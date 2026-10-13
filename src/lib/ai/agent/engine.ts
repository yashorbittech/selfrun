import "server-only";
import type OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { writeBlockReason } from "@/lib/platform/billing/enforce";
import { getOpenAI } from "@/lib/openai";
import { setAiFeature } from "@/lib/platform/billing/ai-usage-log";
import { getCompanyBrand } from "@/lib/platform/branding";
import { actionsFor, canWrite, entitiesFor, reportsFor, scopePanels } from "@/lib/ai/agent/entities";
import { canCreate, canRemove, canUpdate, clean, discoverFields, doCreate, doRemove, doUpdate, findRecords, getRecord, groupRecords, logAgentAction, peek, prepare, titleOf } from "@/lib/ai/agent/records";
import { prepareAttachments } from "@/lib/ai/agent/attachments";
import { claimProposal, finishProposal, peekProposal, saveProposal, type PendingCall, type StoredProposal } from "@/lib/ai/agent/proposals";
import { checkScope, detectLanguage, languageBlock, refusalText, say, scopeBlock, type Lang, type ScopeKind } from "@/lib/ai/policy";
import { GUIDE_PANELS, panelGuide, panelRoutes, routeSummary } from "@/lib/ai/agent/guide/guide";
import { CMS_LABELS, cmsSchemas, cmsSystem, isCmsDestructive, isCmsRead, isCmsTool, runCmsTool } from "@/lib/ai/agent/cms";
import type { ActionDef, AgentResponse, AgentUser, ApprovalCall, ClientMessage, EntityDef, FieldDef, Json, ReportDef } from "@/lib/ai/agent/types";

type Msg = OpenAI.Chat.ChatCompletionMessageParam;
const MODEL = () => process.env.PANEL_AI_MODEL || "gpt-4.1";
const MAX_STEPS = 10;
const RESULT_CAP = 20_000;

export interface Ctx {
  user: AgentUser;
  panel: string;
  entities: EntityDef[];
  actions: ActionDef[];
  reports: ReportDef[];
  cms: boolean;
  /** The language of the person's latest message (what every fixed sentence and the model answer in). */
  lang: Lang;
}

export async function buildCtx(user: AgentUser, panel: string, lang: Lang = "english"): Promise<Ctx> {
  const key = panel === "hub" ? "workspace" : panel;
  return { user, panel: key, entities: await entitiesFor(user, key), actions: actionsFor(user, key), reports: reportsFor(user, key), cms: key === "cms", lang };
}

// ── Tool schemas ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const fn = (name: string, description: string, properties: Json, required: string[] = []) => ({
  type: "function" as const,
  function: { name, description, parameters: { type: "object", properties, required, additionalProperties: true } },
});

function dataTools(ctx: Ctx) {
  const tools = [];
  if (ctx.entities.length) {
    tools.push(
      fn("list_entities", "List the kinds of records you can work with here (keys, what they are, what you may do with them).", { panel: { type: "string", description: "Optional: only this panel, e.g. pms" } }),
      fn("describe_entity", "Show an entity's fields (names, types, allowed values, which are required). Call before creating or updating a kind of record you have not used.", { entity: { type: "string" } }, ["entity"]),
      fn("find_records", "Search records. Use q for a text search across the name-like fields; filters is {field: value} (equal), {field: [a,b]} (any of) or {field: {gte|lte|gt|lt|ne: value}} (dates as YYYY-MM-DD). Max 25 per call; use skip to page.", {
        entity: { type: "string" }, q: { type: "string" }, filters: { type: "object" }, sort: { type: "string", description: "Field to sort by (default createdAt)" }, descending: { type: "boolean" }, limit: { type: "number" }, skip: { type: "number" },
      }, ["entity"]),
      fn("get_record", "Get one record by id.", { entity: { type: "string" }, id: { type: "string" } }, ["entity", "id"]),
      fn("group_records", "Count (and optionally add up) records grouped by a field, for questions like 'how many tasks per status'.", { entity: { type: "string" }, groupBy: { type: "string" }, filters: { type: "object" }, sumField: { type: "string" } }, ["entity", "groupBy"]),
    );
    if (ctx.entities.some((e) => canWrite(ctx.user, e) && canCreate(e))) tools.push(fn("create_record", "Propose creating a record. The person approves before anything is saved. `values` uses the entity's field keys (see describe_entity). Ids of related records must be looked up first.", { entity: { type: "string" }, values: { type: "object" } }, ["entity", "values"]));
    if (ctx.entities.some((e) => canWrite(ctx.user, e) && canUpdate(e))) tools.push(fn("update_record", "Propose changing fields of a record. Only the fields to change go in `values`. The person approves first.", { entity: { type: "string" }, id: { type: "string" }, values: { type: "object" } }, ["entity", "id", "values"]));
    if (ctx.entities.some((e) => canWrite(ctx.user, e) && canRemove(e))) tools.push(fn("delete_record", "Propose deleting a record. Needs the person's explicit approval and a second confirmation.", { entity: { type: "string" }, id: { type: "string" } }, ["entity", "id"]));
  }
  if (ctx.reports.length) tools.push(fn("run_report", `Run one of the panel's own calculations (same numbers as its dashboards). Available: ${ctx.reports.map((r) => `${r.key} — ${r.label}: ${r.description}`).join("; ")}. Give its parameters in values.`, { report: { type: "string" }, values: { type: "object" } }, ["report"]));
  if (ctx.actions.length) tools.push(fn("run_action", `Propose a business action (not plain create/edit): ${ctx.actions.map((a) => `${a.key} — ${a.label}`).join("; ")}. The person approves first.`, { action: { type: "string" }, values: { type: "object" } }, ["action", "values"]));
  return tools;
}

