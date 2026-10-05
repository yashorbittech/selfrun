import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import RequisitionSummary from "@/components/prms/RequisitionSummary";
import RequisitionWorkflow from "@/components/prms/RequisitionWorkflow";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { hasPrmsStaffRole } from "@/lib/prms-roles";
import { getRequisition, serializeRequisition } from "@/lib/prms/requisitions";
import { getVendor } from "@/lib/prms/vendors";

export default async function MyRequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentPrmsUser();
  if (!user) notFound();

  const requisition = await getRequisition(id);
  if (!requisition) notFound();

  const isOwner = requisition.requestedBy.userId === user.id;
  if (!isOwner && !hasPrmsStaffRole(user.roles)) redirect("/prms/me/requisitions");

  const r = serializeRequisition(requisition);
  const vendor = r.preferredVendorId ? await getVendor(r.preferredVendorId) : null;

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "PRMS", href: "/prms/me" },
          { label: "My Requisitions", href: "/prms/me/requisitions" },
          { label: r.prCode },
        ]}
        title={<>{r.itemName}</>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <RequisitionSummary requisition={r} vendorName={vendor?.companyName ?? null} />
        <RequisitionWorkflow
          requisition={r}
          isOwner={isOwner}
          canApprove={false}
          canDecideCurrent={false}
          backPath="/prms/me/requisitions"
        />
      </div>
    </div>
  );
}
