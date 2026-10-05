import { NextRequest, NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/portal-auth";
import { resolvePortalDownload } from "@/lib/portal/documents";
import { recordPortalAudit } from "@/lib/portal/audit";

/**
 * The single authed download gate for the portal. `type` is `staff` | `resume` |
 * `project`; `resolvePortalDownload` authorizes the referenced file against the
 * signed-in external user (own shared doc, own résumé, or a document on one of
 * their own projects) — anything else 404s.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const user = await getCurrentPortalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await params;
  const target = await resolvePortalDownload(user, type, id).catch(() => null);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordPortalAudit({
    actorId: user.id,
    action: "document_download",
    entity: type,
    entityId: id,
    summary: target.filename,
  }).catch(() => {});

  return new NextResponse(target.stream, {
    headers: {
      "Content-Type": target.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(target.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
