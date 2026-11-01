"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Columns2, ImageIcon, Loader2, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptionSelect from "@/components/products/playbook-ai/OptionSelect";
import Stepper, { type StepperStep } from "@/components/products/viralpulse-ai/shared/Stepper";
import AiField from "@/components/products/viralpulse-ai/shared/AiField";
import MediaPicker from "@/components/products/viralpulse-ai/MediaPicker";
import { Field, MediaThumb } from "@/components/products/viralpulse-ai/SmmsBits";
import { Notice, SectionCard } from "@/components/products/viralpulse-ai/SmmsUi";
import { approveAction, chooseAction, editVariantAction, estimateAction, finishAction, generateAction, getProjectAction, rejectAction, createProjectAction, updateBriefAction, startPostFromMediaAction } from "@/app/(products)/viralpulse-ai/(protected)/image-studio/actions";
import { GOALS, SPECS, goalById, specByKey, specGroups, safeBox } from "@/lib/products/viralpulse-ai/images/specs";
import { checkOverlayText, policyCheck } from "@/lib/products/viralpulse-ai/images/policy";
import { TEXT_POSITIONS, type BrandKit, type Brief, type ProjectView } from "@/lib/products/viralpulse-ai/images/types";
import type { ImageSettings } from "@/lib/products/viralpulse-ai/images/limits";
import { IMAGE_QUALITIES } from "@/lib/products/viralpulse-ai/models";
import { LANGUAGES } from "@/lib/products/viralpulse-ai/constants";
import type { MediaCard } from "@/lib/products/viralpulse-ai/media";
import { cn } from "@/lib/utils";

export interface StudioConfig {
  kit: BrandKit;
  logo: MediaCard | null;
  settings: Pick<ImageSettings, "maxVariants" | "badgeForPeopleDefault" | "dailySpendCapUsd" | "approvalThresholdUsd">;
  providers: { openai: boolean; gemini: boolean };
  defaultProvider: "openai" | "gemini";
  defaultQuality: Brief["quality"];
  canApprove: boolean;
  canPost: boolean;
}

const STEPS: StepperStep[] = [
  { key: "goal", label: "Goal & format", hint: "What is it for?" },
  { key: "brief", label: "Brief", hint: "Subject, style, words" },
  { key: "kit", label: "Brand kit", hint: "Logo and colours" },
  { key: "refs", label: "References", hint: "Optional photos" },
  { key: "generate", label: "Generate", hint: "Pick and refine" },
  { key: "finish", label: "Finish", hint: "Sizes and save" },
];
const QUICK_STEPS: StepperStep[] = [
  { key: "brief", label: "Describe it" },
  { key: "generate", label: "Pick" },
  { key: "finish", label: "Save" },
];

const vurl = (p: string, v: string) => `/api/viralpulse-ai/image-studio/variant/${p}/${v}`;
const blank = (c: StudioConfig, quick: boolean): Brief => ({
  goalId: quick ? "custom" : "organic_post", name: "", subject: "", product: "", style: "", colours: "", overlayText: [""], textPosition: "bottom", language: "English", negative: "",
  specKeys: quick ? ["ig_feed_square"] : goalById("organic_post")!.specKeys, variants: 2, quality: c.defaultQuality, provider: c.defaultProvider, applyKit: true, referenceIds: [], consent: null,
});

