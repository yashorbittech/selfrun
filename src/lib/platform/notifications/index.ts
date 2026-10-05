import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/**
 * Company-wide in-app notifications, one row per recipient, shown by the
 * Staff Hub bell and `/workspace/notifications`. The panels' own bells
 * (HRMS, PMS, …) are separate and untouched — this is the cross-panel one
 * that workflows write to.
 */

export const NOTIFICATIONS_COLLECTION = "platform_notifications";
const TTL_SECONDS = 90 * 24 * 60 * 60;
/** A role-wide notification never fans out past this many people. */
const MAX_RECIPIENTS = 200;

export interface PlatformNotification {
  _id: ObjectId;
  /** `admin_users._id` as a string. */
  userId: string;
  title: string;
  body: string;
  url: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationView {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
}

let indexed = false;
async function col() {
  const c = (await getDb()).collection<PlatformNotification>(NOTIFICATIONS_COLLECTION);
  if (!indexed) {
    indexed = true;
    await Promise.all([c.createIndex({ userId: 1, createdAt: -1 }), c.createIndex({ userId: 1, readAt: 1 }), c.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS })]).catch(() => {});
  }
  return c;
}

/** Only same-site paths are stored as links — a notification can never send someone off-site. */
export function safeInternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  return u.startsWith("/") && !u.startsWith("//") && !u.includes("\\") && u.length <= 500 ? u : null;
}

export type NotifyTarget = { userId: string } | { userIds: string[] } | { role: string };

async function resolveRecipients(target: NotifyTarget): Promise<string[]> {
  const users = (await getDb()).collection<{ _id: ObjectId; roles?: string[] }>("admin_users");
  if ("role" in target) {
    if (!target.role) return [];
    const rows = await users.find({ roles: target.role }, { projection: { _id: 1 } }).limit(MAX_RECIPIENTS).toArray();
    return rows.map((r) => String(r._id));
  }
  const ids = [...new Set(("userIds" in target ? target.userIds : [target.userId]).filter((id) => ObjectId.isValid(id)))].slice(0, MAX_RECIPIENTS);
  if (ids.length === 0) return [];
  // Only real accounts of this company (the scoped collection can't see anyone else's).
  const rows = await users.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { _id: 1 } }).toArray();
  return rows.map((r) => String(r._id));
}

/** Creates one notification per recipient; returns how many were created. */
export async function notify(input: { to: NotifyTarget; title: string; body?: string; url?: string | null }): Promise<number> {
  const title = input.title.trim().slice(0, 200);
  if (!title) return 0;
  const recipients = await resolveRecipients(input.to);
  if (recipients.length === 0) return 0;
  const now = new Date();
  const body = (input.body ?? "").trim().slice(0, 1000);
  const url = safeInternalUrl(input.url);
  await (await col()).insertMany(recipients.map((userId) => ({ _id: new ObjectId(), userId, title, body, url, readAt: null, createdAt: now })));
  return recipients.length;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationView[]> {
  const rows = await (await col()).find({ userId }).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 200)).toArray();
  return rows.map((r) => ({ id: String(r._id), title: r.title, body: r.body, url: r.url, read: r.readAt !== null, createdAt: r.createdAt.toISOString() }));
}

export async function unreadCount(userId: string): Promise<number> {
  return (await col()).countDocuments({ userId, readAt: null });
}

/** Marks one of the user's own notifications read (someone else's id is a no-op). */
export async function markRead(userId: string, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const res = await (await col()).updateOne({ _id: new ObjectId(id), userId, readAt: null }, { $set: { readAt: new Date() } });
  return res.modifiedCount === 1;
}

export async function markAllRead(userId: string): Promise<number> {
  const res = await (await col()).updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
  return res.modifiedCount;
}
