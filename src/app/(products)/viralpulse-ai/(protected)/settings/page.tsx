import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { originFromHeaders } from "@/lib/products/viralpulse-ai/oauth-redirect";
import { Check, Minus, TriangleAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader, SectionCard, Notice } from "@/components/products/viralpulse-ai/SmmsUi";
import SettingsLanding from "./SettingsLanding";
import { parseSettingsTab, type SmmsNavFlags } from "@/lib/products/viralpulse-ai/nav";
import { BrandForm, AiSettingsForm, IntegrationsPanel } from "@/components/products/viralpulse-ai/SettingsForms";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { getViralPulseHealth } from "@/lib/products/viralpulse-ai/health";
import { getSettings } from "@/lib/products/viralpulse-ai/settings";
import { getBrandSnapshot, serviceCatalogue, listLiveOffers } from "@/lib/products/viralpulse-ai/brand";
import { listIntegrationViews } from "@/lib/products/viralpulse-ai/integrations";
import { isEncryptionConfigured } from "@/lib/products/viralpulse-ai/crypto";
import { isOpenAIConfigured } from "@/lib/openai";
import { SMMS_PERMISSIONS, SMMS_PERMISSION_META, SMMS_ROLE_META, SMMS_ROLE_PERMISSIONS } from "@/lib/smms-roles";
import { formatDate, formatDateTime } from "@/lib/utils";

const SECTION_TITLE: Record<string, string> = { brand: "Brand kit", ai: "AI & models", integrations: "Connected accounts", health: "System health", roles: "Team & roles" };
const ROLES = ["smms_employee", "smms_specialist", "smms_manager", "smms_admin"] as const;

export default async function SmmsSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "MANAGE_INTEGRATIONS")) redirect("/viralpulse-ai");
  const sp = await searchParams;
  // Connected accounts moved to their own page; the old address (and old links, notifications and the Settings landing) land there.
  if (sp.tab === "integrations") redirect(`/viralpulse-ai/settings/accounts${sp.error ? `?error=${encodeURIComponent(sp.error)}` : ""}`);
  // No section chosen: the Settings landing (a list of sections). Each section keeps its old URL (`?tab=…`), so links and OAuth returns still work.
  if (!parseSettingsTab(sp.tab)) {
    const flags: SmmsNavFlags = { campaigns: can(viewer, "VIEW_CAMPAIGNS"), posts: can(viewer, "MANAGE_POSTS") || can(viewer, "VIEW_CAMPAIGNS"), media: can(viewer, "MANAGE_MEDIA"), ai: can(viewer, "GENERATE_AI_CONTENT"), ugc: can(viewer, "GENERATE_AI_CONTENT"), analytics: can(viewer, "VIEW_ANALYTICS"), audit: can(viewer, "VIEW_AUDIT_LOG"), settings: true };
    return <SettingsLanding flags={flags} />;
  }
  const [settings, snap, integrations, offers] = await Promise.all([getSettings(), getBrandSnapshot(), listIntegrationViews(originFromHeaders(await headers())), listLiveOffers(10)]);
  const tab = ["brand", "ai", "integrations", "health", "roles"].includes(sp.tab ?? "") ? sp.tab! : "brand";
  // Health probes the network (OpenAI/Gemini model lists, ffmpeg), so it only runs when its tab is opened.
  const health = tab === "health" ? await getViralPulseHealth(originFromHeaders(await headers())) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" crumbs={[{ label: "Settings", href: "/viralpulse-ai/settings" }, { label: SECTION_TITLE[tab] ?? tab }]} description="Brand context for the AI, OpenAI settings, platform connections and role permissions." />
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.connected && <Notice tone="ok">Connected. Choose which page / account / location each platform publishes to.</Notice>}
      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="brand">Brand kit</TabsTrigger>
          <TabsTrigger value="ai">AI &amp; models</TabsTrigger>
          <TabsTrigger value="integrations">Connected accounts</TabsTrigger>
          <TabsTrigger value="health">System health</TabsTrigger>
          <TabsTrigger value="roles">Team &amp; roles</TabsTrigger>
        </TabsList>
        <TabsContent value="brand" className="mt-4 space-y-4">
          <SectionCard title="Read live from other products" description="Not copied into ViralPulse — edit them where they live.">
            <ul className="space-y-1 text-sm">
              <li>{`Company: ${snap.companyName} · ${snap.website}`} <span className="text-xs text-muted-foreground">(TalentOS → Settings → Company)</span></li>
              <li>{`Service catalogue: ${serviceCatalogue().filter((s) => s.value === s.group).map((s) => s.label).join(", ")}`} <span className="text-xs text-muted-foreground">(public site)</span></li>
              <li>{`Active offers: ${offers.length ? offers.map((o) => `${o.title} (${o.badge}, until ${formatDate(o.validUntil)})`).join("; ") : "none right now"}`} <span className="text-xs text-muted-foreground">(DealFlow → Offers)</span></li>
              <li>Clients: picked per campaign/post from SprintOS clients</li>
            </ul>
          </SectionCard>
          <SectionCard title="Marketing voice" description="Used in every AI prompt (campaigns, ads, posts, generator).">
            <BrandForm brand={settings.brand} services={serviceCatalogue().map((s) => s.value)} canGenerate={can(viewer, "GENERATE_AI_CONTENT")} />
          </SectionCard>
        </TabsContent>
        <TabsContent value="ai" className="mt-4 space-y-4">
          <SectionCard title="OpenAI" description="OpenAI is the only AI provider in this product. The key stays on the server.">
            <ul className="mb-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">{(await isOpenAIConfigured()) ? <Check className="size-4 text-emerald-600" /> : <Minus className="size-4 text-rose-600" />}{`OPENAI_API_KEY ${(await isOpenAIConfigured()) ? "is set" : "is NOT set — generation is unavailable"}`}</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Text: Responses API with strict JSON-schema output; images: Images API</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Every generation is stored as a version; nothing is published automatically</li>
            </ul>
            <AiSettingsForm ai={settings.ai} />
          </SectionCard>
        </TabsContent>
        <TabsContent value="integrations" className="mt-4 space-y-4">
          <Notice tone="info">Connections are used only when someone presses Publish or approves a schedule. Paid ads (incl. Google Ads) are never created from here — they&apos;re launched in each ads manager; their results come in through DealFlow → Campaigns imports.</Notice>
          <IntegrationsPanel items={integrations} encryptionReady={isEncryptionConfigured()} />
        </TabsContent>
        <TabsContent value="health" className="mt-4 space-y-4">
          {health ? (
            <>
              <Notice tone={health.status === "ok" ? "ok" : "error"}>{health.status === "ok" ? "Everything ViralPulse depends on is working." : `${health.attentionCount} item${health.attentionCount === 1 ? "" : "s"} need attention.`}</Notice>
              {health.groups.map((g) => (
                <SectionCard key={g.id} title={g.title} description={g.status === "ok" ? "OK" : "Needs attention"}>
                  <ul className="space-y-3 text-sm">
                    {g.items.map((i) => (
                      <li key={i.id} className="flex items-start gap-2">
                        {i.status === "ok" ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="OK" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-600" aria-label="Needs attention" />}
                        <div>
                          <p className="font-medium">{i.label}</p>
                          <p className="text-muted-foreground">{i.detail}</p>
                          {i.fix && <p className="text-xs">{`How to fix: ${i.fix}`}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ))}
              <p className="text-[11px] text-muted-foreground">{`Checked ${formatDateTime(health.checkedAt)}`}</p>
            </>
          ) : null}
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
