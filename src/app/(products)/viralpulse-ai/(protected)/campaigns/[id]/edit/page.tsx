import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/viralpulse-ai/SmmsUi";
import CampaignForm from "@/components/products/viralpulse-ai/CampaignForm";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { getCampaign } from "@/lib/products/viralpulse-ai/campaigns";
import { briefPickers, toDateInput } from "@/lib/products/viralpulse-ai/page-data";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  const { id } = await params;
  if (!can(viewer, "EDIT_CAMPAIGNS")) redirect(`/viralpulse-ai/campaigns/${id}`);
  const c = await getCampaign(id);
  if (!c) notFound();
  const pickers = await briefPickers();
  return (
    <div className="space-y-4">
      <PageHeader title="Edit brief" crumbs={[{ label: "Campaigns & Ads", href: "/viralpulse-ai/campaigns" }, { label: c.name, href: `/viralpulse-ai/campaigns/${id}` }, { label: "Edit brief" }]} description="Changing the brief doesn't rewrite existing AI content — regenerate the strategy or ads afterwards if needed." />
      <SectionCard title="Campaign brief">
        <CampaignForm
          campaignId={id}
          {...pickers}
          canGenerate={false}
          initial={{
            name: c.name, objective: c.objective, platforms: c.platforms, targetAudience: c.targetAudience, industry: c.industry, location: c.location,
            budget: c.budget === null ? "" : String(c.budget), currency: c.currency, startDate: toDateInput(c.startDate), endDate: toDateInput(c.endDate),
            cta: c.cta, landingPage: c.landingPage, offerService: c.offerService, offerId: c.offerId ?? "", clientId: c.clientId ?? "", brandInfo: c.brandInfo,
            keywords: c.keywords.join(", "), tone: c.tone, language: c.language,
          }}
        />
      </SectionCard>
    </div>
  );
}
