"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Check, CreditCard, Crown, Gift, Loader2, Lock, Receipt, RotateCcw, ShieldCheck, Sparkles, TicketPercent, XCircle, Zap } from "lucide-react";
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

const SECTIONS = [
  { id: "billing-overview", label: "Overview" },
  { id: "billing-plans-section", label: "Plans" },
  { id: "billing-checkout", label: "Checkout" },
  { id: "billing-usage-section", label: "Usage" },
  { id: "billing-details", label: "Billing details" },
] as const;

/** A sticky bar that jumps between the sections of the page and shows which one is on screen. */
function BillingNav({ available }: { available: string[] }) {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const els = SECTIONS.map((x) => document.getElementById(x.id)).filter((e): e is HTMLElement => e !== null);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [available.join(",")]);
  return (
    <nav aria-label="Sections of this page" className="bl-nav">
      {SECTIONS.filter((x) => available.includes(x.id)).map((x, i) => (
        <a key={x.id} href={`#${x.id}`} className={`bl-nav-link ${active === x.id ? "is-on" : ""}`} onClick={(e) => { e.preventDefault(); document.getElementById(x.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
          <span className="bl-nav-n">{i + 1}</span>
          {x.label}
        </a>
      ))}
    </nav>
  );
}

/** A numbered section heading: what this part of the page is for. */
function SectionHead({ step, icon: Icon, title, desc, aside }: { step: number; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; aside?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <span className="bl-step"><Icon className="size-5" /><i>{step}</i></span>
        <div>
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {aside}
    </header>
  );
}

export default function BillingManager({ view, plans, actions, plansSlot, usageSlot }: { view: BillingView; plans: PlanOption[]; actions: BillingActions; /** The plan cards (chosen plan comes back through the `billing:select-plan` event). */ plansSlot?: React.ReactNode; /** This month's usage meters. */ usageSlot?: React.ReactNode }) {
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

  // The plan cards above ask for a plan to be selected here (they only compare; the checkout is this section).
  useEffect(() => {
    const onSelect = (e: Event) => {
      const d = (e as CustomEvent<{ planId: string; interval: BillingInterval }>).detail;
      if (d && plans.some((p) => p.id === d.planId)) {
        setPlanId(d.planId);
        setInterval(d.interval);
      }
    };
    window.addEventListener("billing:select-plan", onSelect);
    return () => window.removeEventListener("billing:select-plan", onSelect);
  }, [plans]);

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

  const isFree = view.status === "active" && !view.hasLive;
  const HeroIcon = isInternal ? Gift : isFree ? Sparkles : Crown;
  const selected = plans.find((p) => p.id === planId);
  const selPrice = selected ? (interval === "yearly" ? selected.priceYearly : selected.priceMonthly) : null;
  const trialPct = view.trialDaysLeft !== null ? Math.max(4, Math.min(100, Math.round((view.trialDaysLeft / 30) * 100))) : 0;
  const renewal = isInternal ? "No charges" : isFree ? "Free for life" : view.status === "trialing" ? `${view.trialDaysLeft ?? 0} day${view.trialDaysLeft === 1 ? "" : "s"} left` : fmtDate(view.currentPeriodEnd);

  return (
    <div className="space-y-7">
      <BillingNav available={["billing-overview", ...(!isInternal && plansSlot ? ["billing-plans-section"] : []), ...(!isInternal ? ["billing-checkout"] : []), ...(usageSlot ? ["billing-usage-section"] : []), "billing-details"]} />
      {/* Where you are now */}
      <section id="billing-overview" aria-labelledby="billing-current" className="bl-hero scroll-mt-24">
        <div className="bl-aurora" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="bl-hero-icon"><HeroIcon className="size-7" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Your plan</p>
              <h2 id="billing-current" className="text-3xl font-black tracking-tight">{view.planName}</h2>
            </div>
          </div>
          <SubscriptionStatusBadge status={view.status} cancelAtPeriodEnd={view.cancelAtPeriodEnd} complimentary={isInternal} />
        </div>
        <dl className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarClock, label: "Billing cycle", value: isFree || isInternal ? "—" : view.interval === "yearly" ? "Yearly" : "Monthly" },
            { icon: Zap, label: view.status === "trialing" ? "Trial" : view.cancelAtPeriodEnd ? "Ends on" : "Next renewal", value: renewal },
            { icon: Receipt, label: "Charged per cycle", value: view.chargedPerCycle ? `${formatMoney(view.chargedPerCycle.total, view.chargedPerCycle.currency)} incl. GST` : isFree ? "₹0" : "—" },
            { icon: ShieldCheck, label: "Access", value: view.status === "suspended" || view.status === "canceled" ? "Read-only" : "Full" },
          ].map((t) => (
            <div key={t.label} className="bl-tile">
              <t.icon className="size-4 text-primary" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.label}</dt>
                <dd className="truncate text-sm font-bold">{t.value}</dd>
              </div>
            </div>
          ))}
        </dl>
        {view.status === "trialing" && view.trialEndsAt && (
          <div className="relative mt-4 space-y-1.5">
            <div className="bl-track" aria-hidden><span style={{ width: `${trialPct}%` }} /></div>
            <p className="text-xs text-muted-foreground">Trial ends {fmtDate(view.trialEndsAt)}</p>
          </div>
        )}
        {view.pendingChange && (
          <p className="bl-alert bl-alert-info relative mt-4"><CalendarClock className="mt-0.5 size-4 shrink-0" />Moving to {view.pendingChange.planName} ({view.pendingChange.interval}) on {fmtDate(view.pendingChange.effectiveAt)}.</p>
        )}
        {(view.status === "past_due" || view.status === "grace") && (
          <p className="bl-alert bl-alert-warn relative mt-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {view.status === "past_due" ? "Your last payment failed. Razorpay is retrying automatically — make sure your payment method has funds." : `Payment is overdue. Your workspace stays fully usable until ${fmtDate(view.graceEndsAt)}; subscribe again below to keep access.`}
          </p>
        )}
        {(view.status === "suspended" || view.status === "canceled") && (
          <p className="bl-alert bl-alert-bad relative mt-4"><XCircle className="mt-0.5 size-4 shrink-0" />Your workspace is read-only. Choose a plan below to restore full access — your data is safe.</p>
        )}
        {(view.hasLive && !view.cancelAtPeriodEnd) || view.cancelAtPeriodEnd ? (
          <div className="relative mt-4 flex flex-wrap gap-2">
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
        ) : null}
      </section>

      {!isInternal && plansSlot && (
        <section id="billing-plans-section" aria-labelledby="billing-plans" className="bl-section">
          <SectionHead step={2} icon={Sparkles} title="Pick the plan that fits your team" desc="Every plan has every panel and feature. A bigger plan means more people and more storage, AI, email and voice." />
          <span id="billing-plans" className="sr-only">Plans</span>
          {plansSlot}
        </section>
      )}

      {!isInternal && (
        <section id="billing-checkout" aria-labelledby="billing-choose" className="bl-section">
          <SectionHead
            step={3}
            icon={CreditCard}
            title={view.hasLive ? "Change plan" : "Checkout"}
            desc={view.hasLive ? "Upgrades apply immediately (a new period starts and the unused part of your last payment is refunded pro rata). Downgrades apply at the end of the current period." : "Paid through Razorpay by card, UPI or netbanking. You can cancel any time."}
            aside={
              <div className="pc-switch" role="group" aria-label="Billing cycle" data-yearly={interval === "yearly"}>
                <span className="pc-switch-pill" aria-hidden />
                {(["monthly", "yearly"] as const).map((c) => (
                  <button key={c} type="button" aria-pressed={interval === c} onClick={() => setInterval(c)} className={`pc-switch-btn ${interval === c ? "is-on" : ""}`}>
                    {c === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            }
          />
          <span id="billing-choose" className="sr-only">Checkout</span>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Plan">
                {plans.map((p) => {
                  const price = interval === "yearly" ? p.priceYearly : p.priceMonthly;
                  const on = planId === p.id;
                  return (
                    <button key={p.id} type="button" role="radio" aria-checked={on} data-plan={p.id} disabled={price === null} onClick={() => setPlanId(p.id)} className={`bl-chip ${on ? "is-on" : ""}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-black">{p.name}</span>
                        {on ? <Check className="size-4 text-primary" /> : p.id === view.planId && view.status !== "trialing" ? <span className="text-[11px] text-muted-foreground">Current</span> : null}
                      </span>
                      <span className="mt-1 block text-lg font-black tabular-nums">
                        {price === null ? <span className="text-sm font-normal text-muted-foreground">Not offered {interval}</span> : <>{formatMoney(price, p.currency)}<span className="text-xs font-normal text-muted-foreground"> /{interval === "yearly" ? "yr" : "mo"}</span></>}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{p.description}</span>
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
                  <Label htmlFor="billing-coupon">Have a coupon?</Label>
                  <Input id="billing-coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} maxLength={64} autoCapitalize="characters" spellCheck={false} className="w-52 font-mono uppercase" placeholder="CODE" />
                </div>
                <Button type="submit" variant="outline"><TicketPercent className="size-4" /> Apply</Button>
                {coupon && <Button type="button" variant="ghost" onClick={() => { setCoupon(null); setCouponInput(""); }}>Remove</Button>}
              </form>
              {!view.configured && <p className="bl-alert bl-alert-info">Online payments aren&apos;t available yet. Please contact support to subscribe.</p>}
              {!details && <p className="bl-alert bl-alert-info">Add your billing details below before subscribing — they go on your GST invoices.</p>}
            </div>

            <div className="bl-receipt">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><Receipt className="size-4" /> Order summary</p>
              <div id="billing-price-summary" aria-live="polite" className="space-y-2 text-sm">
                {quoteError ? (
                  <p className="text-destructive">{quoteError}</p>
                ) : !summary ? (
                  <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Pricing…</p>
                ) : (
                  <>
                    {summary.lines.map((l, i) => (
                      <div key={i} className="flex justify-between gap-3">
                        <span className="min-w-0">{l.label}</span>
                        <span className="tabular-nums">{l.amount < 0 ? `− ${formatMoney(-l.amount, summary.currency)}` : formatMoney(l.amount, summary.currency)}</span>
                      </div>
                    ))}
                    {summary.discount > 0 && !summary.lines.some((l) => l.kind === "discount") && (
                      <div className="flex justify-between gap-3"><span>Discount</span><span className="tabular-nums">− {formatMoney(summary.discount, summary.currency)}</span></div>
                    )}
                    <div className="flex justify-between gap-3 text-muted-foreground"><span>GST ({summary.gstRatePercent}%{summary.pricesIncludeTax ? ", included" : ""})</span><span className="tabular-nums">{formatMoney(summary.gst, summary.currency)}</span></div>
                    <div className="bl-total">
                      <span>Total per {summary.interval === "yearly" ? "year" : "month"}</span>
                      <span className="tabular-nums" id="billing-total">{formatMoney(summary.total, summary.currency)}</span>
                    </div>
                    {summary.couponError && <p id="billing-coupon-error" className="text-destructive">{summary.couponError}</p>}
                    {summary.couponApplied && <p className="font-semibold text-emerald-700 dark:text-emerald-400">Coupon {summary.couponCode} applied.</p>}
                    {quoting && <p className="text-xs text-muted-foreground">Updating…</p>}
                  </>
                )}
              </div>
              <button
                type="button"
                id="billing-submit"
                className="pc-btn pc-btn-primary mt-5 w-full"
                disabled={busy || quoting || !summary || Boolean(quoteError) || !view.configured || !details || samePlan || Boolean(coupon && summary?.couponError)}
                onClick={subscribeOrChange}
              >
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CreditCard className="mr-2 size-4" />}
                {view.hasLive ? "Change plan" : view.status === "trialing" ? "Subscribe — charged when the trial ends" : selPrice !== null ? `Subscribe to ${selected?.name}` : "Subscribe with Razorpay"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><Lock className="size-3" /> Secure payment by Razorpay · cancel any time</p>
            </div>
          </div>
        </section>
      )}

      {notice && (
        <p role="status" className={notice.tone === "error" ? "bl-alert bl-alert-bad" : "bl-alert bl-alert-good"}>
          {notice.text}
        </p>
      )}

      {usageSlot && (
        <section id="billing-usage-section" aria-labelledby="billing-usage" className="bl-section">
          <SectionHead step={4} icon={Zap} title="Your usage this month" desc="Every service in your plan against its allowance. Need more of anything? Move to the next plan." />
          <span id="billing-usage" className="sr-only">Usage</span>
          {usageSlot}
        </section>
      )}

      <section id="billing-details" aria-labelledby="billing-details-heading" className="bl-section">
        <SectionHead step={5} icon={Receipt} title="Billing details" desc="Printed on your GST invoices. Add your GSTIN to claim input tax credit." />
        <span id="billing-details-heading" className="sr-only">Billing details</span>
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <aside className="bl-info">
            <ShieldCheck className="size-5 text-primary" />
            <p className="font-bold">Why we ask</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Your legal name and address go on every GST invoice.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> A GSTIN lets you claim input tax credit.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Invoices are emailed to the address you give.</li>
            </ul>
          </aside>
          <div className="bl-form"><BillingDetailsForm initial={details} save={actions.saveDetails} onSaved={setDetails} /></div>
        </div>
      </section>
    </div>
  );
}
