import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, updateStamp, notDeleted, type AuditFields } from "@/lib/tms/db";
import { DEFAULT_STUDENT_STATUS, type StudentStatus } from "@/lib/tms/constants";

/**
 * A student's enrolment in one batch of one program. Created by the application
 * "convert to student" flow (Phase 3) and managed from the student profile
 * (Phase 4). Seat availability on a batch is derived from these rows.
 */

export const ENROLLMENTS_COLLECTION = "student_enrollments";
const BATCHES_COLLECTION = "training_batches";

export interface Enrollment extends AuditFields {
  _id: string;
  studentId: string;
  programId: string;
  batchId: string;
  status: StudentStatus; // active | completed | dropped | on_hold
  progressPercent: number;
  enrolledOn: string; // ISO yyyy-mm-dd
}

export interface SerializedEnrollment extends Omit<Enrollment, "createdAt" | "updatedAt" | "deletedAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function serializeEnrollment(e: Enrollment): SerializedEnrollment {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  };
}

let indexesEnsured = false;

async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Enrollment>(ENROLLMENTS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ studentId: 1 }).catch(() => {}),
      collection.createIndex({ batchId: 1 }).catch(() => {}),
      collection.createIndex({ programId: 1 }).catch(() => {}),
      // Not unique — a soft-deleted row must not block re-enrolment; the
      // "already enrolled" guard lives in `enrollStudent`.
      collection.createIndex({ studentId: 1, batchId: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function listEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
  const collection = await getCollection();
  return collection.find({ studentId, ...notDeleted }).sort({ createdAt: -1 }).toArray();
}

/** Flat list of (student, batch) memberships — the project form filters this by the chosen batch. */
export async function listStudentBatchMemberships(): Promise<
  { studentId: string; fullName: string; studentCode: string | null; batchId: string; programId: string }[]
> {
  const collection = await getCollection();
  const rows = await collection.find({ ...notDeleted, status: { $ne: "dropped" } }).toArray();
  if (rows.length === 0) return [];
  const db = await getDb();
  const students = await db
    .collection<{ _id: string; fullName: string; studentCode: string }>("training_students")
    .find({ _id: { $in: Array.from(new Set(rows.map((r) => r.studentId))) } }, { projection: { fullName: 1, studentCode: 1 } })
    .toArray();
  const byId = new Map(students.map((s) => [s._id, s]));
  return rows.map((r) => ({
    studentId: r.studentId,
    fullName: byId.get(r.studentId)?.fullName ?? "Unknown",
    studentCode: byId.get(r.studentId)?.studentCode ?? null,
    batchId: r.batchId,
    programId: r.programId,
  }));
}

/** Enrolled students of a batch — for project / assignment assignee pickers. */
export async function listEnrolledStudentOptions(
  batchId: string
): Promise<{ _id: string; fullName: string; studentCode: string | null }[]> {
  const collection = await getCollection();
  const rows = await collection.find({ batchId, ...notDeleted, status: { $ne: "dropped" } }).toArray();
  if (rows.length === 0) return [];
  const db = await getDb();
  const students = await db
    .collection<{ _id: string; fullName: string; studentCode: string }>("training_students")
    .find({ _id: { $in: rows.map((r) => r.studentId) } }, { projection: { fullName: 1, studentCode: 1 } })
    .toArray();
  return students
    .map((s) => ({ _id: s._id, fullName: s.fullName, studentCode: s.studentCode ?? null }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getEnrollment(studentId: string, batchId: string): Promise<Enrollment | null> {
  const collection = await getCollection();
  return collection.findOne({ studentId, batchId, ...notDeleted });
}

export interface EnrollInput {
  studentId: string;
  programId: string;
  batchId: string;
  enrolledOn?: string;
}

/**
 * Enrol a student into a batch. Refuses when the batch is full or the student
 * is already enrolled. Returns `{ ok:false, reason }` on a business-rule block.
 */
export async function enrollStudent(
  input: EnrollInput,
  actorId: string
): Promise<{ ok: true; enrollment: Enrollment } | { ok: false; reason: string }> {
  const db = await getDb();
  const collection = await getCollection();

  const existing = await collection.findOne({ studentId: input.studentId, batchId: input.batchId, ...notDeleted });
  if (existing) return { ok: false, reason: "This student is already enrolled in that batch." };

  const batch = await db
    .collection<{ _id: string; capacity: number; programId: string; deletedAt: Date | null }>(BATCHES_COLLECTION)
    .findOne({ _id: input.batchId, deletedAt: null });
  if (!batch) return { ok: false, reason: "That batch no longer exists." };
  if (batch.programId !== input.programId) {
    return { ok: false, reason: "The selected batch belongs to a different program." };
  }

  const filled = await collection.countDocuments({ batchId: input.batchId, deletedAt: null, status: { $ne: "dropped" } });
  if (filled >= batch.capacity) return { ok: false, reason: "That batch is full." };

  const doc: Enrollment = {
    _id: newId(),
    studentId: input.studentId,
    programId: input.programId,
    batchId: input.batchId,
    status: DEFAULT_STUDENT_STATUS,
    progressPercent: 0,
    enrolledOn: input.enrolledOn ?? new Date().toISOString().slice(0, 10),
    ...createStamp(actorId),
  };
  await collection.insertOne(doc);
  return { ok: true, enrollment: doc };
}

export async function updateEnrollment(
  id: string,
  data: { status?: string; progressPercent?: number },
  actorId: string
): Promise<Enrollment | null> {
  const collection = await getCollection();
  const patch: Record<string, unknown> = { ...updateStamp(actorId) };
  if (data.status !== undefined) patch.status = data.status;
  if (data.progressPercent !== undefined) {
    patch.progressPercent = Math.min(100, Math.max(0, Math.round(data.progressPercent)));
  }
  return collection.findOneAndUpdate({ _id: id, ...notDeleted }, { $set: patch }, { returnDocument: "after" });
}
