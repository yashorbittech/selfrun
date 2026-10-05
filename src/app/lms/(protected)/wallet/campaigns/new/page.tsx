import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import CampaignForm from "@/components/lms/wallet/CampaignForm";

export const metadata = { title: "New referral campaign · Wallet" };

export default function NewCampaignPage() {
  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/lms" }, { label: "Wallet", href: "/lms/wallet" }, { label: "Referral campaigns", href: "/lms/wallet/campaigns" }, { label: "New" }]}
        title={<>New referral campaign</>}
      />
<div className="relative mx-auto max-w-2xl space-y-4">
      <GlassCard><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent><CampaignForm /></CardContent></GlassCard>
    </div>
</div>
  );
}
