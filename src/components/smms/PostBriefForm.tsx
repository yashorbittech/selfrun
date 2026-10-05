"use client";

import PanelTabs from "@/components/platform/panel/PanelTabs";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, Film, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OptionSelect from "@/components/sop/OptionSelect";
import { Field, PlatformChip } from "@/components/smms/SmmsBits";
import { createPostAction, updatePostBriefAction } from "@/app/smms/(protected)/actions";
import { LANGUAGES, POST_OBJECTIVES, POST_PLATFORMS, TONES } from "@/lib/smms/constants";
import { cn } from "@/lib/utils";
import type { PostBriefValues } from "@/lib/smms/form-defaults";

function Suggest({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <>
      <Input id={id} list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <datalist id={`${id}-list`}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </>
  );
}

export default function PostBriefForm({ postId, initial, offers, clients, services, campaigns, canGenerate, lockedPlatforms = [] }: { postId?: string; initial: PostBriefValues; offers: { _id: string; title: string; badge: string }[]; clients: { _id: string; name: string }[]; services: string[]; campaigns: { _id: string; name: string }[]; canGenerate: boolean; lockedPlatforms?: string[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"save" | "generate" | null>(null);
  const set = <K extends keyof PostBriefValues>(k: K, val: PostBriefValues[K]) => setV((x) => ({ ...x, [k]: val }));

  function submit(generate: boolean) {
    setMode(generate ? "generate" : "save");
    start(async () => {
      const payload = { ...v, plannedAt: v.plannedAt ? new Date(v.plannedAt).toISOString() : "" };
      if (postId) {
        const res = await updatePostBriefAction(postId, payload);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Brief saved.");
        router.push(`/smms/posts/${postId}`);
        return;
      }
      const res = await createPostAction(payload, generate);
      if (!res.ok) return void toast.error(res.error);
      if (res.generateError) toast.warning(`Post saved. ${res.generateError}`);
      else toast.success(generate ? "Post created — review the AI versions." : "Draft created.");
      router.push(`/smms/posts/${res.id}`);
    });
  }

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(false); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Topic *" htmlFor="p-topic" className="sm:col-span-2" hint="What the post is about. One idea — the AI adapts it per platform.">
          <Textarea id="p-topic" rows={2} value={v.topic} onChange={(e) => set("topic", e.target.value)} required maxLength={500} placeholder="e.g. How our AI document intelligence cut invoice processing time by automating data entry" />
        </Field>
        <Field label="Platforms *" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {POST_PLATFORMS.map((p) => {
              const on = v.platforms.includes(p);
              const locked = lockedPlatforms.includes(p);
              return (
                <button key={p} type="button" aria-pressed={on} disabled={locked} title={locked ? "Already published — can't be removed" : undefined} onClick={() => set("platforms", on ? v.platforms.filter((x) => x !== p) : [...v.platforms, p])} className={cn("rounded-lg border px-2.5 py-1.5 transition disabled:opacity-60", on ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40")}>
                  <PlatformChip platform={p} full />
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Media type">
          <PanelTabs className="w-full [&>*]:flex-1" label="Media type" active={v.contentType} onSelect={(k) => set("contentType", k as "image" | "video")} tabs={[{ key: "image", label: "Image", icon: <ImageIcon className="size-4" /> }, { key: "video", label: "Video", icon: <Film className="size-4" /> }]} />
        </Field>
        <Field label="Content objective" htmlFor="p-obj"><Suggest id="p-obj" value={v.objective} onChange={(x) => set("objective", x)} options={POST_OBJECTIVES} placeholder="Engagement" /></Field>
        <Field label="Service / product" htmlFor="p-svc"><Suggest id="p-svc" value={v.serviceProduct} onChange={(x) => set("serviceProduct", x)} options={services} /></Field>
        <Field label="Audience" htmlFor="p-aud"><Input id="p-aud" value={v.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Brand default audience" /></Field>
        <Field label="Tone" htmlFor="p-tone"><Suggest id="p-tone" value={v.tone} onChange={(x) => set("tone", x)} options={TONES} placeholder="Brand default" /></Field>
        <Field label="Language" htmlFor="p-lang"><Suggest id="p-lang" value={v.language} onChange={(x) => set("language", x)} options={LANGUAGES} /></Field>
        <Field label="Planned publish date & time" htmlFor="p-when" hint="Pre-fills scheduling after review — nothing is scheduled automatically."><Input id="p-when" type="datetime-local" value={v.plannedAt} onChange={(e) => set("plannedAt", e.target.value)} /></Field>
        <Field label="Link (optional)" htmlFor="p-link" hint="Landing page for link posts and CTA buttons."><Input id="p-link" type="url" value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" /></Field>
        <Field label="Part of a campaign"><OptionSelect value={v.campaignId} onChange={(x) => set("campaignId", x)} options={campaigns.map((c) => ({ value: c._id, label: c.name }))} noneLabel="None" aria-label="Campaign" /></Field>
        <Field label="Promote a live offer"><OptionSelect value={v.offerId} onChange={(x) => set("offerId", x)} options={offers.map((o) => ({ value: o._id, label: `${o.title} · ${o.badge}` }))} noneLabel="No specific offer" aria-label="Offer" /></Field>
        <Field label="Client (optional)"><OptionSelect value={v.clientId} onChange={(x) => set("clientId", x)} options={clients.map((c) => ({ value: c._id, label: c.name }))} noneLabel="Our own brand" aria-label="Client" /></Field>
        <Field label="Internal title" htmlFor="p-title" hint="Defaults to the topic."><Input id="p-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={120} /></Field>
        <Field label="Notes for the AI" htmlFor="p-notes" className="sm:col-span-2"><Textarea id="p-notes" rows={2} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Points to include, things to avoid, facts and figures to use" /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {!postId && canGenerate && (
          <Button type="button" onClick={() => submit(true)} disabled={pending}>
            {pending && mode === "generate" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {pending && mode === "generate" ? "Generating platform versions…" : "Create & generate with AI"}
          </Button>
        )}
        <Button type="submit" variant={!postId && canGenerate ? "outline" : "default"} disabled={pending}>
          {pending && mode === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {postId ? "Save brief" : "Save as draft"}
        </Button>
      </div>
    </form>
  );
}
