import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { CONNECTION_PROVIDERS } from "@/lib/platform/connections/catalog";
import { listConnectionViews } from "@/lib/platform/connections/store";
import { resolveConnection } from "@/lib/platform/connections/resolve";
import { isPlatformEncryptionConfigured } from "@/lib/platform/crypto";
import { listCompanyIntegrations } from "@/lib/workspace/company";
import { getTrackingForEdit } from "@/lib/cms/tracking";
import ConnectionsHub, { type HubProvider } from "./ConnectionsHub";

export const metadata: Metadata = { title: "Integrations", robots: { index: false, follow: false } };

/** One place for every third-party service the workspace uses. Configure once; every panel and automation uses it. */
export default async function IntegrationsPage() {
  await requireWorkspaceAccess("company.integrations");
  const [views, managed, tracking] = await Promise.all([listConnectionViews(), listCompanyIntegrations().catch(() => []), getTrackingForEdit().catch(() => null)]);
  const managedByKey = new Map<string, (typeof managed)[number]>(managed.map((m) => [m.key, m]));
  const trackingOn = !!tracking && (tracking.ga4Ids.length + tracking.gtmIds.length + tracking.clarityIds.length + tracking.metaPixelIds.length + tracking.scripts.length > 0 || !!tracking.tawkId);

  const providers: HubProvider[] = [];
  for (const p of CONNECTION_PROVIDERS) {
    const view = views[p.key];
    let environment = false;
    let statusNote: string | null = null;
    let connected = false;
    if (p.managedElsewhere) {
      const m = managedByKey.get(p.key === "domains" ? "domain" : p.key);
      if (m) {
        connected = m.connected;
        statusNote = m.status;
      } else if (p.key === "website-tracking") {
        connected = trackingOn;
        statusNote = trackingOn ? "Tracking is on" : "Nothing set up yet";
      }
    } else {
      connected = !!view?.saved;
      if (!connected) environment = (await resolveConnection(p.key))?.source === "environment";
    }
    providers.push({
      key: p.key, name: p.name, group: p.group, description: p.description, usedBy: p.usedBy, fields: p.fields, docsUrl: p.docsUrl ?? null, note: p.note ?? null,
      testable: !!p.testable, managedElsewhere: p.managedElsewhere ?? null, connected, environment, statusNote,
      saved: view ? { values: view.values, secrets: view.secrets, lastTest: view.lastTest, updatedAt: view.updatedAt } : null,
    });
  }

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Integrations" }]}
          title={<>Integrations</>}
          description={<>Connect your own accounts once — email, SMS, AI, social, Google and more. Every panel and automation in your workspace uses these connections, so there is nothing to set up again inside each panel.
            Keys are encrypted and are never shown again.</>}
        />
<div className="space-y-6">
        <ConnectionsHub providers={providers} encryptionReady={isPlatformEncryptionConfigured()} />
      </div>
</div>
    </div>
  );
}
