import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import PrmsSettingsForm from "@/components/prms/PrmsSettingsForm";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageSettings } from "@/lib/prms-roles";
import { getPrmsSettings } from "@/lib/prms/settings";

export default async function PrmsSettingsPage() {
  const user = await getCurrentPrmsUser();
  if (!user || !canManageSettings(user)) redirect("/prms");

  const settings = await getPrmsSettings();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Company identity for purchase orders and invoices, requisition approval thresholds and default currency.</>}
      />
      <PrmsSettingsForm settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
