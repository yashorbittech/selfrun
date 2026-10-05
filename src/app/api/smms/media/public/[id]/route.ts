import { NextRequest, NextResponse } from "next/server";
import { verifyMediaToken } from "@/lib/smms/crypto";
import { getMedia } from "@/lib/smms/media";
import { getObject } from "@/lib/storage/blob";

type Context = { params: Promise<{ id: string }> };

/**
 * Signed, one-hour media URL for platforms that fetch media by URL while a
 * post is being published (Instagram, Facebook, Google Business Profile).
 * No session — the HMAC signature over id + expiry is the only credential,
 * minted by `publicMediaUrl` at publish time.
 */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyMediaToken(id, exp, sig)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const media = await getMedia(id);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const object = await getObject(media.storageKey).catch(() => null);
  if (!object) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": media.contentType,
      ...(media.size ? { "Content-Length": String(media.size) } : {}),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
