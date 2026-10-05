import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/smms/viewer";
import { getMedia } from "@/lib/smms/media";
import { getObject } from "@/lib/storage/blob";

type Context = { params: Promise<{ id: string }> };

/**
 * Authenticated media streamer — the only way a browser reaches a library file
 * (the Blob store is private). Any signed-in SMMS user may view media; the
 * response can never execute script. `?download=1` forces a download.
 */
export async function GET(req: NextRequest, { params }: Context) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const media = await getMedia(id);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const object = await getObject(media.storageKey).catch(() => null);
  if (!object) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ext = media.contentType.split("/")[1] ?? "bin";
  const filename = `${media.name.replace(/[^\w .-]+/g, "").trim() || "media"}.${ext}`;
  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": media.contentType,
      "Content-Disposition": `${req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
