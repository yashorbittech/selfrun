"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CloudOff, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptionSelect from "@/components/products/playbook-ai/OptionSelect";
import MediaPicker from "@/components/products/viralpulse-ai/MediaPicker";
import GlassCard from "@/components/products/dealflow-ai/GlassCard";
import { CardContent } from "@/components/ui/card";
import { Field, mediaSrc } from "@/components/products/viralpulse-ai/SmmsBits";
import AiField from "@/components/products/viralpulse-ai/shared/AiField";
import type { FieldKey } from "@/lib/products/viralpulse-ai/ai-field/registry";
import UgcStyleGallery from "@/components/products/viralpulse-ai/ugc/UgcStyleGallery";
import UgcCastStep from "@/components/products/viralpulse-ai/ugc/UgcCastStep";
import UgcScriptStep from "@/components/products/viralpulse-ai/ugc/UgcScriptStep";
import UgcReviewStep from "@/components/products/viralpulse-ai/ugc/UgcReviewStep";
import {
  addUgcReferenceAction, approveUgcAction, changeUgcStyleAction, createUgcProjectAction, editUgcPlanAction, generateUgcPlanAction, removeUgcReferenceAction, setUgcCastAction, updateUgcBriefAction,
} from "@/app/(products)/viralpulse-ai/(protected)/ugc/actions";
import { getStyle, listStyles } from "@/lib/products/viralpulse-ai/ugc/styles";
import type { UgcStyle } from "@/lib/products/viralpulse-ai/ugc/styles";
import {
  advance, briefPayload, EMPTY_WIZARD, GOAL_CHOICES, hasContent, LANGUAGE_CHOICES, PLATFORM_CHOICES, restoreDraft, serializeDraft, validateStep, WIZARD_STEPS, wizardFromProject, wizardReducer, titleCase, type WizardStep,
} from "@/lib/products/viralpulse-ai/ugc/ui-helpers";
import type { ProjectView, UgcConnections } from "@/lib/products/viralpulse-ai/ugc/api";
import type { UgcSettings } from "@/lib/products/viralpulse-ai/ugc/store";
import type { MediaCard } from "@/lib/products/viralpulse-ai/media";
import type { ScenePlan, UgcOptions } from "@/lib/products/viralpulse-ai/ugc/types";
import { cn } from "@/lib/utils";

const INDUSTRIES = [...new Set((listStyles() as UgcStyle[]).flatMap((s) => s.industries))].filter((i) => i !== "any").sort();
const DRAFT_KEY = "ugc-wizard-draft";
const metaKey = (id: string) => `ugc-meta:${id}`;
const newSeed = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

type SaveState = "idle" | "saving" | "saved" | "local" | "error";

export interface WizardProps {
  initialProject: ProjectView | null;
  settings: UgcSettings;
  spentTodayUsd: number;
  connections: UgcConnections;
  canApprove: boolean;
  canUpload: boolean;
  canIntegrations: boolean;
}

