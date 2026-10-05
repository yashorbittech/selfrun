import type { NextRequest } from "next/server";
import { requireSession, jsonError } from "@/lib/messenger/route-helpers";
import { resolveVisibleScopes } from "@/lib/messenger/access";
import { listAccessibleFiles, type AttachmentKind } from "@/lib/messenger/attachments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KINDS: AttachmentKind[] = ["image", "voice", "video", "file"];

/** GET /api/messenger/files?q=&category=&kind=&scopeId=&page= */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const sp = request.nextUrl.searchParams;
    const scopes = await resolveVisibleScopes(user);

    const kindParam = sp.get("kind");
    const result = await listAccessibleFiles(scopes, {
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
      kind: KINDS.includes(kindParam as AttachmentKind) ? (kindParam as AttachmentKind) : undefined,
      scopeId: sp.get("scopeId") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    });
    return Response.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
