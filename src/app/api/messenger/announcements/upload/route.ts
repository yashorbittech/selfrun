import type { NextRequest } from "next/server";
import { requireSession, jsonError, HttpError } from "@/lib/messenger/route-helpers";
import { canPostAnnouncements } from "@/lib/messenger-roles";
import { saveAttachment } from "@/lib/messenger/attachments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/messenger/announcements/upload (multipart) — author-only attachment upload. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSession();
    if (!canPostAnnouncements(user)) throw new HttpError(403, "You can't post announcements.");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file provided.");
    const attachment = await saveAttachment(file);
    return Response.json({ attachment });
  } catch (err) {
    return jsonError(err);
  }
}
