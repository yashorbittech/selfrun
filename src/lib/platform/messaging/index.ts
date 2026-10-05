import "server-only";
import { connectionValues } from "@/lib/platform/connections/resolve";
import { getSavedConnection } from "@/lib/platform/connections/store";

/**
 * SMS and WhatsApp through the WORKSPACE's own accounts (Workspace → Settings → Integrations): Twilio for SMS and
 * WhatsApp, or Meta's WhatsApp Business Cloud API. Never throws — failures come back in the result.
 */
export type MessageResult = { ok: true; id: string | null } | { ok: false; error: string };

const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,18}$/;
export const isPhoneNumber = (v: string) => PHONE_RE.test(v.trim());
const digits = (v: string) => v.replace(/[^\d+]/g, "");
const E164 = (v: string) => (digits(v).startsWith("+") ? digits(v) : `+${digits(v)}`);

async function twilioSend(v: Record<string, string>, form: Record<string, string>): Promise<MessageResult> {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(v.accountSid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${v.accountSid}:${v.authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  return res.ok ? { ok: true, id: body.sid ?? null } : { ok: false, error: `Twilio ${res.status}: ${body.message ?? "request failed"}` };
}

export async function sendSms(to: string, body: string): Promise<MessageResult> {
  try {
    if (!isPhoneNumber(to)) return { ok: false, error: "That isn't a phone number." };
    const v = await connectionValues("twilio");
    if (!v?.accountSid || !v.authToken) return { ok: false, error: "Twilio isn't connected. Add it in Workspace → Settings → Integrations." };
    if (!v.smsFrom) return { ok: false, error: "Add an SMS sender number to your Twilio connection." };
    const sender: Record<string, string> = /^MG/i.test(v.smsFrom) ? { MessagingServiceSid: v.smsFrom } : { From: v.smsFrom };
    return await twilioSend(v, { To: E164(to), Body: body.slice(0, 1500), ...sender });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMS failed" };
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<MessageResult> {
  try {
    if (!isPhoneNumber(to)) return { ok: false, error: "That isn't a phone number." };
    const twilio = await getSavedConnection("twilio");
    if (twilio?.accountSid && twilio.authToken && twilio.whatsappFrom) {
      const from = twilio.whatsappFrom.startsWith("whatsapp:") ? twilio.whatsappFrom : `whatsapp:${twilio.whatsappFrom}`;
      return await twilioSend(twilio, { To: `whatsapp:${E164(to)}`, From: from, Body: body.slice(0, 1500) });
    }
    const cloud = await connectionValues("whatsapp-cloud");
    if (cloud?.phoneNumberId && cloud.accessToken) {
      const res = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(cloud.phoneNumberId)}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cloud.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: E164(to).replace("+", ""), type: "text", text: { body: body.slice(0, 4000) } }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
      return res.ok ? { ok: true, id: data.messages?.[0]?.id ?? null } : { ok: false, error: `WhatsApp ${res.status}: ${data.error?.message ?? "request failed"}` };
    }
    return { ok: false, error: "WhatsApp isn't connected. Add Twilio (with a WhatsApp sender) or WhatsApp Business in Workspace → Settings → Integrations." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "WhatsApp failed" };
  }
}
