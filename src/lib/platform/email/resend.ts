import type { EmailProvider } from "@/lib/platform/email/types";

/**
 * Resend (https://resend.com) over its REST API — no SDK dependency. The API
 * key is resolved server-side by `integrations/` (Platform Panel →
 * Integrations, else `RESEND_API_KEY`).
 */
export function createResendEmailProvider(apiKey: string | null): EmailProvider {
  return {
    id: "resend",
    async send(message) {
      if (!apiKey) return { ok: false, error: "The Resend API key is not configured" };
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: message.from,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
      if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${body.message ?? body.name ?? "request failed"}` };
      return { ok: true, id: body.id ?? null };
    },
  };
}
