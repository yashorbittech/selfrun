import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import CampaignForm from "@/components/lms/wallet/CampaignForm";
import DeleteEntityButton from "@/components/lms/offers/DeleteEntityButton";
import { getCampaign, serializeCampaign } from "@/lib/wallet/campaigns";
import { deleteCampaignAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();
  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/lms" }, { label: "Wallet", href: "/lms/wallet" }, { label: "Referral campaigns", href: "/lms/wallet/campaigns" }, { label: campaign.name }]}
        title={<>{campaign.name}</>}
        actions={<><DeleteEntityButton label="campaign" confirmText="Referrals already recorded are kept. New signups will no longer be attributed under this campaign." onDelete={deleteCampaignAction.bind(null, id)} redirectTo="/lms/wallet/campaigns" /></>}
      />
<div className="relative mx-auto max-w-2xl space-y-4">
      <GlassCard><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent><CampaignForm campaign={serializeCampaign(campaign)} /></CardContent></GlassCard>
    </div>
</div>
  );
}
