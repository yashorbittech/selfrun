import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { SearchCheck } from "lucide-react";
import { getViewer } from "@/lib/cms/viewer";
import { listPages } from "@/lib/cms/pages";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import SeoTable from "./SeoTable";

export default async function CmsSeoOverviewPage() {
  if (!(await getViewer())) redirect("/cms/login");
  const pages = await listPages();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "SEO Overview" }]}
        icon={SearchCheck}
        title="SEO Overview"
        description={<>Every page&apos;s live search appearance at a glance, with length checks. Click a page to edit its SEO; overrides in the SEO panel still take priority.</>}
      />
      <PanelListFilters>
<SeoTable
        rows={pages
          .filter((p) => p.status !== "archived")
          .map((p) => {
            const seo = p.live?.seo ?? p.draft.seo ?? null;
            return {
              id: p._id,
              path: p.path,
              pageTitle: p.title,
              title: seo?.title ?? "",
              description: seo?.description ?? "",
              canonical: seo?.canonical ?? null,
              noindex: seo?.robots?.index === false,
              hasImage: Boolean(seo?.image),
              jsonLd: (p.live?.jsonLd ?? p.draft.jsonLd ?? []).length,
              pending: p.hasUnpublishedChanges,
            };
          })
          .sort((a, b) => a.path.localeCompare(b.path))}
      />
</PanelListFilters>
    </div>
  );
}
