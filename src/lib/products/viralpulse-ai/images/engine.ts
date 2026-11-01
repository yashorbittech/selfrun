import "server-only";
import { newId, updateStamp, str, strList } from "@/lib/products/viralpulse-ai/db";
import { SmmsInputError, NotFoundError } from "@/lib/products/viralpulse-ai/viewer";
import { GOALS, goalById, geminiRatioFor, openAiSizeFor, specByKey, type GoalDef } from "@/lib/products/viralpulse-ai/images/specs";
import { checkOverlayText, policyCheck, type ImagePolicyResult } from "@/lib/products/viralpulse-ai/images/policy";
import { estimateJob, geminiImageCost, openAiImageCost, GEMINI_TOKENS_PER_IMAGE } from "@/lib/products/viralpulse-ai/images/pricing";
import { evaluateRequest, type ImageSettings } from "@/lib/products/viralpulse-ai/images/limits";
import { ImageProviderError, type ImageProvider, type ImageRequest, type RefImage } from "@/lib/products/viralpulse-ai/images/providers/types";
import { composeExport, toPng } from "@/lib/products/viralpulse-ai/images/compose";
import { getProject, insertProject, jobsCollection, projectsCollection, recentImagesByUser, spentToday, type ProjectDoc } from "@/lib/products/viralpulse-ai/images/store";
import type { BrandKit, Brief, Consent, ExportRecord, Variant } from "@/lib/products/viralpulse-ai/images/types";
import type { AiMediaMeta, MediaDoc, StudioMeta } from "@/lib/products/viralpulse-ai/media";
import { isImageQuality, type ImageQuality } from "@/lib/products/viralpulse-ai/models";

/**
 * The Image Studio engine: brief -> policy -> limits and approval -> provider -> variants -> edits -> finished exports in the library.
 * Everything that touches the outside world (providers, blob storage, the media library, audit, notifications, the clock) comes in
 * through `ImageDeps`, so the tests run the whole flow with a fake provider and no network.
 */

export interface Actor {
  userId: string;
  email: string | null;
  canApprove: boolean;
}

export interface ResolvedProvider {
  provider: ImageProvider;
  model: string;
  note?: string | null;
  /** Records the call in the company's AI usage history when the provider's client does not already (Gemini). */
  meter?: (info: { model: string; images: number; usage: unknown }) => Promise<void>;
}

export interface ImageDeps {
  now(): Date;
  settings(): Promise<ImageSettings>;
  /** OpenAI price overrides and flat fallback from the text/image AI settings. */
  openAiPricing(): Promise<{ overrides: unknown; flatUsd: number }>;
  resolveProvider(id: "openai" | "gemini", settings: ImageSettings): Promise<ResolvedProvider>;
  putBlob(key: string, data: Buffer, contentType: string): Promise<string>;
  getBlob(key: string): Promise<Buffer | null>;
  /** A library image's bytes and type (reference photos, the logo), or null. */
  readMedia(mediaId: string): Promise<{ data: Buffer; mimeType: string; name: string } | null>;
  saveExport(buf: Buffer, meta: { name: string; prompt: string; platform: string | null; width: number; height: number; contentType: "image/png" | "image/jpeg"; tags: string[]; folder: string | null; altText?: string; ai: AiMediaMeta; studio: StudioMeta }, actorId: string): Promise<{ _id: string }>;
  audit(e: { actorId: string; actorEmail: string | null; action: string; entityId: string; entityLabel: string | null; summary: string; metadata?: Record<string, unknown> }): Promise<void>;
  notify(userIds: string[], n: { title: string; body: string; link: string }): Promise<void>;
  managerIds(): Promise<string[]>;
  kit(): Promise<BrandKit>;
  storagePrefix(): Promise<string>;
}

// ── brief normalisation ─────────────────────────────────────────────────────

