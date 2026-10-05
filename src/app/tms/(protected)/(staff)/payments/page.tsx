import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, IndianRupee, Wallet, AlarmClock, TrendingUp } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import TimeSeriesChart from "@/components/lms/TimeSeriesChart";
import CategoryBarChart from "@/components/lms/CategoryBarChart";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/tms/StatusBadges";
import PaymentPlanForm from "@/components/tms/PaymentPlanForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManagePayments } from "@/lib/tms-roles";
import { listPaymentPlans, getPaymentAnalytics } from "@/lib/tms/payments";
import { listStudentOptions } from "@/lib/tms/students";
import { listProgramFeeOptions } from "@/lib/tms/programs";
import { listBatchPickerOptions } from "@/lib/tms/batches";
import { getTmsSettings } from "@/lib/tms/settings";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PaymentsPage() {
  const user = await getCurrentTmsUser();
  if (!user || !canManagePayments(user)) redirect("/tms");

  const [plans, analytics, students, programs, batches, settings] = await Promise.all([
    listPaymentPlans({}, 800),
    getPaymentAnalytics(),
    listStudentOptions(),
    listProgramFeeOptions(),
    listBatchPickerOptions(),
    getTmsSettings(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms" }, { label: "Payments" }]}
        title={<>Payments</>}
        description={<>{analytics.planCount} fee plan{analytics.planCount === 1 ? "" : "s"}.</>}
        actions={<><PaymentPlanForm
          students={students}
          programs={programs}
          batches={batches.map((b) => ({ _id: b._id, name: b.name, programId: b.programId }))}
          defaultCurrency={settings.defaultCurrency}
          trigger={
            <Button type="button" size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              New Fee Plan
            </Button>
          }
        /></>}
      />

      <PanelListFilters>
<KpiGrid>
        <KpiCard label="Total Billed" value={analytics.totalBilled} format="currency" accent icon={<IndianRupee className="size-4" />} />
        <KpiCard label="Collected" value={analytics.totalCollected} format="currency" icon={<Wallet className="size-4" />} />
        <KpiCard label="Pending" value={analytics.totalPending} format="currency" tone={analytics.totalPending > 0 ? "down" : undefined} icon={<AlarmClock className="size-4" />} />
        <KpiCard label="Fully Paid" value={analytics.fullyPaid} icon={<TrendingUp className="size-4" />} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <CardHeader><CardTitle>Collection Trend</CardTitle></CardHeader>
          <CardContent><TimeSeriesChart data={analytics.collectionTrend} /></CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader><CardTitle>Collected by Program</CardTitle></CardHeader>
          <CardContent><CategoryBarChart data={analytics.byProgram} /></CardContent>
        </GlassCard>
      </div>

      <GlassCard interactive={false}>
        <CardContent className="max-h-[60vh] overflow-auto">
          {plans.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No fee plans yet. Use “New Fee Plan”.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <Link href={`/tms/payments/${p._id}`} className="font-medium hover:underline">{p.studentName}</Link>
                      {p.studentCode && <div className="font-mono text-xs text-muted-foreground">{p.studentCode}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.programName}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(Math.max(p.totalFees - p.discount, 0), p.currency)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(p.paidAmount, p.currency)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(p.pendingAmount, p.currency)}</TableCell>
                    <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
