"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, type BillingInterval } from "@/lib/platform/billing/types";
import type { ShowcasePlan } from "@/lib/platform/billing/showcase";

/**
 * The pricing screens: a Monthly / Yearly switch, a card per plan with the "usual" price struck through and the offer price big (yearly shows
 * the per-month equivalent and what you save), what each paid service allows, and a full comparison below. One component for the marketing
 * page and the in-app plan chooser; colours come from the theme tokens, so each takes the look of where it is shown.
 */
export interface PlanShowcaseProps {
  plans: ShowcasePlan[];
  /** The plan in use (in-app): its button reads "Current plan". */
  currentPlanId?: string | null;
  defaultInterval?: BillingInterval;
  /** In-app: choosing a plan calls this (the checkout lives elsewhere). */
  onSelect?: (planId: string, interval: BillingInterval) => void;
  /** Marketing: where the buttons go. */
  signupHref?: string;
  contactHref?: string;
}

const money = (paise: number, currency: string) => formatMoney(paise, currency);

function Price({ p, interval }: { p: ShowcasePlan; interval: BillingInterval }) {
  if (p.kind === "contact") return <p className="text-3xl font-black tracking-tight">Contact support</p>;
  if (p.kind === "free") return <p><span className="text-4xl font-black tracking-tight">{money(0, p.currency)}</span> <span className="text-sm text-muted-foreground">forever</span></p>;
  const offer = p.offer[interval];
  if (offer === null) return <p className="text-sm text-muted-foreground">Not offered {interval === "yearly" ? "yearly" : "monthly"}</p>;
  const perMonth = interval === "yearly" ? Math.round(offer / 12) : offer;
  const list = p.list[interval];
  const listPerMonth = list !== null ? (interval === "yearly" ? Math.round(list / 12) : list) : null;
  const saved = list !== null && list > offer ? list - offer : 0;
  return (
    <div className="space-y-1">
      <p className="flex flex-wrap items-baseline gap-x-2" key={interval}>
        {listPerMonth !== null && listPerMonth > perMonth && <span className="text-lg font-semibold text-muted-foreground line-through decoration-destructive/60" aria-label={`Usual price ${money(listPerMonth, p.currency)}`}>{money(listPerMonth, p.currency)}</span>}
        <span className="plan-price-pop text-4xl font-black tracking-tight">{money(perMonth, p.currency)}</span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </p>
      {interval === "yearly" && <p className="text-xs text-muted-foreground">Billed {money(offer, p.currency)} a year</p>}
      {saved > 0 && <p className="inline-flex rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">You save {money(saved, p.currency)} {interval === "yearly" ? "a year" : "every month"}</p>}
    </div>
  );
}

export default function PlanShowcase({ plans, currentPlanId, defaultInterval = "monthly", onSelect, signupHref = "/signup", contactHref = "/contact" }: PlanShowcaseProps) {
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval);
  const hasYearly = plans.some((p) => p.kind === "paid" && p.offer.yearly !== null);
  const yearlyBest = Math.max(0, ...plans.filter((p) => p.kind === "paid" && p.offer.monthly && p.offer.yearly).map((p) => Math.round((1 - (p.offer.yearly as number) / ((p.offer.monthly as number) * 12)) * 100)));

  return (
    <div className="space-y-10">
      {hasYearly && (
        <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm" role="group" aria-label="Billing cycle">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={interval === c} onClick={() => setInterval(c)} className={cn("relative rounded-full px-5 py-2 text-sm font-bold transition-all", interval === c ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" && yearlyBest > 0 && <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[11px] font-black", interval === "yearly" ? "bg-white/25" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300")}>Save {yearlyBest}%</span>}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {plans.map((p) => {
          const current = currentPlanId === p.id;
          return (
            <div key={p.id} className={cn("plan-card relative flex flex-col gap-5 rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", p.popular ? "border-primary shadow-lg shadow-primary/15 ring-1 ring-primary/30" : "border-border", current && "ring-2 ring-primary")}>
              {p.popular && <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground"><Sparkles className="size-3" /> Most popular</span>}
              {p.offerLabel && p.kind === "paid" && <span className="plan-offer absolute right-5 top-5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{p.offerLabel}</span>}
              <div className="space-y-1">
                <h3 className="text-xl font-black">{p.name}</h3>
                <p className="min-h-[2.75rem] text-sm text-muted-foreground">{p.description}</p>
              </div>
              <div className="min-h-[7rem]"><Price p={p} interval={interval} /></div>

              {onSelect ? (
                p.kind === "contact" ? (
                  <Link href={contactHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-border text-sm font-bold hover:border-primary/50 hover:text-primary">Contact support</Link>
                ) : (
                  <button type="button" disabled={current || p.kind === "free"} onClick={() => onSelect(p.id, interval)} className={cn("h-11 rounded-xl text-sm font-bold transition-all disabled:cursor-default", current ? "bg-primary/10 text-primary" : p.kind === "free" ? "border border-dashed border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:brightness-110")}>
                    {current ? "Current plan" : p.kind === "free" ? "Free plan" : "Choose plan"}
                  </button>
                )
              ) : (
                <Link href={p.kind === "contact" ? contactHref : `${signupHref}${p.kind === "paid" ? `?plan=${p.id}` : ""}`} className={cn("inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all", p.kind === "paid" ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-border hover:border-primary/50 hover:text-primary")}>
                  {p.kind === "contact" ? "Contact support" : p.kind === "free" ? "Start free" : "Get started"}
                </Link>
              )}

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5 font-bold"><Users className="size-4 text-primary" />{p.seats === null ? "Unlimited users" : p.seats === 1 ? "1 user" : `Up to ${p.seats.toLocaleString("en-IN")} users`}</li>
                <li className="flex items-center gap-2.5"><Check className="size-4 shrink-0 text-primary" />{p.panels}</li>
                {p.limits.filter((l) => l.included).slice(0, 4).map((l) => <li key={l.key} className="flex items-center gap-2.5"><Check className="size-4 shrink-0 text-primary" /><span><b>{l.value}</b> <span className="text-muted-foreground">{l.label.toLowerCase()}</span></span></li>)}
                {p.flags.map((f) => <li key={f} className="flex items-center gap-2.5"><Check className="size-4 shrink-0 text-primary" />{f}</li>)}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card/80">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="px-6 pb-2 pt-5 text-left text-base font-black">What each plan includes</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3 font-semibold">Service</th>
              {plans.map((p) => <th key={p.id} className="px-4 py-3 font-bold">{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60"><th scope="row" className="px-6 py-3 text-left font-semibold">Users</th>{plans.map((p) => <td key={p.id} className="px-4 py-3 font-semibold">{p.seats === null ? "Unlimited" : p.seats.toLocaleString("en-IN")}</td>)}</tr>
            {plans[0]?.limits.map((row, i) => (
              <tr key={row.key} className="border-b border-border/60 last:border-0">
                <th scope="row" className="px-6 py-3 text-left font-semibold">{row.label}{row.provider ? <span className="block text-xs font-normal text-muted-foreground">via {row.provider}</span> : null}</th>
                {plans.map((p) => { const l = p.limits[i]; return <td key={p.id} className={cn("px-4 py-3", l.included ? "" : "text-muted-foreground")}>{l.included ? l.value : <span className="inline-flex items-center gap-1"><Minus className="size-3.5" /> {l.value}</span>}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">Need more storage, AI, emails or voice? Add it any time with a one-time payment, as much as you like. More people needs a bigger plan. Prices exclude GST.</p>
    </div>
  );
}
