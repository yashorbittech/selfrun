import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/products/sitecraft-ai/viewer";
import { getSettings } from "@/lib/products/sitecraft-ai/settings";
import SettingsEditor from "@/components/products/sitecraft-ai/SettingsEditor";
import TrackingEditor from "@/components/products/sitecraft-ai/TrackingEditor";
import { getTrackingForEdit } from "@/lib/products/sitecraft-ai/tracking";
import { Settings } from "lucide-react";
import CmsPageHeader from "@/components/products/sitecraft-ai/ui/CmsPageHeader";

export default async function CmsSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sitecraft-ai/login");
  if (!can(viewer, "SETTINGS_MANAGE")) redirect("/sitecraft-ai");

  const [settings, tracking] = await Promise.all([getSettings(), getTrackingForEdit()]);

  return (
    <div className="space-y-4">
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