const askTool = fn("ask_user", "Ask the person ONE short question when you need information you cannot look up (a missing required value, a choice between options, which of several matches they mean). Give `choices` when the answers are a small known set. Use this instead of guessing.", { question: { type: "string" }, choices: { type: "array", items: { type: "string" } } }, ["question"]);

/** The Platform Panel's guide is only for the platform team. */
const guidePanels = (ctx: Ctx) => (ctx.panel === "platform" ? GUIDE_PANELS : GUIDE_PANELS.filter((p) => p !== "platform"));

const guideTools = (ctx: Ctx) => [
  fn("panel_guide", `Look up how this product works: what a panel is for, how to do something step by step, which screen to open. Use it for any "how do I…", "where is…", "what does… mean" question instead of answering from memory. panel is one of: ${guidePanels(ctx).join(", ")}${ctx.panel === "workspace" ? "" : ` (default: ${ctx.panel})`}.`, { panel: { type: "string" }, topic: { type: "string", description: "What the person wants to know, as short ENGLISH keywords even if they asked in Hindi or Hinglish (the guide is written in English), e.g. 'approve leave' or 'import clients'" } }),
  fn("find_screen", "Find the screen (page) in the panels where something is done, by keywords. Returns paths you can give the person as links.", { query: { type: "string", description: "ENGLISH keywords, even if the person asked in Hindi or Hinglish (screen names are in English)" }, panel: { type: "string" } }, ["query"]),
];

export function toolSchemas(ctx: Ctx): OpenAI.Chat.ChatCompletionTool[] {
  return [...dataTools(ctx), ...guideTools(ctx), ...(ctx.cms ? cmsSchemas() : []), askTool] as OpenAI.Chat.ChatCompletionTool[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const err = (error: string, extra: Json = {}): Json => ({ error, ...extra });
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const short = (v: unknown, n = 160): string => {
  if (v === null || v === undefined || v === "") return "—";
  const t = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

function entityOf(ctx: Ctx, key: unknown): EntityDef | null {
  return typeof key === "string" ? ctx.entities.find((e) => e.key === key) ?? null : null;
}

function describeEntity(def: EntityDef, ctx: Ctx): Json {
  const w = canWrite(ctx.user, def);
  return {
    entity: def.key, label: def.label, description: def.description,
    can: { read: true, create: w && canCreate(def), update: w && canUpdate(def), delete: w && canRemove(def) },
    searchable: def.search ?? [],
    fields: def.fields?.map((f) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, ...(f.options ? { allowed: f.options } : {}), ...(f.ref ? { refers_to: f.ref } : {}) })),
  };
}

// ── Reads (run immediately) ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function guidePanel(ctx: Ctx, a: Json): string {
  const p = typeof a.panel === "string" ? a.panel.toLowerCase() : "";
  return p === "hub" ? "workspace" : p || (ctx.panel === "workspace" ? "workspace" : ctx.panel);
}

