import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { exportCertificates } from "@/lib/tms/certificates";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("manage.tms.certificates");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const idsParam = sp.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

  const rows = await exportCertificates({ search: sp.get("search") ?? undefined, ids });

  const csv = toCsv(rows, [
    { header: "Certificate Number", value: (r) => r.certificateNumber },
    { header: "Type", value: (r) => r.typeLabel },
    { header: "Student", value: (r) => r.studentName },
    { header: "Program", value: (r) => r.programName },
    { header: "Batch", value: (r) => r.batchName ?? "" },
    { header: "Issued On", value: (r) => r.issuedOn },
    { header: "Grade", value: (r) => r.grade ?? "" },
    { header: "Revoked", value: (r) => (r.revoked ? "Yes" : "No") },
  ]);

  const filename = `admin-tms-certificates-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
