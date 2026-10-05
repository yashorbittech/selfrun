/**
 * The third-party services a workspace can connect — ONE place, for the whole company. Configure a service here once
 * and every panel and automation uses it (OpenAI for the AI features everywhere, SMTP/Twilio for notifications,
 * ElevenLabs for voice, Google for search data, the social apps for publishing …). Each company brings its own
 * accounts: nothing is shared with the platform or with other companies.
 *
 * Pure data (client-safe). The saved values live in `workspace_connections` (see `store.ts`), secrets encrypted.
 */

export type FieldKind = "text" | "secret" | "textarea" | "select";

export interface ConnectionField {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export type ConnectionGroup = "email" | "messaging" | "ai" | "social" | "search" | "realtime" | "payments" | "other";

export const GROUP_LABELS: Record<ConnectionGroup, { title: string; description: string }> = {
  email: { title: "Email", description: "How your workspace sends emails — invitations, notifications, reports and automations." },
  messaging: { title: "SMS & WhatsApp", description: "Text and WhatsApp messages from your automations and panels." },
  ai: { title: "AI & Voice", description: "Your own AI keys. Powers the assistants, chatbots, content generation and voice in every panel." },
  social: { title: "Social & Advertising", description: "App credentials for publishing to Facebook, Instagram, LinkedIn, YouTube and Google Business." },
  search: { title: "Search & Analytics", description: "Google Search Console, Analytics, Indexing and PageSpeed for your SEO panel." },
  realtime: { title: "Calls & Realtime", description: "Servers behind Messenger voice and video calls." },
  payments: { title: "Payments", description: "Collect money and pay out from your own accounts." },
  other: { title: "Website, domains & automation", description: "Managed in their own settings — shown here so everything is in one place." },
};

export interface ConnectionProvider {
  key: string;
  name: string;
  group: ConnectionGroup;
  description: string;
  /** Panels / features that use it. */
  usedBy: string[];
  fields: ConnectionField[];
  docsUrl?: string;
  /** Has a "Test connection" check. */
  testable?: boolean;
  /** Configured on another settings page: this entry only shows the status and links there. */
  managedElsewhere?: { href: string; label: string };
  /** Shown as a note under the form. */
  note?: string;
}

const secret = (key: string, label: string, help?: string, required = true): ConnectionField => ({ key, label, kind: "secret", help, required });
const text = (key: string, label: string, placeholder?: string, help?: string, required = true): ConnectionField => ({ key, label, kind: "text", placeholder, help, required });

export const CONNECTION_PROVIDERS: ConnectionProvider[] = [
  // ── Email ────────────────────────────────────────────────────────────
  {
    key: "smtp", name: "SMTP", group: "email", testable: true,
    description: "Send workspace email through any SMTP server — your own mail host, Google Workspace, Microsoft 365, Zoho, Amazon SES, Brevo and more.",
    usedBy: ["Invitations", "Notifications", "Automations", "HRMS", "Billing mails", "Reports"],
    fields: [
      text("host", "SMTP host", "smtp.yourcompany.com"),
      text("port", "Port", "587", "587 (STARTTLS) or 465 (SSL) are the usual ones."),
      { key: "secure", label: "Encryption", kind: "select", defaultValue: "starttls", options: [{ value: "starttls", label: "STARTTLS (port 587)" }, { value: "ssl", label: "SSL/TLS (port 465)" }, { value: "none", label: "None" }] },
      text("username", "Username", "you@yourcompany.com"),
      secret("password", "Password / app password"),
      text("fromEmail", "From email", "no-reply@yourcompany.com"),
      text("fromName", "From name", "Your Company", undefined, false),
    ],
  },
  {
    key: "resend", name: "Resend", group: "email", testable: true, docsUrl: "https://resend.com/docs",
    description: "Send workspace email through Resend's API.",
    usedBy: ["Invitations", "Notifications", "Automations", "Reports"],
    fields: [secret("apiKey", "API key", "Starts with re_"), text("from", "From address", "Your Company <no-reply@yourcompany.com>")],
  },
  {
    key: "sendgrid", name: "SendGrid", group: "email", testable: true, docsUrl: "https://docs.sendgrid.com",
    description: "Send workspace email through SendGrid's API.",
    usedBy: ["Invitations", "Notifications", "Automations", "Reports"],
    fields: [secret("apiKey", "API key", "Starts with SG."), text("from", "From address", "no-reply@yourcompany.com", "Must be a verified sender in SendGrid.")],
  },
  // ── SMS & WhatsApp ───────────────────────────────────────────────────
  {
    key: "twilio", name: "Twilio", group: "messaging", testable: true, docsUrl: "https://www.twilio.com/docs",
    description: "Send SMS and WhatsApp messages from automations (and any panel that notifies by text).",
    usedBy: ["Automations", "Notifications", "OTPs & reminders"],
    fields: [
      text("accountSid", "Account SID", "AC…"), secret("authToken", "Auth token"),
      text("smsFrom", "SMS sender number / Messaging Service SID", "+14155550123", "Used for SMS.", false),
      text("whatsappFrom", "WhatsApp sender", "whatsapp:+14155550123", "Your approved WhatsApp sender, if you use WhatsApp.", false),
    ],
  },
  {
    key: "whatsapp-cloud", name: "WhatsApp Business (Meta Cloud API)", group: "messaging", testable: true, docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    description: "Send WhatsApp messages straight through Meta's WhatsApp Business Cloud API.",
    usedBy: ["Automations", "Notifications"],
    fields: [text("phoneNumberId", "Phone number ID", "1234567890"), secret("accessToken", "Permanent access token"), text("businessAccountId", "Business account ID", undefined, undefined, false)],
  },
  // ── AI & Voice ───────────────────────────────────────────────────────
  {
    key: "openai", name: "OpenAI", group: "ai", testable: true, docsUrl: "https://platform.openai.com/api-keys",
    description: "Your OpenAI key powers every AI feature in the workspace: the website chatbot, AI Bots, Intelligence, social-content generation and the business assistant. AI usage is billed to your OpenAI account.",
    usedBy: ["AI Bots", "Website chatbot (LMS)", "Intelligence", "SMMS content generator", "Workspace assistant", "Knowledge bases"],
    fields: [secret("apiKey", "API key", "Starts with sk-"), text("organization", "Organization ID", "org_…", "Optional.", false), text("project", "Project ID", "proj_…", "Optional.", false)],
  },
  {
    key: "elevenlabs", name: "ElevenLabs", group: "ai", testable: true, docsUrl: "https://elevenlabs.io/docs",
    description: "Voice for the website chatbot — speech-to-text and natural text-to-speech.",
    usedBy: ["Website chatbot voice mode"],
    fields: [secret("apiKey", "API key")],
  },
  // ── Social & Advertising ─────────────────────────────────────────────
  {
    key: "meta", name: "Facebook & Instagram (Meta app)", group: "social", docsUrl: "https://developers.facebook.com/apps",
    description: "Your Meta developer app. After saving it, connect your Pages and Instagram accounts from the Social Media panel.",
    usedBy: ["Social Media (SMMS)"],
    managedElsewhere: undefined,
    fields: [text("appId", "App ID"), secret("appSecret", "App secret")],
    note: "Set the app's OAuth redirect URL to  <your workspace address>/api/smms/oauth/meta  (shown in the Social Media panel).",
  },
  {
    key: "google", name: "YouTube & Google Business (Google OAuth app)", group: "social", docsUrl: "https://console.cloud.google.com/apis/credentials",
    description: "Your Google OAuth client for YouTube and Google Business Profile publishing. Connect the accounts from the Social Media panel afterwards.",
    usedBy: ["Social Media (SMMS)"],
    fields: [text("clientId", "OAuth client ID"), secret("clientSecret", "OAuth client secret")],
    note: "Authorised redirect URI:  <your workspace address>/api/smms/oauth/google",
  },
  {
    key: "linkedin", name: "LinkedIn (app)", group: "social", docsUrl: "https://www.linkedin.com/developers/apps",
    description: "Your LinkedIn app for publishing to your company page and profile.",
    usedBy: ["Social Media (SMMS)"],
    fields: [text("clientId", "Client ID"), secret("clientSecret", "Client secret")],
    note: "Authorised redirect URL:  <your workspace address>/api/smms/oauth/linkedin",
  },
  // ── Search & Analytics ───────────────────────────────────────────────
  {
    key: "google-service-account", name: "Google (Search Console, Analytics & Indexing)", group: "search", testable: true, docsUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    description: "A Google service account that reads your Search Console and Analytics 4 data and requests indexing. Add its email as a user on your Search Console property and GA4 property.",
    usedBy: ["SEO panel", "Indexing requests", "Dashboard SEO stats"],
    fields: [
      text("clientEmail", "Service-account email", "name@project.iam.gserviceaccount.com"),
      { key: "privateKey", label: "Private key", kind: "secret", required: true, help: "The private_key value from the JSON key file (-----BEGIN PRIVATE KEY-----…)." },
    ],
  },
  {
    key: "pagespeed", name: "Google PageSpeed Insights", group: "search", testable: true, docsUrl: "https://developers.google.com/speed/docs/insights/v5/get-started",
    description: "API key for page-speed audits in the SEO panel.",
    usedBy: ["SEO panel"],
    fields: [secret("apiKey", "API key")],
  },
  // ── Calls & Realtime ─────────────────────────────────────────────────
  {
    key: "turn", name: "TURN server (calls)", group: "realtime",
    description: "Relay server for Messenger voice and video calls behind strict firewalls. Optional — calls work on most networks without it.",
    usedBy: ["Messenger calls"],
    fields: [text("url", "TURN URL", "turn:turn.yourcompany.com:3478"), text("username", "Username", undefined, undefined, false), secret("credential", "Credential", undefined, false)],
  },
  // ── Managed on their own pages ───────────────────────────────────────
  {
    key: "razorpay", name: "Razorpay", group: "payments", description: "Collect invoice payments and pay salaries from your own Razorpay account.", usedBy: ["Finance", "Payroll", "Payment links"],
    fields: [], managedElsewhere: { href: "/workspace/settings/payments", label: "Payments settings" },
  },
  {
    key: "website-tracking", name: "Analytics, tracking & site verification", group: "other",
    description: "Google Analytics, Tag Manager, Clarity, Meta Pixel, live chat, any custom script, and Search Console / Bing verification for your website.",
    usedBy: ["Website"], fields: [], managedElsewhere: { href: "/cms/settings", label: "CMS → Settings" },
  },
  {
    key: "domains", name: "Custom domain", group: "other", description: "Serve your workspace and website from your own domain with automatic SSL.", usedBy: ["Website", "Workspace"],
    fields: [], managedElsewhere: { href: "/workspace/settings/domains", label: "Domains" },
  },
  {
    key: "webhooks", name: "Webhooks & automations", group: "other", description: "Send signed webhooks and run email, in-app and SMS actions when something happens.", usedBy: ["Automations"],
    fields: [], managedElsewhere: { href: "/workspace/settings/automations", label: "Automations" },
  },
  {
    key: "social-accounts", name: "Connected social accounts", group: "other", description: "Connect and manage your Facebook, Instagram, LinkedIn, YouTube and Google Business accounts.", usedBy: ["Social Media"],
    fields: [], managedElsewhere: { href: "/smms", label: "Social Media panel" },
  },
];

export const providerByKey = new Map(CONNECTION_PROVIDERS.map((p) => [p.key, p]));