async function runRead(name: string, a: Json, ctx: Ctx): Promise<Json> {
  if (name === "panel_guide") {
    const panel = guidePanel(ctx, a);
    if (!guidePanels(ctx).includes(panel)) return err(`Unknown panel "${panel}". Panels: ${guidePanels(ctx).join(", ")}.`);
    return panelGuide(panel, typeof a.topic === "string" ? a.topic : undefined) as unknown as Json;
  }
  if (name === "run_report") {
    const rep = ctx.reports.find((r) => r.key === a.report);
    if (!rep) return err(`Unknown or not allowed report "${short(a.report, 60)}".`);
    const pseudo = { key: rep.key, panel: rep.panel, label: rep.label, description: "", collection: "", fields: rep.params } as EntityDef;
    const prep = prepare(pseudo, isObj(a.values) ? a.values : {}, "create");
    if (!prep.ok) return err("Some parameters are missing or invalid.", { problems: prep.problems });
    try {
      const out = await rep.run(prep.values, ctx.user);
      return clean(out, new Set()) as Json;
    } catch (e) {
      console.error("[ai-agent] report failed", rep.key, e);
      return err(e instanceof Error ? e.message : "The report failed.");
    }
  }
  if (name === "find_screen") {
    const q = String(a.query ?? "").toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
    const only = typeof a.panel === "string" ? guidePanel(ctx, a) : null;
    const panels = only ? [only] : ctx.panel === "workspace" ? guidePanels(ctx) : [ctx.panel];
    const hits = panels.flatMap((p) => panelRoutes(p).map((r) => ({ panel: p, ...r, score: q.reduce((n, w) => n + (`${r.name} ${r.path}`.toLowerCase().includes(w) ? 1 : 0), 0) }))).filter((r) => r.score > 0).sort((x, y) => y.score - x.score).slice(0, 8);
    return { screens: hits.map(({ panel, path, name }) => ({ panel, name, path })) };
  }
  if (name === "list_entities") {
    const panel = typeof a.panel === "string" ? a.panel : null;
    return {
      entities: ctx.entities.filter((e) => !panel || e.panel === panel).map((e) => ({ key: e.key, label: e.label, about: e.description, can: canWrite(ctx.user, e) ? [canCreate(e) && "create", canUpdate(e) && "update", canRemove(e) && "delete"].filter(Boolean) : [] })),
      actions: ctx.actions.map((x) => ({ key: x.key, label: x.label })),
      reports: ctx.reports.map((x) => ({ key: x.key, label: x.label })),
    };
  }
  const def = entityOf(ctx, a.entity);
  if (!def) return err(`Unknown or not allowed entity "${short(a.entity, 60)}". Call list_entities.`);
  switch (name) {
    case "describe_entity": {
      const d = describeEntity(def, ctx);
      if (!def.fields) d.fields = await discoverFields(def);
      return d;
    }
    case "find_records":
      return findRecords(def, { filters: a.filters, q: typeof a.q === "string" ? a.q : undefined, sort: typeof a.sort === "string" ? a.sort : undefined, desc: a.descending === false ? false : true, limit: typeof a.limit === "number" ? a.limit : undefined, skip: typeof a.skip === "number" ? a.skip : undefined });
    case "get_record":
      return typeof a.id === "string" ? getRecord(def, a.id) : err("id is required.");
    case "group_records":
      return typeof a.groupBy === "string" ? groupRecords(def, { groupBy: a.groupBy, filters: a.filters, sumField: typeof a.sumField === "string" ? a.sumField : undefined }) : err("groupBy is required.");
  }
  return err(`Unknown tool ${name}.`);
}

// ── Writes: validate now, show a card, execute only after approval ──────────────────────────────────────────────────────────────────────

const READ_TOOLS = new Set(["run_report", "panel_guide", "find_screen", "list_entities", "describe_entity", "find_records", "get_record", "group_records"]);
const WRITE_TOOLS = new Set(["create_record", "update_record", "delete_record", "run_action"]);

/** Resolves a ref field's id to a readable name for the approval card. */
async function labelFor(f: FieldDef, value: unknown, ctx: Ctx): Promise<string> {
  if (f.type === "ref" && f.ref && typeof value === "string") {
    const ref = entityOf(ctx, f.ref);
    if (ref) {
      const row = await peek(ref, value);
      if (row) return `${titleOf(ref, row)} (${value.slice(0, 8)}…)`;
    }
  }
  if (f.type === "stringList" && Array.isArray(value)) return value.join(", ");
  if (f.type === "json") return short(value, 400);
  return short(value, 300);
}

