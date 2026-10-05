import "server-only";
import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntitlements } from "@/lib/platform/billing/entitlements";
import { getCompanySubscription } from "@/lib/platform/billing/subscription";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";
import { getBillingSettings } from "@/lib/platform/billing/settings";
import { effectiveSubscriptionStatus, neverPaid, trialDaysLeft } from "@/lib/platform/billing/lifecycle";

/**
 * Trial / read-only notice for the current company (server component).
 * - trialing: "X days left in your trial — Choose a plan"
 * - grace after the trial: "Your trial has ended — N days before read-only"
 * - suspended after the trial: "Your trial has ended — your data is safe…"
 * - suspended/canceled otherwise: the subscription has lapsed
 * Renders nothing for the platform owner, paying companies, or outside a company.
 * Links go to `/workspace/settings/billing` on the current host.
 */
export default async function TrialBanner({ className }: { className?: string }) {
  const companyId = await currentCompanyIdOrNull();
  if (!companyId) return null;
  const e = await getEntitlements();

  if (e.status === "trialing" && e.trialDaysLeft !== null) {
    const days = e.trialDaysLeft;
    const urgent = days <= 3;
    return (
      <div
        role="status"
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm",
          urgent ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200" : "border-border bg-muted/50 text-foreground",
          className,
        )}
      >
        <Clock className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          {days <= 0 ? "Your trial ends today" : `${days} day${days === 1 ? "" : "s"} left in your trial`}
          {e.planName && <span className="text-muted-foreground"> of {e.planName}</span>}
        </span>
        <Link href="/workspace/settings/billing" className="font-semibold text-primary underline-offset-4 hover:underline">
          Choose a plan
        </Link>
      </div>
    );
  }

  if (e.status === "grace") {
    const sub = await getCompanySubscription(companyId);
    if (sub && neverPaid(sub)) {
      const now = new Date();
      const { graceEndsAt } = effectiveSubscriptionStatus(sub, (await getBillingSettings()).billing.graceDays, now);
      const left = graceEndsAt ? trialDaysLeft(graceEndsAt, now) : 0;
      return (
        <div role="alert" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200", className)}>
          <Clock className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            Your trial has ended — {left <= 0 ? "the workspace becomes read-only today" : `${left} day${left === 1 ? "" : "s"} before the workspace becomes read-only`}.
          </span>
          <Link href="/workspace/settings/billing" className="font-semibold text-primary underline-offset-4 hover:underline">
            Choose a plan
          </Link>
        </div>
      );
    }
  }

  if (e.readOnly) {
    const sub = await getCompanySubscription(companyId);
    // A company that never paid (no billing period recorded) is read-only because its trial ended.
    const trialEnded = Boolean(sub?.trialEndsAt) && !sub?.currentPeriodStart;
    return (
      <div role="alert" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground", className)}>
        <Lock className="size-4 shrink-0 text-destructive" aria-hidden />
        <span className="min-w-0 flex-1">
          {trialEnded ? "Your trial has ended" : "Your subscription has lapsed"} — your data is safe; choose a plan to continue.
        </span>
        <Link href="/workspace/settings/billing" className="font-semibold text-primary underline-offset-4 hover:underline">
          Choose a plan
        </Link>
      </div>
    );
  }

  return null;
}