export function cleanBrief(input: Partial<Brief> & Record<string, unknown>, settings: ImageSettings, cur?: Brief): Brief {
  const goal = goalById(String(input.goalId ?? cur?.goalId ?? ""));
  if (!goal) throw new SmmsInputError("Choose what the picture is for.");
  const goalChanged = cur && cur.goalId !== goal.id;
  const wantedKeys = Array.isArray(input.specKeys) ? (input.specKeys as unknown[]).filter((k): k is string => typeof k === "string" && !!specByKey(k)) : goalChanged || !cur ? goal.specKeys : cur.specKeys;
  const specKeys = [...new Set(wantedKeys)].slice(0, 8);
  if (specKeys.length === 0) throw new SmmsInputError("Choose at least one output size.");
  const overlayRaw = Array.isArray(input.overlayText) ? input.overlayText : cur?.overlayText ?? [];
  const slides = goal.slides;
  const overlayText = overlayRaw.map((t) => str(t, 160).replace(/\r/g, ""));
  for (const t of overlayText) {
    const c = checkOverlayText(t);
    if (!c.ok) throw new SmmsInputError(c.message ?? "That text can't go on the picture.");
  }
  if (slides) {
    if (overlayText.length < slides.min) while (overlayText.length < slides.min) overlayText.push("");
    overlayText.length = Math.min(overlayText.length, slides.max);
  } else overlayText.length = Math.min(overlayText.length, 1);
  const variants = slides ? overlayText.length : Math.round(Math.min(Math.max(Number(input.variants ?? cur?.variants ?? 2) || 1, 1), Math.min(settings.maxVariants, 4)));
  const consentIn = (input.consent ?? cur?.consent ?? null) as Partial<Consent> | null;
  const q = input.quality ?? cur?.quality ?? settings.defaultQuality;
  const referenceIds = strList(input.referenceIds ?? cur?.referenceIds ?? [], 8, 64);
  const consent: Consent | null = consentIn ? { attested: !!consentIn.attested, showsPeople: !!consentIn.showsPeople, publicFigure: !!consentIn.publicFigure, at: consentIn.at ?? null, by: consentIn.by ?? null } : null;
  return {
    goalId: goal.id,
    name: str(input.name ?? cur?.name, 160),
    subject: str(input.subject ?? cur?.subject, 1200),
    product: str(input.product ?? cur?.product, 400),
    style: str(input.style ?? cur?.style, 400),
    colours: str(input.colours ?? cur?.colours, 200),
    overlayText,
    textPosition: input.textPosition === "top" || input.textPosition === "middle" || input.textPosition === "bottom" ? input.textPosition : cur?.textPosition ?? (goal.id === "quote_card" ? "middle" : "bottom"),
    language: str(input.language ?? cur?.language, 40) || "English",
    negative: str(input.negative ?? cur?.negative, 400),
    specKeys,
    variants,
    quality: isImageQuality(q) ? (q as ImageQuality) : settings.defaultQuality,
    provider: input.provider === "gemini" ? "gemini" : input.provider === "openai" ? "openai" : cur?.provider ?? settings.defaultProvider,
    applyKit: input.applyKit === undefined ? (cur?.applyKit ?? true) : !!input.applyKit,
    referenceIds,
    consent,
  };
}

export function policyInput(b: Brief, extra: { instruction?: string; prompt?: string } = {}) {
  return { subject: b.subject, product: b.product, style: b.style, negative: b.negative, overlayText: b.overlayText, goalId: b.goalId, hasReferenceImages: b.referenceIds.length > 0, consent: b.consent, ...extra };
}

/** The prompt sent to the model. It never contains the overlay words: those are drawn by the app. */
export function buildPrompt(b: Brief, kit: BrandKit | null, goal: GoalDef, slide: number | null, instruction?: string): string {
  const lines: string[] = [];
  lines.push(`Create ${goal.promptRole}${slide !== null && goal.slides ? ` (slide ${slide + 1} of ${b.overlayText.length}; keep the same look across slides)` : ""}.`);
  if (b.subject) lines.push(`Subject: ${b.subject}`);
  if (b.product) lines.push(`Product or service: ${b.product}`);
  if (b.style) lines.push(`Style and mood: ${b.style}`);
  const colours = [b.colours, b.applyKit && kit ? [kit.colours.primary, kit.colours.secondary, kit.colours.accent].filter(Boolean).join(", ") : ""].filter(Boolean).join("; ");
  if (colours) lines.push(`Colour palette: ${colours}`);
  if (b.applyKit && kit) {
    if (kit.voice) lines.push(`Brand personality: ${kit.voice}`);
    if (kit.dos.length) lines.push(`Always: ${kit.dos.join("; ")}`);
    const avoid = [...kit.donts, b.negative].filter(Boolean);
    if (avoid.length) lines.push(`Never: ${avoid.join("; ")}`);
  } else if (b.negative) lines.push(`Avoid: ${b.negative}`);
  const space = b.textPosition === "top" ? "top" : b.textPosition === "middle" ? "middle" : "bottom";
  lines.push(b.overlayText.some(Boolean) ? `Leave calm, uncluttered space in the ${space} third for text that is added afterwards. Keep the main subject away from that area.` : "Compose the main subject so that a centred crop still works.");
  lines.push("Do not draw any text, letters, numbers, captions, logos, watermarks or UI. Use only fictional people. No real person, celebrity or brand may appear.");
  if (b.referenceIds.length) lines.push("Use the reference pictures for the product or setting they show; do not alter any person's face or body.");
  if (instruction) lines.push(`Change requested: ${instruction}. Keep everything else the same.`);
  return lines.join("\n");
}

