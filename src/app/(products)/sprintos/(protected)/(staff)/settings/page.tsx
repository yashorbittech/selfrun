import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import PmsSettingsForm from "@/components/products/sprintos/PmsSettingsForm";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canManageSettings } from "@/lib/pms-roles";
import { getPmsSettings } from "@/lib/products/sprintos/settings";

export default async function PmsSettingsPage() {
  const user = await getCurrentPmsUser();
  if (!user || !canManageSettings(user)) redirect("/sprintos");

  const settings = await getPmsSettings();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "SprintOS", href: "/sprintos" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Configure project categories, technology suggestions and defaults.</>}
      />
      <PmsSettingsForm
        categories={settings.categories}
        technologySuggestions={settings.technologySuggestions}
        defaultCurrency={settings.defaultCurrency}
      />
    </div>
  );
}
