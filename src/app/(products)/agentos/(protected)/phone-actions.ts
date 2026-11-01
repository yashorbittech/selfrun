"use server";

import { revalidatePath } from "next/cache";
import { runCallAction, type ActionResult } from "@/lib/products/agentos/calls/action-run";
import { addDoNotCall, removeDoNotCall } from "@/lib/products/agentos/calls/dnc";
import { assignInboundAgent, importTwilioNumber, removePhoneNumber, type PhoneNumberView } from "@/lib/products/agentos/calls/numbers";
import { getCallSettings, saveCallSettings, savePublicCallSettings, type PublicCallSettings } from "@/lib/products/agentos/calls/settings";
import { registerWebhookWithElevenLabs, resetWebhookUrl, saveWebhookSecret, type RegisterResult } from "@/lib/products/agentos/calls/webhook";
import type { CallSettings } from "@/lib/products/agentos/calls/types";
import { AibotsInputError } from "@/lib/products/agentos/viewer";

/**
 * Server actions of the Phone pages (numbers, call settings, do-not-call, webhook). Each one re-checks the session and
 * VOICE_CALL_MANAGE on the server; the engine functions check again.
 */

const manage = { permission: "VOICE_CALL_MANAGE" as const, write: true };
const refresh = (...paths: string[]) => paths.forEach((p) => revalidatePath(p));
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export async function importNumberAction(input: { number: string; label: string }): Promise<ActionResult<{ number: PhoneNumberView }>> {
  return runCallAction(manage, async (v) => {
    const number = await importTwilioNumber(v, { number: str(input?.number, 40), label: str(input?.label, 120) });
    refresh("/agentos/phone");
    return { number };
  });
}

export async function assignInboundAgentAction(numberId: string, agentId: string | null): Promise<ActionResult<{ number: PhoneNumberView }>> {
  return runCallAction(manage, async (v) => {
    const number = await assignInboundAgent(v, str(numberId, 64), agentId ? str(agentId, 64) : null);
    refresh("/agentos/phone");
    return { number };
  });
}

export async function removeNumberAction(numberId: string): Promise<ActionResult<{ removed: true }>> {
  return runCallAction(manage, async (v) => {
    await removePhoneNumber(v, str(numberId, 64));
    refresh("/agentos/phone");
    return { removed: true as const };
  });
}

export async function saveCallSettingsAction(raw: Record<string, unknown>): Promise<ActionResult<{ settings: CallSettings }>> {
  return runCallAction(manage, async (v) => {
    const settings = await saveCallSettings(v, raw && typeof raw === "object" ? raw : {});
    refresh("/agentos/phone/settings", "/agentos/phone");
    return { settings };
  });
}

export async function addDoNotCallAction(phone: string, reason: string): Promise<ActionResult<{ added: true }>> {
  return runCallAction(manage, async (v) => {
    await addDoNotCall(v, str(phone, 40), str(reason, 300));
    refresh("/agentos/phone/do-not-call");
    return { added: true as const };
  });
}

export async function removeDoNotCallAction(entryId: string): Promise<ActionResult<{ removed: true }>> {
  return runCallAction(manage, async (v) => {
    await removeDoNotCall(v, str(entryId, 64));
    refresh("/agentos/phone/do-not-call");
    return { removed: true as const };
  });
}

/** Issues a new webhook address (the old one stops working) and returns it once. */
export async function resetWebhookUrlAction(): Promise<ActionResult<{ url: string }>> {
  return runCallAction(manage, async (v) => {
    const url = await resetWebhookUrl(v);
    refresh("/agentos/phone");
    return { url };
  });
}

export async function saveWebhookSecretAction(secret: string): Promise<ActionResult<{ saved: true }>> {
  return runCallAction(manage, async (v) => {
    await saveWebhookSecret(v, str(secret, 400));
    refresh("/agentos/phone");
    return { saved: true as const };
  });
}

/** Tries to register the webhook in ElevenLabs. Always answers ok with the result, so the page can show the manual steps when it can't. */
export async function registerWebhookAction(): Promise<ActionResult<{ result: RegisterResult }>> {
  return runCallAction(manage, async (v) => {
    const result = await registerWebhookWithElevenLabs(v);
    refresh("/agentos/phone");
    return { result };
  });
}

/** Switches how calls are placed (automatic, conference or direct) without touching the other calling rules. */
export async function saveCallModeAction(mode: string): Promise<ActionResult<{ callMode: CallSettings["callMode"] }>> {
  return runCallAction(manage, async (v) => {
    if (mode !== "auto" && mode !== "conference" && mode !== "direct") throw new AibotsInputError("Pick automatic, conference or direct calling.");
    const cur = await getCallSettings();
    const settings = await saveCallSettings(v, { ...cur, callMode: mode });
    refresh("/agentos/phone", "/agentos/phone/settings");
    return { callMode: settings.callMode };
  });
}

/** Saves the website-call limits and the number-masking choice. */
export async function savePublicCallSettingsAction(raw: Record<string, unknown>): Promise<ActionResult<{ settings: PublicCallSettings }>> {
  return runCallAction(manage, async (v) => {
    const settings = await savePublicCallSettings(v, raw && typeof raw === "object" ? raw : {});
    refresh("/agentos/phone/settings", "/agentos/calls");
    return { settings };
  });
}