interface Checked { ok: true; card: ApprovalCall; args: Json }

async function checkWrite(callId: string, tool: string, a: Json, ctx: Ctx): Promise<Checked | { ok: false; error: Json }> {
  if (tool === "run_action") {
    const action = ctx.actions.find((x) => x.key === a.action);
    if (!action) return { ok: false, error: err(`Unknown or not allowed action "${short(a.action, 60)}".`) };
    const pseudo = { key: action.key, panel: action.panel, label: action.label, description: "", collection: "", fields: action.params } as EntityDef;
    const prep = prepare(pseudo, isObj(a.values) ? a.values : {}, "create");
    if (!prep.ok) return { ok: false, error: err("Some values are missing or invalid.", { problems: prep.problems }) };
    const fields = await Promise.all(action.params.filter((p) => prep.values[p.key] !== undefined).map(async (p) => ({ label: p.label, value: await labelFor(p, prep.values[p.key], ctx) })));
    return { ok: true, args: { action: action.key, values: prep.values }, card: { id: callId, tool, title: action.label, kind: "action", destructive: !!action.destructive, fields } };
  }

  const def = entityOf(ctx, a.entity);
  if (!def) return { ok: false, error: err(`Unknown or not allowed entity "${short(a.entity, 60)}".`) };
  if (!canWrite(ctx.user, def)) return { ok: false, error: err(`You don't have permission to change ${def.label.toLowerCase()} records.`) };

  if (tool === "create_record") {
    if (!canCreate(def)) return { ok: false, error: err(`${def.label} records can't be created from here. Use the panel itself.`) };
    const prep = prepare(def, a.values, "create");
    if (!prep.ok) return { ok: false, error: err("Some values are missing or invalid.", { problems: prep.problems }) };
    for (const f of def.fields ?? []) if (f.type === "ref" && f.ref && prep.values[f.key] != null) {
      const ref = entityOf(ctx, f.ref);
      if (ref && !(await peek(ref, String(prep.values[f.key])))) return { ok: false, error: err(`${f.label}: no such record. Look it up with find_records first.`) };
    }
    const fields = await Promise.all((def.fields ?? []).filter((f) => prep.values[f.key] !== undefined).map(async (f) => ({ label: f.label, value: await labelFor(f, prep.values[f.key], ctx) })));
    return { ok: true, args: { entity: def.key, values: prep.values }, card: { id: callId, tool, title: `Create ${def.label.toLowerCase()}`, kind: "create", destructive: false, fields } };
  }

  const id = typeof a.id === "string" ? a.id : "";
  if (!id) return { ok: false, error: err("id is required.") };
  const current = await peek(def, id);
  if (!current) return { ok: false, error: err(`No ${def.label.toLowerCase()} found with id ${id}.`) };
  const name = titleOf(def, current);

  if (tool === "update_record") {
    if (!canUpdate(def)) return { ok: false, error: err(`${def.label} records can't be edited from here. Use the panel itself.`) };
    const prep = prepare(def, a.values, "update");
    if (!prep.ok) return { ok: false, error: err("Some values are missing or invalid.", { problems: prep.problems }) };
    const fields = await Promise.all(Object.keys(prep.values).map(async (k) => {
      const f = (def.fields ?? []).find((x) => x.key === k)!;
      return { label: f.label, value: await labelFor(f, prep.values[k], ctx), before: short(clean(current[k] as unknown, new Set()), 160) };
    }));
    return { ok: true, args: { entity: def.key, id, values: prep.values }, card: { id: callId, tool, title: `Update ${def.label.toLowerCase()}: ${name}`, kind: "update", destructive: false, fields } };
  }

  // delete_record
  if (!canRemove(def)) return { ok: false, error: err(`${def.label} records can't be deleted from here. Use the panel itself.`) };
  return { ok: true, args: { entity: def.key, id }, card: { id: callId, tool, title: `Delete ${def.label.toLowerCase()}: ${name}`, kind: "delete", destructive: true, fields: [{ label: def.label, value: `${name} (${id.slice(0, 8)}…)` }] } };
}

function cmsCard(callId: string, tool: string, a: Json): ApprovalCall {
  const fields = Object.entries(a).filter(([, v]) => v !== undefined && v !== null && v !== "").slice(0, 8).map(([k, v]) => ({ label: k, value: short(v, 200) }));
  return { id: callId, tool, title: CMS_LABELS[tool] ?? tool, kind: "action", destructive: isCmsDestructive(tool), fields };
}

