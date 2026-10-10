export interface EmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text alternative; always provide one for deliverability. */
  text: string;
  replyTo?: string;
}

export type EmailResult = { ok: true; id: string | null } | { ok: false; error: string };

export interface EmailProvider {
  id: string;
  send(message: EmailMessage): Promise<EmailResult>;
}
