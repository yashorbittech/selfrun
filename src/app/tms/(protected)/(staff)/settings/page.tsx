import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import TmsSettingsForm from "@/components/tms/TmsSettingsForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageSettings } from "@/lib/tms-roles";
import { getTmsSettings } from "@/lib/tms/settings";

export default async function TmsSettingsPage() {
  const user = await getCurrentTmsUser();
  if (!user || !canManageSettings(user)) redirect("/tms");

  const settings = await getTmsSettings();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Track suggestions, currency, certificate numbering and institute identity.</>}
      />
      <TmsSettingsForm settings={settings} />
    </div>
  );
}