export default function UgcWizard({ initialProject, settings, spentTodayUsd, connections, canApprove, canUpload, canIntegrations }: WizardProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectView | null>(initialProject);
  const [state, dispatch] = useReducer(wizardReducer, initialProject, (p) => (p ? wizardFromProject(p) : EMPTY_WIZARD));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, setSave] = useState<SaveState>(initialProject ? "saved" : "idle");
  const [saveMsg, setSaveMsg] = useState("");
  const [busy, setBusy] = useState<null | "next" | "generate" | "save" | "approve" | "refs" | "options">(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [scriptDirty, setScriptDirty] = useState(false);
  const [rewriting, setRewriting] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [restore, setRestore] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastSaved = useRef<string>("");
  const inFlight = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(false);

  const style = useMemo(() => (state.styleId ? ((getStyle(state.styleId) as UgcStyle | undefined) ?? null) : null), [state.styleId]);
  const editable = !project || ["draft", "scripted", "failed", "cancelled", "ready"].includes(project.status);
  const snapshot = useMemo(() => JSON.stringify({ b: briefPayload(state), c: state.cast, s: state.styleId }), [state]);
  const caps = project?.capabilities;

  // Restore this person's own saved view of a project (platform/goal/industry are not stored on the server) or offer an unsaved new draft.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    try {
      if (initialProject) {
        const raw = localStorage.getItem(metaKey(initialProject.id));
        if (raw) dispatch({ type: "set", patch: JSON.parse(raw) as Partial<typeof state> });
        lastSaved.current = JSON.stringify({ b: briefPayload(wizardFromProject(initialProject)), c: initialProject.cast, s: initialProject.styleId });
      } else {
        const d = restoreDraft(localStorage.getItem(DRAFT_KEY));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
        if (d && hasContent(d)) setRestore(localStorage.getItem(DRAFT_KEY));
      }
    } catch {
      /* storage unavailable: autosave to the server only */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [state.step]);

  // Persist the bits the server doesn't keep, and the whole draft before a project exists.
  useEffect(() => {
    if (!mounted.current) return;
    const t = setTimeout(() => {
      try {
        if (project) localStorage.setItem(metaKey(project.id), JSON.stringify({ platform: state.platform, goal: state.goal, industry: state.industry, imageIds: state.imageIds }));
        else if (hasContent(state)) {
          localStorage.setItem(DRAFT_KEY, serializeDraft(state));
          setSave("local");
        }
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [state, project]);

  const applyProject = useCallback((p: ProjectView) => {
    setProject(p);
    return p;
  }, []);

  /** Writes the brief, style and cast to the project (creating it once a style is chosen). Serialised, so two saves never race. */
  const persist = useCallback(
    async (opts: { create?: boolean } = {}): Promise<boolean> => {
      if (inFlight.current) await inFlight.current.catch(() => false);
      const run = async (): Promise<boolean> => {
        if (!editable) return false;
        const step1 = validateStep(state, 1);
        if (Object.keys(step1).length) {
          setSave(project ? "error" : "local");
          setSaveMsg(project ? "Finish the brief to keep saving." : "");
          return !opts.create;
        }
        if (!project && !opts.create) return true;
        if (snapshot === lastSaved.current && project) return true;
        setSave("saving");
        const payload = briefPayload(state);
        let p = project;
        if (!p) {
          if (!state.styleId) return true;
          const r = await createUgcProjectAction({ title: payload.title, styleId: state.styleId, brief: payload.brief, options: payload.options as Partial<UgcOptions> });
          if (!r.ok) { setSave("error"); setSaveMsg(r.error); toast.error(r.error); return false; }
          p = applyProject(r.project);
          try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
          window.history.replaceState(null, "", `/viralpulse-ai/ugc/${p.id}/edit`);
        } else {
          if (p.styleId !== state.styleId && state.styleId) {
            const r = await changeUgcStyleAction(p.id, state.styleId);
            if (!r.ok) { setSave("error"); setSaveMsg(r.error); toast.error(r.error); return false; }
            p = applyProject(r.project);
          }
          const r = await updateUgcBriefAction(p.id, payload);
          if (!r.ok) { setSave("error"); setSaveMsg(r.error); if (opts.create) toast.error(r.error); return false; }
          p = applyProject(r.project);
        }
        if (state.cast && JSON.stringify({ ...state.cast, seed: "" }) !== JSON.stringify({ ...(p.cast ?? {}), seed: "" })) {
          const r = await setUgcCastAction(p.id, state.cast);
          if (!r.ok) { setSave("error"); setSaveMsg(r.error); toast.error(r.error); return false; }
          applyProject(r.project);
        }
        lastSaved.current = snapshot;
        setSave("saved");
        setSaveMsg("");
        return true;
      };
      const pr = run();
      inFlight.current = pr;
      try {
        return await pr;
      } finally {
        if (inFlight.current === pr) inFlight.current = null;
      }
    },
    [editable, project, snapshot, state, applyProject],
  );

  // Autosave to the project on steps 1 and 3 (and style changes) a moment after the last edit.
  useEffect(() => {
    if (!project || !editable || state.step > 3 || busy) return;
    if (snapshot === lastSaved.current) return;
    const t = setTimeout(() => { void persist(); }, 1500);
    return () => clearTimeout(t);
  }, [snapshot, project, editable, state.step, busy, persist]);

  // Elapsed seconds while the script is being written.
  useEffect(() => {
    if (busy !== "generate") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const scriptReady = !!project?.plan && project.status === "scripted" && !scriptDirty;
  const pendingImages = state.imageIds.filter((id) => !project?.references.some((r) => r.mediaId === id));

  async function goTo(to: WizardStep) {
    if (busy) return;
    if (to <= state.step) {
      setErrors({});
      dispatch({ type: "set", patch: { step: to } });
      return;
    }
    const r = advance(state, to, scriptReady);
    if (r.blocked) {
      const all = validateStep(state, state.step, scriptReady);
      setErrors(all);
      if (state.step === 4 && scriptDirty) toast.error("Save or discard your script edits first.");
      else toast.error(r.blocked);
      return;
    }
    if (state.step === 3 && pendingImages.length && !project?.references.length) {
      toast.error("Attach the photos you chose (with consent) or remove them before continuing.");
      return;
    }
    setErrors({});
    setBusy("next");
    const ok = state.step >= 2 ? await persist({ create: state.step === 2 }) : await persist();
    setBusy(null);
    if (!ok) return;
    dispatch({ type: "set", patch: { step: to, reached: Math.max(state.reached, to) as WizardStep } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onGenerate(instruction?: string, scene?: number) {
    if (!project) return;
    if (!(await persist())) return;
    setElapsed(0);
    setBusy("generate");
    setRewriting(scene ?? null);
    setScriptError(null);
    const r = await generateUgcPlanAction(project.id, instruction);
    setBusy(null);
    setRewriting(null);
    if (!r.ok) { setScriptError(r.error); return; }
    applyProject(r.project);
    toast.success(instruction ? `Script updated (version ${r.project.planVersion}).` : "Script written. Read it through and edit anything you like.");
  }

  async function onSavePlan(plan: ScenePlan): Promise<boolean> {
    if (!project) return false;
    setBusy("save");
    setScriptError(null);
    const r = await editUgcPlanAction(project.id, plan);
    setBusy(null);
    if (!r.ok) { setScriptError(r.error); return false; }
    applyProject(r.project);
    toast.success("Script saved.");
    return true;
  }

  async function onAttach(ids: string[]): Promise<boolean> {
    if (!project) return false;
    setBusy("refs");
    let p = project;
    let all = true;
    for (const id of ids) {
      const r = await addUgcReferenceAction(p.id, id, { hasConsent: true, notPublicFigureOrMinor: true });
      if (!r.ok) { toast.error(r.error); all = false; break; }
      p = r.project;
    }
    applyProject(p);
    setBusy(null);
    if (all) toast.success(ids.length > 1 ? "Photos attached with your consent recorded." : "Photo attached with your consent recorded.");
    return all;
  }

  async function onRemoveRef(mediaId: string) {
    if (!project) return;
    setBusy("refs");
    const r = await removeUgcReferenceAction(project.id, mediaId);
    setBusy(null);
    if (!r.ok) { toast.error(r.error); return; }
    applyProject(r.project);
    dispatch({ type: "set", patch: { imageIds: state.imageIds.filter((x) => x !== mediaId) } });
  }

  async function onOptions(patch: Partial<Pick<UgcOptions, "burnCaptions" | "aiLabel">>) {
    if (!project) return;
    setBusy("options");
    const r = await updateUgcBriefAction(project.id, { options: patch });
    setBusy(null);
    if (!r.ok) { toast.error(r.error); return; }
    applyProject(r.project);
    dispatch({ type: "set", patch: { aiLabelOn: r.project.options.aiLabel.enabled, aiLabelPos: r.project.options.aiLabel.position, burnCaptions: r.project.options.burnCaptions } });
  }

  async function onApprove(acknowledge: string[]) {
    if (!project) return;
    setBusy("approve");
    const r = await approveUgcAction(project.id, acknowledge);
    setBusy(null);
    if (!r.ok) { toast.error(r.error); return; }
    applyProject(r.project);
    if (r.outcome === "started") {
      toast.success("Approved. Your video is being generated.");
      router.push(`/viralpulse-ai/ugc/${project.id}`);
    } else {
      toast.info(`A manager was asked to approve about $${(r.estimateUsd ?? 0).toFixed(2)}.`);
    }
  }

  const set = (patch: Partial<typeof state>) => dispatch({ type: "set", patch });
  // Step 1 AI buttons read the whole brief; the server keeps only what each field may read (offer fields only tidy what you typed).
  const ai = (fieldKey: FieldKey) => ({
    fieldKey,
    aiDisabled: !editable,
    getContext: () => ({ name: state.name, title: state.title, description: state.description, keyPoints: state.keyPointsText.split("\n").map((x) => x.trim()).filter(Boolean), offer: state.offerDetails, validUntil: state.offerValidity, coupon: state.offerCode, terms: state.offerTerms, audience: state.audience, callToAction: state.callToAction, industry: state.industry, goal: state.goal, platform: state.platform, language: state.language, targetSecs: state.targetSecs }) as Record<string, unknown>,
  });
  const err = (k: string) => errors[k];
  const stepDef = WIZARD_STEPS[state.step - 1];
  const blockedReason = !project?.plan ? "Write the script first." : scriptDirty ? "Save your script edits first." : project.status !== "scripted" ? "The script is out of date: write a new version." : null;
  const referencesBlocked = !project ? "Photos can be attached on this step once your style is saved." : caps && caps.maxReferenceImages === 0 ? "The selected video model can't use reference photos." : !editable ? "Cancel the video first to change its photos." : null;

  return (
    <div className="space-y-4 rounded-[1.75rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-1.5 sm:p-2">
      {restore && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex-1">You have an unfinished brief saved in this browser.</span>
          <Button type="button" size="sm" onClick={() => { const d = restoreDraft(restore); if (d) dispatch({ type: "load", state: { ...d, step: Math.min(d.step, 2) as WizardStep, reached: Math.min(d.reached, 2) as WizardStep } }); setRestore(null); }}>Restore it</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } setRestore(null); }}>Start fresh</Button>
        </div>
      )}

      <nav aria-label="Progress" className="rounded-2xl border border-primary/15 bg-background/90 p-3 shadow-sm backdrop-blur-xl dark:bg-[#080711]/95">
        <ol className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {WIZARD_STEPS.map((s, i) => {
            const done = s.n < state.step || (s.n <= state.reached && s.n !== state.step && s.n < state.step);
            const current = s.n === state.step;
            const clickable = s.n <= state.step && !busy;
            return (
              <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  type="button"
                  disabled={!clickable}
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(s.n as WizardStep)}
                  className={cn("flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3", current ? "bg-primary/10 dark:bg-violet-500/15" : clickable ? "hover:bg-muted/60" : "opacity-60")}
                >
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", current ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
                    {done ? <Check className="size-3.5" /> : s.n}
                  </span>
                  <span className={cn("truncate text-xs font-semibold sm:text-sm", current ? "text-primary" : "text-muted-foreground", !current && "max-sm:hidden")}>{s.label}</span>
                </button>
                {i < WIZARD_STEPS.length - 1 && <span aria-hidden className="h-px min-w-3 flex-1 bg-border dark:bg-white/15" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <GlassCard interactive={false} className="border-primary/15 bg-background/95 shadow-xl dark:bg-[#080711]/95">
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none">{`${state.step}. ${stepDef.label}`}</h2>
              <p className="text-xs text-muted-foreground">
                {state.step === 1 && "Tell us what the video is about. The video can only mention what you write here."}
                {state.step === 2 && "Pick the kind of video. You can look at the details of any style before choosing."}
                {state.step === 3 && "Choose who appears, where, and how it is filmed."}
                {state.step === 4 && "Read and edit the script, scene by scene."}
                {state.step === 5 && "Check the cost and labelling, then approve."}
              </p>
            </div>
            <p className={cn("flex items-center gap-1.5 text-[11px]", save === "error" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")} role="status" aria-live="polite">
              {save === "saving" && <><Loader2 className="size-3 animate-spin" /> Saving…</>}
              {save === "saved" && <><Check className="size-3 text-emerald-600" /> Saved as draft</>}
              {save === "local" && <><CloudOff className="size-3" /> Kept in this browser until you choose a style</>}
              {save === "error" && <>{`Not saved${saveMsg ? `: ${saveMsg}` : ""}`}</>}
            </p>
          </div>

          {!editable && project && (
            <p className="rounded-xl bg-muted/60 p-3 text-xs">This video is {project.status}, so it can&apos;t be edited here. <Link href={`/viralpulse-ai/ugc/${project.id}`} className="font-semibold text-primary underline">Open it</Link>.</p>
          )}

          {state.step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); void goTo(2); }} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <AiField {...ai("ugc.name")} label="Product or business name" id="ugc-name" hint={err("name")} value={state.name} maxLength={120} onChange={(x) => set({ name: String(x) })} />
                <AiField {...ai("ugc.title")} label="Video name (optional)" id="ugc-title" hint="Only for finding it later. Defaults to the product name." value={state.title} maxLength={120} onChange={(x) => set({ title: String(x) })} />
                <AiField {...ai("ugc.description")} label="What it is" id="ugc-desc" as="textarea" rows={3} className="sm:col-span-2" hint={err("description") ?? "One or two sentences on what it is and who it is for."} value={state.description} maxLength={1500} onChange={(x) => set({ description: String(x) })} />
                <AiField {...ai("ugc.keyPoints")} label="Key points the video may state (one per line)" id="ugc-kp" as="textarea" rows={5} className="sm:col-span-2" hint={err("keyPoints") ?? "Only these facts will be used. If you don't write a price, offer, number or claim here, the video won't say one. Up to 10 lines. The AI button only tidies what you wrote."} value={state.keyPointsText} onChange={(x) => set({ keyPointsText: Array.isArray(x) ? x.join("\n") : String(x) })} placeholder={"Free delivery on orders above the amount you set\nMade in small batches"} />
                <fieldset className="grid gap-3 rounded-xl border border-border/40 p-3 sm:col-span-2 sm:grid-cols-2">
                  <legend className="px-1 text-xs font-semibold">Offer details (only for offer styles)</legend>
                  <p className="text-[11px] text-muted-foreground sm:col-span-2">Offer styles show exactly what you write here, word for word, and nothing else. Without offer details they cannot be used. No countdown or &ldquo;last few&rdquo; appears unless you give a real end date or say stock is limited.</p>
                  <AiField {...ai("ugc.offer")} label="The offer" id="ugc-offer" as="textarea" rows={2} className="sm:col-span-2" value={state.offerDetails} maxLength={400} onChange={(x) => set({ offerDetails: String(x) })} />
                  <AiField {...ai("ugc.validUntil")} label="Valid until or dates" id="ugc-offer-valid" value={state.offerValidity} maxLength={160} onChange={(x) => set({ offerValidity: String(x) })} />
                  <AiField {...ai("ugc.coupon")} label="Coupon code (optional)" id="ugc-offer-code" value={state.offerCode} maxLength={40} onChange={(x) => set({ offerCode: String(x) })} />
                  <AiField {...ai("ugc.terms")} label="Terms (optional)" id="ugc-offer-terms" as="textarea" rows={2} className="sm:col-span-2" hint="If you add terms, the video shows a Terms apply line." value={state.offerTerms} maxLength={400} onChange={(x) => set({ offerTerms: String(x) })} />
                  <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={state.offerStockLimited} onChange={(e) => set({ offerStockLimited: e.target.checked })} /> Stock or places are really limited (allows a &ldquo;last few&rdquo; style)</label>
                </fieldset>
                <AiField {...ai("ugc.audience")} label="Audience (optional)" id="ugc-aud" value={state.audience} maxLength={300} onChange={(x) => set({ audience: String(x) })} />
                <AiField {...ai("ugc.callToAction")} label="Call to action (optional)" id="ugc-cta" hint="What should viewers do? Without one, the video ends with a soft, claim-free invitation." value={state.callToAction} maxLength={200} onChange={(x) => set({ callToAction: String(x) })} />
                <AiField {...ai("ugc.industry")} label="Industry" id="ugc-ind" as="custom" hint="Helps suggest styles. Pick one or type your own." value={state.industry} onChange={(x) => set({ industry: String(x).slice(0, 60) })}><Input id="ugc-ind" list="ugc-industries" value={state.industry} maxLength={60} onChange={(e) => set({ industry: e.target.value })} /><datalist id="ugc-industries">{INDUSTRIES.map((i) => <option key={i} value={i}>{titleCase(i)}</option>)}</datalist></AiField>
                <AiField {...ai("ugc.goal")} label="Goal" as="custom" enumOptions={GOAL_CHOICES.map((g) => g.value)} value={state.goal} onChange={(x) => set({ goal: String(x) })}><OptionSelect value={state.goal} onChange={(v) => set({ goal: v })} options={GOAL_CHOICES.map((g) => ({ value: g.value, label: g.label }))} aria-label="Goal" /></AiField>
                <AiField {...ai("ugc.platform")} label="Where will it be posted?" as="custom" enumOptions={PLATFORM_CHOICES.map((g) => g.value)} value={state.platform} onChange={(x) => set({ platform: String(x) })}><OptionSelect value={state.platform} onChange={(v) => set({ platform: v })} options={PLATFORM_CHOICES.map((g) => ({ value: g.value, label: g.label }))} aria-label="Platform" /></AiField>
                <AiField {...ai("ugc.language")} label="Language people speak" as="custom" hint={err("language")} enumOptions={LANGUAGE_CHOICES.map((g) => g.value)} value={state.language} onChange={(x) => set({ language: String(x) })}><OptionSelect value={state.language} onChange={(v) => set({ language: v })} options={LANGUAGE_CHOICES.map((g) => ({ value: g.value, label: g.label }))} aria-label="Language" /></AiField>
                <Field label={`Length: about ${state.targetSecs} seconds`} htmlFor="ugc-len" className="sm:col-span-2" hint={err("targetSecs") ?? "The style you pick sets the allowed range; the length is adjusted to fit."}>
                  <input id="ugc-len" type="range" min={15} max={60} step={1} value={state.targetSecs} onChange={(e) => set({ targetSecs: Number(e.target.value) })} className="w-full accent-[var(--primary)]" aria-valuetext={`${state.targetSecs} seconds`} />
                </Field>
              </div>

              <div className="space-y-2 rounded-2xl border border-border/40 bg-background/50 p-3">
                <p className="text-sm font-semibold">Product images (optional)</p>
                <p className="text-xs text-muted-foreground">Pick images from the media library to guide how things look. You&apos;ll confirm you have the right to use them in the Cast step. They aren&apos;t shown as-is: the AI uses them as a reference.</p>
                {state.imageIds.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {state.imageIds.map((id) => (
                      <li key={id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated private media route */}
                        <img src={mediaSrc(id)} alt="Chosen product image" className="size-16 rounded-lg object-cover" loading="lazy" />
                        <button type="button" aria-label="Remove this image" onClick={() => set({ imageIds: state.imageIds.filter((x) => x !== id) })} className="absolute -top-1.5 -right-1.5 rounded-full bg-background p-0.5 shadow ring-1 ring-border"><Trash2 className="size-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <MediaPicker kind="image" multiple canUpload={canUpload} onPick={(items: MediaCard[]) => set({ imageIds: [...new Set([...state.imageIds, ...items.filter((m) => m.source === "upload").map((m) => m._id)])].slice(0, 3) })} trigger={<Button type="button" variant="outline" size="sm" disabled={state.imageIds.length >= 3}><ImagePlus className="size-3.5" /> {state.imageIds.length >= 3 ? "3 images chosen" : "Choose images"}</Button>} />
              </div>
              <button type="submit" className="sr-only">Continue to style</button>
            </form>
          )}

          {state.step === 2 && (
            <UgcStyleGallery
              value={state.styleId}
              onPick={(s) => { dispatch({ type: "selectStyle", style: s, seed: newSeed() }); setErrors({}); toast.success(`${s.label} selected`); }}
              industry={state.industry}
              goal={state.goal}
              platform={state.platform}
              language={state.language}
              brandName={state.name}
              error={err("styleId")}
            />
          )}

          {state.step === 3 && style && (
            <UgcCastStep
              state={state}
              dispatch={dispatch}
              style={style}
              newSeed={newSeed}
              references={project?.references ?? []}
              maxReferences={caps?.maxReferenceImages ?? 0}
              referencesBlocked={referencesBlocked}
              attaching={busy === "refs"}
              canUpload={canUpload}
              onAttach={onAttach}
              onRemoveRef={onRemoveRef}
              onPickImages={(ids) => set({ imageIds: ids })}
              error={err("cast")}
            />
          )}

          {state.step === 4 && project && (
            <UgcScriptStep
              project={project}
              style={style}
              scriptsConnected={connections.scripts}
              canManageIntegrations={canIntegrations}
              canEdit={editable}
              busy={busy === "generate" ? "generate" : busy === "save" ? "save" : null}
              rewritingScene={rewriting}
              elapsed={elapsed}
              serverError={scriptError}
              onGenerate={onGenerate}
              onSave={onSavePlan}
              onDirty={setScriptDirty}
              onBackToCast={() => void goTo(3)}
            />
          )}

          {state.step === 5 && project && (
            <UgcReviewStep
              project={project}
              style={style}
              settings={settings}
              spentTodayUsd={spentTodayUsd}
              videoConnected={connections.video}
              canManageIntegrations={canIntegrations}
              canApprove={canApprove}
              platform={state.platform}
              busy={busy === "approve" || busy === "options"}
              onOptions={onOptions}
              onApprove={onApprove}
              blockedReason={blockedReason}
            />
          )}
          {err("script") && <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">{err("script")}</p>}
        </CardContent>
      </GlassCard>

      <div className="sticky bottom-0 z-20 -mx-1 flex items-center justify-between gap-2 rounded-2xl border border-primary/15 bg-background/95 p-3 shadow-xl backdrop-blur-xl dark:bg-[#080711]/95">
        <Button type="button" variant="outline" disabled={state.step === 1 || !!busy} onClick={() => goTo((state.step - 1) as WizardStep)}><ArrowLeft className="size-4" /> Back</Button>
        <div className="flex items-center gap-2">
          {project && <Button type="button" variant="ghost" disabled={!!busy} onClick={async () => { if (await persist()) router.push(`/viralpulse-ai/ugc/${project.id}`); }}><Save className="size-4" /> <span className="max-sm:hidden">Save and close</span><span className="sm:hidden">Close</span></Button>}
          {state.step < 5 && (
            <Button type="button" disabled={!!busy || !editable} onClick={() => goTo((state.step + 1) as WizardStep)}>
              {busy === "next" ? <Loader2 className="size-4 animate-spin" /> : null}
              {state.step === 4 ? "Review and estimate" : "Next"} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
