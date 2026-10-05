import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";

/**
 * A small fixed-window rate limiter for PUBLIC endpoints (forms, coupon checks, payments). Counters live in the
 * database — serverless instances share no memory — keyed by bucket + client address, and expire on their own.
 * If the database can't be reached the request is allowed: a broken limiter must not take the site down.
 */
const COLLECTION = "security_rate_limits";
let indexed = false;

/** The client's address. On Vercel `x-vercel-forwarded-for` is set by the platform and cannot be spoofed by the caller. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || (h.get("x-forwarded-for") ?? "").split(",")[0] || "unknown").trim().slice(0, 64);
}

export async function rateLimit(req: Request, bucket: string, limit: number, windowSeconds: number): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  try {
    const windowMs = windowSeconds * 1000;
    const now = Date.now();
    const slot = Math.floor(now / windowMs);
    const id = `${bucket}:${createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 24)}:${slot}`;
    const col = (await getPlatformDb()).collection<{ _id: string; n: number; expireAt: Date }>(COLLECTION);
    if (!indexed) {
      indexed = true;
      await col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
    }
    const doc = await col.findOneAndUpdate({ _id: id }, { $inc: { n: 1 }, $setOnInsert: { expireAt: new Date((slot + 2) * windowMs) } }, { upsert: true, returnDocument: "after" });
    if ((doc?.n ?? 1) > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil(((slot + 1) * windowMs - now) / 1000)) };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/** `null` when allowed, else a ready 429 response. */
export async function limitOr429(req: Request, bucket: string, limit: number, windowSeconds: number): Promise<NextResponse | null> {
  const r = await rateLimit(req, bucket, limit, windowSeconds);
  if (r.ok) return null;
  const res = NextResponse.json({ ok: false, error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  res.headers.set("Retry-After", String(r.retryAfter));
  return res;
}
