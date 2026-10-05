import "server-only";
import { createConsoleEmailProvider } from "@/lib/platform/email/console";
import { createResendEmailProvider } from "@/lib/platform/email/resend";
import type { EmailMessage, EmailProvider, EmailResult } from "@/lib/platform/email/types";
import { resolveEmailConfig, type ResolvedEmailConfig } from "@/lib/platform/integrations/resolve";
import { createSmtpEmailProvider } from "@/lib/platform/email/smtp";
import { createSendgridEmailProvider } from "@/lib/platform/email/sendgrid";
import { getSavedConnection } from "@/lib/platform/connections/store";
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
 * The WORKSPACE's own email connection (Workspace → Settings → Integrations: SMTP, Resend or SendGrid), when it has one.
 * Mail sent while serving a company goes out through the company's own account and sender; otherwise it falls back to the
 * platform's provider below. SMTP wins over Resend over SendGrid when several are connected.
 */
async function workspaceEmail(): Promise<{ provider: EmailProvider; from: string } | null> {
  if (!(await currentCompanyIdOrNull())) return null;
  const smtp = await getSavedConnection("smtp");
  if (smtp?.host && smtp.fromEmail) return { provider: createSmtpEmailProvider(smtp), from: smtp.fromName ? `${smtp.fromName} <${smtp.fromEmail}>` : smtp.fromEmail };
  const resend = await getSavedConnection("resend");
  if (resend?.apiKey && resend.from) return { provider: createResendEmailProvider(resend.apiKey), from: resend.from };
  const sendgrid = await getSavedConnection("sendgrid");
  if (sendgrid?.apiKey && sendgrid.from) return { provider: createSendgridEmailProvider(sendgrid.apiKey), from: sendgrid.from };
  return null;
}

/** The platform's default sender, e.g. `SelfRun Business <no-reply@selfrunbusiness.ai>`. */
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
    const own = await workspaceEmail().catch(() => null);
    const cfg = own ? null : await resolveEmailConfig();
    const provider = own ? own.provider : providerFor(cfg!);
    const result = await provider.send({ ...message, from: message.from ?? own?.from ?? cfg!.from });
    if (!result.ok) console.error(`[email:${provider.id}] send failed`, result.error);
    return result;
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
