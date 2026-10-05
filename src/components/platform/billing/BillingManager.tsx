"use client";

import PanelTabs from "@/components/platform/panel/PanelTabs";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, CreditCard, Loader2, RotateCcw, TicketPercent, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubscriptionStatusBadge from "@/components/platform/billing/SubscriptionStatusBadge";
import BillingDetailsForm, { type SaveBillingDetails } from "@/components/platform/billing/BillingDetailsForm";
import { openSubscriptionCheckout, type RazorpayHandlerResponse } from "@/components/platform/billing/razorpay-checkout";
import { formatMoney, type BillingInterval, type SubscriptionStatus } from "@/lib/platform/billing/types";
import type { BillingDetails, PlanOption, PriceSummary } from "@/lib/platform/billing/billing-details";

type Result = { ok: true; message?: string } | { ok: false; error: string };
type CheckoutResult = { ok: true; checkout: { key: string; subscriptionId: string; name: string; description: string; amount: number; currency: string; prefill: { name: string; email: string }; startsAt: string | null } } | { ok: false; error: string };

export interface BillingView {
  configured: boolean;
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  interval: BillingInterval;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasLive: boolean;
  /** Charged per cycle (tax-inclusive), when known. */
  chargedPerCycle: { total: number; currency: string; couponCode: string | null } | null;
  pendingChange: { planId: string; planName: string; interval: BillingInterval; effectiveAt: string | null } | null;
  billingDetails: BillingDetails | null;
}

export interface BillingActions {
  quote: (planId: string, interval: BillingInterval, couponCode: string | null) => Promise<{ ok: true; summary: PriceSummary } | { ok: false; error: string }>;
  saveDetails: SaveBillingDetails;
  startCheckout: (planId: string, interval: BillingInterval, couponCode: string | null) => Promise<CheckoutResult>;
  confirmCheckout: (response: RazorpayHandlerResponse) => Promise<Result>;
  changePlan: (planId: string, interval: BillingInterval, couponCode: string | null) => Promise<Result>;
  cancel: () => Promise<Result>;
  resume: () => Promise<CheckoutResult>;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{children}</dd>
    </div>
  );
}

