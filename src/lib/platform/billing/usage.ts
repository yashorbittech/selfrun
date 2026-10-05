import "server-only";
import { getDb } from "@/lib/mongodb";
import type { UsageMetric } from "@/lib/platform/billing/types";

/**
 * Metered usage per company per calendar month, in the company-scoped
 * `billing_usage` collection keyed `<metric>:<yyyy-mm>` (a keyed collection,
 * so each company has its own counters). Increment-only and cheap: one upsert.
 */

const COLLECTION = "billing_usage";

export function usagePeriod(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export async function recordUsage(metric: UsageMetric, amount: number, date = new Date()): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const db = await getDb();
  await db
    .collection<{ _id: string; metric: UsageMetric; period: string; total: number; updatedAt: Date }>(COLLECTION)
    .updateOne({ _id: `${metric}:${usagePeriod(date)}` }, { $inc: { total: Math.round(amount) }, $set: { metric, period: usagePeriod(date), updatedAt: new Date() } }, { upsert: true });
}

export async function getUsage(metric: UsageMetric, period = usagePeriod()): Promise<number> {
  const db = await getDb();
  const doc = await db.collection<{ _id: string; total: number }>(COLLECTION).findOne({ _id: `${metric}:${period}` });
  return doc?.total ?? 0;
}
