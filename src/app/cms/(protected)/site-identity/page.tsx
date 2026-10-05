import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { getSiteInfoForEdit } from "@/lib/cms/site-info";
import SiteInfoEditor from "@/components/cms/SiteInfoEditor";
import { BadgeInfo } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsSiteIdentityPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  if (!can(viewer, "VIEW")) redirect("/cms");

  const info = await getSiteInfoForEdit();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Site Identity" }]}
        icon={BadgeInfo}
        title="Site Identity & Contact"
        description={<>Brand, logo, contact details, social links and the header/footer text around the menus. Used by the header, both footer styles, the contact page, the floating WhatsApp button and offer CTAs. Saving publishes immediately.</>}
      />
      <SiteInfoEditor initial={info} canEdit={can(viewer, "NAV_MANAGE") || can(viewer, "FOOTER_MANAGE")} />
    </div>
  );
}
