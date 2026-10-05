import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { RefundStatusBadge } from "@/components/fms/StatusBadges";
import RefundStatusActions from "@/components/fms/RefundStatusActions";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageTransactions, canApproveTransactions } from "@/lib/fms-roles";
import { getRefund, serializeRefund } from "@/lib/fms/refunds";
import { formatMoney } from "@/lib/fms/constants";
import { formatDateTime } from "@/lib/utils";

export default async function RefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentFmsUser();
  const raw = await getRefund(id);
  if (!raw) notFound();
  const refund = serializeRefund(raw);
  const canAct = user ? canManageTransactions(user) || canApproveTransactions(user) : false;

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Refunds", href: "/fms/refunds" }, { label: refund.refundNumber }]}
        title={<>{refund.refundNumber}</>}
        description={<>{refund.customerName}</>}
        actions={<><RefundStatusBadge status={refund.status} /></>}
      />

      {canAct && (
        <GlassCard>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent>
            <RefundStatusActions id={refund._id} status={refund.status} />
          </CardContent>
        </GlassCard>
      )}

      <GlassCard>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Receipt" value={<Link href={`/fms/receipts/${refund.receiptId}`} className="text-primary hover:underline">{refund.receiptNumber}</Link>} />
          <Row label="Amount" value={formatMoney(refund.amount)} />
          <Row label="Reason" value={refund.reason} />
          <Row label="Approved By" value={refund.approvedBy ?? "—"} />
          <Row label="Approved At" value={refund.approvedAt ? formatDateTime(refund.approvedAt) : "—"} />
          <Row label="Created" value={formatDateTime(refund.createdAt)} />
        </CardContent>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
