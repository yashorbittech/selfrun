"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageStudents } from "@/lib/tms-roles";
import {
  createApplication,
  updateApplication,
  deleteApplication,
  getApplication,
  setApplicationStatus,
  markApplicationConverted,
} from "@/lib/tms/applications";
import { getProgram } from "@/lib/tms/programs";
import { getBatch } from "@/lib/tms/batches";
import { createStudent, getStudentByApplication } from "@/lib/tms/students";
import { enrollStudent } from "@/lib/tms/enrollments";
import { validateApplication } from "@/lib/tms/validation";
import { recordAudit, diffSummary } from "@/lib/tms/audit";
import { isValidApplicationStatus, type ApplicationStatus } from "@/lib/tms/constants";

export interface ApplicationActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
  studentId?: string;
}

async function requireManage() {
  const user = await getCurrentTmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageStudents(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(id?: string) {
  revalidatePath("/tms/applications");
  revalidatePath("/tms/applications/board");
  revalidatePath("/tms");
  if (id) revalidatePath(`/tms/applications/${id}`);
}

export async function saveApplicationAction(
  input: Record<string, unknown>,
  id?: string
): Promise<ApplicationActionResult> {
  const user = await requireManage();
  const v = validateApplication(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  const program = await getProgram(v.data.programId);
  if (!program) return { ok: false, fieldErrors: { programId: "That program no longer exists." } };

  if (id) {
    const before = await getApplication(id);
    if (!before) return { ok: false, error: "Application not found." };
    if (before.studentId) return { ok: false, error: "This application was already converted." };
    const updated = await updateApplication(id, v.data, user.id);
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entity: "application",
      entityId: id,
      entityLabel: v.data.fullName,
      summary: diffSummary(
        { name: before.fullName, status: before.status, programId: before.programId },
        { name: v.data.fullName, status: v.data.status, programId: v.data.programId },
        ["name", "status", "programId"]
      ),
    });
    revalidate(id);
    return { ok: true, id: updated?._id };
  }

  const created = await createApplication(v.data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "create",
    entity: "application",
    entityId: created._id,
    entityLabel: v.data.fullName,
  });
  revalidate(created._id);
  return { ok: true, id: created._id };
}

export async function setApplicationStatusAction(
  id: string,
  status: string
): Promise<ApplicationActionResult> {
  const user = await requireManage();
  if (!isValidApplicationStatus(status)) return { ok: false, error: "Unknown status." };
  const before = await getApplication(id);
  if (!before) return { ok: false, error: "Application not found." };
  if (before.studentId && status !== "enrolled") {
    return { ok: false, error: "This application was converted to a student — its status is locked to Enrolled." };
  }
  if (status === "enrolled" && !before.studentId) {
    return { ok: false, error: "Use “Convert to Student” to enrol this applicant." };
  }
  await setApplicationStatus(id, status as ApplicationStatus, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "status_change",
    entity: "application",
    entityId: id,
    entityLabel: before.fullName,
    summary: `status: ${before.status} → ${status}`,
  });
  revalidate(id);
  return { ok: true, id };
}

export async function deleteApplicationAction(id: string): Promise<ApplicationActionResult> {
  const user = await requireManage();
  const before = await getApplication(id);
  const result = await deleteApplication(id, user.id);
  if (!result.ok) return { ok: false, error: result.reason ?? "Could not delete application." };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "delete",
    entity: "application",
    entityId: id,
    entityLabel: before?.fullName ?? null,
  });
  revalidate(id);
  return { ok: true };
}

/**
 * Convert an application to a student and enrol them in the chosen batch.
 * Creates the `training_students` record from the application data, adds a
 * `student_enrollments` row (which drives batch seat availability), and links
 * the application. Idempotent-ish: refuses if already converted.
 */
export async function convertApplicationAction(
  id: string,
  batchId: string,
  extra: Record<string, unknown> = {}
): Promise<ApplicationActionResult> {
  const user = await requireManage();
  const app = await getApplication(id);
  if (!app) return { ok: false, error: "Application not found." };
  if (app.studentId) return { ok: false, error: "This application has already been converted." };

  const existingByApp = await getStudentByApplication(id);
  if (existingByApp) return { ok: false, error: "A student already exists for this application." };

  const batch = await getBatch(batchId);
  if (!batch) return { ok: false, fieldErrors: { batchId: "Select a valid batch." } };
  if (batch.programId !== app.programId) {
    return { ok: false, fieldErrors: { batchId: "That batch belongs to a different program." } };
  }

  const student = await createStudent(
    {
      fullName: app.fullName,
      email: app.email,
      mobile: app.mobile,
      address: null,
      education: {
        college: app.college,
        university: (typeof extra.university === "string" && extra.university.trim()) || null,
        branch: (typeof extra.branch === "string" && extra.branch.trim()) || null,
        semester: null,
        graduationYear: app.graduationYear,
      },
      guardian: { name: null, phone: null, relation: null },
      links: { resumeUrl: null, linkedin: null, github: null, photoUrl: null },
      status: "active",
      notes: app.notes,
    },
    user.id,
    id
  );

  const enrol = await enrollStudent(
    { studentId: student._id, programId: app.programId, batchId },
    user.id
  );
  if (!enrol.ok) {
    // Roll the student back so a full batch doesn't leave an orphan record.
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    await db.collection<{ _id: string }>("training_students").deleteOne({ _id: student._id });
    return { ok: false, fieldErrors: { batchId: enrol.reason } };
  }

  await markApplicationConverted(id, student._id, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "convert",
    entity: "application",
    entityId: id,
    entityLabel: app.fullName,
    summary: `converted to student ${student.studentCode}, enrolled in ${batch.batchCode}`,
    metadata: { studentId: student._id, batchId },
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "enroll",
    entity: "enrollment",
    entityId: enrol.enrollment._id,
    entityLabel: `${student.fullName} → ${batch.name}`,
  });

  revalidate(id);
  revalidatePath("/tms/students");
  revalidatePath(`/tms/batches/${batchId}`);
  return { ok: true, id, studentId: student._id };
}
