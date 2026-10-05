import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { getCompanySubscription } from "@/lib/platform/billing/subscription";
import { getEntitlements } from "@/lib/platform/billing/entitlements";
import { getPlan, listPlans } from "@/lib/platform/billing/plans";
import { razorpayConfigured } from "@/lib/platform/billing/razorpay";
import { hasLiveSubscription } from "@/lib/platform/billing/subscriptions";
import type { PlanOption } from "@/lib/platform/billing/billing-details";
import { planPrice } from "@/lib/platform/billing/pricing";
import BillingManager, { type BillingView } from "@/components/platform/billing/BillingManager";
import {
  cancelSubscriptionAction,
  changePlanAction,
  confirmCheckoutAction,
  quoteAction,
  resumeSubscriptionAction,
  saveBillingDetailsAction,
  startCheckoutAction,
} from "./actions";

export const metadata: Metadata = { title: "Plan & billing", robots: { index: false, follow: false } };

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: title }]} title={<>{title}</>} description={<>{description}</>} />
<div className="mx-auto max-w-4xl space-y-4">
        {children}
      </div>
</div>
    </div>
  );
}

export default async function BillingSettingsPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  const companyId = await currentCompanyId();
  const sub = await getCompanySubscription(companyId);

  if (!sub || (sub.status === "internal" && !sub.complimentary)) {
    return (
      <Shell title="Plan & billing" description="Subscription and invoices for this workspace.">
        <GlassCard>
          <CardContent>
            <p className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Your workspace runs the platform — no subscription. Every panel is included, with no limits and no charges.
            </p>
          </CardContent>
        </GlassCard>
      </Shell>
    );
  }

  const [entitlements, plans, currentPlan, pendingPlan, configured] = await Promise.all([
    getEntitlements(),
    listPlans({ activeOnly: true }),
    getPlan(sub.planId),
    sub.pendingChange ? getPlan(sub.pendingChange.planId) : Promise.resolve(null),
    razorpayConfigured(),
  ]);
  const pricing = sub.pricing && sub.pricing.planId === sub.planId && sub.pricing.interval === sub.interval ? sub.pricing : null;

  const options: PlanOption[] = plans.map((p) => ({
    id: p._id,
    name: p.name,
    description: p.description,
    currency: p.currency,
    priceMonthly: planPrice(p, "monthly"),
    priceYearly: planPrice(p, "yearly"),
  }));

  const view: BillingView = {
    configured,
    // Entitlements apply time-based transitions (expired trial/grace) before the daily sweep persists them.
    status: entitlements.status,
    planId: sub.planId,
    planName: sub.status === "internal" ? "Complimentary" : (currentPlan?.name ?? sub.planId),
    interval: sub.interval,
    trialDaysLeft: entitlements.trialDaysLeft,
    trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    graceEndsAt: sub.graceEndsAt?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    hasLive: hasLiveSubscription(sub),
    chargedPerCycle: pricing ? { total: pricing.total, currency: pricing.currency, couponCode: pricing.couponCode } : null,
    pendingChange: sub.pendingChange
      ? { planId: sub.pendingChange.planId, planName: pendingPlan?.name ?? sub.pendingChange.planId, interval: sub.pendingChange.interval, effectiveAt: sub.pendingChange.effectiveAt?.toISOString() ?? null }
      : null,
    billingDetails: sub.billingDetails ?? null,
  };

  return (
    <Shell title="Plan & billing" description="Your plan, payments through Razorpay, and the details printed on your GST invoices.">
      <GlassCard>
        <CardContent>
          <BillingManager
            view={view}
            plans={options}
            actions={{
              quote: quoteAction,
              saveDetails: saveBillingDetailsAction,
              startCheckout: startCheckoutAction,
              confirmCheckout: confirmCheckoutAction,
              changePlan: changePlanAction,
              cancel: cancelSubscriptionAction,
              resume: resumeSubscriptionAction,
            }}
          />
        </CardContent>
      </GlassCard>
    </Shell>
  );
}
