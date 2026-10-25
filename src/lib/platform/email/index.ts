import "server-only";
import { emailBlockReason } from "@/lib/platform/billing/enforce";
import { recordUsage } from "@/lib/platform/billing/usage";
import { createConsoleEmailProvider } from "@/lib/platform/email/console";
import { createResendEmailProvider } from "@/lib/platform/email/resend";
import { companyReplyTo, companySenderForSending, markSenderFailing } from "@/lib/platform/email/sender";
import type { EmailMessage, EmailProvider, EmailResult } from "@/lib/platform/email/types";
import { resolveEmailConfig, type ResolvedEmailConfig } from "@/lib/platform/integrations/resolve";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";

export type { EmailMessage, EmailResult } from "@/lib/platform/email/types";

/**
 * Outgoing email, behind a provider chosen at the platform level — never by
 * application code. Configured in Platform Console → Integrations, falling back
 * to `EMAIL_PROVIDER` (`resend` | `console`) / `RESEND_API_KEY` /
 * `EMAIL_FROM`; with nothing set it's Resend when an API key exists, else the
 * console adapter (development: the message is printed, nothing is sent).
 * Adding SES, SendGrid or SMTP means one adapter file and one case below.
 *
 * Server-only: provider credentials never reach the browser.
 */
export async function activeEmailProvider(): Promise<EmailProvider> {
  return providerFor(await resolveEmailConfig());
}

function providerFor(cfg: ResolvedEmailConfig): EmailProvider {
  return cfg.provider === "resend" ? createResendEmailProvider(cfg.resendApiKey) : createConsoleEmailProvider(cfg.explicit);
}

/**
 * Email is provided by the platform for every company: nothing a company saved is used, so mail always goes out through the platform's
 * provider and sender. (Kept as a function so the call sites below read the same.)
 */
async function workspaceEmail(): Promise<{ provider: EmailProvider; from: string } | null> {
  return null;
}

/** The platform's default sender, e.g. `SelfRun AI <no-reply@selfrunbusiness.ai>`. */
export async function defaultFrom(): Promise<string> {
  return (await resolveEmailConfig()).from;
}

/**
 * Sends one message. Never throws: a failed send is reported in the result
 * (and logged) so a flaky provider can't break the flow that triggered it —
 * callers decide whether the email was essential.
 */
/** `jane@acme.com` → `acme.com` (the history shows where mail went, not the person's address). */
function emailDomain(to: unknown): string {
  const first = Array.isArray(to) ? to[0] : to;
  const m = typeof first === "string" ? first.match(/@([^>\s,]+)/) : null;
  return m ? m[1].toLowerCase() : "recipient";
}

/**
 * Local development only: with `EMAIL_DEV_TO` set (and never in production), every message goes to that one inbox instead of its real
 * recipient, with the real recipient named in the subject. Needed while the email provider has no verified domain (it then only delivers
 * to the account owner's own address). Not set = mail goes to its real recipients as usual.
 */
function devRedirect<T extends { to: string | string[]; subject: string }>(message: T): T {
  const only = process.env.NODE_ENV === "production" ? "" : process.env.EMAIL_DEV_TO?.trim();
  if (!only) return message;
  const real = (Array.isArray(message.to) ? message.to : [message.to]).join(", ");
  return { ...message, to: only, subject: `[to: ${real}] ${message.subject}` };
}

export async function sendEmail(input: Omit<EmailMessage, "from"> & { from?: string }): Promise<EmailResult> {
  const message = devRedirect(input);
  try {
    // A company's own monthly email allowance (never applied to the platform's own mail, which has no company).
    const blocked = await emailBlockReason().catch(() => null);
    if (blocked) return { ok: false, error: blocked };
    const own = await workspaceEmail().catch(() => null);
    const cfg = own ? null : await resolveEmailConfig();
    const provider = own ? own.provider : providerFor(cfg!);
    // A company's own verified address wins; otherwise the platform's sender (replies still go to the company's reply-to when it set one).
    const mine = message.from || own || provider.id !== "resend" ? null : await companySenderForSending();
    const replyTo = message.replyTo ?? mine?.replyTo ?? (own ? undefined : await companyReplyTo());
    let result = await provider.send({ ...message, from: message.from ?? own?.from ?? mine?.from ?? cfg!.from, ...(replyTo ? { replyTo } : {}) });
    // The provider no longer accepts the company's domain (DNS changed, domain removed): send from the platform's sender now and mark it for a re-check.
    if (!result.ok && mine && /domain|verif|from/i.test(result.error)) {
      await markSenderFailing();
      result = await provider.send({ ...message, from: cfg!.from, ...(replyTo ? { replyTo } : {}) });
    }
    if (!result.ok) console.error(`[email:${provider.id}] send failed`, result.error);
    else await recordUsage("emails", 1, new Date(), { source: "Email sent", detail: `${String(message.subject ?? "").slice(0, 120)}${message.to ? ` → ${emailDomain(message.to)}` : ""}` }).catch(() => {});
    return result;
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
