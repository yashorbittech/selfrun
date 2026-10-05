import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { listNavItems } from "@/lib/cms/nav";
import NavigationManager from "@/components/cms/NavigationManager";
import { Menu } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsNavigationPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const items = await listNavItems();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Header & Navigation" }]}
        icon={Menu}
        title="Header & Navigation"
        description={<>The website&apos;s header menu — its columns, links, icons and featured cards. The desktop mega-menu and the mobile menu share it; changes go live immediately.</>}
      />
      <PanelListFilters>
<NavigationManager initialItems={items} canEdit={can(viewer, "NAV_MANAGE")} />
</PanelListFilters>
    </div>
  );
}
