import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Banknote } from "lucide-react";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import PayrollRunManager from "@/components/hrms/PayrollRunManager";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canRunPayroll } from "@/lib/hrms-roles";
import { listRuns, serializeRun } from "@/lib/hrms/payroll-run";

export default async function PayrollPage() {
  const user = await getCurrentHrmsUser();
  if (!user || !canRunPayroll(user)) redirect("/hrms");

  const runs = (await listRuns()).map(serializeRun);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/hrms" }, { label: "Payroll" }]}
        title={<>Payroll</>}
        description={<>Generate monthly runs, review payslips, and approve. Disbursement happens under Salary Payouts.</>}
        actions={<><Link href="/hrms/payroll/payouts" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Banknote className="size-3.5" data-icon="inline-start" />
          Salary Payouts
        </Link></>}
      />

      <PanelListFilters>
<PayrollRunManager
        runs={runs.map((r) => ({
          _id: r._id,
          month: r.month,
          status: r.status,
          payslipCount: r.payslipCount,
          totalGross: r.totalGross,
          totalNet: r.totalNet,
          totalEmployerCost: r.totalEmployerCost,
          generatedAt: r.generatedAt,
        }))}
      />
</PanelListFilters>
    </div>
  );
}
