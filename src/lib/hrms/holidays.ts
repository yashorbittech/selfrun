import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, updateStamp, notDeleted, type AuditFields } from "@/lib/hrms/db";

export const HOLIDAYS_COLLECTION = "hrms_holidays";

export { HOLIDAY_TYPES, isValidHolidayType } from "@/lib/hrms/holiday-types";
import type { HolidayType } from "@/lib/hrms/holiday-types";
export type { HolidayType };

export interface Holiday extends AuditFields {
  _id: string;
  date: string; // "yyyy-mm-dd"
  year: number;
  name: string;
  type: HolidayType;
}

export interface SerializedHoliday extends Omit<Holiday, "createdAt" | "updatedAt" | "deletedAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

let indexesEnsured = false;

async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Holiday>(HOLIDAYS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ date: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ year: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export function serializeHoliday(h: Holiday): SerializedHoliday {
  return {
    ...h,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    deletedAt: h.deletedAt ? h.deletedAt.toISOString() : null,
  };
}

export async function listHolidays(year?: number): Promise<Holiday[]> {
  const collection = await getCollection();
  const filter: Record<string, unknown> = { ...notDeleted };
  if (year) filter.year = year;
  return collection.find(filter).sort({ date: 1 }).toArray();
}

export async function listHolidayYears(): Promise<number[]> {
  const collection = await getCollection();
  const years = await collection.distinct("year", notDeleted);
  return (years as number[]).sort((a, b) => b - a);
}

/** Set of holiday date-strings between `from` and `to` inclusive. */
export async function holidaySetInRange(from: string, to: string): Promise<Set<string>> {
  const collection = await getCollection();
  const docs = await collection
    .find({ date: { $gte: from, $lte: to }, ...notDeleted }, { projection: { date: 1 } })
    .toArray();
  return new Set(docs.map((d) => d.date));
}

export async function getHoliday(id: string): Promise<Holiday | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function createHoliday(
  data: { date: string; name: string; type: HolidayType },
  actorId: string
): Promise<{ ok: true; holiday: Holiday } | { ok: false; reason: string }> {
  const collection = await getCollection();
  const clash = await collection.findOne({ date: data.date, ...notDeleted });
  if (clash) return { ok: false, reason: `A holiday already exists on ${data.date}.` };

  const doc: Holiday = {
    _id: newId(),
    date: data.date,
    year: Number(data.date.slice(0, 4)),
    name: data.name,
    type: data.type,
    ...createStamp(actorId),
  };
  await collection.insertOne(doc);
  return { ok: true, holiday: doc };
}

export async function updateHoliday(
  id: string,
  data: { date: string; name: string; type: HolidayType },
  actorId: string
): Promise<{ ok: true; holiday: Holiday } | { ok: false; reason: string }> {
  const collection = await getCollection();
  const clash = await collection.findOne({ date: data.date, _id: { $ne: id }, ...notDeleted });
  if (clash) return { ok: false, reason: `A holiday already exists on ${data.date}.` };

  const updated = await collection.findOneAndUpdate(
    { _id: id, ...notDeleted },
    { $set: { date: data.date, year: Number(data.date.slice(0, 4)), name: data.name, type: data.type, ...updateStamp(actorId) } },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, reason: "Holiday not found." };
  return { ok: true, holiday: updated };
}

export async function deleteHoliday(id: string, actorId: string): Promise<boolean> {
  const collection = await getCollection();
  const res = await collection.updateOne({ _id: id, ...notDeleted }, { $set: { deletedAt: new Date(), ...updateStamp(actorId) } });
  return res.modifiedCount === 1;
}
