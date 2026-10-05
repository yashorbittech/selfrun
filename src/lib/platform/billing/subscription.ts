import "server-only";
import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { COMPANIES_COLLECTION, type Company } from "@/lib/platform/tenancy/companies";
import { getDefaultPlan, getPlan } from "@/lib/platform/billing/plans";
import { type CompanySubscription } from "@/lib/platform/billing/types";
import { getBillingSettings } from "@/lib/platform/billing/settings";
import { resolveTrialDays } from "@/lib/platform/billing/pricing";
import { recordSubscriptionEvent } from "@/lib/platform/billing/events";

/**
 * A company's subscription lives on its registry document
 * (`companies.subscription`, platform-level) so routing, the console and
 * enforcement can all read it without entering the company's workspace.
 * The platform owner is `internal` (never billed, never limited).
 */

type CompanyWithSubscription = Company & { subscription?: CompanySubscription };

async function companies() {
  return (await getPlatformDb()).collection<CompanyWithSubscription>(COMPANIES_COLLECTION);
}

const INTERNAL: CompanySubscription = {
  planId: "internal",
  status: "internal",
  interval: "monthly",
  trialEndsAt: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  graceEndsAt: null,
  provider: null,
  updatedAt: new Date(0),
};

/**
 * The company's subscription. A company with none recorded (created before
 * billing existed) is treated as trialing the default plan from its creation
 * date — nothing is written until something changes it.
 */
export async function getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
  const company = await (await companies()).findOne({ _id: companyId }, { projection: { isPlatformOwner: 1, subscription: 1, createdAt: 1 } });
  if (!company) return null;
  if (company.isPlatformOwner) return INTERNAL;
  if (company.subscription) return company.subscription;
  const plan = await getDefaultPlan();
  const trialDays = resolveTrialDays(plan, (await getBillingSettings()).billing.defaultTrialDays);
  return {
    ...INTERNAL,
    planId: plan?._id ?? "trial",
    status: "trialing",
    trialEndsAt: new Date(company.createdAt.getTime() + trialDays * 86_400_000),
    updatedAt: company.createdAt,
  };
}

/** Starts a trial of the default (or given) plan — called when a company is created. */
export async function startTrial(companyId: string, planId?: string): Promise<CompanySubscription> {
  const plan = planId ? await getPlan(planId) : await getDefaultPlan();
  const trialDays = resolveTrialDays(plan, (await getBillingSettings()).billing.defaultTrialDays);
  const now = new Date();
  const sub: CompanySubscription = {
    ...INTERNAL,
    planId: plan?._id ?? "trial",
    status: "trialing",
    trialEndsAt: new Date(now.getTime() + trialDays * 86_400_000),
    updatedAt: now,
  };
  const res = await (await companies()).updateOne({ _id: companyId, isPlatformOwner: { $ne: true } }, { $set: { subscription: sub } });
  if (res.modifiedCount === 1) await recordSubscriptionEvent({ companyId, type: "trial_started", planId: sub.planId, interval: sub.interval, at: now });
  return sub;
}

/**
 * Partial update of a company's subscription (never the platform owner's — the
 * filter below excludes it). A non-owner company marked complimentary in the
 * Platform Panel is stored as "internal" and can still be changed back.
 */
export async function updateCompanySubscription(companyId: string, patch: Partial<CompanySubscription>): Promise<void> {
  const current = await getCompanySubscription(companyId);
  if (!current) return;
  await (await companies()).updateOne({ _id: companyId, isPlatformOwner: { $ne: true } }, { $set: { subscription: { ...current, ...patch, updatedAt: new Date() } } });
}
