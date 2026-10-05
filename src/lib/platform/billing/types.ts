import type { ModuleKey } from "@/lib/platform/onboarding/catalog";

/**
 * Billing contract shared by every Phase 2 workstream (plans, subscriptions,
 * enforcement, invoices, revenue). Client-safe — no data access here.
 * Money is always an integer in the smallest currency unit (paise for INR).
 */

/**
 * Billing cycles the platform knows about. Adding one (e.g. quarterly) means
 * adding a row here; each plan then chooses which cycles it offers and its
 * price for each (`Plan.intervals` / `Plan.prices`).
 */
export const BILLING_INTERVALS = [
  { id: "monthly", label: "Monthly", adjective: "per month", months: 1 },
  { id: "yearly", label: "Yearly", adjective: "per year", months: 12 },
] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number]["id"];
export const BILLING_INTERVAL_IDS: readonly BillingInterval[] = BILLING_INTERVALS.map((i) => i.id);

export interface PlanLimits {
  /** Max active user accounts (admin_users); null = unlimited. */
  seats: number | null;
  /** AI tokens per calendar month across all AI features; null = unlimited. */
  aiTokensPerMonth: number | null;
  /** File storage in MB; null = unlimited. */
  storageMb: number | null;
  /** Further numeric limits added in the Platform Panel (camelCase key); null = unlimited. */
  [key: string]: number | null;
}

/** Limits with a known meaning and label. Any other key in `PlanLimits` is a custom limit. */
export const PLAN_LIMIT_DEFS = [
  { key: "seats", label: "Seats (users)", unit: "users", min: 1 },
  { key: "aiTokensPerMonth", label: "AI tokens per month", unit: "tokens", min: 0 },
  { key: "storageMb", label: "Storage (MB)", unit: "MB", min: 0 },
] as const;

/**
 * Capability flags a plan can switch on (enforced by the feature that owns
 * each one; shown on pricing). Adding a flag = adding a row here.
 */
export const PLAN_FLAGS = [
  { key: "customDomain", label: "Custom domain" },
  { key: "whiteLabel", label: "White-label branding" },
  { key: "apiAccess", label: "API access" },
  { key: "prioritySupport", label: "Priority support" },
] as const;
export type PlanFlag = (typeof PLAN_FLAGS)[number]["key"];

/**
 * One immutable price point of a plan. Editing a plan's prices, cycles or
 * currency appends a new version instead of rewriting history; subscriptions
 * remember the version they bought (`CompanySubscription.priceVersion`).
 */
export interface PlanPriceVersion {
  version: number;
  currency: string;
  intervals: BillingInterval[];
  prices: Partial<Record<BillingInterval, number>>;
  effectiveFrom: Date;
  /** admin_users id, or "seed". */
  createdBy: string;
  /** Provider plan ids that were live for this version (retired when superseded). */
  provider?: { razorpay?: Partial<Record<BillingInterval, string>> };
}

