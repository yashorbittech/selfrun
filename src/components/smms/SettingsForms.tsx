"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plug, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OptionSelect from "@/components/sop/OptionSelect";
import ActionButton from "@/components/smms/ActionButton";
import { Field, PlatformChip } from "@/components/smms/SmmsBits";
import { saveBrandAction, saveAiSettingsAction, disconnectIntegrationAction, selectIntegrationTargetAction } from "@/app/smms/(protected)/actions";
import type { BrandContext, AiSettings } from "@/lib/smms/settings";
import type { IntegrationView } from "@/lib/smms/integrations";
import { PLATFORM_META, type Platform } from "@/lib/smms/constants";
import { formatDateTime } from "@/lib/utils";

const lines = (xs: string[]) => xs.join("\n");

export function BrandForm({ brand, services }: { brand: BrandContext; services: string[] }) {
  const router = useRouter();
  const [f, setF] = useState({ ...brand, services: lines(brand.services), products: lines(brand.products), sellingPoints: lines(brand.sellingPoints), avoid: lines(brand.avoid), brandHashtags: brand.brandHashtags.join(" ") });
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveBrandAction({ ...f, brandHashtags: f.brandHashtags.split(/[\s,]+/) }); if (!r.ok) toast.error(r.error); else { toast.success("Brand context saved."); router.refresh(); } }); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="About the company" htmlFor="b-about" className="sm:col-span-2"><Textarea id="b-about" rows={3} value={f.about} onChange={(e) => set("about", e.target.value)} placeholder="What the company does, for whom, and why it's different" /></Field>
        <Field label="Services (one per line)" htmlFor="b-svc" hint={`Suggestions from the site catalogue: ${services.slice(0, 6).join(", ")}…`}><Textarea id="b-svc" rows={5} value={f.services} onChange={(e) => set("services", e.target.value)} /></Field>
        <Field label="Products (one per line)" htmlFor="b-prod"><Textarea id="b-prod" rows={5} value={f.products} onChange={(e) => set("products", e.target.value)} /></Field>
        <Field label="Brand tone" htmlFor="b-tone"><Input id="b-tone" value={f.tone} onChange={(e) => set("tone", e.target.value)} /></Field>
        <Field label="Branded hashtags" htmlFor="b-tags"><Input id="b-tags" value={f.brandHashtags} onChange={(e) => set("brandHashtags", e.target.value)} placeholder="#YourBrand #BuiltWithAI" /></Field>
        <Field label="Target audience" htmlFor="b-aud" className="sm:col-span-2"><Textarea id="b-aud" rows={2} value={f.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} /></Field>
        <Field label="Brand messaging" htmlFor="b-msg" className="sm:col-span-2"><Textarea id="b-msg" rows={3} value={f.messaging} onChange={(e) => set("messaging", e.target.value)} placeholder="Core message, tagline, proof points" /></Field>
        <Field label="Website information" htmlFor="b-web" className="sm:col-span-2"><Textarea id="b-web" rows={2} value={f.websiteInfo} onChange={(e) => set("websiteInfo", e.target.value)} placeholder="Key pages and what visitors should do there" /></Field>
        <Field label="Key selling points (one per line)" htmlFor="b-usp"><Textarea id="b-usp" rows={4} value={f.sellingPoints} onChange={(e) => set("sellingPoints", e.target.value)} /></Field>
        <Field label="Never say / claim (one per line)" htmlFor="b-avoid"><Textarea id="b-avoid" rows={4} value={f.avoid} onChange={(e) => set("avoid", e.target.value)} placeholder={"guaranteed results\n#1 in India"} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.includeOffers} onChange={(e) => set("includeOffers", e.target.checked)} /> Let the AI mention currently active Festival Offers when relevant</label>
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save brand context</Button>
    </form>
  );
}

