"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageStudents } from "@/lib/tms-roles";
import { createStudent, updateStudent, getStudent } from "@/lib/tms/students";
import { enrollStudent, updateEnrollment, getEnrollment } from "@/lib/tms/enrollments";
import { getBatch } from "@/lib/tms/batches";
import { validateStudent } from "@/lib/tms/validation";
import { recordAudit, diffSummary } from "@/lib/tms/audit";
import {
  createStudentLogin,
  resetStudentLoginPassword,
  revokeStudentLogin,
  generateTempPassword,
} from "@/lib/tms/student-auth";
import { isValidStudentStatus } from "@/lib/tms/constants";

export interface StudentActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
  tempPassword?: string;
  email?: string;
}

async function requireManage() {
  const user = await getCurrentTmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageStudents(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(id?: string) {
  revalidatePath("/tms/students");
  revalidatePath("/tms");
  if (id) revalidatePath(`/tms/students/${id}`);
}

export async function saveStudentAction(
  input: Record<string, unknown>,
  id?: string
): Promise<StudentActionResult> {
  const user = await requireManage();
  const v = validateStudent(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  if (id) {
    const before = await getStudent(id);
    if (!before) return { ok: false, error: "Student not found." };
    const updated = await updateStudent(id, v.data, user.id);
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entity: "student",
      entityId: id,
      entityLabel: v.data.fullName,
      summary: diffSummary(
        { name: before.fullName, status: before.status, email: before.email },
        { name: v.data.fullName, status: v.data.status, email: v.data.email },
        ["name", "status", "email"]
      ),
    });
    revalidate(id);
    return { ok: true, id: updated?._id };
  }

  const created = await createStudent(v.data, user.id, null);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "create",
    entity: "student",
    entityId: created._id,
    entityLabel: v.data.fullName,
  });
  revalidate(created._id);
  return { ok: true, id: created._id };
}

export async function assignBatchAction(
  studentId: string,
  programId: string,
  batchId: string
): Promise<StudentActionResult> {
  const user = await requireManage();
  const student = await getStudent(studentId);
  if (!student) return { ok: false, error: "Student not found." };
  const batch = await getBatch(batchId);
  if (!batch) return { ok: false, fieldErrors: { batchId: "Select a valid batch." } };
  if (batch.programId !== programId) {
    return { ok: false, fieldErrors: { batchId: "That batch belongs to a different program." } };
  }

  const result = await enrollStudent({ studentId, programId, batchId }, user.id);
  if (!result.ok) return { ok: false, fieldErrors: { batchId: result.reason } };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "enroll",
    entity: "enrollment",
    entityId: result.enrollment._id,
    entityLabel: `${student.fullName} → ${batch.name}`,
  });
  revalidate(studentId);
  revalidatePath(`/tms/batches/${batchId}`);
  return { ok: true, id: studentId };
}

export async function updateEnrollmentAction(
  studentId: string,
  batchId: string,
  patch: { status?: string; progressPercent?: number }
): Promise<StudentActionResult> {
  const user = await requireManage();
  const enrollment = await getEnrollment(studentId, batchId);
  if (!enrollment) return { ok: false, error: "Enrolment not found." };
  if (patch.status !== undefined && !isValidStudentStatus(patch.status)) {
    return { ok: false, error: "Unknown status." };
  }
  await updateEnrollment(enrollment._id, patch, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "enrollment",
    entityId: enrollment._id,
    entityLabel: null,
    summary: [
      patch.status !== undefined ? `status → ${patch.status}` : null,
      patch.progressPercent !== undefined ? `progress → ${patch.progressPercent}%` : null,
    ]
      .filter(Boolean)
      .join(", "),
  });
  revalidate(studentId);
  revalidatePath(`/tms/batches/${batchId}`);
  return { ok: true, id: studentId };
}

export async function createStudentLoginAction(
  studentId: string,
  email: string
): Promise<StudentActionResult> {
  const user = await requireManage();
  const temp = generateTempPassword();
  const result = await createStudentLogin(studentId, email, temp);
  if (!result.ok) return { ok: false, error: result.error };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "student",
    entityId: studentId,
    entityLabel: result.email,
    summary: "portal login created",
  });
  revalidate(studentId);
  return { ok: true, id: studentId, tempPassword: temp, email: result.email };
}

export async function resetStudentLoginAction(studentId: string): Promise<StudentActionResult> {
  const user = await requireManage();
  const temp = generateTempPassword();
  const result = await resetStudentLoginPassword(studentId, temp);
  if (!result.ok) return { ok: false, error: result.error };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "student",
    entityId: studentId,
    entityLabel: null,
    summary: "portal password reset",
  });
  revalidate(studentId);
  return { ok: true, id: studentId, tempPassword: temp };
}

export async function revokeStudentLoginAction(studentId: string): Promise<StudentActionResult> {
  const user = await requireManage();
  const result = await revokeStudentLogin(studentId);
  if (!result.ok) return { ok: false, error: result.error };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "student",
    entityId: studentId,
    entityLabel: null,
    summary: "portal login revoked",
  });
  revalidate(studentId);
  return { ok: true, id: studentId };
}
