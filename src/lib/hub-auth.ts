import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { WORKSPACE_SESSION_COOKIE } from "@/lib/workspace-session";
import { verifyPassword, hashPassword } from "@/lib/lms-auth";

/**
 * Workspace authentication — THE company sign-in (`/workspace/login`) for
 * every `admin_users` account. Its session (`hub_sessions`) is also accepted
 * by every staff panel's auth module (see `workspace-session.ts`), so there
 * is one sign-in for the whole company.
 *
 * `verifyHubCredentials` has NO role restriction — any account with valid
 * credentials can sign in here, same permissiveness as `lms-auth.ts`. Hub
 * itself has no role vocabulary; it exists to show each account whichever
 * OTHER panels its real roles already grant (see `cross-module-sso.ts`).
 */

export const HUB_SESSION_COOKIE = WORKSPACE_SESSION_COOKIE;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface HubUserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  roles?: string[];
  permissionOverrides?: Record<string, boolean>;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
}

interface HubSessionDoc {
  _id: ObjectId;
  tokenHash: string;
  adminId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export interface CurrentHubUser {
  id: string;
  email: string;
  /** Raw `admin_users.roles` — Hub has no role vocabulary of its own; this is
   * used only to decide which OTHER panels' dashboard tiles to show. */
  roles: string[];
  /** The Super Admin's per-user capability overrides (`permission-overrides.ts`). */
  permissionOverrides?: Record<string, boolean>;
  mustChangePassword: boolean;
  /** false only for a new sign-up that hasn't verified its email; a missing field counts as verified. */
  emailVerified?: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

let userIndexEnsured = false;
let sessionIndexEnsured = false;

async function getHubUsersCollection() {
  const db = await getDb();
  const collection = db.collection<HubUserDoc>("admin_users");
  if (!userIndexEnsured) {
    userIndexEnsured = true;
    await collection.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  }
  return collection;
}

async function getHubSessionsCollection() {
  const db = await getDb();
  const collection = db.collection<HubSessionDoc>("hub_sessions");
  if (!sessionIndexEnsured) {
    sessionIndexEnsured = true;
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
    await collection.createIndex({ tokenHash: 1 }, { unique: true }).catch(() => {});
  }
  return collection;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyHubCredentials(
  email: string,
  password: string
): Promise<{ ok: true; adminId: ObjectId } | { ok: false; error: string }> {
  const users = await getHubUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  // Same generic error for every failure mode so the login form never reveals
  // which accounts exist.
  const GENERIC = "Invalid email or password.";

  if (!user) return { ok: false, error: GENERIC };

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: "Too many failed attempts. Try again in a few minutes." };
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await users.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts, lockedUntil } });
    return { ok: false, error: GENERIC };
  }

  // No role check — Hub accepts any valid admin_users login, mirroring LMS.
  await users.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }
  );
  return { ok: true, adminId: user._id };
}

export async function createHubSession(adminId: ObjectId): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const sessions = await getHubSessionsCollection();
  await sessions.insertOne({
    _id: new ObjectId(),
    tokenHash: hashToken(token),
    adminId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function destroyHubSessionByToken(token: string): Promise<void> {
  const sessions = await getHubSessionsCollection();
  await sessions.deleteOne({ tokenHash: hashToken(token) });
}

export async function getSessionHubUser(token: string | undefined | null): Promise<CurrentHubUser | null> {
  if (!token) return null;
  const sessions = await getHubSessionsCollection();
  const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const users = await getHubUsersCollection();
  const user = await users.findOne({ _id: session.adminId });
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles ?? [],
    permissionOverrides: user.permissionOverrides ?? {},
    mustChangePassword: user.mustChangePassword === true,
    emailVerified: user.emailVerified !== false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function setHubSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(HUB_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearHubSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(HUB_SESSION_COOKIE);
}

export async function getCurrentHubUser(): Promise<CurrentHubUser | null> {
  const store = await cookies();
  const token = store.get(HUB_SESSION_COOKIE)?.value;
  return getSessionHubUser(token);
}

/**
 * Changes the signed-in user's own password and clears `mustChangePassword`.
 * Minimum length matches every other module's bootstrap script.
 */
export async function changeOwnHubPassword(
  userId: string,
  current: string,
  next: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (next.length < 10) return { ok: false, error: "New password must be at least 10 characters." };
  if (next === current) return { ok: false, error: "New password must be different from the current one." };
  if (!ObjectId.isValid(userId)) return { ok: false, error: "Unknown account." };

  const users = await getHubUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return { ok: false, error: "Unknown account." };
  if (!verifyPassword(current, user.passwordHash)) return { ok: false, error: "Current password is incorrect." };

  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: hashPassword(next), mustChangePassword: false } }
  );
  return { ok: true };
}
