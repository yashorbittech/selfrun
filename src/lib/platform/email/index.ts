import "server-only";
import { emailBlockReason } from "@/lib/platform/billing/enforce";
import { recordUsage } from "@/lib/platform/billing/usage";
import { createConsoleEmailProvider } from "@/lib/platform/email/console";
import { createResendEmailProvider } from "@/lib/platform/email/resend";
import type { EmailMessage, EmailProvider, EmailResult } from "@/lib/platform/email/types";
import { resolveEmailConfig, type ResolvedEmailConfig } from "@/lib/platform/integrations/resolve";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";

export type { EmailMessage, EmailResult } from "@/lib/platform/email/types";

/**
 * Outgoing email, behind a provider chosen at the platform level — never by
 * application code. Configured in Platform Panel → Integrations, falling back
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
export async function sendEmail(message: Omit<EmailMessage, "from"> & { from?: string }): Promise<EmailResult> {
  try {
    // A company's own monthly email allowance (never applied to the platform's own mail, which has no company).
    const blocked = await emailBlockReason().catch(() => null);
    if (blocked) return { ok: false, error: blocked };
    const own = await workspaceEmail().catch(() => null);
    const cfg = own ? null : await resolveEmailConfig();
    const provider = own ? own.provider : providerFor(cfg!);
    const result = await provider.send({ ...message, from: message.from ?? own?.from ?? cfg!.from });
    if (!result.ok) console.error(`[email:${provider.id}] send failed`, result.error);
    else await recordUsage("emails", 1).catch(() => {});
    return result;
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
