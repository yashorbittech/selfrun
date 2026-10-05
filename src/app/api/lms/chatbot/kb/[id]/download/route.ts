import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedLmsRequest } from "@/lib/api-auth";
import { getPdfDocument } from "@/lib/kb-pdf";
import { readKbFileStream } from "@/lib/kb-storage";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getPdfDocument(id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const object = await readKbFileStream(doc.storageKey);
  if (!object) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      "Content-Length": String(doc.size),
    },
  });
}
