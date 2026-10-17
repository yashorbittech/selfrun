import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import type { Metadata } from "next";
import PlatformPageHeader from "@/components/platform/panel/PlatformPageHeader";
import { requirePlatformPermission } from "@/lib/platform/console/access";
import { getIntegrationsView } from "@/lib/platform/integrations";
import IntegrationsForm from "./IntegrationsForm";

export const metadata: Metadata = { title: "Integrations" };

export default async function PlatformIntegrationsPage() {
  const user = await requirePlatformPermission("integrations.read");
  const view = await getIntegrationsView();
  return (
    <div className="space-y-6 p-1">
      <PlatformPageHeader
        title="Integrations"
        description="The email and domain providers the whole platform uses. Anything left blank falls back to the server's environment variables."
        crumbs={[{ label: "Administration" }]}
      />
      <PanelListFilters>
<IntegrationsForm key={view.updatedAt ?? "none"} view={view} adminEmail={user.email} />
</PanelListFilters>
    </div>
  );
}
