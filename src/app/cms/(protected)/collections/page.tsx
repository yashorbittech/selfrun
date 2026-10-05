import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Newspaper, Briefcase, UserPlus, Boxes, ArrowRight } from "lucide-react";
import { getViewer } from "@/lib/cms/viewer";
import { COLLECTIONS } from "@/lib/cms/collections/registry";
import { listAdminRecords } from "@/lib/cms/collections/store";
import type { CollectionKey } from "@/lib/cms/collections/types";
import GlassCard from "@/components/lms/GlassCard";
import { Database } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

const ICONS: Record<CollectionKey, typeof Newspaper> = { blog: Newspaper, jobs: Briefcase, engagement: UserPlus, products: Boxes };
const USED_BY: Record<CollectionKey, string> = {
  blog: "Blog index, article pages, related/next links, sitemap and article SEO.",
  jobs: "Careers job board, job pages, the apply form's role list, LMS applicant filters, sitemap and job-posting SEO.",
  engagement: "Resource Augmentation cards and pages, and the homepage hiring section.",
  products: "The Our SaaS Product catalogue, product modals and flagship showcases.",
};

export default async function CmsCollectionsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  const keys = Object.keys(COLLECTIONS) as CollectionKey[];
  const counts = await Promise.all(keys.map(async (k) => {
    const rows = await listAdminRecords(k);
    return { total: rows.filter((r) => r.state === "published").length, drafts: rows.filter((r) => r.state === "draft").length };
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Collections" }]}
        icon={Database}
        title="Collections"
        description={<>Records that several pages share. Edit one here and every page, listing and search result that shows it updates when you publish.</>}
      />
      <PanelListFilters>
<div className="grid gap-4 sm:grid-cols-2">
        {keys.map((k, i) => {
          const Icon = ICONS[k];
          return (
            <Link key={k} href={`/cms/collections/${k}`}>
              <GlassCard className="group h-full p-5 transition-colors hover:border-primary/40">
                <Icon className="size-6 text-primary" />
                <p className="mt-3 flex items-center gap-1.5 font-semibold text-foreground">
                  {COLLECTIONS[k].label}
                  <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{USED_BY[k]}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {counts[i].total} on the site · {counts[i].drafts} unpublished
                </p>
              </GlassCard>
            </Link>
          );
        })}
      </div>
</PanelListFilters>
    </div>
  );
}
