import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/pms/ProgressBar";
import { PaymentStatusBadge } from "@/components/tms/StatusBadges";
import PaymentPlanForm from "@/components/tms/PaymentPlanForm";
import PaymentDetailPanel from "@/components/tms/PaymentDetailPanel";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManagePayments } from "@/lib/tms-roles";
import { paymentWithMeta } from "@/lib/tms/payments";
import { listStudentOptions } from "@/lib/tms/students";
import { listProgramFeeOptions } from "@/lib/tms/programs";
import { listBatchPickerOptions } from "@/lib/tms/batches";
import { getTmsSettings } from "@/lib/tms/settings";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentTmsUser();
  if (!user || !canManagePayments(user)) redirect("/tms");

  const plan = await paymentWithMeta(id);
  if (!plan) notFound();

  const [students, programs, batches, settings] = await Promise.all([
    listStudentOptions(),
    listProgramFeeOptions(),
    listBatchPickerOptions(),
    getTmsSettings(),
  ]);

  const net = Math.max(plan.totalFees - plan.discount, 0);
  const pct = net > 0 ? Math.round((plan.paidAmount / net) * 100) : 100;

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms" }, { label: "Payments", href: "/tms/payments" }, { label: plan.studentName }]}
        title={<><span className="inline-flex flex-wrap items-center gap-2">{plan.studentName}<PaymentStatusBadge status={plan.status} /></span></>}
        description={<><Link href={`/tms/students/${plan.studentId}`} className="text-primary hover:underline">Student profile</Link>
            {" · "}{plan.programName}{plan.batchName ? ` · ${plan.batchName}` : ""}</>}
        actions={<><PaymentPlanForm
          plan={plan}
          students={students}
          programs={programs}
          batches={batches.map((b) => ({ _id: b._id, name: b.name, programId: b.programId }))}
          defaultCurrency={settings.defaultCurrency}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Pencil className="size-3.5" data-icon="inline-start" />
              Edit plan
            </Button>
          }
        /></>}
      />

      <KpiGrid>
        <KpiCard label="Net Fees" value={net} format="currency" accent icon={undefined} />
        <KpiCard label="Paid" value={plan.paidAmount} format="currency" />
        <KpiCard label="Pending" value={plan.pendingAmount} format="currency" tone={plan.pendingAmount > 0 ? "down" : undefined} />
        <KpiCard label="Discount" value={plan.discount} format="currency" />
      </KpiGrid>

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ProgressBar value={pct} />
          <p className="text-xs text-muted-foreground">
            {formatCurrency(plan.paidAmount, plan.currency)} of {formatCurrency(net, plan.currency)} collected.
            {plan.notes ? ` · ${plan.notes}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">Last updated {formatDateTime(plan.updatedAt)}</p>
        </CardContent>
      </GlassCard>

      <PaymentDetailPanel plan={plan} canManage />
    </div>
  );
}
