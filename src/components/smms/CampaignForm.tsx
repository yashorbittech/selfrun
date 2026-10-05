"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OptionSelect from "@/components/sop/OptionSelect";
import { Field, PlatformChip } from "@/components/smms/SmmsBits";
import { createCampaignAction, updateCampaignBriefAction } from "@/app/smms/(protected)/actions";
import { AD_PLATFORMS, CAMPAIGN_OBJECTIVES, CTAS, INDUSTRIES, LANGUAGES, TONES } from "@/lib/smms/constants";
import { cn } from "@/lib/utils";
import type { CampaignFormValues } from "@/lib/smms/form-defaults";

/** Free text with suggestions (datalist) — the vocabularies are suggestions, not a closed list. */
function Suggest({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <>
      <Input id={id} list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <datalist id={`${id}-list`}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </>
  );
}

export default function CampaignForm({ campaignId, initial, offers, clients, services, canGenerate }: { campaignId?: string; initial: CampaignFormValues; offers: { _id: string; title: string; badge: string }[]; clients: { _id: string; name: string }[]; services: string[]; canGenerate: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"save" | "generate" | null>(null);
  const set = <K extends keyof CampaignFormValues>(k: K, val: CampaignFormValues[K]) => setV((x) => ({ ...x, [k]: val }));

  function submit(generate: boolean) {
    setMode(generate ? "generate" : "save");
    start(async () => {
      const payload = { ...v, keywords: v.keywords, budget: v.budget };
      if (campaignId) {
        const res = await updateCampaignBriefAction(campaignId, payload);
        if (!res.ok) toast.error(res.error);
        else {
          toast.success("Brief saved.");
          router.push(`/smms/campaigns/${campaignId}`);
        }
        return;
      }
      const res = await createCampaignAction(payload, generate);
      if (!res.ok) return void toast.error(res.error);
      if (res.generateError) toast.warning(`Campaign saved. ${res.generateError}`);
      else toast.success(res.generated ? "Campaign created and AI strategy generated." : "Campaign created.");
      router.push(`/smms/campaigns/${res.id}`);
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign name *" htmlFor="c-name" className="sm:col-span-2">
          <Input id="c-name" value={v.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} placeholder="e.g. Diwali AI Automation Push" />
        </Field>
        <Field label="Platforms *" className="sm:col-span-2" hint="Where the ads will run. Each ad targets one of these.">
          <div className="flex flex-wrap gap-2">
            {AD_PLATFORMS.map((p) => {
              const on = v.platforms.includes(p);
              return (
                <button key={p} type="button" aria-pressed={on} onClick={() => set("platforms", on ? v.platforms.filter((x) => x !== p) : [...v.platforms, p])} className={cn("rounded-lg border px-2.5 py-1.5 transition", on ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40")}>
                  <PlatformChip platform={p} full />
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Objective" htmlFor="c-obj"><Suggest id="c-obj" value={v.objective} onChange={(x) => set("objective", x)} options={CAMPAIGN_OBJECTIVES} placeholder="Lead generation" /></Field>
        <Field label="Industry" htmlFor="c-ind"><Suggest id="c-ind" value={v.industry} onChange={(x) => set("industry", x)} options={INDUSTRIES} /></Field>
        <Field label="Target audience" htmlFor="c-aud" className="sm:col-span-2"><Textarea id="c-aud" rows={2} value={v.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Who should see this — roles, company size, interests, pain points" /></Field>
        <Field label="Location" htmlFor="c-loc"><Input id="c-loc" value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="India — Delhi NCR, Bengaluru" /></Field>
        <div className="grid grid-cols-[1fr_5rem] gap-2">
          <Field label="Budget" htmlFor="c-bud"><Input id="c-bud" type="number" min={0} value={v.budget} onChange={(e) => set("budget", e.target.value)} placeholder="50000" /></Field>
          <Field label="Currency" htmlFor="c-cur"><Input id="c-cur" value={v.currency} onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))} /></Field>
        </div>
        <Field label="Start date" htmlFor="c-start"><Input id="c-start" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="End date" htmlFor="c-end"><Input id="c-end" type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
        <Field label="Call to action" htmlFor="c-cta"><Suggest id="c-cta" value={v.cta} onChange={(x) => set("cta", x)} options={CTAS} /></Field>
        <Field label="Landing page" htmlFor="c-lp"><Input id="c-lp" type="url" value={v.landingPage} onChange={(e) => set("landingPage", e.target.value)} placeholder="https://…" /></Field>
        <Field label="Offer / service" htmlFor="c-os" hint="From the site's service catalogue, or free text."><Suggest id="c-os" value={v.offerService} onChange={(x) => set("offerService", x)} options={services} /></Field>
        <Field label="Promote a live offer" hint="Read live from Festival Offers.">
          <OptionSelect value={v.offerId} onChange={(x) => set("offerId", x)} options={offers.map((o) => ({ value: o._id, label: `${o.title} · ${o.badge}` }))} noneLabel="No specific offer" aria-label="Offer" />
        </Field>
        <Field label="Client (optional)" hint="Run for a PMS client — the AI then writes in the client's voice.">
          <OptionSelect value={v.clientId} onChange={(x) => set("clientId", x)} options={clients.map((c) => ({ value: c._id, label: c.name }))} noneLabel="Our own brand" aria-label="Client" />
        </Field>
        <Field label="Keywords" htmlFor="c-kw" hint="Comma or line separated."><Input id="c-kw" value={v.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="ai automation, workflow automation, rpa" /></Field>
        <Field label="Tone" htmlFor="c-tone"><Suggest id="c-tone" value={v.tone} onChange={(x) => set("tone", x)} options={TONES} placeholder="Brand default" /></Field>
        <Field label="Language" htmlFor="c-lang"><Suggest id="c-lang" value={v.language} onChange={(x) => set("language", x)} options={LANGUAGES} /></Field>
        <Field label="Brand information for this campaign" htmlFor="c-bi" className="sm:col-span-2" hint="Anything beyond the central brand context (Settings) the AI should know."><Textarea id="c-bi" rows={3} value={v.brandInfo} onChange={(e) => set("brandInfo", e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {!campaignId && canGenerate && (
          <Button type="button" onClick={() => submit(true)} disabled={pending}>
            {pending && mode === "generate" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {pending && mode === "generate" ? "Creating & generating…" : "Create & generate strategy"}
          </Button>
        )}
        <Button type="submit" variant={!campaignId && canGenerate ? "outline" : "default"} disabled={pending}>
          {pending && mode === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {campaignId ? "Save brief" : "Save as draft"}
        </Button>
      </div>
    </form>
  );
}
