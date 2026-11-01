import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import SmmsFilterBar from "@/components/products/viralpulse-ai/SmmsFilterBar";
import MediaLibrary from "@/components/products/viralpulse-ai/MediaLibrary";
import { can, type SmmsViewer } from "@/lib/products/viralpulse-ai/viewer";
import { listMedia, getMediaMany, toMediaCard, mediaFacets, platformFit } from "@/lib/products/viralpulse-ai/media";
import { isOpenAIConfigured } from "@/lib/openai";
import { PLATFORMS, PLATFORM_META } from "@/lib/products/viralpulse-ai/constants";
import { SPECS } from "@/lib/products/viralpulse-ai/images/specs";

/** The Library tab of the AI Image Studio: every reusable image and video, with upload, details, versions and "used in". */
export default async function MediaLibraryTab({ viewer, sp }: { viewer: SmmsViewer; sp: Record<string, string | undefined> }) {
  const page = Math.max(Number(sp.page) || 1, 1);
  const [r, facets] = await Promise.all([listMedia({ q: sp.q, kind: sp.kind, origin: sp.origin, platform: sp.platform, folder: sp.folder, tag: sp.tag, fit: sp.fit, minWidth: sp.minWidth, page, pageSize: 48 }), mediaFacets()]);
  const thumbs = new Map((await getMediaMany(r.items.map((m) => m.thumbnailId).filter((x): x is string => Boolean(x)))).map((m) => [m._id, toMediaCard(m)]));
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1] && e[0] !== "open"));
    qs.set("tab", "library");
    qs.set("page", String(p));
    return `/viralpulse-ai/image-studio?${qs}`;
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{`${r.total} reusable image${r.total === 1 ? "" : "s"} and videos for ads and posts. Files are private — served only to signed-in staff.`}</p>
      <SmmsFilterBar
        values={{ q: sp.q ?? "", kind: sp.kind ?? "", origin: sp.origin ?? "", platform: sp.platform ?? "", folder: sp.folder ?? "", tag: sp.tag ?? "", fit: sp.fit ?? "", minWidth: sp.minWidth ?? "" }}
        fields={[
          { key: "q", label: "Search", type: "search", placeholder: "Name, tag, caption" },
          { key: "kind", label: "Type", type: "select", options: [{ value: "image", label: "Images" }, { value: "video", label: "Videos" }] },
          { key: "origin", label: "Source", type: "select", options: [{ value: "upload", label: "Uploaded" }, { value: "ai_image", label: "AI image" }, { value: "ugc_video", label: "UGC video" }] },
          { key: "platform", label: "Platform", type: "select", options: PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label })) },
          { key: "fit", label: "Fits size", type: "select", options: SPECS.map((x) => ({ value: x.key, label: `${x.group}: ${x.label}` })) },
          { key: "minWidth", label: "Width", type: "select", options: [{ value: "1080", label: "1080 px or wider" }, { value: "1920", label: "1920 px or wider" }, { value: "3000", label: "3000 px or wider" }] },
          ...(facets.folders.length ? [{ key: "folder", label: "Folder", type: "select" as const, options: [{ value: "__none", label: "No folder" }, ...facets.folders.map((f) => ({ value: f, label: f }))] }] : []),
          ...(facets.tags.length ? [{ key: "tag", label: "Tag", type: "select" as const, options: facets.tags.map((t) => ({ value: t, label: t })) }] : []),
        ]}
      />
      <MediaLibrary
        key={r.items.map((m) => m._id + m.updatedAt.getTime()).join(",")}
        openId={sp.open ?? null}
        canManage={can(viewer, "MANAGE_MEDIA")}
        canGenerate={can(viewer, "GENERATE_AI_CONTENT") && (await isOpenAIConfigured())}
        canPost={can(viewer, "MANAGE_POSTS")}
        canAds={can(viewer, "CREATE_ADS")}
        items={r.items.map((m) => ({ ...toMediaCard(m), description: m.description, tags: m.tags, platform: m.platform, creativePrompt: m.creativePrompt, script: m.script, caption: m.caption, createdAt: m.createdAt.toISOString(), versions: m.versions.length, folder: m.folder ?? null, fits: platformFit(m), studio: m.studio ? { specKey: m.studio.specKey, badge: m.studio.badge, consentRecorded: m.studio.consentRecorded } : null, aiModel: m.ai?.model ?? null, thumbnail: m.thumbnailId ? (thumbs.get(m.thumbnailId) ?? null) : null }))}
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
