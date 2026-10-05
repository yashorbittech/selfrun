import type { NextRequest } from "next/server";
import { requireSession, jsonError } from "@/lib/messenger/route-helpers";
import { globalSearch, type SearchType } from "@/lib/messenger/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES: SearchType[] = ["messages", "channels", "users", "files", "projects", "groups"];

/** GET /api/messenger/search?q=&types=messages,channels,users */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q") ?? "";
    const typesParam = sp.get("types");
    const types = typesParam
      ? (typesParam.split(",").filter((t) => VALID_TYPES.includes(t as SearchType)) as SearchType[])
      : undefined;
    const results = await globalSearch(q, user, { types, limit: sp.get("limit") ? Number(sp.get("limit")) : undefined });
    return Response.json({ results });
  } catch (err) {
    return jsonError(err);
  }
}
