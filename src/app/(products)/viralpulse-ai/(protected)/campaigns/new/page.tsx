import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/viralpulse-ai/SmmsUi";
import CampaignForm from "@/components/products/viralpulse-ai/CampaignForm";
import { EMPTY_CAMPAIGN_FORM } from "@/lib/products/viralpulse-ai/form-defaults";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { briefPickers } from "@/lib/products/viralpulse-ai/page-data";

export const maxDuration = 300;

export default async function NewCampaignPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "CREATE_CAMPAIGNS")) redirect("/viralpulse-ai/campaigns");
  const pickers = await briefPickers();
  return (
    <div className="space-y-4">
      <PageHeader title="New campaign" crumbs={[{ label: "Campaigns & Ads", href: "/viralpulse-ai/campaigns" }, { label: "New" }]} description="Describe the campaign. OpenAI turns the brief + your brand context into a strategy, audiences, keywords and ad concepts per platform." />
      <SectionCard title="Campaign brief">
        <CampaignForm initial={EMPTY_CAMPAIGN_FORM} {...pickers} canGenerate={can(viewer, "GENERATE_AI_CONTENT")} />
      </SectionCard>
    </div>
  );
}
