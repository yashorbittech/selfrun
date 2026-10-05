import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { getSettings } from "@/lib/cms/settings";
import SettingsEditor from "@/components/cms/SettingsEditor";
import TrackingEditor from "@/components/cms/TrackingEditor";
import { getTrackingForEdit } from "@/lib/cms/tracking";
import { Settings } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  if (!can(viewer, "SETTINGS_MANAGE")) redirect("/cms");

  const [settings, tracking] = await Promise.all([getSettings(), getTrackingForEdit()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Settings" }]}
        icon={Settings}
        title="CMS Settings"
        description={<>Global settings. Brand, contact details and social links are under Site Identity.</>}
      />
      <SettingsEditor initial={settings} />
      <TrackingEditor initial={tracking} />
    </div>
  );
}