async function executeWrite(call: PendingCall, ctx: Ctx): Promise<Json> {
  const { tool } = call;
  const blocked = await writeBlockReason();
  if (blocked) return err(blocked);
  try {
    const out = await executeWriteInner(call, ctx);
    if (!("error" in out)) {
      try { revalidatePath(`/${ctx.panel === "workspace" ? "workspace" : ctx.panel}`, "layout"); } catch { /* not in a request that can revalidate */ }
    }
    return out;
  } catch (e) {
    console.error("[ai-agent] write failed", tool, e);
    return err(e instanceof Error ? e.message : "That action failed.");
  }
}

async function executeWriteInner(call: PendingCall, ctx: Ctx): Promise<Json> {
  const { tool, args: a } = call;
  try {
    if (ctx.cms && isCmsTool(tool)) {
      const out = await runCmsTool(tool, a);
      await logAgentAction(ctx.user, ctx.panel, { tool, ok: !("error" in out) });
      return out;
    }
    if (tool === "run_action") {
      const action = ctx.actions.find((x) => x.key === a.action);
      if (!action) return err("That action is no longer available to you.");
      const out = await action.run(isObj(a.values) ? a.values : {}, ctx.user);
      await logAgentAction(ctx.user, ctx.panel, { tool, action: action.key, values: a.values, ok: !("error" in out) });
      return out;
    }
    const def = entityOf(ctx, a.entity);
    if (!def || !canWrite(ctx.user, def)) return err("That is no longer allowed.");
    let out: Json;
    if (tool === "create_record") out = await doCreate(def, a.values as Json, ctx.user);
    else if (tool === "update_record") out = await doUpdate(def, String(a.id), a.values as Json, ctx.user);
    else out = await doRemove(def, String(a.id), ctx.user);
    await logAgentAction(ctx.user, ctx.panel, { tool, entity: def.key, recordId: a.id ?? out.id ?? null, values: tool === "delete_record" ? undefined : a.values, ok: !("error" in out) });
    return out;
  } catch (e) {
    console.error("[ai-agent] write failed", tool, e);
    return err(e instanceof Error ? e.message : "That action failed.");
  }
}

// ── The loop ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Run { messages: Msg[]; steps: { label: string; ok: boolean }[]; changed: boolean; autoApprove: boolean }

const STEP_LABEL: Record<string, string> = { panel_guide: "Read the guide", find_screen: "Found the screen", list_entities: "Checked what's available", describe_entity: "Checked the fields", find_records: "Searched records", get_record: "Opened a record", group_records: "Counted records" };

