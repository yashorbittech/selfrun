import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { PageHeader, Notice } from "@/components/smms/SmmsUi";
import AiWorkspace from "@/components/smms/AiWorkspace";
import { getViewer, can } from "@/lib/smms/viewer";
import { listWorkspaceRuns } from "@/lib/smms/generations";
import { listLiveOffers, listClientChoices } from "@/lib/smms/brand";
import { normalizeWorkspace } from "@/lib/smms/content";
import { isOpenAIConfigured } from "@/lib/openai";

export const maxDuration = 120;

export default async function AiGeneratorPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "GENERATE_AI_CONTENT")) redirect("/smms");
  const [runs, offers, clients] = await Promise.all([listWorkspaceRuns(viewer.userId, 20), listLiveOffers(30), listClientChoices()]);
  return (
    <div className="space-y-4">
      <PageHeader title="AI Content Generator" crumbs={[{ label: "AI Content Generator" }]} description="Campaign ideas, ad copy, posts, captions, scripts, headlines, CTAs, hashtags and creative concepts — written by OpenAI from your brand context." />
      <PanelListFilters>
{!(await isOpenAIConfigured()) && <Notice tone="warn">OpenAI isn&apos;t connected for this workspace (Settings → Integrations), so generation will fail.</Notice>}
      <AiWorkspace
        canCreatePost={can(viewer, "MANAGE_POSTS")}
        offers={offers.map((o) => ({ _id: o._id, title: o.title, badge: o.badge }))}
        clients={clients}
        history={runs.map((r) => {
          const snap = (r.snapshot ?? {}) as { output?: unknown };
          return { id: r.targetId, kind: r.kind, label: r.label, platform: r.platform, createdAt: r.createdAt.toISOString(), output: normalizeWorkspace(snap.output) };
        })}
      />
</PanelListFilters>
    </div>
  );
}