export interface Plan {
  /** Stable key, e.g. "starter". */
  _id: string;
  name: string;
  description: string;
  currency: string;
  /**
   * Per month / per year, smallest currency unit, before tax. Kept in step
   * with `prices` for code written before billing cycles were configurable;
   * new code should read `planPrice(plan, interval)` (billing/pricing.ts).
   */
  priceMonthly: number;
  priceYearly: number;
  /** Billing cycles offered (absent on older docs = monthly + yearly). */
  intervals?: BillingInterval[];
  /** Price per offered cycle (paise, before tax). Absent on older docs = priceMonthly/priceYearly. */
  prices?: Partial<Record<BillingInterval, number>>;
  /** Current price version (see `priceHistory`). Absent on older docs = 1. */
  priceVersion?: number;
  /** Every price version ever offered, oldest first, current last. */
  priceHistory?: PlanPriceVersion[];
  /** Bullet points shown on the pricing page. */
  highlights?: string[];
  /** Capability flags (see `PLAN_FLAGS`). */
  flags?: string[];
  /** Panels included; "all" = every panel. Core panels (see MODULES.core) are always included. */
  modules: ModuleKey[] | "all";
  limits: PlanLimits;
  /** Free-trial length; null = the platform default (`getBillingSettings().billing.defaultTrialDays`). */
  trialDays: number | null;
  /** Shown on the pricing/checkout pages and selectable for new subscriptions. */
  active: boolean;
  /** Plan offered by default to new sign-ups (exactly one). */
  isDefault: boolean;
  sortOrder: number;
  /** Provider-side plan ids, created lazily by the subscriptions workstream. */
  provider?: { razorpay?: Partial<Record<BillingInterval, string>> };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription lifecycle:
 * trialing → active (paid) → past_due (payment failed, retrying) → grace (retries exhausted,
 * still usable for GRACE_DAYS) → suspended (read-only / blocked) ; canceled at any point.
 * `internal` = the platform owner (never billed).
 */
export type SubscriptionStatus = "internal" | "trialing" | "active" | "past_due" | "grace" | "suspended" | "canceled";

export interface CompanySubscription {
  planId: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  graceEndsAt: Date | null;
  provider: { id: "razorpay"; subscriptionId: string | null; customerId: string | null } | null;
  /** GST / billing details for invoices. */
  billingDetails?: { legalName: string; gstin: string | null; address: string; state: string; email: string } | null;
  /** Purchased (or complimentary) add-ons — see `addons.ts`. Missing = none. */
  addons?: CompanyAddon[];
  /** The plan price version this subscription was bought at (set at checkout); price edits never change it. */
  priceVersion?: number | null;
  /** Trial reminder thresholds (days left, e.g. 7/3/1) already emailed — see `billing/trials.ts`. */
  trialRemindersSent?: number[];
  /** A plan change scheduled with the provider for the end of the current period (subscriptions workstream). */
  pendingChange?: { planId: string; interval: BillingInterval; effectiveAt: Date | null; pricing?: SubscriptionPricing | null } | null;
  /** Failed-renewal bookkeeping for dunning (subscriptions workstream); reset on every successful charge. */
  dunning?: { failedPayments: number; pastDueSince: Date | null } | null;
  /** What the company is charged per cycle — the checkout quote (plan, coupon, add-ons) it subscribed with. */
  pricing?: SubscriptionPricing | null;
  /** The last successful charge (for invoices and pro-rata refunds on an immediate upgrade). */
  lastPayment?: { id: string; amount: number; currency: string; at: Date; periodStart: Date | null; periodEnd: Date | null } | null;
  /** A checkout started but not yet confirmed by Razorpay: the quote it was created with. */
  checkout?: { subscriptionId: string; pricing: SubscriptionPricing } | null;
  /** Set by the Platform Panel: never billed (status "internal") although not the platform owner. */
  complimentary?: boolean;
  updatedAt: Date;
}

/** One add-on held by a company (`companies.subscription.addons[]`). */
export interface CompanyAddon {
  addonId: string;
  quantity: number;
  addedAt: Date;
  /** Granted free by the platform: priced at 0 for this company. */
  complimentary?: boolean;
}

/** Snapshot of a checkout quote (`quoteCheckout`) with its tax worked out. Smallest currency unit. */
export interface SubscriptionPricing {
  planId: string;
  interval: BillingInterval;
  currency: string;
  couponCode: string | null;
  couponId: string | null;
  subtotal: number;
  discount: number;
  /** Pre-tax amount per cycle (what MRR is based on). */
  net: number;
  gst: number;
  gstRatePercent: number;
  /** Charged per cycle, tax-inclusive — the Razorpay plan amount. */
  total: number;
  quotedAt: Date;
  /** The quote's lines (plan, add-ons, discount; pre-tax/catalogue basis, discounts negative) — printed on invoices. */
  lines?: { kind: "plan" | "addon" | "discount"; refId: string; label: string; amount: number }[];
  /** The coupon redemption (`billing_coupon_redemptions`) this discount is billed against. */
  redemptionId?: string | null;
  /** Plan price version the plan line was priced at (becomes `CompanySubscription.priceVersion`). */
  priceVersion?: number | null;
}

/** Usage metrics metered per company per calendar month. */
export type UsageMetric = "ai_tokens" | "storage_mb" | "emails";

/** What the current company may do right now — the single question every panel asks. */
export interface Entitlements {
  planId: string | null;
  planName: string | null;
  status: SubscriptionStatus;
  /** null = all panels. */
  modules: Set<string> | null;
  limits: PlanLimits;
  /** Suspended/canceled: data stays visible but nothing new can be created. */
  readOnly: boolean;
  /** Days left in the trial (trialing only). */
  trialDaysLeft: number | null;
}

/**
 * First-run fallbacks only. The live values are platform settings
 * (`getBillingSettings()` in `settings.ts`), edited in the Platform Panel.
 */
export const GRACE_DAYS = 7;
export const DEFAULT_TRIAL_DAYS = 30;
export const GST_RATE = 0.18;

export function formatMoney(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
}