export function AiSettingsForm({ ai }: { ai: AiSettings }) {
  const router = useRouter();
  const [f, setF] = useState({ textModel: ai.textModel, imageModel: ai.imageModel, imageQuality: ai.imageQuality, temperature: ai.temperature === null ? "" : String(ai.temperature), maxOutputTokens: String(ai.maxOutputTokens), dailyGenerationLimit: String(ai.dailyGenerationLimit), imageCostUsd: String(ai.imageCostUsd) });
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveAiSettingsAction({ ...f, temperature: f.temperature === "" ? null : f.temperature }); if (!r.ok) toast.error(r.error); else { toast.success("AI settings saved."); router.refresh(); } }); }}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Text model (OpenAI)" htmlFor="ai-tm"><Input id="ai-tm" list="ai-models" value={f.textModel} onChange={(e) => set("textModel", e.target.value)} /><datalist id="ai-models">{ai.models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</datalist></Field>
        <Field label="Image model (OpenAI)" htmlFor="ai-im"><Input id="ai-im" value={f.imageModel} onChange={(e) => set("imageModel", e.target.value)} /></Field>
        <Field label="Image quality"><OptionSelect value={f.imageQuality} onChange={(v) => set("imageQuality", v)} options={[{ value: "low", label: "Low (cheapest)" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} aria-label="Image quality" /></Field>
        <Field label="Temperature" htmlFor="ai-t" hint="Blank = model default (needed for reasoning models)."><Input id="ai-t" type="number" step="0.1" min={0} max={2} value={f.temperature} onChange={(e) => set("temperature", e.target.value)} /></Field>
        <Field label="Max output tokens" htmlFor="ai-mo"><Input id="ai-mo" type="number" min={1000} max={32000} value={f.maxOutputTokens} onChange={(e) => set("maxOutputTokens", e.target.value)} /></Field>
        <Field label="Daily AI generations per user" htmlFor="ai-dl" hint="0 = unlimited"><Input id="ai-dl" type="number" min={0} value={f.dailyGenerationLimit} onChange={(e) => set("dailyGenerationLimit", e.target.value)} /></Field>
        <Field label="Est. cost per image (USD)" htmlFor="ai-ic"><Input id="ai-ic" type="number" step="0.01" min={0} value={f.imageCostUsd} onChange={(e) => set("imageCostUsd", e.target.value)} /></Field>
      </div>
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save AI settings</Button>
    </form>
  );
}

function TargetSelect({ provider, platform, options, value }: { provider: string; platform: Platform; options: { id: string; name: string }[]; value: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <PlatformChip platform={platform} full />
      <div className="min-w-0 flex-1">
        {options.length === 0 ? <span className="text-xs text-muted-foreground">No accounts found for this platform on the connected login.</span> : (
          <OptionSelect value={value} disabled={pending} onChange={(v) => start(async () => { const r = await selectIntegrationTargetAction(provider, platform, v); if (!r.ok) toast.error(r.error); else { toast.success(`${PLATFORM_META[platform].label} target saved.`); router.refresh(); } })} options={options.map((o) => ({ value: o.id, label: o.name }))} aria-label={`${PLATFORM_META[platform].label} account`} />
        )}
      </div>
    </div>
  );
}

export function IntegrationsPanel({ items, encryptionReady }: { items: IntegrationView[]; encryptionReady: boolean }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it.provider} className="space-y-3 rounded-2xl border border-border/50 bg-background/60 p-4">
          <div>
            <p className="font-semibold">{it.label}</p>
            <div className="mt-1 flex flex-wrap gap-1">{it.platforms.map((p) => <PlatformChip key={p} platform={p} />)}</div>
          </div>
          {it.connected ? (
            <>
              <p className="text-xs">{`Connected as ${it.accountName ?? "—"}${it.connectedAt ? ` · ${formatDateTime(it.connectedAt)}` : ""}`}</p>
              {it.expiresAt && <p className="text-[11px] text-muted-foreground">{`Token expires ${formatDateTime(it.expiresAt)}`}</p>}
              {it.lastError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{`Last error: ${it.lastError}`}</p>}
              <div className="space-y-2">{it.platforms.map((p) => <TargetSelect key={p} provider={it.provider} platform={p} options={it.targets[p] ?? []} value={it.selected[p] ?? ""} />)}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/smms/oauth/${it.provider}`} />}><Plug className="size-3.5" /> Reconnect</Button>
                <ActionButton size="sm" variant="ghost" action={disconnectIntegrationAction.bind(null, it.provider)} success="Disconnected" confirm={{ title: `Disconnect ${it.label}?`, description: "Stored tokens are deleted. Scheduled posts for these platforms will fail until it's reconnected.", confirmLabel: "Disconnect" }}><Unplug className="size-3.5" /> Disconnect</ActionButton>
              </div>
            </>
          ) : it.configured && encryptionReady ? (
            <Button size="sm" nativeButton={false} render={<a href={`/api/smms/oauth/${it.provider}`} />}><Plug className="size-3.5" /> Connect</Button>
          ) : (
            <p className="text-xs text-muted-foreground">{!encryptionReady ? "Set SMMS_ENCRYPTION_KEY on the server first." : `App credentials aren't configured on the server (${it.provider === "meta" ? "META_APP_ID / META_APP_SECRET" : it.provider === "google" ? "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET" : "LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET"}).`}</p>
          )}
        </div>
      ))}
    </div>
  );
}
