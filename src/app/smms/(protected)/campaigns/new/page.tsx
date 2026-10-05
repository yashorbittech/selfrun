import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/smms/SmmsUi";
import CampaignForm from "@/components/smms/CampaignForm";
import { EMPTY_CAMPAIGN_FORM } from "@/lib/smms/form-defaults";
import { getViewer, can } from "@/lib/smms/viewer";
import { briefPickers } from "@/lib/smms/page-data";

export const maxDuration = 120;

export default async function NewCampaignPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "CREATE_CAMPAIGNS")) redirect("/smms/campaigns");
  const pickers = await briefPickers();
  return (
    <div className="space-y-4">
      <PageHeader title="New campaign" crumbs={[{ label: "Campaigns & Ads", href: "/smms/campaigns" }, { label: "New" }]} description="Describe the campaign. OpenAI turns the brief + your brand context into a strategy, audiences, keywords and ad concepts per platform." />
      <SectionCard title="Campaign brief">
        <CampaignForm initial={EMPTY_CAMPAIGN_FORM} {...pickers} canGenerate={can(viewer, "GENERATE_AI_CONTENT")} />
      </SectionCard>
    </div>
  );
}
