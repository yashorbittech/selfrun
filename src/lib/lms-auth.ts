import "server-only";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { WORKSPACE_SESSION_COOKIE, workspaceSessionAccountId } from "@/lib/workspace-session";
import { getDb } from "@/lib/mongodb";

// NOTE: was literally `admin_session` — an accidental exact collision with
// the separate Super Admin Command Center's own cookie of the same name
// (the former admin panel, since removed). Both use `path: "/"`,
// so whichever was set last silently overwrote the other for any browser with
// both sessions active. Renamed to fix the collision and to allow the Command
// Center to safely mint a real LMS session alongside its own on login.
export const SESSION_COOKIE = "lms_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const SCRYPT_KEYLEN = 64;

interface LmsUserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  /** HRMS panel access — empty/absent means no HRMS access. See `hrms-roles.ts`. */
  roles?: string[];
  /** Links this login to an `hrms_employees` record, when applicable. */
  employeeId?: string | null;
}

interface LmsSessionDoc {
  _id: ObjectId;
  tokenHash: string;
  adminId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export interface CurrentLmsUser {
  id: string;
  email: string;
  /** Raw `admin_users.roles` — LMS itself has no role gate, but other panels'
   * role literals (notably `super_admin`) still show up here since identity is
   * shared. Used e.g. to conditionally show a "Back to Admin" link. */
  roles: string[];
  createdAt: Date;
  lastLoginAt: Date | null;
}

let indexesEnsured = false;

async function getAdminUsersCollection() {
  const db = await getDb();
  const collection = db.collection<LmsUserDoc>("admin_users");
  if (!indexesEnsured) {
    indexesEnsured = true;
    await collection.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  }
  return collection;
}

async function getAdminSessionsCollection() {
  const db = await getDb();
  const collection = db.collection<LmsSessionDoc>("admin_sessions");
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return collection;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyLmsCredentials(
  email: string,
  password: string
): Promise<{ ok: true; adminId: ObjectId } | { ok: false; error: string }> {
  const users = await getAdminUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: "Too many failed attempts. Try again in a few minutes." };
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await users.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts, lockedUntil } });
    return { ok: false, error: "Invalid email or password." };
  }

  await users.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }
  );
  return { ok: true, adminId: user._id };
}

export async function createLmsSession(adminId: ObjectId): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const sessions = await getAdminSessionsCollection();
  await sessions.insertOne({
    _id: new ObjectId(),
    tokenHash: hashToken(token),
    adminId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function destroySessionByToken(token: string): Promise<void> {
  const sessions = await getAdminSessionsCollection();
  await sessions.deleteOne({ tokenHash: hashToken(token) });
}

export async function getSessionLmsUser(token: string | undefined | null): Promise<CurrentLmsUser | null> {
  if (!token) return null;
  const sessions = await getAdminSessionsCollection();
  const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return getLmsUserForAccount(session.adminId);
}

/**
 * This panel's user for an `admin_users` account, under the panel's own role
 * rule — shared by the panel's session and the Workspace session.
 */
export async function getLmsUserForAccount(adminId: ObjectId): Promise<CurrentLmsUser | null> {
  const users = await getAdminUsersCollection();
  const user = await users.findOne({ _id: adminId });
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles ?? [],
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentLmsUser(): Promise<CurrentLmsUser | null> {
  const store = await cookies();
  const own = await getSessionLmsUser(store.get(SESSION_COOKIE)?.value);
  if (own) return own;
  // One company sign-in: the Workspace session of the same account opens this panel too (same role rule).
  const accountId = await workspaceSessionAccountId(store.get(WORKSPACE_SESSION_COOKIE)?.value);
  return accountId ? getLmsUserForAccount(accountId) : null;
}
