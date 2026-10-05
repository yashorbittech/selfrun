import { NextRequest, NextResponse } from "next/server";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canManageProjects } from "@/lib/pms-roles";
import { getDocument, deleteDocument } from "@/lib/pms/documents";
import { readDocumentStream } from "@/lib/pms/document-storage";
import { recordActivity } from "@/lib/pms/activity";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const user = await getCurrentPmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const object = await readDocumentStream(doc.storageKey);
  if (!object) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(doc.filename)}"`,
      "Content-Length": String(doc.size),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const user = await getCurrentPmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageProjects(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const result = await deleteDocument(id);
  if (!result.ok) return NextResponse.json({ error: "Could not delete document." }, { status: 400 });

  await recordActivity({
    actorId: user.id,
    actorEmail: user.email,
    action: "delete",
    entity: "project",
    entityId: doc.projectId,
    entityLabel: `Document · ${doc.title}`,
    projectId: doc.projectId,
  });
  return NextResponse.json({ ok: true });
}
