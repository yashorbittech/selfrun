import { redirect } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader, SectionCard, Notice } from "@/components/smms/SmmsUi";
import { BrandForm, AiSettingsForm, IntegrationsPanel } from "@/components/smms/SettingsForms";
import { getViewer, can } from "@/lib/smms/viewer";
import { getSettings } from "@/lib/smms/settings";
import { getBrandSnapshot, serviceCatalogue, listLiveOffers } from "@/lib/smms/brand";
import { listIntegrationViews } from "@/lib/smms/integrations";
import { isEncryptionConfigured } from "@/lib/smms/crypto";
import { isOpenAIConfigured } from "@/lib/openai";
import { SMMS_PERMISSIONS, SMMS_PERMISSION_META, SMMS_ROLE_META, SMMS_ROLE_PERMISSIONS } from "@/lib/smms-roles";
import { formatDate } from "@/lib/utils";

const ROLES = ["smms_employee", "smms_specialist", "smms_manager", "smms_admin"] as const;

export default async function SmmsSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "MANAGE_INTEGRATIONS")) redirect("/smms");
  const sp = await searchParams;
  const [settings, snap, integrations, offers] = await Promise.all([getSettings(), getBrandSnapshot(), listIntegrationViews(), listLiveOffers(10)]);
  const tab = ["brand", "ai", "integrations", "roles"].includes(sp.tab ?? "") ? sp.tab! : "brand";

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} description="Brand context for the AI, OpenAI settings, platform connections and role permissions." />
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.connected && <Notice tone="ok">Connected. Choose which page / account / location each platform publishes to.</Notice>}
      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="brand">Brand context</TabsTrigger>
          <TabsTrigger value="ai">AI (OpenAI)</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="brand" className="mt-4 space-y-4">
          <SectionCard title="Read live from other panels" description="Not copied into SMMS — edit them where they live.">
            <ul className="space-y-1 text-sm">
              <li>{`Company: ${snap.companyName} · ${snap.website}`} <span className="text-xs text-muted-foreground">(HRMS → Settings → Company)</span></li>
              <li>{`Service catalogue: ${serviceCatalogue().filter((s) => s.value === s.group).map((s) => s.label).join(", ")}`} <span className="text-xs text-muted-foreground">(public site)</span></li>
              <li>{`Active offers: ${offers.length ? offers.map((o) => `${o.title} (${o.badge}, until ${formatDate(o.validUntil)})`).join("; ") : "none right now"}`} <span className="text-xs text-muted-foreground">(LMS → Offers)</span></li>
              <li>Clients: picked per campaign/post from PMS clients</li>
            </ul>
          </SectionCard>
          <SectionCard title="Marketing voice" description="Used in every AI prompt (campaigns, ads, posts, generator).">
            <BrandForm brand={settings.brand} services={serviceCatalogue().map((s) => s.value)} />
          </SectionCard>
        </TabsContent>
        <TabsContent value="ai" className="mt-4 space-y-4">
          <SectionCard title="OpenAI" description="OpenAI is the only AI provider in this panel. The key stays on the server.">
            <ul className="mb-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">{(await isOpenAIConfigured()) ? <Check className="size-4 text-emerald-600" /> : <Minus className="size-4 text-rose-600" />}{`OPENAI_API_KEY ${(await isOpenAIConfigured()) ? "is set" : "is NOT set — generation is unavailable"}`}</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Text: Responses API with strict JSON-schema output; images: Images API</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Every generation is stored as a version; nothing is published automatically</li>
            </ul>
            <AiSettingsForm ai={settings.ai} />
          </SectionCard>
        </TabsContent>
        <TabsContent value="integrations" className="mt-4 space-y-4">
          <Notice tone="info">Connections are used only when someone presses Publish or approves a schedule. Paid ads (incl. Google Ads) are never created from here — they&apos;re launched in each ads manager; their results come in through LMS → Campaigns imports.</Notice>
          <IntegrationsPanel items={integrations} encryptionReady={isEncryptionConfigured()} />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <SectionCard title="Role permissions" description="Defaults per role. Roles are assigned (and individual capabilities overridden) under Admin → Users.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Capability</TableHead>{ROLES.map((r) => <TableHead key={r} className="text-center">{SMMS_ROLE_META[r].label}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {SMMS_PERMISSIONS.map((p) => (
                    <TableRow key={p}>
                      <TableCell><p className="text-sm font-medium">{SMMS_PERMISSION_META[p].label}</p><p className="text-[11px] text-muted-foreground">{SMMS_PERMISSION_META[p].description}</p></TableCell>
                      {ROLES.map((r) => <TableCell key={r} className="text-center">{SMMS_ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-emerald-600" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not allowed" />}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
