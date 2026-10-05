import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import CampaignForm from "@/components/lms/offers/CampaignForm";

export const metadata = { title: "New campaign · Festival Offers" };

export default function NewCampaignPage() {
  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "Festival Offers", href: "/lms/offers" },
          { label: "New campaign" },
        ]}
        title={<>New campaign</>}
      />
<div className="relative mx-auto max-w-3xl space-y-4">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm />
        </CardContent>
      </GlassCard>
    </div>
</div>
  );
}
