import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PageHeader, Notice } from "@/components/products/viralpulse-ai/SmmsUi";
import ProviderSection from "@/components/products/viralpulse-ai/accounts/ProviderSection";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { originFromHeaders, oauthRedirectUrl } from "@/lib/products/viralpulse-ai/oauth-redirect";
import { isEncryptionConfigured } from "@/lib/products/viralpulse-ai/crypto";
import { providerConfigured } from "@/lib/products/viralpulse-ai/accounts/apps";
import { listAccounts, listConnections } from "@/lib/products/viralpulse-ai/accounts/service";
import { CONNECTION_PROVIDERS } from "@/lib/products/viralpulse-ai/accounts/types";

export const metadata = { title: "Connected accounts" };

export default async function ConnectedAccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "MANAGE_INTEGRATIONS")) redirect("/viralpulse-ai");
  const sp = await searchParams;
  const origin = originFromHeaders(await headers());
  const [accounts, connections, configured] = await Promise.all([listAccounts(), listConnections(), Promise.all(CONNECTION_PROVIDERS.map((p) => providerConfigured(p)))]);
  const encryptionReady = isEncryptionConfigured();
  return (
    <div className="space-y-4">
      <PageHeader title="Connected accounts" crumbs={[{ label: "Settings", href: "/viralpulse-ai/settings" }, { label: "Connected accounts" }]} description="The Pages, channels, profiles and ad accounts ViralPulse publishes to and reads from. Each login uses your own developer app." />
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.connected && <Notice tone="ok">{`Connected ${sp.connected}: ${sp.found ?? "0"} account${sp.found === "1" ? "" : "s"} found. Switch on the ones you want to publish to.`}</Notice>}
      {sp.missing && <Notice tone="warn">{`The platform did not grant: ${sp.missing.split(",").join(", ")}. Accounts that need them cannot publish until you reconnect and allow them.`}</Notice>}
      {sp.note && <Notice tone="warn">{sp.note}</Notice>}
      <Notice tone="info">Connections are used only when someone publishes, approves a schedule or reads results. Tokens are stored encrypted and never shown. ViralPulse checks every login with the platform every 30 minutes and warns the admins before one expires.</Notice>
      <div className="space-y-4">
        {CONNECTION_PROVIDERS.map((p, i) => (
          <ProviderSection
            key={p}
            oauth={p}
            configured={configured[i]}
            encryptionReady={encryptionReady}
            redirectUrl={origin ? oauthRedirectUrl(p, origin) : null}
            connections={connections.filter((c) => c.oauth === p)}
            accounts={accounts.filter((a) => a.oauth === p)}
          />
        ))}
      </div>
    </div>
  );
}