async function stepLoop(ctx: Ctx, run: Run): Promise<AgentResponse> {
  const client = await getOpenAI();
  const tools = toolSchemas(ctx);
  for (let i = 0; i < MAX_STEPS; i++) {
    const res = await client.chat.completions.create({ model: MODEL(), temperature: 0.2, messages: run.messages, tools, tool_choice: "auto", parallel_tool_calls: true });
    const msg = res.choices[0]?.message;
    if (!msg) break;
    run.messages.push({ role: "assistant", content: msg.content ?? null, ...(msg.tool_calls?.length ? { tool_calls: msg.tool_calls } : {}) } as Msg);
    const calls = (msg.tool_calls ?? []).filter((c) => c.type === "function");
    if (!calls.length) return { reply: msg.content?.trim() || say("done", ctx.lang), steps: run.steps, changed: run.changed };

    const toolMsg = (id: string, out: Json): Msg => ({ role: "tool", tool_call_id: id, content: JSON.stringify(out).slice(0, RESULT_CAP) });
    const pending: PendingCall[] = [];
    const cards: ApprovalCall[] = [];
    let ask: { question: string; choices?: string[] } | null = null;

    for (const c of calls) {
      const name = c.function.name;
      let args: Json = {};
      try { args = c.function.arguments ? (JSON.parse(c.function.arguments) as Json) : {}; } catch { run.messages.push(toolMsg(c.id, err("The arguments were not valid JSON."))); continue; }

      if (name === "ask_user") {
        if (!ask) ask = { question: short(args.question, 600), choices: Array.isArray(args.choices) ? args.choices.filter((x): x is string => typeof x === "string").slice(0, 6) : undefined };
        run.messages.push(toolMsg(c.id, { asked: true }));
        continue;
      }
      if (READ_TOOLS.has(name) || (ctx.cms && isCmsTool(name) && isCmsRead(name))) {
        const out = ctx.cms && isCmsTool(name) ? await runCmsTool(name, args) : await runRead(name, args, ctx);
        run.steps.push({ label: STEP_LABEL[name] ?? name.replace(/_/g, " "), ok: !("error" in out) });
        run.messages.push(toolMsg(c.id, out));
        continue;
      }
      if (ctx.cms && isCmsTool(name)) {
        pending.push({ id: c.id, tool: name, args, destructive: isCmsDestructive(name) });
        cards.push(cmsCard(c.id, name, args));
        continue;
      }
      if (WRITE_TOOLS.has(name)) {
        const checked = await checkWrite(c.id, name, args, ctx);
        if (!checked.ok) { run.steps.push({ label: "Couldn't prepare a change", ok: false }); run.messages.push(toolMsg(c.id, checked.error)); continue; }
        pending.push({ id: c.id, tool: name, args: checked.args, destructive: checked.card.destructive });
        cards.push(checked.card);
        continue;
      }
      run.messages.push(toolMsg(c.id, err(`Unknown tool ${name}.`)));
    }

    if (ask && !pending.length) return { reply: ask.question, choices: ask.choices, steps: run.steps, changed: run.changed };

    if (pending.length) {
      const needsExtra = pending.some((p) => p.destructive);
      if (run.autoApprove && !needsExtra) {
        for (const p of pending) {
          const out = await executeWrite(p, ctx);
          const ok = !("error" in out);
          if (ok) run.changed = true;
          run.steps.push({ label: cards.find((c) => c.id === p.id)?.title ?? p.tool, ok });
          run.messages.push(toolMsg(p.id, out));
        }
        continue;
      }
      const id = await saveProposal({ userId: ctx.user.id, panel: ctx.panel, messages: run.messages, calls: pending, steps: run.steps, changed: run.changed, autoApprove: run.autoApprove, lang: ctx.lang });
      const lead = msg.content?.trim();
      return { reply: lead || say(cards.length > 1 ? "readyMany" : "readyOne", ctx.lang), steps: run.steps, changed: run.changed, proposal: { id, title: cards.length > 1 ? `${cards.length} changes` : cards[0].title, calls: cards, needsExtraConfirm: needsExtra } };
    }
  }
  return { reply: say("ranOut", ctx.lang), steps: run.steps, changed: run.changed };
}

// ── Public entry points ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Panels whose reach differs from "this company's records": said plainly so the model neither over-promises nor goes looking in the wrong place. */
const SCOPE_NOTES: Record<string, string> = {
  platform: "\n\nScope: this is the platform owner's console. You see ALL companies on the platform (not one company's records): use run_report to read companies, subscriptions, invoices, revenue, plans, coupons, add-ons, usage, AI token history, sign-ups, support requests and the audit log, and run_action to change them. There are no generic records here. Every tool is limited by the person's platform role; a missing tool means their role does not allow it. Deleting a company, changing payment keys and platform integrations are done on their own screens, never by you. Money and access changes are significant: state the company and the exact change in your reply.",
  portal: "\n\nScope: you are talking to an EXTERNAL person (an applicant, intern, trainee or client of this company), not staff. Help them with their own request, progress, interviews, messages, documents, wallet and notifications only. Never mention or reveal anything about other people, the company's internal records, staff or other customers. You cannot change anything except sending a message to the team, switching their active request and marking notifications read.",
  support: "\n\nScope: this is the company's Help & Support centre. Search the help articles first (support.search_help) and answer from them; if they do not cover the problem, offer to raise a support request to the SelfRun team (ask for the type, a clear title and the steps), and help follow or reply to the company's existing requests.",
  cms: "\n\nScope: the company's public website. Page content, menus, footer, blog/jobs/products collections, media, forms, offers, wallet, chatbot, push and settings are all yours to read and (with approval) change. Never invent business facts.",
};

const scopeKind = (panel: string): ScopeKind => (panel === "platform" ? "platform" : panel === "portal" ? "portal" : panel === "support" ? "support" : "workspace");

