import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { listFooterColumns, listFooterLinks } from "@/lib/cms/footer";
import FooterManager from "@/components/cms/FooterManager";
import { PanelBottom } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsFooterPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const [columns, links] = await Promise.all([listFooterColumns(), listFooterLinks()]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Footer" }]}
        icon={PanelBottom}
        title="Footer"
        description={<>The website footer&apos;s link columns. Contact details, social links and the footer&apos;s CTA/intro text are under Site Identity.</>}
      />
      <FooterManager initialColumns={columns} initialLinks={links} canEdit={can(viewer, "FOOTER_MANAGE")} />
    </div>
  );
}
