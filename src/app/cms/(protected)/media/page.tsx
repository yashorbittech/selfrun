import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { listMedia } from "@/lib/cms/media";
import MediaLibraryGrid from "@/components/cms/MediaLibraryGrid";
import { Image as ImageIcon } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsMediaPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const items = await listMedia();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Media Library" }]}
        icon={ImageIcon}
        title="Media Library"
        description={<>Every image used across the website. Click a file to edit its title and alt text, copy its URL or delete it.</>}
      />
      <PanelListFilters>
<MediaLibraryGrid initialItems={items} canUpload={can(viewer, "MEDIA_UPLOAD")} canDelete={can(viewer, "MEDIA_DELETE")} />
</PanelListFilters>
    </div>
  );
}
