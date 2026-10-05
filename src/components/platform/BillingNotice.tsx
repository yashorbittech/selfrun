import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { AlertTriangle, ArrowRight, Lock, Timer } from "lucide-react";
import { BILLING_SETTINGS_PATH, getBillingNotice, type BillingNoticeInfo } from "@/lib/platform/billing/enforce";
import { cn } from "@/lib/utils";

/**
 * Compact subscription pill shown at the top of every business panel: trial days
 * left, payment overdue, grace period, suspended / ended (read-only). Renders
 * nothing for an active subscription or the platform owner, and never breaks
 * the panel — a lookup failure just hides it.
 */

const days = (n: number | null) => (n === null ? "" : n <= 0 ? "ends today" : `${n} day${n === 1 ? "" : "s"} left`);

function copy(n: BillingNoticeInfo): { title: string; body: string; cta: string; tone: "info" | "warn" | "danger" } {
  const plan = n.planName ? `${n.planName} plan` : "plan";
  switch (n.status) {
    case "trialing":
      return { title: `Free trial${n.daysLeft !== null ? ` · ${days(n.daysLeft)}` : ""}`, body: `You're trying the ${plan}. Choose a plan to keep your workspace running after the trial.`, cta: "Choose a plan", tone: n.daysLeft !== null && n.daysLeft <= 3 ? "warn" : "info" };
    case "past_due":
      return { title: "Payment overdue", body: "Your last payment didn't go through. We'll retry automatically — update your payment method to avoid interruption.", cta: "Update payment", tone: "warn" };
    case "grace":
      return { title: `Grace period${n.daysLeft !== null ? ` · ${days(n.daysLeft)}` : ""}`, body: "Payment is still outstanding. Your workspace becomes read-only when the grace period ends.", cta: "Pay now", tone: "danger" };
    case "suspended":
      return { title: "Workspace is read-only", body: "Your subscription is suspended. You can view everything, but nothing new can be created until you renew.", cta: "Renew subscription", tone: "danger" };
    case "canceled":
      return { title: "Subscription ended", body: "Your workspace is read-only. Choose a plan to start making changes again.", cta: "Choose a plan", tone: "danger" };
  }
}

const TONES = {
  info: "border-primary/25 bg-primary/10 dark:border-border dark:bg-card text-foreground [&_svg.notice-icon]:text-primary",
  warn: "border-amber-500/30 bg-amber-500/10 dark:border-border dark:bg-card text-foreground [&_svg.notice-icon]:text-amber-600 dark:[&_svg.notice-icon]:text-amber-400",
  danger: "border-rose-500/30 bg-rose-500/10 dark:border-border dark:bg-card text-foreground [&_svg.notice-icon]:text-rose-600 dark:[&_svg.notice-icon]:text-rose-400",
};

export default async function BillingNotice({ className }: { className?: string }) {
  let notice: BillingNoticeInfo | null = null;
  try {
    notice = await getBillingNotice();
  } catch (err) {
    // Re-throw Next's own control flow (dynamic bailout, notFound) untouched.
    unstable_rethrow(err);
    console.error("[billing] notice lookup failed", err);
  }
  if (!notice) return null;
  const c = copy(notice);
  const Icon = notice.status === "trialing" ? Timer : notice.status === "suspended" || notice.status === "canceled" ? Lock : AlertTriangle;

  return (
    <div id="billing-notice" role="status" data-status={notice.status} title={c.body} className={cn("inline-flex max-w-full shrink-0 items-center gap-2 self-start rounded-full border py-1 pl-3 pr-1 text-xs backdrop-blur-md", TONES[c.tone], className)}>
      <Icon className="notice-icon size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate font-semibold">{c.title}</span>
      <Link href={BILLING_SETTINGS_PATH} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/70 dark:bg-background dark:hover:bg-muted px-2.5 py-1 font-semibold text-primary transition-colors hover:bg-background">
        {c.cta}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
