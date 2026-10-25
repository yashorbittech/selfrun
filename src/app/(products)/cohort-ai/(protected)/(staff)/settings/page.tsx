import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import TmsSettingsForm from "@/components/products/cohort-ai/TmsSettingsForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageSettings } from "@/lib/tms-roles";
import { getTmsSettings } from "@/lib/products/cohort-ai/settings";

export default async function TmsSettingsPage() {
  const user = await getCurrentTmsUser();
  if (!user || !canManageSettings(user)) redirect("/cohort-ai");

  const settings = await getTmsSettings();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Cohort AI", href: "/cohort-ai" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Track suggestions, currency, certificate numbering and institute identity.</>}
      />
      <TmsSettingsForm settings={settings} />
    </div>
  );
}
