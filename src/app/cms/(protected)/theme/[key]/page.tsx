import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Palette, Eye, Paintbrush } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getViewer, can } from "@/lib/cms/viewer";
import { getTheme, getActiveThemeKey } from "@/lib/cms/theme";
import { normalizeSelections } from "@/lib/cms/component-variants";
import ThemeComponentsEditor from "@/components/cms/ThemeComponentsEditor";
import ThemeEditor from "@/components/cms/ThemeEditor";

export default async function CmsThemeEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const [doc, activeKey] = await Promise.all([getTheme(key).catch(() => null), getActiveThemeKey()]);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Themes", href: "/cms/theme" }, { label: doc.name }]}
        icon={Palette}
        title={doc.name}
        description={doc.description}
        badges={activeKey === doc._id ? <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">Active</Badge> : undefined}
        actions={
          <>
            <Link href={`/cms/theme/${doc._id}/preview`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-3.5" /> Page arrangements</Link>
            <Link href={`/cms/customize/${doc._id}`} className={buttonVariants({ size: "sm" })}><Paintbrush className="size-3.5" /> Customize</Link>
          </>
        }
      />
      <ThemeComponentsEditor themeKey={doc._id} initial={normalizeSelections(doc.components)} isActive={activeKey === doc._id} canEdit={can(viewer, "THEME_PUBLISH")} />
      <ThemeEditor
        themeKey={doc._id}
        draftTokens={doc.draftTokens}
        publishedTokens={doc.tokens}
        canEdit={can(viewer, "THEME_UPDATE")}
        canPublish={can(viewer, "THEME_PUBLISH")}
        history={[...(doc.history ?? [])].reverse().map((h, i) => ({
          version: h.version,
          publishedAt: new Date(h.publishedAt).toISOString(),
          note: h.note,
          // Newest entry is what's live (publishing is the only way an entry is added).
          isLive: i === 0,
        }))}
      />
    </div>
  );
}