// ── pieces ──────────────────────────────────────────────────────────────────

const imageCountFor = (b: Brief) => b.variants;
const unitSize = (b: Brief) => ({ openAiSize: openAiSizeFor(b.specKeys.map((k) => specByKey(k)!).filter(Boolean)), geminiRatio: geminiRatioFor(b.specKeys.map((k) => specByKey(k)!).filter(Boolean)) });

export class NeedsAckError extends Error {
  constructor(public flags: { code: string; message: string }[]) {
    super("needs acknowledgement");
  }
}

async function loadRefs(d: ImageDeps, ids: string[]): Promise<RefImage[]> {
  const out: RefImage[] = [];
  for (const id of ids) {
    const m = await d.readMedia(id);
    if (!m) throw new SmmsInputError("A reference picture is missing from the library. Choose another.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(m.mimeType)) throw new SmmsInputError("Reference pictures must be JPG, PNG or WebP.");
    out.push({ data: m.data, mimeType: m.mimeType as RefImage["mimeType"] });
  }
  return out;
}

function toUserError(err: unknown): never {
  if (err instanceof ImageProviderError) throw new SmmsInputError(err.message);
  throw err;
}

export type Outcome<T> = { outcome: "done"; project: T } | { outcome: "needs_manager"; estimateUsd: number; thresholdUsd: number; project: T } | { outcome: "needs_ack"; flags: { code: string; message: string }[] };

// ── engine ──────────────────────────────────────────────────────────────────

export function createEngine(d: ImageDeps) {
  async function must(id: string): Promise<ProjectDoc> {
    const p = await getProject(id);
    if (!p) throw new NotFoundError();
    return p;
  }

  async function createProject(actor: Actor, input: Record<string, unknown>) {
    const settings = await d.settings();
    const brief = cleanBrief(input, settings);
    const p = await insertProject(brief, actor.userId);
    await d.audit({ actorId: actor.userId, actorEmail: actor.email, action: "create", entityId: p._id, entityLabel: brief.name || goalById(brief.goalId)?.label || "Image project", summary: "Started an Image Studio project" });
    return p;
  }

  async function updateBrief(actor: Actor, id: string, input: Record<string, unknown>) {
    const p = await must(id);
    if (p.status === "generating") throw new SmmsInputError("Wait for the current generation to finish.");
    const brief = cleanBrief(input, await d.settings(), p.brief);
    await (await projectsCollection()).updateOne({ _id: id }, { $set: { brief, ...(p.status === "finished" ? { status: "ready" } : {}), pendingApproval: null, ...updateStamp(actor.userId) } });
    return must(id);
  }

  /** Policy for the current brief (plus an optional edit instruction). Safe to call from the UI as the person types. */
  function check(b: Brief, extra: { instruction?: string } = {}): ImagePolicyResult {
    return policyCheck(policyInput(b, extra));
  }

  async function gate(actor: Actor, p: ProjectDoc, settings: ImageSettings, images: number, estimateUsd: number, ack: string[], extra: { instruction?: string }): Promise<{ needsApproval: boolean }> {
    const policy = policyCheck(policyInput(p.brief, extra));
    if (!policy.ok) throw new SmmsInputError(`This can't be generated: ${policy.blocked.map((f) => f.message).join(" ")}`);
    const open = policy.flagged.filter((f) => !ack.includes(f.code));
    if (open.length) throw new NeedsAckError(open.map((f) => ({ code: f.code, message: f.message })));
    const now = d.now();
    const dec = evaluateRequest({ settings, images, estimateUsd, recentImagesByUser: await recentImagesByUser(actor.userId, now), spentTodayUsd: await spentToday(now), canApprove: actor.canApprove });
    if (!dec.ok) throw new SmmsInputError(dec.message);
    return { needsApproval: dec.needsApproval };
  }

  async function estimate(b: Brief, settings: ImageSettings, images: number) {
    const price = await d.openAiPricing();
    const model = b.provider === "gemini" ? settings.geminiModel : (await d.resolveProvider("openai", settings)).model;
    return { ...estimateJob({ provider: b.provider, model, quality: b.quality, openAiSize: unitSize(b).openAiSize, images, openAiOverrides: price.overrides as never, geminiOverrides: settings.geminiPrices, flatUsd: price.flatUsd }), model };
  }

  /** Runs one provider call and books its cost. `references` present => edit. */
  async function runCall(actor: Actor, p: ProjectDoc, settings: ImageSettings, opts: { prompt: string; n: number; references?: RefImage[]; est: { totalUsd: number }; parent?: Variant; instruction?: string; slides?: (number | null)[] }): Promise<Variant[]> {
    const b = p.brief;
    const rp = await d.resolveProvider(b.provider, settings);
    const jobs = await jobsCollection();
    const jobId = newId();
    await jobs.insertOne({ _id: jobId, userId: actor.userId, projectId: p._id, images: opts.n, estimateUsd: opts.est.totalUsd, costUsd: opts.est.totalUsd, status: "running", provider: b.provider, model: rp.model, at: d.now() });
    await (await projectsCollection()).updateOne({ _id: p._id }, { $set: { status: "generating", error: null, ...updateStamp(actor.userId) } });
    const sizes = unitSize(b);
    const req: ImageRequest = { prompt: opts.prompt, n: opts.n, model: rp.model, quality: b.quality, openAiSize: sizes.openAiSize, geminiRatio: sizes.geminiRatio, references: opts.references };
    try {
      const res = opts.references?.length ? await rp.provider.edit(req) : await rp.provider.generate(req);
      const price = await d.openAiPricing();
      const unit = b.provider === "gemini" ? geminiImageCost({ model: rp.model, overrides: settings.geminiPrices }) : openAiImageCost({ model: rp.model, quality: b.quality, size: sizes.openAiSize, usage: res.usage ? { ...res.usage, input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens } : null, overrides: price.overrides as never, flatUsd: price.flatUsd });
      // With reported token usage the whole call's cost is split across the pictures; otherwise each costs the table price.
      const perImage = b.provider === "openai" && res.usage && unit.basis === "usage" ? openAiImageCost({ model: rp.model, quality: b.quality, size: sizes.openAiSize, usage: res.usage }).usd / Math.max(res.images.length, 1) : unit.usd;
      const prefix = await d.storagePrefix();
      const out: Variant[] = [];
      for (let i = 0; i < res.images.length; i++) {
        const png = await toPng(res.images[i]);
        const vid = newId();
        const key = await d.putBlob(`${prefix}/${p._id}/${vid}.png`, png.data, "image/png");
        out.push({ id: vid, storageKey: key, contentType: "image/png", width: png.width, height: png.height, provider: b.provider, model: rp.model, prompt: opts.prompt, parentId: opts.parent?.id ?? null, instruction: opts.instruction ?? null, slide: opts.slides?.[i] ?? null, costUsd: Math.round(perImage * 1e6) / 1e6, costBasis: unit.basis, createdAt: d.now().toISOString() });
      }
      const spent = Math.round(out.reduce((a, v) => a + v.costUsd, 0) * 1e6) / 1e6;
      if (rp.meter) await rp.meter({ model: rp.model, images: out.length, usage: res.usage }).catch(() => {});
      await jobs.updateOne({ _id: jobId }, { $set: { status: "done", costUsd: spent } });
      await (await projectsCollection()).updateOne({ _id: p._id }, { $push: { variants: { $each: out } }, $inc: { totalCostUsd: spent }, $set: { status: "ready", pendingApproval: null, error: null, ...updateStamp(actor.userId) } });
      await d.audit({ actorId: actor.userId, actorEmail: actor.email, action: opts.parent ? "regenerate" : "generate", entityId: p._id, entityLabel: b.name || p._id, summary: `${opts.parent ? "Edited" : "Generated"} ${out.length} image${out.length === 1 ? "" : "s"} with ${rp.model}`, metadata: { provider: b.provider, model: rp.model, images: out.length, costUsd: spent, quality: b.quality } });
      return out;
    } catch (err) {
      await jobs.updateOne({ _id: jobId }, { $set: { status: "failed", costUsd: 0 } });
      const msg = err instanceof ImageProviderError ? err.message : "Something went wrong while generating. Please try again.";
      await (await projectsCollection()).updateOne({ _id: p._id }, { $set: { status: p.variants.length ? "ready" : "draft", error: msg, ...updateStamp(actor.userId) } });
      await d.audit({ actorId: actor.userId, actorEmail: actor.email, action: "generate", entityId: p._id, entityLabel: b.name || p._id, summary: `Image generation failed: ${err instanceof ImageProviderError ? err.code : "error"}`, metadata: { provider: b.provider } });
      toUserError(err);
    }
  }

  async function queueApproval(actor: Actor, p: ProjectDoc, kind: "generate" | "edit", est: number, thresholdUsd: number, request: Record<string, unknown>) {
    await (await projectsCollection()).updateOne({ _id: p._id }, { $set: { status: "awaiting_approval", pendingApproval: { by: actor.userId, email: actor.email, at: d.now(), estimateUsd: est, kind, request }, ...updateStamp(actor.userId) } });
    await d.notify(await d.managerIds(), { title: `Approve image spend: ${p.brief.name || "Image project"}`, body: `About $${est.toFixed(2)} for AI images. Over the $${thresholdUsd.toFixed(2)} limit that needs a manager.`, link: `/viralpulse-ai/image-studio?tab=create&project=${p._id}` });
  }

  async function generate(actor: Actor, id: string, opts: { acknowledge?: string[]; approved?: boolean } = {}): Promise<Outcome<ProjectDoc>> {
    const p = await must(id);
    if (p.status === "generating") throw new SmmsInputError("Already generating. Wait for it to finish.");
    const settings = await d.settings();
    const b = p.brief;
    const goal = goalById(b.goalId)!;
    const n = imageCountFor(b);
    const est = await estimate(b, settings, n);
    const ack = opts.acknowledge ?? p.ackFlags;
    try {
      const g = await gate(actor, p, settings, n, est.totalUsd, ack, {});
      if (g.needsApproval && !opts.approved) {
        await queueApproval(actor, p, "generate", est.totalUsd, settings.approvalThresholdUsd, { acknowledge: ack });
        return { outcome: "needs_manager", estimateUsd: est.totalUsd, thresholdUsd: settings.approvalThresholdUsd, project: await must(id) };
      }
    } catch (e) {
      if (e instanceof NeedsAckError) return { outcome: "needs_ack", flags: e.flags };
      throw e;
    }
    await (await projectsCollection()).updateOne({ _id: id }, { $set: { ackFlags: ack } });
    const kit = b.applyKit ? await d.kit() : null;
    const refs = await loadRefs(d, b.referenceIds);
    if (goal.slides) {
      // One request per slide so each gets its own scene; the cost estimate above already counts them all.
      const per = { totalUsd: est.perImageUsd };
      for (let i = 0; i < n; i++) await runCall(actor, i === 0 ? p : await must(id), settings, { prompt: buildPrompt(b, kit, goal, i), n: 1, references: refs.length ? refs : undefined, est: per, slides: [i] });
    } else {
      await runCall(actor, p, settings, { prompt: buildPrompt(b, kit, goal, null), n, references: refs.length ? refs : undefined, est, slides: [] });
    }
    return { outcome: "done", project: await must(id) };
  }

  async function editVariant(actor: Actor, id: string, variantId: string, instruction: string, opts: { acknowledge?: string[]; approved?: boolean } = {}): Promise<Outcome<ProjectDoc>> {
    const p = await must(id);
    const ins = str(instruction, 500);
    if (ins.length < 4) throw new SmmsInputError("Say what to change, for example: make the background warmer.");
    const parent = p.variants.find((v) => v.id === variantId);
    if (!parent) throw new SmmsInputError("That picture no longer exists.");
    const settings = await d.settings();
    const est = await estimate(p.brief, settings, 1);
    const ack = opts.acknowledge ?? [];
    try {
      const g = await gate(actor, p, settings, 1, est.totalUsd, ack, { instruction: ins });
      if (g.needsApproval && !opts.approved) {
        await queueApproval(actor, p, "edit", est.totalUsd, settings.approvalThresholdUsd, { variantId, instruction: ins, acknowledge: ack });
        return { outcome: "needs_manager", estimateUsd: est.totalUsd, thresholdUsd: settings.approvalThresholdUsd, project: await must(id) };
      }
    } catch (e) {
      if (e instanceof NeedsAckError) return { outcome: "needs_ack", flags: e.flags };
      throw e;
    }
    const src = await d.getBlob(parent.storageKey);
    if (!src) throw new SmmsInputError("The picture file is missing. Generate it again.");
    const extra = await loadRefs(d, p.brief.referenceIds.slice(0, 5));
    const refs: RefImage[] = [{ data: src, mimeType: "image/png" }, ...extra];
    const goal = goalById(p.brief.goalId)!;
    const kit = p.brief.applyKit ? await d.kit() : null;
    const prompt = `${buildPrompt(p.brief, kit, goal, parent.slide, ins)}\nEdit the first picture. Return the whole edited picture.`;
    await runCall(actor, p, settings, { prompt, n: 1, references: refs, est, parent, instruction: ins, slides: [parent.slide] });
    return { outcome: "done", project: await must(id) };
  }

  /** A manager approves the stored request, and it runs. */
  async function approve(actor: Actor, id: string): Promise<Outcome<ProjectDoc>> {
    if (!actor.canApprove) throw new SmmsInputError("Only a manager can approve image spend.");
    const p = await must(id);
    const pa = p.pendingApproval;
    if (!pa) throw new SmmsInputError("Nothing is waiting for approval.");
    const claim = await (await projectsCollection()).updateOne({ _id: id, "pendingApproval.at": pa.at }, { $set: { pendingApproval: null, status: p.variants.length ? "ready" : "draft" } });
    if (claim.modifiedCount !== 1) throw new SmmsInputError("Someone else already handled this approval.");
    await d.audit({ actorId: actor.userId, actorEmail: actor.email, action: "approve", entityId: id, entityLabel: p.brief.name || id, summary: `Approved image spend of about $${pa.estimateUsd.toFixed(2)}`, metadata: { requestedBy: pa.by, estimateUsd: pa.estimateUsd } });
    const requester: Actor = { userId: pa.by, email: pa.email, canApprove: true };
    const req = pa.request as { variantId?: string; instruction?: string; acknowledge?: string[] };
    return pa.kind === "edit" ? editVariant(requester, id, req.variantId ?? "", req.instruction ?? "", { acknowledge: req.acknowledge, approved: true }) : generate(requester, id, { acknowledge: req.acknowledge, approved: true });
  }

  async function reject(actor: Actor, id: string) {
    if (!actor.canApprove) throw new SmmsInputError("Only a manager can decline image spend.");
    const p = await must(id);
    await (await projectsCollection()).updateOne({ _id: id }, { $set: { pendingApproval: null, status: p.variants.length ? "ready" : "draft", ...updateStamp(actor.userId) } });
  }

  async function choose(actor: Actor, id: string, ids: string[]) {
    const p = await must(id);
    const goal = goalById(p.brief.goalId)!;
    const valid = [...new Set(ids)].filter((x) => p.variants.some((v) => v.id === x));
    const chosen = goal.slides ? valid : valid.slice(0, 1);
    await (await projectsCollection()).updateOne({ _id: id }, { $set: { chosenIds: chosen, ...updateStamp(actor.userId) } });
    return must(id);
  }

  /** Composes every wanted size from the chosen picture(s) and saves each to the library. */
  async function finish(actor: Actor, id: string, opts: { name: string; tags?: string[]; folder?: string | null; badge: boolean; applyLogo: boolean; specKeys?: string[]; altText?: string; format?: "jpeg" | "png" }) {
    const p = await must(id);
    const b = p.brief;
    const goal = goalById(b.goalId)!;
    const chosen = p.chosenIds.map((cid) => p.variants.find((v) => v.id === cid)).filter((v): v is Variant => !!v);
    if (chosen.length === 0) throw new SmmsInputError("Pick the picture to finish first.");
    if (goal.slides && chosen.length < (goal.slides.min)) throw new SmmsInputError(`Pick one picture for each of the ${b.overlayText.length} slides.`);
    const policy = policyCheck(policyInput(b));
    if (!policy.ok) throw new SmmsInputError(`This can't be saved: ${policy.blocked.map((f) => f.message).join(" ")}`);
    const name = str(opts.name, 160) || b.name || goal.label;
    const keys = (opts.specKeys?.length ? opts.specKeys : b.specKeys).filter((k) => specByKey(k));
    if (!keys.length) throw new SmmsInputError("Choose at least one output size.");
    const kit = b.applyKit ? await d.kit() : null;
    let logo: { data: Buffer; placement: BrandKit["logoPlacement"]; scale: number } | undefined;
    if (opts.applyLogo && kit?.logoMediaId) {
      const l = await d.readMedia(kit.logoMediaId);
      if (!l) throw new SmmsInputError("The brand kit's logo is missing from the library. Choose it again in the Brand kit tab.");
      logo = { data: l.data, placement: kit.logoPlacement, scale: kit.logoScale };
    } else if (opts.applyLogo) throw new SmmsInputError("Add a logo in the Brand kit tab first, or switch the logo off.");
    const done: ExportRecord[] = [];
    const warnings: string[] = [];
    for (const v of chosen) {
      const src = await d.getBlob(v.storageKey);
      if (!src) throw new SmmsInputError("A picture file is missing. Generate it again.");
      const text = goal.slides ? b.overlayText[v.slide ?? 0] : b.overlayText[0];
      for (const key of keys) {
        const spec = specByKey(key)!;
        const c = await composeExport({
          spec,
          source: src,
          text: text?.trim() ? { value: text, position: b.textPosition, color: kit?.colours.text || undefined, weight: kit?.fontWeight ?? "bold" } : undefined,
          logo,
          badge: opts.badge,
          format: opts.format,
          meta: { description: `${name} - AI generated image (${v.model})`, aiGenerated: true },
        });
        warnings.push(...c.warnings.map((w) => `${spec.label}: ${w}`));
        const label = goal.slides ? `${name} - slide ${(v.slide ?? 0) + 1} - ${spec.label}` : `${name} - ${spec.label}`;
        const saved = await d.saveExport(c.data, {
          name: label,
          prompt: v.prompt,
          platform: platformOf(spec.group),
          width: c.width,
          height: c.height,
          contentType: c.contentType,
          tags: [...(opts.tags ?? []), "image-studio", goal.id],
          folder: opts.folder ?? null,
          altText: opts.altText ?? (b.subject ? b.subject.slice(0, 200) : ""),
          ai: { aiGenerated: true, provider: v.provider, model: v.model, projectId: p._id, role: "image", disclosureRequired: true },
          studio: { projectId: p._id, variantId: v.id, specKey: key, goalId: goal.id, badge: opts.badge, metadataMarked: true, consentRecorded: !!b.consent?.attested },
        }, actor.userId);
        done.push({ specKey: key, mediaId: saved._id, variantId: v.id, badge: opts.badge });
      }
    }
    await (await projectsCollection()).updateOne({ _id: id }, { $set: { status: "finished", exports: [...p.exports, ...done], "brief.name": name, ...updateStamp(actor.userId) } });
    await d.audit({ actorId: actor.userId, actorEmail: actor.email, action: "create", entityId: id, entityLabel: name, summary: `Saved ${done.length} AI image${done.length === 1 ? "" : "s"} to the library${opts.badge ? " with the AI badge" : ""}`, metadata: { exports: done.length, badge: opts.badge, consent: !!b.consent?.attested, sizes: keys.join(",") } });
    return { exports: done, warnings, project: await must(id) };
  }

  return { createProject, updateBrief, check, generate, editVariant, approve, reject, choose, finish, getProject: must, estimate };
}

const GROUP_PLATFORM: Record<string, string | null> = { Instagram: "instagram", Facebook: "facebook", YouTube: "youtube", LinkedIn: "linkedin", "Google Ads": "google_ads", "Google Business Profile": "google_business", X: null };
const platformOf = (group: string) => GROUP_PLATFORM[group] ?? null;

export { GOALS, GEMINI_TOKENS_PER_IMAGE };
export type { MediaDoc };