async function systemPrompt(ctx: Ctx, page?: string): Promise<string> {
  const brand = await getCompanyBrand();
  const panels = scopePanels(ctx.panel);
  const list = ctx.entities.map((e) => `- ${e.key}: ${e.label} — ${e.description}${canWrite(ctx.user, e) ? ` [${[canCreate(e) && "create", canUpdate(e) && "edit", canRemove(e) && "delete"].filter(Boolean).join("/") || "read"}]` : " [read only]"}`).join("\n");
  const reps = ctx.reports.map((r) => `- ${r.key}: ${r.label} — ${r.description}`).join("\n");
  const acts = ctx.actions.map((a) => `- ${a.key}: ${a.label} — ${a.description}`).join("\n");
  const where = ctx.panel === "workspace" ? "the Workspace (it spans every panel you have access to)" : ctx.panel === "platform" ? "the Platform Panel (the SaaS owner's console)" : ctx.panel === "portal" ? "the external user Portal" : ctx.panel === "support" ? "the Help & Support centre" : `the ${ctx.panel.toUpperCase()} panel`;
  const scope = SCOPE_NOTES[ctx.panel] ?? "";
  return `You are the AI agent inside ${where} of "${brand.name}". Today is ${new Date().toISOString().slice(0, 10)}. You act as ${ctx.user.email} (roles: ${ctx.user.roles.join(", ") || "none"}), with exactly their permissions${ctx.panel === "platform" ? "" : ", only inside this company"}.${page ? `\nThe person is on this page: ${page}.` : ""}

You can read this company's real records and, with the person's approval, create, change or delete them and run business actions. You can also read attached screenshots, photos, PDFs, spreadsheets and documents.${scope}

How to work:
1. Look things up before acting. Names the person says ("the Acme project") must be resolved to real ids with find_records; never guess or invent ids. If several match, ask which one (ask_user, with choices).
2. Anything that changes data goes through create_record / update_record / delete_record / run_action. The person then sees an approval card and nothing is saved until they approve, so do NOT ask "should I go ahead?" in text first. Collect every required value first (ask_user for what is missing, one short question at a time, with choices when the options are known; use describe_entity to know the required fields), then make the call with complete values. Related changes that belong together go in the same turn.
3. After the result comes back, say exactly what happened (name, code, id). If it failed, say why in plain words and what to do. Never claim something was done unless the tool result says so.
4. For attachments: read them carefully. If a screenshot shows a record or a form, you can explain it, answer questions about it, or use its data to fill a record; when a value is unclear or illegible, ask rather than guess.
5. For "how do I…", "where is…" or "what does… mean" questions, call panel_guide (and find_screen) and answer from it with the exact screen as a link; offer to do it for them when you can. Questions about numbers ("how many", "total") are answered from real data with find_records / group_records, not from memory. If nothing is found, say so.
6. Never invent facts. Never reveal passwords, tokens, keys or bank/ID numbers. If something is not possible here (not in your tools, or you lack permission), say so and point to where in the panel it is done.
7. Be brief and concrete; use short lists for several items. The LANGUAGE and SCOPE sections below are binding.

${ctx.panel !== "workspace" && routeSummary(ctx.panel) ? `\nScreens in this panel (give them as markdown links, e.g. [Projects](/pms/projects)):\n${routeSummary(ctx.panel)}\n` : ""}${ctx.cms ? "" : list ? `Records you can work with (${panels.join(", ")}):\n${list}\n` : reps || acts ? "" : "In this panel you have no record tools. You can answer how-to questions from the guide (panel_guide), read what the person attaches or pastes, explain it, and help them think it through; for anything that needs the panel's data or a change, tell them plainly you can't do that from here and which panel can.\n"}${reps ? `\nReports (use run_report):\n${reps}\n` : ""}${acts ? `\nActions (use run_action, needs approval):\n${acts}\n` : ""}\n${scopeBlock(scopeKind(ctx.panel))}\n\n${languageBlock(ctx.lang)}`;
}

function historyMessages(history: ClientMessage[], attachedParts: { parts: OpenAI.Chat.ChatCompletionContentPart[] }[]): Msg[] {
  return history.map((m, i) => {
    if (m.role === "assistant") return { role: "assistant", content: m.content };
    const prepared = attachedParts[i];
    if (prepared?.parts.length) return { role: "user", content: [{ type: "text", text: m.content || "(see the attached file)" }, ...prepared.parts] };
    const names = (m.attachments ?? []).map((a) => a.name);
    return { role: "user", content: names.length ? `${m.content}\n[earlier attachments not shown again: ${names.join(", ")}]` : m.content };
  });
}

