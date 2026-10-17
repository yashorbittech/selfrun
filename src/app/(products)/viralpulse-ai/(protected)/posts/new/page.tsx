import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/viralpulse-ai/SmmsUi";
import PostBriefForm from "@/components/products/viralpulse-ai/PostBriefForm";
import { EMPTY_POST_BRIEF } from "@/lib/products/viralpulse-ai/form-defaults";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { briefPickers } from "@/lib/products/viralpulse-ai/page-data";
import { listCampaignOptions } from "@/lib/products/viralpulse-ai/campaigns";

export const maxDuration = 120;

export default async function NewPostPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "MANAGE_POSTS")) redirect("/viralpulse-ai/posts");
  const sp = await searchParams;
  const [pickers, campaigns] = await Promise.all([briefPickers(), listCampaignOptions()]);
  return (
    <div className="space-y-4">
      <PageHeader title="New post" crumbs={[{ label: "Social Media Posts", href: "/viralpulse-ai/posts" }, { label: "New" }]} description="Pick platforms and describe the post — OpenAI writes a platform-native version for each, plus the image or video creative." />
      <SectionCard title="Post brief">
        <PostBriefForm initial={{ ...EMPTY_POST_BRIEF, campaignId: sp.campaign ?? "" }} {...pickers} campaigns={campaigns} canGenerate={can(viewer, "GENERATE_AI_CONTENT")} />
      </SectionCard>
    </div>
  );
}
