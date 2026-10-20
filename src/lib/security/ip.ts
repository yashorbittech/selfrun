import { verifiedClientIp } from "@/lib/security/transport-ip";

/**
 * The address a request really came from. Only headers a trusted edge sets are believed:
 *  1. `x-vercel-forwarded-for` / `cf-connecting-ip` — set by the hosting platform / CDN; the caller cannot choose them;
 *  2. `x-real-ip` — set by the reverse proxy in front of the app;
 *  3. the RIGHT-most `x-forwarded-for` entry — the one our own proxy appended (left-most entries are whatever the caller typed).
 * Never use the left-most `x-forwarded-for`: any visitor can put anything there and walk around a rate limit or a ban.
 */
export function clientIpFrom(headers: Headers): string {
  const internal = verifiedClientIp(headers.get("x-internal-ip")); // our own server forwarding a Server Action on a person's behalf
  if (internal) return internal;
  const pick = (v: string | null) => (v ?? "").split(",")[0].trim();
  const direct = pick(headers.get("x-vercel-forwarded-for")) || pick(headers.get("cf-connecting-ip")) || pick(headers.get("x-real-ip"));
  if (direct) return direct.slice(0, 64);
  const xff = (headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return (xff[xff.length - 1] ?? "unknown").slice(0, 64);
}