export async function runAgent(input: { user: AgentUser; panel: string; history: ClientMessage[]; page?: string; autoApprove?: boolean }): Promise<AgentResponse & { attachmentErrors?: string[] }> {
  setAiFeature(`Ask AI · ${input.panel}`);
  const lang = detectLanguage(input.history.filter((m) => m.role === "user").map((m) => m.content));
  const ctx = await buildCtx(input.user, input.panel, lang);

  // The independent scope gate: a request that is not about this product / company never reaches the model that holds the tools.
  const last = input.history[input.history.length - 1];
  const before = [...input.history].reverse().find((m, i) => i > 0 && m.role === "assistant");
  if (!(await checkScope({ text: last.content, previousAssistant: before?.content, kind: scopeKind(ctx.panel), hasAttachment: !!last.attachments?.length }))) {
    return { reply: refusalText(lang, scopeKind(ctx.panel)), steps: [], changed: false };
  }

  // Only the two most recent messages with attachments carry them again; older ones are just noted.
  const withFiles = input.history.map((m, i) => (m.role === "user" && m.attachments?.length ? i : -1)).filter((i) => i >= 0).slice(-2);
  const prepared: { parts: OpenAI.Chat.ChatCompletionContentPart[] }[] = [];
  const errors: string[] = [];
  for (let i = 0; i < input.history.length; i++) {
    if (withFiles.includes(i)) {
      const p = await prepareAttachments(input.history[i].attachments);
      prepared[i] = { parts: p.parts };
      errors.push(...p.errors);
    }
  }
  const system = (ctx.cms ? `${await cmsSystem("")}\n\n` : "") + (await systemPrompt(ctx, input.page));
  const run: Run = { messages: [{ role: "system", content: system }, ...historyMessages(input.history, prepared)], steps: [], changed: false, autoApprove: !!input.autoApprove };
  const out = await stepLoop(ctx, run);
  return errors.length ? { ...out, attachmentErrors: errors } : out;
}

export async function decideProposal(input: { user: AgentUser; panel: string; proposalId: string; decision: "approve" | "reject"; confirmed?: boolean; note?: string; autoApprove?: boolean; lang?: Lang }): Promise<AgentResponse> {
  setAiFeature(`Ask AI · ${input.panel}`);
  const peeked = await peekProposal(input.proposalId, input.user.id);
  const ctx = await buildCtx(input.user, input.panel, peeked?.lang ?? input.lang ?? "english");
  if (input.decision === "approve" && !input.confirmed && peeked?.calls.some((c) => c.destructive)) return { reply: say("needsConfirm", ctx.lang) };
  const claimed = await claimProposal(input.proposalId, input.user.id, input.decision === "approve" ? "running" : "rejected");
  if (!claimed) return { reply: say("expired", ctx.lang) };
  if (claimed.panel !== ctx.panel) return { reply: say("wrongPanel", ctx.lang) };
  const p: StoredProposal = claimed;
  const run: Run = { messages: [...p.messages], steps: [...p.steps], changed: p.changed, autoApprove: input.autoApprove ?? p.autoApprove };
  const toolMsg = (id: string, out: Json): Msg => ({ role: "tool", tool_call_id: id, content: JSON.stringify(out).slice(0, RESULT_CAP) });

  if (input.decision === "reject") {
    for (const c of p.calls) run.messages.push(toolMsg(c.id, { rejected: true, note: input.note?.slice(0, 500) || "The person did not approve this change. Nothing was changed." }));
    run.messages.push({ role: "user", content: `[I rejected that proposal.${input.note ? ` Reason: ${input.note.slice(0, 500)}` : ""} Don't make the change; ask what I'd like instead.]` });
    await finishProposal(p._id);
    return stepLoop(ctx, run);
  }

  let failed = false;
  for (const c of p.calls) {
    if (failed) { run.messages.push(toolMsg(c.id, err("Skipped because an earlier change failed."))); run.steps.push({ label: c.tool.replace(/_/g, " "), ok: false }); continue; }
    const out = await executeWrite(c, ctx);
    const ok = !("error" in out);
    if (ok) run.changed = true; else failed = true;
    run.steps.push({ label: c.tool === "run_action" ? String((c.args as Json).action) : `${c.tool.replace(/_/g, " ")}${c.args.entity ? ` · ${String(c.args.entity)}` : ""}`, ok });
    run.messages.push(toolMsg(c.id, out));
  }
  await finishProposal(p._id);
  return stepLoop(ctx, run);
}

