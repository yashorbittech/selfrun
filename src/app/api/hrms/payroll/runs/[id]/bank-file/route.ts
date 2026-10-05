import { NextRequest, NextResponse } from "next/server";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canRunPayroll } from "@/lib/hrms-roles";
import { getRun } from "@/lib/hrms/payroll-run";
import { payoutsForRun } from "@/lib/hrms/salary-payouts";
import { bankAccountForPayout } from "@/lib/hrms/bank-accounts";
import { recordAudit } from "@/lib/hrms/audit";
import { toCsv } from "@/lib/csv";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const user = await getCurrentHrmsUser();
  if (!user || !canRunPayroll(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  if (run.status === "draft") {
    return NextResponse.json({ error: "Approve the run before exporting the bank file." }, { status: 400 });
  }

  const payouts = (await payoutsForRun(id)).filter((p) => p.status === "pending" || p.status === "initiated");

  const rows: { code: string; name: string; account: string; ifsc: string; amount: number }[] = [];
  for (const p of payouts) {
    if (!p.bankAccountId) continue;
    const bank = await bankAccountForPayout(p.bankAccountId);
    if (!bank) continue;
    rows.push({ code: p.employeeCode, name: bank.holder || p.employeeName, account: bank.accountNumber, ifsc: bank.ifsc, amount: p.paymentAmount });
  }

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "view_sensitive",
    entity: "salary_payout",
    entityId: run._id,
    entityLabel: `Bank file — ${run.month}`,
    summary: `Exported ${rows.length} account number(s)`,
  });

  const csv = toCsv(rows, [
    { header: "Employee Code", value: (r) => r.code },
    { header: "Beneficiary Name", value: (r) => r.name },
    { header: "Account Number", value: (r) => r.account },
    { header: "IFSC", value: (r) => r.ifsc },
    { header: "Amount", value: (r) => r.amount },
    { header: "Payment Mode", value: () => "NEFT" },
    { header: "Narration", value: () => `Salary ${run.month}` },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bank-file-${run.month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
