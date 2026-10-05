import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import OfferForm from "@/components/lms/offers/OfferForm";
import DeleteEntityButton from "@/components/lms/offers/DeleteEntityButton";
import { getCampaign } from "@/lib/offers/campaigns";
import { getOffer, serializeOffer } from "@/lib/offers/offers";
import { deleteOfferAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string; offerId: string }> }) {
  const { id, offerId } = await params;
  const [campaign, offer] = await Promise.all([getCampaign(id), getOffer(offerId)]);
  if (!campaign || !offer || offer.campaignId !== id) notFound();

  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "Festival Offers", href: "/lms/offers" },
          { label: campaign.name, href: `/lms/offers/${id}` },
          { label: offer.title },
        ]}
        title={<>{offer.title}</>}
        actions={<><DeleteEntityButton
          label="offer"
          confirmText="This removes the offer from the public page immediately. This can't be undone."
          onDelete={deleteOfferAction.bind(null, id, offerId)}
          redirectTo={`/lms/offers/${id}`}
        /></>}
      />
<div className="relative mx-auto max-w-3xl space-y-4">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm campaignId={id} offer={serializeOffer(offer)} />
        </CardContent>
      </GlassCard>
    </div>
</div>
  );
}