export default function StudioCreate({ config, quick = false, initial = null }: { config: StudioConfig; quick?: boolean; initial?: ProjectView | null }) {
  const steps = quick ? QUICK_STEPS : STEPS;
  const [step, setStep] = useState(initial ? "generate" : steps[0].key);
  const [brief, setBrief] = useState<Brief>(initial?.brief ?? blank(config, quick));
  const [project, setProject] = useState<ProjectView | null>(initial);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [refs, setRefs] = useState<MediaCard[]>([]);
  const [flags, setFlags] = useState<{ code: string; message: string }[] | null>(null);
  const [flagAck, setFlagAck] = useState<string[]>([]);
  const [pendingEdit, setPendingEdit] = useState<{ variantId: string; text: string } | null>(null);
  const [estimate, setEstimate] = useState<{ totalUsd: number; model: string; basis: string } | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [editText, setEditText] = useState("");
  const [previewSpec, setPreviewSpec] = useState("");
  const [fin, setFin] = useState({ name: "", tags: "", folder: "", badge: false, applyLogo: config.kit.applyLogo && !!config.kit.logoMediaId, format: "jpeg", specKeys: [] as string[] });
  const [done, setDone] = useState<{ mediaIds: string[]; warnings: string[] } | null>(null);
  const badgeTouched = useRef(false);

  const goal = goalById(brief.goalId)!;
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const overlayOk = brief.overlayText.map((t) => checkOverlayText(t));
  const policy = useMemo(() => policyCheck({ subject: brief.subject, product: brief.product, style: brief.style, negative: brief.negative, overlayText: brief.overlayText, goalId: brief.goalId, hasReferenceImages: brief.referenceIds.length > 0, consent: brief.consent }), [brief]);
  const ctx = () => ({ goal: goal.label, product: brief.product, subject: brief.subject, style: brief.style, colours: brief.colours, platform: brief.specKeys.map((k) => specByKey(k)?.group).filter(Boolean).join(", "), language: brief.language, kitVoice: config.kit.voice, overlayText: brief.overlayText.join("\n"), textPosition: brief.textPosition });

  useEffect(() => {
    if (!badgeTouched.current) setFin((f) => ({ ...f, badge: policy.suggestAiBadge && config.settings.badgeForPeopleDefault }));
  }, [policy.suggestAiBadge, config.settings.badgeForPeopleDefault]);
  useEffect(() => {
    if (!busy) return;
    const t0 = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    const poll = setInterval(async () => {
      if (!project) return;
      const r = await getProjectAction(project.id);
      if (r.ok) setProject((p) => (p && r.project.variants.length > p.variants.length ? { ...p, variants: r.project.variants } : p));
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [busy, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const briefPayload = () => ({ ...brief, referenceIds: refs.map((r) => r._id) });

  async function sync(): Promise<ProjectView | null> {
    const payload = briefPayload();
    const r = project ? await updateBriefAction(project.id, payload) : await createProjectAction(payload);
    if (!r.ok) {
      toast.error(r.error);
      return null;
    }
    setProject(r.project);
    setBrief(r.project.brief);
    return r.project;
  }

  function handle(r: Awaited<ReturnType<typeof generateAction>>, onAck: (codes: string[]) => void) {
    if (!r.ok) return void toast.error(r.error);
    if (r.outcome === "needs_ack") {
      setFlags(r.flags);
      setFlagAck([]);
      return;
    }
    setProject(r.project);
    if (r.outcome === "needs_manager") return void toast.message(`Needs a manager's approval: about $${r.estimateUsd.toFixed(2)} is over the $${r.thresholdUsd.toFixed(2)} limit. Managers were notified.`);
    setFlags(null);
    setFlagAck([]);
    setPendingEdit(null);
    setEditText("");
    toast.success("Done.");
    void onAck;
  }

  async function runGenerate(ack: string[]) {
    const p = await sync();
    if (!p) return;
    setBusy(true);
    setElapsed(0);
    setStep("generate");
    const r = await generateAction(p.id, ack);
    setBusy(false);
    handle(r, () => {});
  }

  async function goGenerate() {
    const p = await sync();
    if (!p) return;
    setStep("generate");
    const e = await estimateAction(p.id);
    if (e.ok) setEstimate(e.estimate);
  }

  async function runEdit(variantId: string, text: string, ack: string[]) {
    if (!project) return;
    setBusy(true);
    setElapsed(0);
    const r = await editVariantAction(project.id, variantId, text, ack);
    setBusy(false);
    handle(r, () => {});
  }

  const chosen = project?.chosenIds ?? [];
  async function choose(id: string) {
    if (!project) return;
    const next = goal.slides ? (chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]) : [id];
    const r = await chooseAction(project.id, next);
    if (r.ok) setProject(r.project);
  }

  const labelOf = (i: number) => (goal.slides ? `Slide ${(project?.variants[i]?.slide ?? 0) + 1}` : `Option ${i + 1}`);
  const canNextBrief = (brief.subject.trim().length >= 8 || brief.product.trim().length >= 3 || refs.length > 0) && overlayOk.every((o) => o.ok) && policy.ok && (!brief.consent?.showsPeople || brief.consent.attested);
  const idx = steps.findIndex((s) => s.key === step);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)].key);
  const back = () => setStep(steps[Math.max(idx - 1, 0)].key);
  const approvalPending = project?.pendingApproval;
  const previewKey = previewSpec || brief.specKeys[0];
  const prev = specByKey(previewKey);

  return (
    <div className="space-y-4">
      <Stepper steps={steps} current={step} onSelect={(k) => !busy && setStep(k)} label="Image Studio steps" />

      {step === "goal" && !quick && (
        <SectionCard title="What is the picture for?" description="This picks the exact sizes. You can change them below.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {GOALS.filter((g) => g.id !== "custom").map((g) => (
              <button key={g.id} type="button" aria-pressed={brief.goalId === g.id} onClick={() => setBrief((b) => ({ ...b, goalId: g.id, specKeys: g.specKeys, overlayText: g.slides ? Array.from({ length: g.slides.min }, (_, i) => b.overlayText[i] ?? "") : [b.overlayText[0] ?? ""], variants: g.slides ? g.slides.min : b.variants }))} className={cn("rounded-xl border p-3 text-left transition", brief.goalId === g.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/40")}>
                <p className="text-sm font-semibold">{g.label}</p>
                <p className="text-xs text-muted-foreground">{g.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <AiField fieldKey="image.goal" label="Name this project (optional)" id="st-goal" value={brief.name} onChange={(v) => set("name", String(v))} getContext={ctx} placeholder="e.g. Diwali offer - Instagram" />
            <SizePicker brief={brief} onChange={(keys) => set("specKeys", keys)} />
          </div>
        </SectionCard>
      )}

      {step === "brief" && (
        <SectionCard title={quick ? "Describe the picture" : "The brief"} description="The model draws the picture. Words on the picture are typed by the app, so they are always spelled exactly as you write them.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {quick && (
                <Field label="Size">
                  <OptionSelect value={brief.specKeys[0]} onChange={(v) => set("specKeys", [v])} options={SPECS.map((s) => ({ value: s.key, label: `${s.group}: ${s.label} (${s.width}x${s.height})` }))} aria-label="Size" />
                </Field>
              )}
              <AiField fieldKey="image.subject" label="What the picture shows" id="st-subject" as="textarea" rows={4} value={brief.subject} onChange={(v) => set("subject", String(v))} getContext={ctx} placeholder="A tailor measuring fabric in a bright, tidy shop, shot from the front" hint="Fictional people only. No real person's name, no other company's logo." />
              {!quick && <AiField fieldKey="image.product" label="Product or service" id="st-product" value={brief.product} onChange={(v) => set("product", String(v))} getContext={ctx} />}
              <AiField fieldKey="image.style" label="Style and mood" id="st-style" value={brief.style} onChange={(v) => set("style", String(v))} getContext={ctx} placeholder="Warm natural light, clean, modern" />
              {!quick && <AiField fieldKey="image.colours" label="Colours" id="st-colours" value={brief.colours} onChange={(v) => set("colours", String(v))} getContext={ctx} placeholder="Deep blue and saffron" />}
              <AiField fieldKey="image.negative" label="Leave out" id="st-neg" value={brief.negative} onChange={(v) => set("negative", String(v))} getContext={ctx} placeholder="crowds, clutter, bright red" />
            </div>
            <div className="space-y-3">
              {goal.slides ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium">{`Text for each slide (${brief.overlayText.length} slides)`}</p>
                  {brief.overlayText.map((t, i) => (
                    <AiField key={i} fieldKey="image.overlayText" label={`Slide ${i + 1}`} id={`st-ot-${i}`} value={t} onChange={(v) => setBrief((b) => ({ ...b, overlayText: b.overlayText.map((x, j) => (j === i ? String(v) : x)) }))} getContext={ctx} hint={overlayOk[i]?.message ?? undefined} />
                  ))}
                  <div className="flex gap-2">
                    <Button type="button" size="xs" variant="outline" disabled={brief.overlayText.length >= goal.slides.max} onClick={() => setBrief((b) => ({ ...b, overlayText: [...b.overlayText, ""], variants: b.overlayText.length + 1 }))}>Add slide</Button>
                    <Button type="button" size="xs" variant="outline" disabled={brief.overlayText.length <= goal.slides.min} onClick={() => setBrief((b) => ({ ...b, overlayText: b.overlayText.slice(0, -1), variants: b.overlayText.length - 1 }))}>Remove last</Button>
                  </div>
                </div>
              ) : (
                <AiField fieldKey="image.overlayText" label="Text on the picture (exactly as you want it)" id="st-ot" as="textarea" rows={3} value={brief.overlayText[0] ?? ""} onChange={(v) => set("overlayText", [String(v)])} getContext={ctx} hint={overlayOk[0]?.message ?? "Optional. Drawn by the app with a bundled font, in English or Hindi. Keep prices and dates exactly right."} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Text position"><OptionSelect value={brief.textPosition} onChange={(v) => set("textPosition", v as Brief["textPosition"])} options={TEXT_POSITIONS.map((p) => ({ value: p.value, label: p.label }))} aria-label="Text position" /></Field>
                <Field label="Language of the text"><OptionSelect value={brief.language} onChange={(v) => set("language", v)} options={LANGUAGES.map((l) => ({ value: l, label: l }))} aria-label="Language" /></Field>
              </div>
              {quick && <ConsentBlock brief={brief} setBrief={setBrief} refs={refs} setRefs={setRefs} quick />}
              <PolicyBox policy={policy} />
            </div>
          </div>
        </SectionCard>
      )}

      {step === "kit" && !quick && (
        <SectionCard title="Brand kit" description="Applied to the prompt (colours, voice, dos and don'ts) and to every export (logo, text colour).">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brief.applyKit} onChange={(e) => set("applyKit", e.target.checked)} /> Apply the brand kit to this project</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 p-3 text-sm">
              <p className="font-semibold">Logo</p>
              {config.logo ? <div className="mt-2 flex items-center gap-3"><MediaThumb media={config.logo} className="size-16 bg-white" /><p className="text-xs text-muted-foreground">{`Placed ${config.kit.logoPlacement === "bc" ? "bottom centre" : config.kit.logoPlacement.replace("t", "top ").replace("b", "bottom ").replace("l", "left").replace("r", "right")} at ${(config.kit.logoScale * 100).toFixed(0)}% width. Switch it on when you finish.`}</p></div> : <p className="mt-1 text-xs text-muted-foreground">No logo yet.</p>}
            </div>
            <div className="rounded-xl border border-border/50 p-3 text-sm">
              <p className="font-semibold">Voice, colours and rules</p>
              <p className="mt-1 text-xs text-muted-foreground">{[config.kit.voice, Object.values(config.kit.colours).filter(Boolean).join(" "), config.kit.dos.length ? `${config.kit.dos.length} do` : "", config.kit.donts.length ? `${config.kit.donts.length} don't` : ""].filter(Boolean).join(" · ") || "The kit is empty."}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Edit the kit in the <Link className="text-primary underline" href="/viralpulse-ai/image-studio?tab=brand">Brand kit tab</Link>. Changes apply to the next generation.</p>
        </SectionCard>
      )}

      {step === "refs" && !quick && (
        <SectionCard title="Reference pictures (optional)" description="Product photos or a scene to follow. The model sees them; people in them must have agreed.">
          <ConsentBlock brief={brief} setBrief={setBrief} refs={refs} setRefs={setRefs} />
          <PolicyBox policy={policy} />
        </SectionCard>
      )}

      {step === "generate" && (
        <div className="space-y-4">
          <SectionCard title="Generate" description={estimate ? `About $${estimate.totalUsd.toFixed(3)} for ${brief.variants} picture${brief.variants === 1 ? "" : "s"} with ${estimate.model} (${estimate.basis === "usage" ? "actual usage" : "price table"} estimate).` : undefined}>
            <div className="flex flex-wrap items-end gap-3">
              <Field label={goal.slides ? "Slides" : "How many options"}>
                <OptionSelect value={String(brief.variants)} disabled={!!goal.slides} onChange={(v) => set("variants", Number(v))} options={Array.from({ length: Math.min(config.settings.maxVariants, 4) }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} aria-label="Number of options" />
              </Field>
              <Field label="Model"><OptionSelect value={brief.provider} onChange={(v) => set("provider", v as Brief["provider"])} options={[{ value: "openai", label: "OpenAI", disabled: !config.providers.openai }, ...(config.providers.gemini ? [{ value: "gemini", label: "Gemini" }] : [])] as never} aria-label="Model" /></Field>
              {brief.provider === "openai" && <Field label="Quality"><OptionSelect value={brief.quality} onChange={(v) => set("quality", v as Brief["quality"])} options={IMAGE_QUALITIES.map((q) => ({ value: q, label: q }))} aria-label="Quality" /></Field>}
              <Button type="button" disabled={busy || !canNextBrief} onClick={() => runGenerate([])}>{busy ? <><Loader2 className="size-4 animate-spin" /> {`Generating… ${elapsed}s`}</> : <><Sparkles className="size-4" /> {project?.variants.length ? "Generate more" : "Generate"}</>}</Button>
            </div>
            {!canNextBrief && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{policy.ok ? "Finish the brief first (the subject or product, valid text, and reference consent)." : "Fix the policy problems in the brief first."}</p>}
            {project?.error && <Notice tone="error">{project.error}</Notice>}
            {approvalPending && (
              <Notice tone="warn">
                {`Waiting for a manager: about $${approvalPending.estimateUsd.toFixed(2)} is over the approval limit.`}
                {config.canApprove && (
                  <span className="ml-2 inline-flex gap-2">
                    <Button type="button" size="xs" disabled={busy} onClick={async () => { setBusy(true); setElapsed(0); const r = await approveAction(project!.id); setBusy(false); handle(r, () => {}); }}>Approve and run</Button>
                    <Button type="button" size="xs" variant="outline" onClick={async () => { const r = await rejectAction(project!.id); if (r.ok) { const g = await getProjectAction(project!.id); if (g.ok) setProject(g.project); } }}>Decline</Button>
                  </span>
                )}
              </Notice>
            )}
          </SectionCard>

          {(project?.variants.length || busy) ? (
            <SectionCard title="Options" description={goal.slides ? "Choose the picture for every slide." : "Choose one. Tick two to compare."} action={compare.length === 2 ? <Button size="xs" variant="outline" onClick={() => setCompare([])}><X className="size-3" /> Close compare</Button> : undefined}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {project?.variants.map((v, i) => {
                  const picked = chosen.includes(v.id);
                  return (
                    <div key={v.id} className={cn("rounded-xl border p-1.5", picked ? "border-primary ring-2 ring-primary/30" : "border-border/60")}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- private authenticated route */}
                      <img src={vurl(project.id, v.id)} alt={`${labelOf(i)}${v.instruction ? `, edited: ${v.instruction}` : ""}`} className="aspect-square w-full rounded-lg bg-muted object-cover" loading="lazy" />
                      <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5 text-xs">
                        <span className="truncate font-medium">{labelOf(i)}{v.parentId ? " (edited)" : ""}</span>
                        <span className="text-muted-foreground">{`$${v.costUsd.toFixed(3)}`}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button type="button" size="xs" variant={picked ? "default" : "outline"} onClick={() => choose(v.id)}>{picked ? <><Check className="size-3" /> Chosen</> : "Choose"}</Button>
                        <Button type="button" size="xs" variant="ghost" aria-pressed={compare.includes(v.id)} onClick={() => setCompare((c) => (c.includes(v.id) ? c.filter((x) => x !== v.id) : [...c, v.id].slice(-2)))}><Columns2 className="size-3" /> Compare</Button>
                      </div>
                    </div>
                  );
                })}
                {busy && Array.from({ length: Math.max(brief.variants - (goal.slides ? (project?.variants.length ?? 0) : 0), 1) }, (_, i) => (
                  <div key={`s${i}`} className="animate-pulse rounded-xl border border-dashed border-border/60 p-1.5" aria-hidden>
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
                    <p className="mt-1.5 px-0.5 text-xs text-muted-foreground">{`Drawing… ${elapsed}s`}</p>
                  </div>
                ))}
              </div>
              {compare.length === 2 && project && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Compare options">
                  {compare.map((id) => (
                    // eslint-disable-next-line @next/next/no-img-element -- private authenticated route
                    <img key={id} src={vurl(project.id, id)} alt="Compared option" className="w-full rounded-xl border border-border/60 bg-muted object-contain" />
                  ))}
                </div>
              )}
              {chosen.length > 0 && project && !goal.slides && (
                <div className="mt-4 space-y-2 rounded-xl border border-border/50 p-3">
                  <AiField fieldKey="image.instruction" label="Change the chosen picture" id="st-edit" value={editText} onChange={(v) => setEditText(String(v))} getContext={ctx} placeholder="make the background warmer" hint="Examples: remove the plant, make it brighter, zoom out. To remove text, leave it out of the text box: the app draws it." />
                  <Button type="button" size="sm" disabled={busy || editText.trim().length < 4} onClick={() => { setPendingEdit({ variantId: chosen[0], text: editText }); void runEdit(chosen[0], editText, []); }}><Wand2 className="size-3.5" /> Apply change</Button>
                </div>
              )}
            </SectionCard>
          ) : (
            <SectionCard title="Options"><p className="text-sm text-muted-foreground">Your options appear here. Nothing is drawn or charged until you press Generate.</p></SectionCard>
          )}
        </div>
      )}

      {step === "finish" && (
        <SectionCard title="Finish" description="All the sizes you tick are cut from your chosen picture, with your text and logo placed inside each platform&apos;s safe zone.">
          {!chosen.length || !project ? (
            <Notice tone="warn">Choose a picture in the Generate step first.</Notice>
          ) : done ? (
            <div className="space-y-3">
              <Notice tone="ok">{`Saved ${done.mediaIds.length} image${done.mediaIds.length === 1 ? "" : "s"} to the library.`}</Notice>
              {done.warnings.map((w, i) => <Notice key={i} tone="warn">{w}</Notice>)}
              <div className="flex flex-wrap gap-2">
                <Button nativeButton={false} render={<Link href="/viralpulse-ai/image-studio?tab=library" />}><ImageIcon className="size-4" /> Open the library</Button>
                {config.canPost && <Button variant="outline" onClick={() => start(async () => { const r = await startPostFromMediaAction(done.mediaIds[0]); if (!r.ok) return void toast.error(r.error); window.location.href = r.href; })} disabled={pending}>Use in a post</Button>}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <div className="space-y-3">
                <AiField fieldKey="image.name" label="Name" id="st-fname" value={fin.name || brief.name} onChange={(v) => setFin((f) => ({ ...f, name: String(v) }))} getContext={() => ({ prompt: brief.subject, platform: ctx().platform })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Folder"><Input value={fin.folder} maxLength={60} onChange={(e) => setFin((f) => ({ ...f, folder: e.target.value }))} placeholder="optional" aria-label="Folder" /></Field>
                  <Field label="Tags"><Input value={fin.tags} onChange={(e) => setFin((f) => ({ ...f, tags: e.target.value }))} placeholder="diwali, offer" aria-label="Tags" /></Field>
                </div>
                <fieldset className="space-y-1">
                  <legend className="text-xs font-medium">Sizes</legend>
                  {(fin.specKeys.length ? fin.specKeys : brief.specKeys).length === 0 && null}
                  {brief.specKeys.map((k) => {
                    const s = specByKey(k)!;
                    const on = fin.specKeys.length ? fin.specKeys.includes(k) : true;
                    return (
                      <label key={k} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={on} onChange={(e) => setFin((f) => { const cur = f.specKeys.length ? f.specKeys : brief.specKeys; return { ...f, specKeys: e.target.checked ? [...new Set([...cur, k])] : cur.filter((x) => x !== k) }; })} />
                        <span>{`${s.group}: ${s.label}`}</span><span className="text-xs text-muted-foreground">{`${s.width}x${s.height}`}</span>
                      </label>
                    );
                  })}
                </fieldset>
                <div className="space-y-2 rounded-xl border border-border/50 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="size-4 text-emerald-600" /> AI disclosure</p>
                  <p className="text-xs text-muted-foreground">Every file&apos;s metadata says it is AI generated (EXIF description, and the IPTC &ldquo;trained algorithmic media&rdquo; source type). Add a visible badge too when the picture could pass as a real photograph of people.</p>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={fin.badge} onChange={(e) => { badgeTouched.current = true; setFin((f) => ({ ...f, badge: e.target.checked })); }} /> Show an &ldquo;AI generated&rdquo; badge on the picture{policy.suggestAiBadge ? " (recommended: this may look like a real photo of people)" : ""}</label>
                  {config.kit.logoMediaId && <label className="flex items-center gap-2"><input type="checkbox" checked={fin.applyLogo} onChange={(e) => setFin((f) => ({ ...f, applyLogo: e.target.checked }))} /> Place the brand logo</label>}
                  <label className="flex items-center gap-2">File type <OptionSelect value={fin.format} onChange={(v) => setFin((f) => ({ ...f, format: v }))} options={[{ value: "jpeg", label: "JPEG (smaller)" }, { value: "png", label: "PNG" }]} aria-label="File type" /></label>
                </div>
                <Button type="button" disabled={pending} onClick={() => start(async () => {
                  const r = await finishAction(project.id, { name: fin.name || brief.name || goal.label, tags: fin.tags.split(",").map((t) => t.trim()).filter(Boolean), folder: fin.folder, badge: fin.badge, applyLogo: fin.applyLogo, specKeys: fin.specKeys.length ? fin.specKeys : brief.specKeys, format: fin.format });
                  if (!r.ok) return void toast.error(r.error);
                  setProject(r.project);
                  setDone({ mediaIds: r.exports.map((e) => e.mediaId), warnings: r.warnings });
                })}>{pending ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Check className="size-4" /> Save to library</>}</Button>
              </div>
              <div className="space-y-2">
                <Field label="Safe-zone preview">
                  <OptionSelect value={previewKey} onChange={setPreviewSpec} options={brief.specKeys.map((k) => ({ value: k, label: specByKey(k)!.label }))} aria-label="Preview size" />
                </Field>
                {prev && <SafePreview src={vurl(project.id, chosen[0])} spec={prev} />}
                <p className="text-[11px] text-muted-foreground">{`Dashed box: keep text and logos inside. ${prev?.note ?? ""}`}</p>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {flags && (
        <Notice tone="warn">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4" /> Check before generating</p>
            {flags.map((f) => (
              <label key={f.code} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={flagAck.includes(f.code)} onChange={(e) => setFlagAck((a) => (e.target.checked ? [...a, f.code] : a.filter((x) => x !== f.code)))} /> {f.message}</label>
            ))}
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={flagAck.length < flags.length || busy} onClick={() => (pendingEdit ? runEdit(pendingEdit.variantId, pendingEdit.text, flagAck) : runGenerate(flagAck))}>I checked, continue</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setFlags(null)}>Cancel</Button>
            </div>
          </div>
        </Notice>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={idx === 0 || busy} onClick={back}><ArrowLeft className="size-4" /> Back</Button>
        {step === "generate" ? (
          <Button type="button" disabled={chosen.length === 0 || busy} onClick={next}>Continue <ArrowRight className="size-4" /></Button>
        ) : step === "finish" ? null : step === "brief" && !quick ? (
          <Button type="button" disabled={!canNextBrief} onClick={next}>Next <ArrowRight className="size-4" /></Button>
        ) : step === "refs" ? (
          <Button type="button" disabled={busy || !canNextBrief} onClick={goGenerate}>Next <ArrowRight className="size-4" /></Button>
        ) : step === "brief" && quick ? (
          <Button type="button" disabled={busy || !canNextBrief} onClick={goGenerate}>Next <ArrowRight className="size-4" /></Button>
        ) : (
          <Button type="button" onClick={next}>Next <ArrowRight className="size-4" /></Button>
        )}
      </div>
    </div>
  );
}

function SizePicker({ brief, onChange }: { brief: Brief; onChange: (keys: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium">Output sizes</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {specGroups().map((g) => (
          <div key={g.group} className="rounded-xl border border-border/50 p-2">
            <p className="text-xs font-semibold">{g.group}</p>
            {g.specs.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={brief.specKeys.includes(s.key)} onChange={(e) => onChange(e.target.checked ? [...brief.specKeys, s.key].slice(0, 8) : brief.specKeys.filter((k) => k !== s.key))} />
                <span className="flex-1">{s.label}</span>
                <span className="text-muted-foreground" title={`Source: ${s.source.url} (${s.source.confidence}, checked ${s.source.verifiedOn})`}>{`${s.width}x${s.height}`}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Sizes were checked on 2026-11-01. Hover a size for its source and how firmly it was confirmed.</p>
    </fieldset>
  );
}

function PolicyBox({ policy }: { policy: ReturnType<typeof policyCheck> }) {
  if (!policy.blocked.length && !policy.flagged.length) return null;
  return (
    <div role="status" aria-live="polite" className="space-y-1">
      {policy.blocked.map((f) => <Notice key={f.code} tone="error">{f.message}</Notice>)}
      {policy.flagged.map((f) => <Notice key={f.code} tone="warn">{f.message}</Notice>)}
    </div>
  );
}

function ConsentBlock({ brief, setBrief, refs, setRefs, quick }: { brief: Brief; setBrief: React.Dispatch<React.SetStateAction<Brief>>; refs: MediaCard[]; setRefs: (r: MediaCard[]) => void; quick?: boolean }) {
  const c = brief.consent ?? { attested: false, showsPeople: false, publicFigure: false, at: null, by: null };
  const upd = (patch: Partial<typeof c>) => setBrief((b) => ({ ...b, consent: { ...c, ...patch } }));
  return (
    <div className="space-y-2 rounded-xl border border-border/50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <MediaPicker kind="image" multiple canUpload onPick={(x) => { const picked = x.slice(0, 8); setRefs(picked); setBrief((b) => ({ ...b, referenceIds: picked.map((r) => r._id), consent: picked.length ? (b.consent ?? { attested: false, showsPeople: false, publicFigure: false, at: null, by: null }) : null })); }} trigger={<Button type="button" size="sm" variant="outline"><ImageIcon className="size-3.5" /> {refs.length ? `${refs.length} reference${refs.length === 1 ? "" : "s"}` : quick ? "Add reference photos (optional)" : "Choose reference pictures"}</Button>} />
        {refs.map((r) => <MediaThumb key={r._id} media={r} className="size-10" />)}
      </div>
      {refs.length > 0 && (
        <>
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={c.showsPeople} onChange={(e) => upd({ showsPeople: e.target.checked, attested: e.target.checked ? c.attested : false })} /> These pictures show people</label>
          {c.showsPeople && (
            <>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={c.attested} onChange={(e) => upd({ attested: e.target.checked })} /> Every person shown agreed to appear in AI-made marketing images (a parent or guardian, for a minor). I can show that consent if asked.</label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={c.publicFigure} onChange={(e) => upd({ publicFigure: e.target.checked })} /> One of them is a public figure or celebrity</label>
            </>
          )}
          <p className="text-[11px] text-muted-foreground">Product photos with no people need no consent. Your confirmation is saved with the project and the audit log.</p>
        </>
      )}
    </div>
  );
}

function SafePreview({ src, spec }: { src: string; spec: NonNullable<ReturnType<typeof specByKey>> }) {
  const b = safeBox(spec);
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-border/60 bg-muted" style={{ aspectRatio: `${spec.width} / ${spec.height}`, maxHeight: "28rem" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- private authenticated route */}
      <img src={src} alt="Chosen picture cropped to this size" className="size-full object-cover" />
      <div className="pointer-events-none absolute border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(b.left / spec.width) * 100}%`, top: `${(b.top / spec.height) * 100}%`, width: `${(b.width / spec.width) * 100}%`, height: `${(b.height / spec.height) * 100}%` }} />
    </div>
  );
}
