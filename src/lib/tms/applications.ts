import "server-only";
import { getDb } from "@/lib/mongodb";
import { escapeRegExp } from "@/lib/text-search";
import {
  newId,
  createStamp,
  updateStamp,
  notDeleted,
  nextSequence,
  formatCode,
  type AuditFields,
} from "@/lib/tms/db";
import {
  APPLICATION_STATUSES,
  DEFAULT_APPLICATION_STATUS,
  type ApplicationStatus,
} from "@/lib/tms/constants";
import { PROGRAMS_COLLECTION } from "@/lib/tms/programs";

export const APPLICATIONS_COLLECTION = "training_applications";
const APPLICATION_CODE_PREFIX = "APP";

export interface Application extends AuditFields {
  _id: string;
  applicationCode: string;
  fullName: string;
  email: string;
  mobile: string | null;
  programId: string;
  /** Where the lead came from — website, referral, walk-in, campaign… */
  source: string | null;
  college: string | null;
  graduationYear: number | null;
  message: string | null;
  status: ApplicationStatus;
  /** Set once converted — links to the created student. */
  studentId: string | null;
  convertedAt: Date | null;
  notes: string | null;
}

export interface SerializedApplication extends Omit<Application, "createdAt" | "updatedAt" | "deletedAt" | "convertedAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  convertedAt: string | null;
}

export function serializeApplication(a: Application): SerializedApplication {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
    convertedAt: a.convertedAt ? a.convertedAt.toISOString() : null,
  };
}

let indexesEnsured = false;

async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Application>(APPLICATIONS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ applicationCode: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ status: 1 }).catch(() => {}),
      collection.createIndex({ programId: 1 }).catch(() => {}),
      collection.createIndex({ createdAt: -1 }).catch(() => {}),
      collection.createIndex({ email: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function generateApplicationCode(): Promise<string> {
  const seq = await nextSequence("application_code");
  return formatCode(APPLICATION_CODE_PREFIX, seq);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getApplication(id: string): Promise<Application | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export interface ApplicationFilter {
  search?: string;
  status?: ApplicationStatus;
  programId?: string;
  source?: string;
}

function buildFilter(opts: ApplicationFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...notDeleted };
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    filter.$or = [{ fullName: rx }, { applicationCode: rx }, { email: rx }, { mobile: rx }, { college: rx }];
  }
  if (opts.status) filter.status = opts.status;
  if (opts.programId) filter.programId = opts.programId;
  if (opts.source) filter.source = opts.source;
  return filter;
}

export interface ApplicationWithProgram extends Application {
  programName: string;
}

async function attachProgram(rows: Application[]): Promise<ApplicationWithProgram[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = Array.from(new Set(rows.map((r) => r.programId)));
  const programs = await db
    .collection<{ _id: string; name: string }>(PROGRAMS_COLLECTION)
    .find({ _id: { $in: ids } }, { projection: { name: 1 } })
    .toArray();
  const nameById = new Map(programs.map((p) => [p._id, p.name ?? "Unknown program"]));
  return rows.map((r) => ({ ...r, programName: nameById.get(r.programId) ?? "Unknown program" }));
}

export interface SearchApplicationsOptions extends ApplicationFilter {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "fullName" | "applicationCode" | "status";
  sortDir?: "asc" | "desc";
}

export async function searchApplications(opts: SearchApplicationsOptions = {}) {
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
  const filter = buildFilter(opts);

  const sortField =
    opts.sortBy === "fullName"
      ? "fullName"
      : opts.sortBy === "applicationCode"
        ? "applicationCode"
        : opts.sortBy === "status"
          ? "status"
          : "createdAt";
  const sortDir = opts.sortDir === "asc" ? 1 : -1;

  const [rows, total] = await Promise.all([
    collection.find(filter).sort({ [sortField]: sortDir }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    items: await attachProgram(rows),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/** All non-terminal + recently-terminal applications grouped by status, for the kanban. */
export async function getApplicationsBoard(opts: ApplicationFilter = {}): Promise<
  Record<ApplicationStatus, ApplicationWithProgram[]>
> {
  const collection = await getCollection();
  const rows = await collection.find(buildFilter(opts)).sort({ createdAt: -1 }).limit(500).toArray();
  const withProgram = await attachProgram(rows);
  const board = {} as Record<ApplicationStatus, ApplicationWithProgram[]>;
  for (const s of APPLICATION_STATUSES) board[s.value] = [];
  for (const a of withProgram) (board[a.status] ?? board.new).push(a);
  return board;
}

export async function countApplications(filter: ApplicationFilter = {}): Promise<number> {
  const collection = await getCollection();
  return collection.countDocuments(buildFilter(filter));
}

export async function listApplicationSources(): Promise<string[]> {
  const collection = await getCollection();
  const values = await collection.distinct("source", notDeleted);
  return values.filter((v): v is string => typeof v === "string" && v.length > 0).sort();
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface ApplicationWriteData {
  fullName: string;
  email: string;
  mobile: string | null;
  programId: string;
  source: string | null;
  college: string | null;
  graduationYear: number | null;
  message: string | null;
  status: ApplicationStatus;
  notes: string | null;
}

export async function createApplication(data: ApplicationWriteData, actorId: string): Promise<Application> {
  const collection = await getCollection();
  const doc: Application = {
    _id: newId(),
    applicationCode: await generateApplicationCode(),
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    programId: data.programId,
    source: data.source,
    college: data.college,
    graduationYear: data.graduationYear,
    message: data.message,
    status: data.status ?? DEFAULT_APPLICATION_STATUS,
    studentId: null,
    convertedAt: null,
    notes: data.notes,
    ...createStamp(actorId),
  };
  await collection.insertOne(doc);
  return doc;
}

export async function updateApplication(
  id: string,
  data: Partial<ApplicationWriteData>,
  actorId: string
): Promise<Application | null> {
  const collection = await getCollection();
  return collection.findOneAndUpdate(
    { _id: id, ...notDeleted },
    { $set: { ...data, ...updateStamp(actorId) } },
    { returnDocument: "after" }
  );
}

export async function setApplicationStatus(
  id: string,
  status: ApplicationStatus,
  actorId: string
): Promise<Application | null> {
  const collection = await getCollection();
  return collection.findOneAndUpdate(
    { _id: id, ...notDeleted },
    { $set: { status, ...updateStamp(actorId) } },
    { returnDocument: "after" }
  );
}

/** Links an application to the student it was converted into and marks it enrolled. */
export async function markApplicationConverted(id: string, studentId: string, actorId: string): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne(
    { _id: id, ...notDeleted },
    { $set: { status: "enrolled", studentId, convertedAt: new Date(), ...updateStamp(actorId) } }
  );
}

export async function deleteApplication(id: string, actorId: string): Promise<{ ok: boolean; reason?: string }> {
  const collection = await getCollection();
  const app = await collection.findOne({ _id: id, ...notDeleted });
  if (!app) return { ok: false, reason: "Application not found." };
  if (app.studentId) return { ok: false, reason: "This application was converted to a student and cannot be deleted." };
  const res = await collection.updateOne(
    { _id: id, ...notDeleted },
    { $set: { deletedAt: new Date(), ...updateStamp(actorId) } }
  );
  return { ok: res.modifiedCount === 1 };
}
