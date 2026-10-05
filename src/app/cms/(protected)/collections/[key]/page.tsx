import { notFound, redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { COLLECTIONS } from "@/lib/cms/collections/registry";
import { listAdminRecords } from "@/lib/cms/collections/store";
import type { CollectionKey } from "@/lib/cms/collections/types";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import NewRecordDialog from "./NewRecordDialog";
import RecordsTable from "./RecordsTable";
import { COLLECTION_META } from "./collection-meta";


export default async function CmsCollectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  if (!(key in COLLECTIONS)) notFound();
  const k = key as CollectionKey;
  const def = COLLECTIONS[k];
  const rows = await listAdminRecords(k);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Collections", href: "/cms/collections" }, { label: def.label }]}
        icon={COLLECTION_META[k].icon}
        title={def.label}
        description={COLLECTION_META[k].description}
        actions={can(viewer, "COLLECTIONS_EDIT") ? <NewRecordDialog collection={key} singular={def.singular} /> : undefined}
      />
      <RecordsTable
        collection={key}
        singular={def.singular}
        rows={rows.map((r) => ({
          slug: r.slug,
          title: r.title,
          path: def.pathOf ? def.pathOf(r.slug) : null,
          state: r.state,
          pending: r.hasUnpublishedChanges,
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
        }))}
      />
    </div>
  );
}
