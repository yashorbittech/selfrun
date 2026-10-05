import "server-only";
import OpenAI from "openai";
import { unstable_rethrow } from "next/navigation";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";
import { assertAiAvailable, meterAiTokens } from "@/lib/platform/billing/enforce";
import { connectionValues } from "@/lib/platform/connections/resolve";

// One client per distinct credential set (a workspace brings its own OpenAI key — Workspace → Settings → Integrations),
// reused across hot reloads and invocations. Created lazily, so a workspace without a key only gets a clear error when it
// actually tries to use AI.
const globalForOpenAI = globalThis as unknown as { _openAIClients?: Map<string, OpenAI> };

export const OPENAI_NOT_CONNECTED = "OpenAI isn't connected for this workspace. Add your OpenAI API key in Workspace → Settings → Integrations.";

export async function getOpenAI(): Promise<OpenAI> {
  const creds = await connectionValues("openai");
  if (!creds?.apiKey) throw new Error(OPENAI_NOT_CONNECTED);
  const clients = (globalForOpenAI._openAIClients ??= new Map());
  const id = `${creds.apiKey}|${creds.organization ?? ""}|${creds.project ?? ""}`;
  let metered = clients.get(id);
  if (!metered) {
    metered = meteredClient(new OpenAI({ apiKey: creds.apiKey, organization: creds.organization || undefined, project: creds.project || undefined }));
    clients.set(id, metered);
  }
  return metered;
}

// ---------------------------------------------------------------------------
// Plan enforcement: every token-consuming call made through getOpenAI() is
// checked against the company's monthly AI allowance first (throws a friendly
// BillingLimitError when it's used up) and metered afterwards from the
// response's `usage` — streamed replies are metered when their final event
// arrives. Other endpoints (files, vector stores, conversations) pass through.
// ---------------------------------------------------------------------------

type Usage = { total_tokens?: number; input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number } | null | undefined;

function tokensOf(usage: Usage): number {
  if (!usage) return 0;
  if (typeof usage.total_tokens === "number") return usage.total_tokens;
  return (usage.input_tokens ?? usage.prompt_tokens ?? 0) + (usage.output_tokens ?? usage.completion_tokens ?? 0);
}

/** Usage carried by a stream event (Responses: `response.completed` etc.; Chat Completions: the final chunk). */
function streamEventUsage(event: unknown): Usage {
  if (!event || typeof event !== "object") return null;
  const e = event as { response?: { usage?: Usage }; usage?: Usage };
  return e.response?.usage ?? e.usage ?? null;
}

function meterStream<T extends object>(stream: T, companyId: string): T {
  let metered = false;
  return new Proxy(stream, {
    get(target, prop) {
      if (prop === Symbol.asyncIterator) {
        return () => {
          const it = (target as unknown as AsyncIterable<unknown>)[Symbol.asyncIterator]();
          return {
            async next() {
              const r = await it.next();
              if (!r.done && !metered) {
                const tokens = tokensOf(streamEventUsage(r.value));
                if (tokens > 0) {
                  metered = true;
                  await meterAiTokens(tokens, companyId);
                }
              }
              return r;
            },
            return: it.return ? (v?: unknown) => it.return!(v) : undefined,
            throw: it.throw ? (e?: unknown) => it.throw!(e) : undefined,
            [Symbol.asyncIterator]() {
              return this;
            },
          };
        };
      }
      const v = Reflect.get(target, prop, target);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

function meteredMethod(owner: object, fn: (...args: unknown[]) => unknown) {
  return async (...args: unknown[]) => {
    let companyId: string | null = null;
    try {
      companyId = await currentCompanyIdOrNull();
    } catch (err) {
      unstable_rethrow(err);
    }
    // Outside any company (scripts) there is no plan to check or meter against.
    if (companyId) await assertAiAvailable();
    const result = await fn.apply(owner, args);
    const streaming = Boolean((args[0] as { stream?: boolean } | undefined)?.stream);
    if (companyId && streaming && result && typeof result === "object" && Symbol.asyncIterator in result) return meterStream(result, companyId);
    if (companyId) await meterAiTokens(tokensOf((result as { usage?: Usage } | null)?.usage), companyId);
    return result;
  };
}

/** Wraps `resource[method]` (e.g. `responses.create`) with the check + meter; everything else is untouched. */
function wrapResource<T extends object>(resource: T, methods: string[], children: Record<string, string[]> = {}): T {
  return new Proxy(resource, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target);
      if (typeof prop === "string" && methods.includes(prop) && typeof v === "function") return meteredMethod(target, v as (...args: unknown[]) => unknown);
      if (typeof prop === "string" && prop in children && v && typeof v === "object") return wrapResource(v as object, children[prop]);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

function meteredClient(client: OpenAI): OpenAI {
  const wrapped: Record<string, [string[], Record<string, string[]>?]> = {
    responses: [["create"]],
    images: [["generate", "edit"]],
    embeddings: [["create"]],
    chat: [[], { completions: ["create"] }],
  };
  return new Proxy(client, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target);
      if (typeof prop === "string" && prop in wrapped && v && typeof v === "object") {
        const [methods, children] = wrapped[prop];
        return wrapResource(v as object, methods, children);
      }
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** True when this workspace has an OpenAI key (its own, from Integrations). */
export async function isOpenAIConfigured(): Promise<boolean> {
  return Boolean((await connectionValues("openai"))?.apiKey);
}

/**
 * True when OpenAI rejected a request because the model doesn't accept `param`
 * (e.g. reasoning models refuse `temperature`) — callers retry without it.
 */
export function isUnsupportedParamError(err: unknown, param: string): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; param?: string; message?: string };
  if (e.status !== 400) return false;
  if (e.param === param) return true;
  return typeof e.message === "string" && e.message.toLowerCase().includes(param);
}
