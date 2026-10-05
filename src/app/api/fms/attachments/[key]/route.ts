import { NextRequest, NextResponse } from "next/server";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { readAttachmentStream } from "@/lib/fms/attachment-storage";
import { getDb } from "@/lib/mongodb";

type Context = { params: Promise<{ key: string }> };

/**
 * Authed streamer for FMS attachments. Any signed-in FMS user may fetch a
 * file referenced by a transaction — FMS has no employee self-service tier
 * in Phase 1, so every FMS session is staff.
 */
export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentFmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;

  const db = await getDb();
  const txn = await db
    .collection<{ attachments?: { storageKey: string; filename: string; contentType: string }[] }>("fms_transactions")
    .findOne({ "attachments.storageKey": key, deletedAt: null });

  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const meta = txn.attachments?.find((a) => a.storageKey === key);
  const object = await readAttachmentStream(key);
  if (!object) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": meta?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(meta?.filename ?? key)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
