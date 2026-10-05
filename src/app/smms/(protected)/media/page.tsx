import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/smms/SmmsUi";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import MediaLibrary from "@/components/smms/MediaLibrary";
import { getViewer, can } from "@/lib/smms/viewer";
import { listMedia, getMediaMany, toMediaCard } from "@/lib/smms/media";
import { isOpenAIConfigured } from "@/lib/openai";
import { PLATFORMS, PLATFORM_META } from "@/lib/smms/constants";

export const maxDuration = 120;

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "MANAGE_MEDIA") && !can(viewer, "MANAGE_POSTS") && !can(viewer, "CREATE_ADS")) redirect("/smms");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const r = await listMedia({ q: sp.q, kind: sp.kind, source: sp.source, platform: sp.platform, page, pageSize: 48 });
  const thumbs = new Map((await getMediaMany(r.items.map((m) => m.thumbnailId).filter((x): x is string => Boolean(x)))).map((m) => [m._id, toMediaCard(m)]));
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1] && e[0] !== "open"));
    qs.set("page", String(p));
    return `/smms/media?${qs}`;
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Media Library" crumbs={[{ label: "Media Library" }]} description={`${r.total} reusable image${r.total === 1 ? "" : "s"} and videos for ads and posts. Files are private — served only to signed-in staff.`} />
      <SmmsFilterBar
        values={{ q: sp.q ?? "", kind: sp.kind ?? "", source: sp.source ?? "", platform: sp.platform ?? "" }}
        fields={[
          { key: "q", label: "Search", type: "search", placeholder: "Name, tag, caption" },
          { key: "kind", label: "Type", type: "select", options: [{ value: "image", label: "Images" }, { value: "video", label: "Videos" }] },
          { key: "source", label: "Source", type: "select", options: [{ value: "upload", label: "Uploaded" }, { value: "ai", label: "AI generated" }] },
          { key: "platform", label: "Platform", type: "select", options: PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label })) },
        ]}
      />
      <MediaLibrary
        key={r.items.map((m) => m._id + m.updatedAt.getTime()).join(",")}
        openId={sp.open ?? null}
        canManage={can(viewer, "MANAGE_MEDIA")}
        canGenerate={can(viewer, "GENERATE_AI_CONTENT") && (await isOpenAIConfigured())}
        items={r.items.map((m) => ({ ...toMediaCard(m), description: m.description, tags: m.tags, platform: m.platform, creativePrompt: m.creativePrompt, script: m.script, caption: m.caption, createdAt: m.createdAt.toISOString(), versions: m.versions.length, thumbnail: m.thumbnailId ? (thumbs.get(m.thumbnailId) ?? null) : null }))}
      />
      {r.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{`Page ${page} of ${r.totalPages}`}</span>
          <div className="flex gap-2">
            <Link href={href(Math.max(page - 1, 1))} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronLeft className="size-3.5" />Previous</Link>
            <Link href={href(Math.min(page + 1, r.totalPages))} className={buttonVariants({ variant: "outline", size: "sm" })}>Next<ChevronRight className="size-3.5" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}
