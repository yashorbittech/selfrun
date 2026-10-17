import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * App-level secret encryption for SMMS platform tokens: AES-256-GCM keyed by
 * `SMMS_ENCRYPTION_KEY` (base64, 32 bytes — `openssl rand -base64 32`). A
 * deliberate per-module copy of the FMS/HRMS helper: key material for one
 * module's secrets is never shared with another's, so rotating one never
 * touches the others. Each value carries its own random IV and auth tag, and
 * the record id is bound in as additional authenticated data so a ciphertext
 * can't be copied onto a different record.
 *
 * The plaintext is only ever produced by `decryptSecret`, called from the one
 * place a token is used (see `integrations.ts`); it is never logged or sent to a list.
 *
 * Key rotation: keep the old key, decrypt every token in `smms_integrations`
 * and re-encrypt with the new key, then swap `SMMS_ENCRYPTION_KEY`.
 */

export interface EncryptedValue {
  c: string; // ciphertext (base64)
  iv: string; // 12-byte nonce (base64)
  t: string; // GCM auth tag (base64)
}

const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = process.env.SMMS_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SMMS_ENCRYPTION_KEY must be a base64-encoded 32-byte key (openssl rand -base64 32).");
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    return getKey() !== null;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string, recordId: string): EncryptedValue {
  const key = getKey();
  if (!key) throw new Error("MISSING_ENCRYPTION_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  cipher.setAAD(Buffer.from(recordId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { c: ciphertext.toString("base64"), iv: iv.toString("base64"), t: cipher.getAuthTag().toString("base64") };
}

/** Never throws into a render — a bad key or tampered data returns null (and logs the failure, not the value). */
export function decryptSecret(value: EncryptedValue | null | undefined, recordId: string): string | null {
  if (!value) return null;
  try {
    const key = getKey();
    if (!key) return null;
    const decipher = createDecipheriv(ALGO, key, Buffer.from(value.iv, "base64"));
    decipher.setAAD(Buffer.from(recordId, "utf8"));
    decipher.setAuthTag(Buffer.from(value.t, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(value.c, "base64")), decipher.final()]).toString("utf8");
  } catch {
    console.error("smms/crypto: failed to decrypt a stored secret");
    return null;
  }
}

/**
 * Short-lived signed URLs for handing a PRIVATE media file to a platform that
 * fetches media by URL (Instagram, Facebook, Google Business Profile). The HMAC
 * key is derived from the encryption key, so nothing extra has to be configured.
 */
function signingKey(): Buffer | null {
  const key = getKey();
  return key ? createHmac("sha256", key).update("smms-media-url").digest() : null;
}

export function signMediaToken(mediaId: string, expiresAt: number): string | null {
  const key = signingKey();
  if (!key) return null;
  return createHmac("sha256", key).update(`${mediaId}.${expiresAt}`).digest("base64url");
}

export function verifyMediaToken(mediaId: string, expiresAt: number, sig: string): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = signMediaToken(mediaId, expiresAt);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
