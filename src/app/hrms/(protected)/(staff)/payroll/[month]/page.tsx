import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import PayrollRunDetail from "@/components/hrms/PayrollRunDetail";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canRunPayroll } from "@/lib/hrms-roles";
import { getRunByMonth, getPayslipsForRun, serializeRun, serializePayslip } from "@/lib/hrms/payroll-run";
import { payoutsForRun, serializePayout } from "@/lib/hrms/salary-payouts";

export default async function PayrollRunPage({ params }: { params: Promise<{ month: string }> }) {
  const user = await getCurrentHrmsUser();
  if (!user || !canRunPayroll(user)) redirect("/hrms");

  const { month } = await params;
  const run = await getRunByMonth(month);
  if (!run) notFound();
  const [slips, payouts] = await Promise.all([
    getPayslipsForRun(run._id).then((s) => s.map(serializePayslip)),
    payoutsForRun(run._id).then((p) => p.map(serializePayout)),
  ]);
  const r = serializeRun(run);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/hrms" }, { label: "Payroll", href: "/hrms/payroll" }, { label: month }]}
        title={<>Payroll · {month}</>}
        description={<>Review, approve and pay this payroll run.</>}
        actions={
          <Link href="/hrms/payroll" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> All runs
          </Link>
        }
      />

      <PayrollRunDetail
        run={{
          _id: r._id,
          month: r.month,
          status: r.status,
          totalGross: r.totalGross,
          totalNet: r.totalNet,
          totalDeductions: r.totalDeductions,
          totalEmployerCost: r.totalEmployerCost,
        }}
        slips={slips.map((s) => ({
          _id: s._id,
          employeeId: s.employeeId,
          employeeName: s.employeeName,
          employeeCode: s.employeeCode,
          workingDays: s.workingDays,
          lopDays: s.lopDays,
          earnings: s.earnings,
          grossPay: s.grossPay,
          deductions: s.deductions,
          totalDeductions: s.totalDeductions,
          employerContributions: s.employerContributions,
          employerCost: s.employerCost,
          netPay: s.netPay,
          overrides: s.overrides,
          bankAccountLast4: s.bankAccountLast4,
          bankName: s.bankName,
          ifsc: s.ifsc,
        }))}
        payouts={payouts.map((p) => ({
          _id: p._id,
          employeeName: p.employeeName,
          employeeCode: p.employeeCode,
          netPayable: p.netPayable,
          paymentAmount: p.paymentAmount,
          bankAccountMasked: p.bankAccountMasked,
          bankName: p.bankName,
          status: p.status,
          paymentProvider: p.paymentProvider,
          utr: p.utr,
          failureReason: p.failureReason,
        }))}
      />
    </div>
  );
}
