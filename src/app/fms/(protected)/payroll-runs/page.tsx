import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { Users, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import FmsDataTable from "@/components/fms/FmsDataTable";
import { listPayrollRuns } from "@/lib/fms/payroll";
import { payrollRunStatusMeta, monthLabelLong } from "@/lib/hrms/payroll-status";
import { formatMoney } from "@/lib/fms/constants";

export default async function PayrollRunsPage() {
  const runs = await listPayrollRuns();
  const totalNetThisRun = runs[0]?.totalNet ?? 0;
  const totalPayslips = runs.reduce((s, r) => s + r.payslipCount, 0);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Payroll Runs" }]}
        title={<>Payroll Runs</>}
        description={<>Read-only financial view over HRMS&apos;s real payroll runs — {runs.length} run{runs.length === 1 ? "" : "s"}.</>}
      />

      <KpiGrid>
        <KpiCard label="Total Runs" value={runs.length} accent icon={<Users className="size-4" />} />
        <KpiCard label="Latest Run Net Pay" value={<span>{formatMoney(totalNetThisRun)}</span>} icon={<Coins className="size-4" />} />
        <KpiCard label="Total Payslips" value={totalPayslips} icon={<Users className="size-4" />} />
      </KpiGrid>

      <FmsDataTable
        columns={[
          { key: "month", header: "Month" },
          { key: "employees", header: "Employees", align: "right" },
          { key: "gross", header: "Gross", align: "right" },
          { key: "deductions", header: "Deductions", align: "right" },
          { key: "net", header: "Net", align: "right" },
          { key: "status", header: "Status" },
        ]}
        rows={runs.map((r) => ({
          id: r._id,
          href: `/fms/payroll-runs/${r._id}`,
          cells: {
            month: monthLabelLong(r.month),
            employees: r.payslipCount,
            gross: formatMoney(r.totalGross),
            deductions: formatMoney(r.totalDeductions),
            net: formatMoney(r.totalNet),
            status: <Badge className={payrollRunStatusMeta(r.status).badgeClass}>{payrollRunStatusMeta(r.status).label}</Badge>,
          },
        }))}
        page={1}
        totalPages={1}
        total={runs.length}
        emptyLabel="No payroll runs found — runs are created in HRMS."
      />

      <p className="text-xs text-muted-foreground">Manage payroll runs at /hrms/payroll.</p>
    </div>
  );
}
