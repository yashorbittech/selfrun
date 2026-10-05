import { redirect } from "next/navigation";
import { Files } from "lucide-react";
import { getViewer, can } from "@/lib/cms/viewer";
import { listPages } from "@/lib/cms/pages";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import { areaLabel, displayTitle } from "@/lib/cms/site-areas";
import NewPageDialog from "./NewPageDialog";
import PagesTable from "./PagesTable";

export default async function CmsPagesPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const [pages, { area }] = await Promise.all([listPages(), searchParams]);
  const title = area ? areaLabel(area) : "Pages";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={area ? [{ label: "Pages", href: "/cms/pages" }, { label: title }] : [{ label: "Pages" }]}
        icon={Files}
        title={title}
        description="Every page on the public website. Edit its sections and SEO, preview the draft, then publish."
        actions={can(viewer, "PAGES_CREATE") ? <NewPageDialog /> : undefined}
      />
      <PagesTable
        canPublish={can(viewer, "PAGES_PUBLISH")}
        rows={pages.map((p) => ({
          id: p._id,
          title: displayTitle(p.title, p.path),
          path: p.path,
          status: p.status,
          version: p.version,
          pending: p.hasUnpublishedChanges,
          updatedAt: new Date(p.updatedAt).toISOString(),
        }))}
      />
    </div>
  );
}
