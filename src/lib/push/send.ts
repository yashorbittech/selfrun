import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { afterForCompany, currentCompanyIdOrNull, runAsCompany } from "@/lib/platform/tenancy/context";
import { inQuietHours, PUSH_CATEGORY_META, type PushCategory } from "@/lib/push/categories";
import { getPreferencesMany, subscriptionsCol, type PushActor } from "@/lib/push/store";
import { pushConfigured, webpush } from "@/lib/push/vapid";

/**
 * Sends a Web Push notification to people of the CURRENT company. Always best-effort: it never throws and never delays the
 * action that raised the notification. Respects each person's master switch, category choices and quiet hours, drops
 * subscriptions the push service says are gone, and only ever links to same-site paths.
 */

export interface PushMessage {
  category: PushCategory;
  title: string;
  body?: string | null;
  /** Same-site path opened when the notification is tapped. */
  url?: string | null;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string | null;
}

const MAX_FAILURES = 5;
const CONCURRENCY = 10;

function safePath(url: string | null | undefined): string {
  const u = (url ?? "").trim();
  return u.startsWith("/") && !u.startsWith("//") && !u.includes("\\") && u.length <= 500 ? u : "/workspace/notifications";
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

/** Delivers to every device of `userIds` that wants it. Returns how many pushes the services accepted. */
export async function pushToUsers(actor: PushActor, userIds: string[], message: PushMessage): Promise<number> {
  try {
    if (!pushConfigured()) return 0;
    const ids = [...new Set(userIds.filter(Boolean))].slice(0, 500);
    if (ids.length === 0) return 0;

    const prefs = await getPreferencesMany(actor, ids);
    const urgent = PUSH_CATEGORY_META[message.category].urgent === true;
    const wanted = ids.filter((id) => {
      const p = prefs.get(id);
      if (!p) return true; // no saved choice = the defaults (everything on, no quiet hours)
      if (!p.enabled || !p.categories[message.category]) return false;
      return urgent || !inQuietHours(p.quietHours);
    });
    if (wanted.length === 0) return 0;

    const subs = await subscriptionsCol();
    const rows = await subs.find({ actor, userId: { $in: wanted } }).toArray();
    if (rows.length === 0) return 0;

    const payload = JSON.stringify({
      title: message.title.slice(0, 120),
      body: (message.body ?? "").slice(0, 300),
      url: safePath(message.url),
      tag: message.tag ?? undefined,
      category: message.category,
    });
    let delivered = 0;
    await mapLimit(rows, CONCURRENCY, async (row) => {
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: row.keys }, payload, { TTL: 60 * 60 * 24, urgency: urgent ? "high" : "normal" });
        delivered++;
        await subs.updateOne({ _id: row._id }, { $set: { lastSuccessAt: new Date(), failures: 0 } });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410: the browser unsubscribed or the install was removed. Anything else counts toward giving up.
        if (status === 404 || status === 410) await subs.deleteOne({ _id: row._id });
        else if (row.failures + 1 >= MAX_FAILURES) await subs.deleteOne({ _id: row._id });
        else await subs.updateOne({ _id: row._id }, { $inc: { failures: 1 } });
      }
    });
    return delivered;
  } catch (err) {
    console.error("[push] delivery failed", err);
    return 0;
  }
}

/**
 * For the notification writers: schedules the push after the response (a serverless function may stop right after it),
 * inside the current company's scope. Outside a request (a cron, a script) it just runs it.
 */
export async function queuePush(actor: PushActor, userIds: string[], message: PushMessage): Promise<void> {
  try {
    if (!pushConfigured() || userIds.length === 0) return;
    const companyId = await currentCompanyIdOrNull();
    if (!companyId) return;
    try {
      await afterForCompany(() => pushToUsers(actor, userIds, message));
    } catch {
      void runAsCompany(companyId, () => pushToUsers(actor, userIds, message));
    }
  } catch (err) {
    console.error("[push] could not queue", err);
  }
}

/** Staff accounts of the company holding any of `roles` (for panel broadcasts such as "tell HR"). */
export async function userIdsWithRoles(roles: string[]): Promise<string[]> {
  const rows = await (await getDb()).collection<{ _id: ObjectId }>("admin_users").find({ roles: { $in: roles } }, { projection: { _id: 1 } }).limit(200).toArray();
  return rows.map((r) => String(r._id));
}
