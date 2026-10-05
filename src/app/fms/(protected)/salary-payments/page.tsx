import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { Wallet, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import FmsDataTable from "@/components/fms/FmsDataTable";
import { listSalaryPayments, totalSalaryPayable } from "@/lib/fms/payroll";
import { payoutStatusMeta, PAYOUT_STATUSES, isValidPayoutStatus } from "@/lib/hrms/payout-status";
import { monthLabelLong } from "@/lib/hrms/payroll-status";
import { formatMoney } from "@/lib/fms/constants";

export default async function SalaryPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const status = sp.status && isValidPayoutStatus(sp.status) ? sp.status : undefined;

  const [result, payable] = await Promise.all([
    listSalaryPayments({ status, q: sp.search, page, pageSize: 20 }),
    totalSalaryPayable(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Salary Payments" }]}
        title={<>Salary Payments</>}
        description={<>Read-only financial view over HRMS&apos;s real salary payouts — {result.total} payment{result.total === 1 ? "" : "s"}.</>}
      />

      <KpiGrid>
        <KpiCard label="Total Payments" value={result.total} accent icon={<Wallet className="size-4" />} />
        <KpiCard label="Salary Payable" value={<span>{formatMoney(payable)}</span>} tone={payable > 0 ? "down" : undefined} icon={<Clock className="size-4" />} />
      </KpiGrid>

      <FmsDataTable
        columns={[
          { key: "employee", header: "Employee" },
          { key: "month", header: "Month" },
          { key: "net", header: "Net Payable", align: "right" },
          { key: "utr", header: "Reference" },
          { key: "status", header: "Status" },
        ]}
        rows={result.items.map((p) => ({
          id: p._id,
          cells: {
            employee: `${p.employeeName} (${p.employeeCode})`,
            month: monthLabelLong(p.month),
            net: formatMoney(p.netPayable),
            utr: p.utr ?? "—",
            status: <Badge className={payoutStatusMeta(p.status).badgeClass}>{payoutStatusMeta(p.status).label}</Badge>,
          },
        }))}
        filters={[{ key: "status", label: "Status", value: sp.status ?? "", options: PAYOUT_STATUSES.map((s) => ({ value: s.value, label: s.label })) }]}
        search={sp.search ?? ""}
        searchPlaceholder="Employee name, code"
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        emptyLabel="No salary payments found — payments are executed in HRMS."
      />

      <p className="text-xs text-muted-foreground">Initiate or reconcile payouts at /hrms/payroll.</p>
    </div>
  );
}
