import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import PrmsSettingsForm from "@/components/products/spendiq/PrmsSettingsForm";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageSettings } from "@/lib/prms-roles";
import { getPrmsSettings } from "@/lib/products/spendiq/settings";

export default async function PrmsSettingsPage() {
  const user = await getCurrentPrmsUser();
  if (!user || !canManageSettings(user)) redirect("/spendiq");

  const settings = await getPrmsSettings();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "SpendIQ", href: "/spendiq" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Company identity for purchase orders and invoices, requisition approval thresholds and default currency.</>}
      />
      <PrmsSettingsForm settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
