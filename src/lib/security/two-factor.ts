import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import QRCode from "qrcode";
import { getDb } from "@/lib/mongodb";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { decryptPlatformSecret, encryptPlatformSecret, isPlatformEncryptionConfigured, type EncryptedValue } from "@/lib/platform/crypto";
import { newTotpSecret, otpauthUri, verifyTotp } from "@/lib/security/totp";

/**
 * Two-step sign-in. A person turns it on under Security & sessions with an authenticator app; from then on a password alone does not sign
 * them in: the six-digit code (or one of ten single-use recovery codes) is needed too. The secret is encrypted at rest, a code works once,
 * wrong codes count towards the same lock-out as wrong passwords, and a Super Admin can switch it off for someone who lost their device.
 */
interface TwoFactorDoc {
  secret: EncryptedValue;
  enabledAt: Date;
  lastStep: number;
  /** SHA-256 of each unused recovery code. */
  recovery: string[];
}
interface Pending { secret: EncryptedValue; at: Date }
interface UserTf { _id: ObjectId; email: string; twoFactor?: TwoFactorDoc | null; twoFactorPending?: Pending | null }

const SETUP_TTL_MS = 15 * 60_000;
const ISSUER = "SelfRun";
const hashCode = (c: string) => createHash("sha256").update(c.trim().toLowerCase().replace(/[\s-]/g, "")).digest("hex");
const ctx = async (adminId: ObjectId | string) => `2fa:${await currentCompanyId()}:${String(adminId)}`;
const users = async () => (await getDb()).collection<UserTf>("admin_users");

export function twoFactorAvailable(): boolean {
  return isPlatformEncryptionConfigured();
}

export function hasTwoFactor(user: { twoFactor?: unknown } | null | undefined): boolean {
  return !!user && !!user.twoFactor;
}

export async function twoFactorStatus(adminId: ObjectId): Promise<{ enabled: boolean; enabledAt: Date | null; recoveryLeft: number; available: boolean }> {
  const u = await (await users()).findOne({ _id: adminId }, { projection: { twoFactor: 1 } });
  return { enabled: !!u?.twoFactor, enabledAt: u?.twoFactor?.enabledAt ?? null, recoveryLeft: u?.twoFactor?.recovery.length ?? 0, available: twoFactorAvailable() };
}

export async function startTwoFactorSetup(adminId: ObjectId, email: string): Promise<{ ok: true; secret: string; qr: string } | { ok: false; error: string }> {
  if (!twoFactorAvailable()) return { ok: false, error: "Two-step sign-in isn't available on this server yet (the platform's encryption key isn't set). Ask your platform administrator." };
  const col = await users();
  const u = await col.findOne({ _id: adminId }, { projection: { twoFactor: 1 } });
  if (u?.twoFactor) return { ok: false, error: "Two-step sign-in is already on. Turn it off first to set it up again." };
  const secret = newTotpSecret();
  await col.updateOne({ _id: adminId }, { $set: { twoFactorPending: { secret: encryptPlatformSecret(secret, await ctx(adminId)), at: new Date() } } });
  const qr = await QRCode.toDataURL(otpauthUri(secret, email, ISSUER), { margin: 1, width: 192 });
  return { ok: true, secret, qr };
}

/** Checks the first code from the app; on success turns two-step on and returns the recovery codes (shown once, never stored in the clear). */
export async function confirmTwoFactorSetup(adminId: ObjectId, code: string): Promise<{ ok: true; recovery: string[] } | { ok: false; error: string }> {
  const col = await users();
  const u = await col.findOne({ _id: adminId }, { projection: { twoFactorPending: 1, twoFactor: 1 } });
  if (u?.twoFactor) return { ok: false, error: "Two-step sign-in is already on." };
  const p = u?.twoFactorPending;
  if (!p || Date.now() - p.at.getTime() > SETUP_TTL_MS) return { ok: false, error: "That setup has expired. Start again." };
  const secret = decryptPlatformSecret(p.secret, await ctx(adminId));
  if (!secret) return { ok: false, error: "That setup can't be read any more. Start again." };
  const step = verifyTotp(secret, code);
  if (step === null) return { ok: false, error: "That code isn't right. Wait for the next one in your app and try again." };
  const recovery = Array.from({ length: 10 }, () => randomBytes(5).toString("hex").replace(/(.{5})(.{5})/, "$1-$2"));
  await col.updateOne({ _id: adminId }, { $set: { twoFactor: { secret: p.secret, enabledAt: new Date(), lastStep: step, recovery: recovery.map(hashCode) } }, $unset: { twoFactorPending: "" } });
  return { ok: true, recovery };
}

/**
 * Whether `code` is a valid second step for this account: the current app code, or an unused recovery code (which is used up). Updates the
 * replay guard, so the same code cannot be used twice.
 */
export async function verifySecondStep(user: { _id: ObjectId; twoFactor?: TwoFactorDoc | null }, code: string): Promise<boolean> {
  const tf = user.twoFactor;
  if (!tf) return true;
  const col = await users();
  const secret = decryptPlatformSecret(tf.secret, await ctx(user._id));
  if (secret) {
    const step = verifyTotp(secret, code, tf.lastStep ?? 0);
    if (step !== null) {
      // Only the first request to present this step wins.
      const r = await col.updateOne({ _id: user._id, "twoFactor.lastStep": { $lt: step } }, { $set: { "twoFactor.lastStep": step } });
      return r.modifiedCount === 1;
    }
  }
  const h = hashCode(code);
  if (tf.recovery.includes(h)) {
    const r = await col.updateOne({ _id: user._id, "twoFactor.recovery": h }, { $pull: { "twoFactor.recovery": h } });
    return r.modifiedCount === 1;
  }
  return false;
}

/** Turns two-step off for the signed-in person, after one valid code (or recovery code). */
export async function disableTwoFactor(adminId: ObjectId, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const col = await users();
  const u = await col.findOne({ _id: adminId });
  if (!u?.twoFactor) return { ok: true };
  if (!(await verifySecondStep(u, code))) return { ok: false, error: "That code isn't right." };
  await col.updateOne({ _id: adminId }, { $unset: { twoFactor: "", twoFactorPending: "" } });
  return { ok: true };
}

/** A Super Admin switching two-step off for someone who lost their device (they can set it up again). */
export async function resetTwoFactor(adminId: ObjectId): Promise<void> {
  await (await users()).updateOne({ _id: adminId }, { $unset: { twoFactor: "", twoFactorPending: "" } });
}
