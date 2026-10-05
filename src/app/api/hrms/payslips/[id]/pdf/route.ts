import { NextRequest, NextResponse } from "next/server";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canRunPayroll, canManagePayroll } from "@/lib/hrms-roles";
import { getPayslipPdfData } from "@/lib/hrms/payslip-pdf";
import { renderPayslipPdf } from "@/components/hrms/PayslipPdfDocument";
import { recordAudit } from "@/lib/hrms/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentHrmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await getPayslipPdfData(id);
  if (!data) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });

  const isStaff = canRunPayroll(user) || canManagePayroll(user);
  const isOwner =
    user.employeeId === data.employeeId && ["approved", "paid"].includes(data.runStatus);
  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await renderPayslipPdf(data);

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "generate",
    entity: "payslip",
    entityId: id,
    entityLabel: `${data.employee.name} · ${data.month}`,
    summary: `Payslip PDF downloaded${isOwner && !isStaff ? " by employee" : ""}`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Payslip-${data.employee.code}-${data.month}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