export default function BillingManager({ view, plans, actions }: { view: BillingView; plans: PlanOption[]; actions: BillingActions }) {
  const router = useRouter();
  const initialPlan = plans.some((p) => p.id === view.planId) ? view.planId : (plans[0]?.id ?? "");
  const [planId, setPlanId] = useState(initialPlan);
  const [interval, setInterval] = useState<BillingInterval>(view.interval);
  const [couponInput, setCouponInput] = useState(view.chargedPerCycle?.couponCode ?? "");
  const [coupon, setCoupon] = useState<string | null>(view.chargedPerCycle?.couponCode ?? null);
  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [details, setDetails] = useState<BillingDetails | null>(view.billingDetails);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [quoting, startQuote] = useTransition();
  const [busy, startBusy] = useTransition();

  useEffect(() => {
    if (!planId) return;
    let alive = true;
    startQuote(async () => {
      const res = await actions.quote(planId, interval, coupon);
      if (!alive) return;
      if (res.ok) {
        setSummary(res.summary);
        setQuoteError(null);
      } else {
        setSummary(null);
        setQuoteError(res.error);
      }
    });
    return () => {
      alive = false;
    };
  }, [planId, interval, coupon, actions]);

  const samePlan = view.hasLive && planId === view.planId && interval === view.interval && (coupon ?? null) === (view.chargedPerCycle?.couponCode ?? null);
  const isInternal = view.status === "internal";

  async function runCheckout(res: CheckoutResult) {
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    const c = res.checkout;
    let failed: string | null = null;
    const response = await openSubscriptionCheckout({ key: c.key, subscriptionId: c.subscriptionId, name: c.name, description: c.description, prefill: c.prefill, onPaymentFailed: (m) => (failed = m) });
    if (!response) {
      setNotice(failed ? { tone: "error", text: failed } : { tone: "error", text: "Checkout closed — nothing was charged." });
      return;
    }
    const confirmed = await actions.confirmCheckout(response);
    setNotice(confirmed.ok ? { tone: "ok", text: confirmed.message ?? "Done." } : { tone: "error", text: confirmed.error });
    router.refresh();
  }

  function subscribeOrChange() {
    setNotice(null);
    startBusy(async () => {
      try {
        if (view.hasLive) {
          const res = await actions.changePlan(planId, interval, coupon);
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Plan updated." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        } else {
          await runCheckout(await actions.startCheckout(planId, interval, coupon));
        }
      } catch (err) {
        setNotice({ tone: "error", text: err instanceof Error ? err.message : "Something went wrong. Please try again." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <section aria-labelledby="billing-current" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="billing-current" className="text-base font-semibold">
            Current plan
          </h2>
          <SubscriptionStatusBadge status={view.status} cancelAtPeriodEnd={view.cancelAtPeriodEnd} complimentary={isInternal} />
        </div>
        <dl className="grid gap-4 rounded-xl border border-border/60 p-4 sm:grid-cols-4">
          <Row label="Plan">{view.planName}</Row>
          <Row label="Billing cycle">{view.interval === "yearly" ? "Yearly" : "Monthly"}</Row>
          {view.status === "trialing" ? (
            <Row label="Trial">
              {view.trialDaysLeft ?? 0} day{view.trialDaysLeft === 1 ? "" : "s"} left · ends {fmtDate(view.trialEndsAt)}
            </Row>
          ) : (
            <Row label={view.cancelAtPeriodEnd ? "Ends on" : "Next renewal"}>{fmtDate(view.currentPeriodEnd)}</Row>
          )}
          <Row label="Charged per cycle">{view.chargedPerCycle ? `${formatMoney(view.chargedPerCycle.total, view.chargedPerCycle.currency)} incl. GST` : "—"}</Row>
        </dl>
        {view.pendingChange && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarClock className="mt-0.5 size-4 shrink-0" />
            Moving to {view.pendingChange.planName} ({view.pendingChange.interval}) on {fmtDate(view.pendingChange.effectiveAt)}.
          </p>
        )}
        {(view.status === "past_due" || view.status === "grace") && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            {view.status === "past_due"
              ? "Your last payment failed. Razorpay is retrying automatically — make sure your payment method has funds."
              : `Payment is overdue. Your workspace stays fully usable until ${fmtDate(view.graceEndsAt)}; subscribe again below to keep access.`}
          </p>
        )}
        {(view.status === "suspended" || view.status === "canceled") && (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            Your workspace is read-only. Choose a plan below to restore full access — your data is safe.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {view.hasLive && !view.cancelAtPeriodEnd && (
            <Button
              type="button"
              variant="outline"
              id="billing-cancel"
              disabled={busy}
              onClick={() => {
                if (!window.confirm(view.status === "trialing" ? "Cancel your subscription? You won't be charged when the trial ends." : "Cancel at the end of this billing period? You keep full access until then.")) return;
                setNotice(null);
                startBusy(async () => {
                  const res = await actions.cancel();
                  setNotice(res.ok ? { tone: "ok", text: res.message ?? "Canceled." } : { tone: "error", text: res.error });
                  if (res.ok) router.refresh();
                });
              }}
            >
              <XCircle className="size-4" /> Cancel at period end
            </Button>
          )}
          {view.cancelAtPeriodEnd && (
            <Button
              type="button"
              id="billing-resume"
              disabled={busy || !view.configured || !details}
              onClick={() => {
                setNotice(null);
                startBusy(async () => runCheckout(await actions.resume()));
              }}
            >
              <RotateCcw className="size-4" /> Resume subscription
            </Button>
          )}
        </div>
      </section>

      {!isInternal && (
        <section aria-labelledby="billing-choose" className="space-y-4">
          <div>
            <h2 id="billing-choose" className="text-base font-semibold">
              {view.hasLive ? "Change plan" : "Choose a plan"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {view.hasLive ? "Upgrades apply immediately (a new period starts and the unused part of your last payment is refunded pro rata). Downgrades apply at the end of the current period." : "Paid through Razorpay by card, UPI or netbanking. You can cancel any time."}
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="sr-only">Billing cycle</legend>
            <PanelTabs label="Billing cycle" active={interval} onSelect={(k) => setInterval(k as typeof interval)} tabs={[{ key: "monthly", label: "Monthly" }, { key: "yearly", label: "Yearly" }]} />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Plan">
            {plans.map((p) => {
              const price = interval === "yearly" ? p.priceYearly : p.priceMonthly;
              const selected = planId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-plan={p.id}
                  disabled={price === null}
                  onClick={() => setPlanId(p.id)}
                  className={`min-w-0 rounded-xl border p-4 text-left transition-colors disabled:opacity-50 ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {p.id === view.planId && view.status !== "trialing" && <span className="text-xs text-muted-foreground">Current</span>}
                  </span>
                  <span className="mt-1 block text-lg font-bold tabular-nums">
                    {price === null ? (
                      <span className="text-sm font-normal text-muted-foreground">Not offered {interval}</span>
                    ) : (
                      <>
                        {formatMoney(price, p.currency)}
                        <span className="text-xs font-normal text-muted-foreground">/{interval === "yearly" ? "year" : "month"} + GST</span>
                      </>
                    )}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span>
                </button>
              );
            })}
          </div>

          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCoupon(couponInput.trim().toUpperCase() || null);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="billing-coupon">Coupon code</Label>
              <Input id="billing-coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} maxLength={64} autoCapitalize="characters" spellCheck={false} className="w-48 font-mono uppercase" />
            </div>
            <Button type="submit" variant="outline">
              <TicketPercent className="size-4" /> Apply
            </Button>
            {coupon && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
              >
                Remove
              </Button>
            )}
          </form>

          <div id="billing-price-summary" aria-live="polite" className="space-y-1.5 rounded-xl border border-border/60 p-4 text-sm">
            {quoteError ? (
              <p className="text-destructive">{quoteError}</p>
            ) : !summary ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Pricing…
              </p>
            ) : (
              <>
                {summary.lines.map((l, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span className="min-w-0">{l.label}</span>
                    <span className="tabular-nums">{l.amount < 0 ? `− ${formatMoney(-l.amount, summary.currency)}` : formatMoney(l.amount, summary.currency)}</span>
                  </div>
                ))}
                {summary.discount > 0 && !summary.lines.some((l) => l.kind === "discount") && (
                  <div className="flex justify-between gap-3">
                    <span>Discount</span>
                    <span className="tabular-nums">− {formatMoney(summary.discount, summary.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>GST ({summary.gstRatePercent}%{summary.pricesIncludeTax ? ", included" : ""})</span>
                  <span className="tabular-nums">{formatMoney(summary.gst, summary.currency)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-1.5 font-semibold">
                  <span>Total per {summary.interval === "yearly" ? "year" : "month"}</span>
                  <span className="tabular-nums" id="billing-total">
                    {formatMoney(summary.total, summary.currency)}
                  </span>
                </div>
                {summary.couponError && (
                  <p id="billing-coupon-error" className="text-destructive">
                    {summary.couponError}
                  </p>
                )}
                {summary.couponApplied && <p className="text-emerald-700 dark:text-emerald-400">Coupon {summary.couponCode} applied.</p>}
                {quoting && <p className="text-xs text-muted-foreground">Updating…</p>}
              </>
            )}
          </div>

          {!view.configured && <p className="text-sm text-muted-foreground">Online payments aren&apos;t available yet. Please contact support to subscribe.</p>}
          {!details && <p className="text-sm text-muted-foreground">Add your billing details below before subscribing — they go on your GST invoices.</p>}
          <Button
            type="button"
            id="billing-submit"
            size="lg"
            disabled={busy || quoting || !summary || Boolean(quoteError) || !view.configured || !details || samePlan || Boolean(coupon && summary?.couponError)}
            onClick={subscribeOrChange}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {view.hasLive ? "Change plan" : view.status === "trialing" ? "Subscribe — charged when the trial ends" : "Subscribe with Razorpay"}
          </Button>
        </section>
      )}

      {notice && (
        <p role="status" className={notice.tone === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700 dark:text-emerald-400"}>
          {notice.text}
        </p>
      )}

      <section aria-labelledby="billing-details-heading" className="space-y-3">
        <div>
          <h2 id="billing-details-heading" className="text-base font-semibold">
            Billing details
          </h2>
          <p className="text-sm text-muted-foreground">Printed on your GST invoices. Add your GSTIN to claim input tax credit.</p>
        </div>
        <BillingDetailsForm initial={details} save={actions.saveDetails} onSaved={setDetails} />
      </section>
    </div>
  );
}
