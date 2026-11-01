import { redirect } from "next/navigation";
import { Images, Palette, Sparkles, Wand2 } from "lucide-react";
import PanelTabs from "@/components/platform/panel/PanelTabs";
import { PageHeader, Notice } from "@/components/products/viralpulse-ai/SmmsUi";
import StudioCreate, { type StudioConfig } from "@/components/products/viralpulse-ai/studio/StudioCreate";
import StudioKit from "@/components/products/viralpulse-ai/studio/StudioKit";
import ConnectionGate from "@/components/products/viralpulse-ai/shared/ConnectionGate";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { getMedia, toMediaCard } from "@/lib/products/viralpulse-ai/media";
import { getBrandKit, getImageSettings, getProject } from "@/lib/products/viralpulse-ai/images/store";
import { toProjectView } from "@/lib/products/viralpulse-ai/images/view";
import { isGeminiImageConfigured } from "@/lib/products/viralpulse-ai/images/deps-default";
import { isOpenAIConfigured } from "@/lib/openai";
import MediaLibraryTab from "./MediaLibraryTab";

export const maxDuration = 300;

/**
 * AI Image Studio. Create: guided flow (goal and sizes, brief, brand kit, references, generate / edit / compare, finish with exports).
 * Quick generate: the same engine in three steps. Library: every image and video. Brand kit: logo, colours, rules, limits.
 */
export default async function ImageStudioPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  const canLibrary = can(viewer, "MANAGE_MEDIA") || can(viewer, "MANAGE_POSTS") || can(viewer, "CREATE_ADS");
  const canGenerate = can(viewer, "MANAGE_MEDIA") && can(viewer, "GENERATE_AI_CONTENT");
  if (!canLibrary && !canGenerate) redirect("/viralpulse-ai");
  const sp = await searchParams;
  const requested = sp.tab === "generate" ? "quick" : sp.tab;
  const order = [...(canGenerate ? ["create", "quick"] : []), ...(canLibrary ? ["library"] : []), ...(canLibrary || canGenerate ? ["brand"] : [])] as const;
  const tab = (order as readonly string[]).includes(requested ?? "") ? (requested as (typeof order)[number]) : order[0];
  const tabs = [
    ...(canGenerate ? [{ key: "create", label: "Create", icon: <Wand2 className="size-4" />, href: "/viralpulse-ai/image-studio?tab=create" }, { key: "quick", label: "Quick generate", icon: <Sparkles className="size-4" />, href: "/viralpulse-ai/image-studio?tab=quick" }] : []),
    ...(canLibrary ? [{ key: "library", label: "Library", icon: <Images className="size-4" />, href: "/viralpulse-ai/image-studio?tab=library" }] : []),
    { key: "brand", label: "Brand kit", icon: <Palette className="size-4" />, href: "/viralpulse-ai/image-studio?tab=brand" },
  ];

  let body: React.ReactNode;
  if (tab === "library") {
    body = <MediaLibraryTab viewer={viewer} sp={sp} />;
  } else {
    const [openai, gemini, settings, kit] = await Promise.all([isOpenAIConfigured(), isGeminiImageConfigured(), getImageSettings(), getBrandKit()]);
    const logo = kit.logoMediaId ? await getMedia(kit.logoMediaId) : null;
    if (tab === "brand") {
      body = <StudioKit kit={kit} logo={logo ? toMediaCard(logo) : null} settings={settings} canEdit={can(viewer, "MANAGE_INTEGRATIONS")} geminiConnected={gemini} />;
    } else {
      const project = sp.project && tab === "create" ? await getProject(sp.project) : null;
      const config: StudioConfig = {
        kit,
        logo: logo ? toMediaCard(logo) : null,
        settings: { maxVariants: settings.maxVariants, badgeForPeopleDefault: settings.badgeForPeopleDefault, dailySpendCapUsd: settings.dailySpendCapUsd, approvalThresholdUsd: settings.approvalThresholdUsd },
        providers: { openai, gemini },
        defaultProvider: settings.defaultProvider === "gemini" && gemini ? "gemini" : "openai",
        defaultQuality: settings.defaultQuality,
        canApprove: can(viewer, "PUBLISH_CONTENT"),
        canPost: can(viewer, "MANAGE_POSTS"),
      };
      body = (
        <ConnectionGate requires={[{ name: "OpenAI or Gemini", connected: openai || gemini, why: "to generate images" }]} canManage={can(viewer, "MANAGE_INTEGRATIONS")}>
          <StudioCreate key={`${tab}-${project?._id ?? "new"}`} config={config} quick={tab === "quick"} initial={project ? toProjectView(project) : null} />
        </ConnectionGate>
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="AI Image Studio" crumbs={[{ label: "AI Image Studio" }]} description="Make images for posts and ads at the exact sizes each platform wants, with your brand kit, and keep every image and video in one library." actions={<PanelTabs label="Image Studio" active={tab} tabs={tabs} />} />
      {!canGenerate && tab === "library" && <Notice tone="info">You can browse and attach media. Generating images needs permission to manage media and use AI.</Notice>}
      {body}
    </div>
  );
}
