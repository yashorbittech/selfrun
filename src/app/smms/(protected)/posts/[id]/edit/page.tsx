import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/smms/SmmsUi";
import PostBriefForm from "@/components/smms/PostBriefForm";
import { getViewer, can } from "@/lib/smms/viewer";
import { getPost } from "@/lib/smms/posts";
import { briefPickers, toLocalInput } from "@/lib/smms/page-data";
import { listCampaignOptions } from "@/lib/smms/campaigns";

const local = (d: Date | null) => (d ? toLocalInput(d) : "");

export default async function EditPostBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  const { id } = await params;
  if (!can(viewer, "MANAGE_POSTS")) redirect(`/smms/posts/${id}`);
  const p = await getPost(id);
  if (!p) notFound();
  const [pickers, campaigns] = await Promise.all([briefPickers(), listCampaignOptions()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Edit post brief" crumbs={[{ label: "Social Media Posts", href: "/smms/posts" }, { label: p.title, href: `/smms/posts/${id}` }, { label: "Edit brief" }]} description="Adding a platform adds an empty version for it — regenerate that version afterwards." />
      <SectionCard title="Post brief">
        <PostBriefForm
          postId={id}
          {...pickers}
          campaigns={campaigns}
          canGenerate={false}
          lockedPlatforms={p.variants.filter((v) => v.publish.state === "published").map((v) => v.platform)}
          initial={{ title: p.title, topic: p.topic, serviceProduct: p.serviceProduct, audience: p.audience, tone: p.tone, language: p.language, objective: p.objective, contentType: p.contentType, platforms: p.platforms, link: p.link ?? "", plannedAt: local(p.plannedAt), campaignId: p.campaignId ?? "", offerId: p.offerId ?? "", clientId: p.clientId ?? "", notes: p.notes }}
        />
      </SectionCard>
    </div>
  );
}
