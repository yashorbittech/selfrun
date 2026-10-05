/**
 * How each MongoDB collection is treated by the company-scoped data layer
 * (`scoped-db.ts`). Every collection is company-scoped by default — a
 * collection only escapes scoping by being listed in GLOBAL_COLLECTIONS, so
 * forgetting to classify a new collection fails safe (isolated), never open.
 */

/** Platform-level collections: shared by every company, never scoped. */
export const GLOBAL_COLLECTIONS = new Set<string>([
  "companies",
  "company_domains",
  "platform_settings",
  "pending_signups",
  "signup_attempts",
  "login_handoffs",
  // Billing (platform-level: the platform bills companies)
  "billing_plans",
  "saas_invoices",
  "billing_webhook_events",
  "subscription_events",
  "billing_coupons",
  "billing_coupon_redemptions",
  "billing_addons",
  // Platform administration
  "platform_audit_log",
  "platform_roles",
  "platform_panels", // the Panel Registry (names, descriptions, global on/off)
  // Help & Support Center: the platform's own cross-company service (rows carry their companyId; see lib/support/db.ts)
  "support_requests",
  "support_messages",
  "support_articles",
  "support_config",
  "support_counters",
  // The SaaS product website: demo requests and contact messages from visitors who are not (yet) a company
  "saas_inquiries",
]);

/**
 * Company-scoped collections whose `_id` is a fixed, meaningful key rather
 * than a random id — counters (`_id: "project"`), settings singletons
 * (`_id: "main"`), sweep throttles (`_id: "notification_sweep"`), date-keyed
 * rollups, theme keys, idempotency keys. Two companies would collide on the
 * same `_id` in a shared collection, so the scoped layer stores these as
 * `<companyId>::<key>` and strips the prefix again on the way out; callers
 * keep using the bare key.
 */
export const KEYED_COLLECTIONS = new Set<string>([
  // Sequence counters
  "hrms_counters",
  "pms_counters",
  "prms_counters",
  "tms_counters",
  "fms_counters",
  "cms_counters",
  "chat_counters",
  "ots_counters",
  "portal_counters",
  "seo_counters",
  "sop_counters",
  // Settings / config singletons
  "aibots_settings",
  "cms_settings",
  "dlms_settings",
  "hrms_settings",
  "hrms_company",
  "hrms_payroll_config",
  "ots_settings",
  "pms_settings",
  "prms_settings",
  "seo_settings",
  "smms_settings",
  "sop_settings",
  "training_settings",
  "fms_tax_config",
  "ai_chatbot_config",
  // Sweep throttles
  "hrms_meta",
  "pms_meta",
  "prms_meta",
  "tms_meta",
  "chat_meta",
  // Date-keyed analytics rollups
  "chat_daily_rollup",
  "voice_analytics",
  "seo_search_daily",
  "seo_traffic_daily",
  // Keyed documents
  "cms_theme",
  "cms_forms", // _id = form key ("contact")
  "seo_page_content", // _id = page path
  "seo_sitemaps", // _id = URL
  "seo_search_rows", // _id = row index ("0", "1", …)
  "smms_integrations", // _id = provider ("meta", …)
  "aibots_bots", // the built-in "general" bot has a fixed _id
  "wallet_idempotency_locks",
  "fms_idempotency_keys",
  "billing_usage", // _id = <metric>:<yyyy-mm>
  "platform_payment_accounts", // _id = provider ("razorpay")
  "workspace_connections", // _id = provider key (Workspace → Settings → Integrations)
]);

export const KEY_SEPARATOR = "::";

export function isGlobalCollection(name: string): boolean {
  return GLOBAL_COLLECTIONS.has(name);
}

export function isKeyedCollection(name: string): boolean {
  return KEYED_COLLECTIONS.has(name);
}
