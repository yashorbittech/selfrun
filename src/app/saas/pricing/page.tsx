import type { Metadata } from "next";
import Link from "next/link";
import { listPlans } from "@/lib/platform/billing/plans";
import { planPrice, resolveTrialDays } from "@/lib/platform/billing/pricing";
import { getBillingSettings } from "@/lib/platform/billing/settings";
import { PLAN_FLAGS, PLAN_LIMIT_DEFS } from "@/lib/platform/billing/types";
import { listPanels } from "@/lib/platform/panels/store";
import { CtaBand, PageHero } from "@/components/saas/blocks";
import PricingTable, { type PricingPlan } from "./PricingTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent SaaS pricing for SelfRun Business. Every plan starts with a free trial and includes the modules, users, AI allowance and storage listed.",
  alternates: { canonical: "/pricing" },
};

function limitLine(key: string, value: number | null): string | null {
  const def = PLAN_LIMIT_DEFS.find((d) => d.key === key);
  const label = def?.label ?? key;
  if (value === null) return `Unlimited ${label.toLowerCase().replace(/ \(.*\)/, "")}`;
  if (key === "seats") return `Up to ${value.toLocaleString("en-IN")} users`;
  if (key === "aiTokensPerMonth") return `${value.toLocaleString("en-IN")} AI tokens per month`;
  if (key === "storageMb") return value >= 1024 ? `${(value / 1024).toLocaleString("en-IN", { maximumFractionDigits: 1 })} GB storage` : `${value} MB storage`;
  return `${label}: ${value.toLocaleString("en-IN")}`;
}

export default async function PricingPage() {
  const [plans, settings, panels] = await Promise.all([listPlans({ activeOnly: true }).catch(() => []), getBillingSettings().catch(() => null), listPanels().catch(() => [])]);
  const defaultTrial = settings?.billing.defaultTrialDays ?? 14;
  const rows: PricingPlan[] = plans.map((p) => {
    const include: string = p.modules === "all" ? "Every module" : `${p.modules.length} modules: ${p.modules.map((k) => panels.find((x) => x.key === k)?.shortName ?? k).slice(0, 5).join(", ")}${p.modules.length > 5 ? " and more" : ""}`;
    const limits = Object.entries(p.limits).flatMap(([k, v]) => { const l = limitLine(k, v); return l ? [l] : []; });
    const flags = (p.flags ?? []).flatMap((f) => { const l = PLAN_FLAGS.find((d) => d.key === f)?.label; return l ? [l as string] : []; });
    return {
      id: p._id,
      name: p.name,
      description: p.description,
      currency: p.currency,
      prices: { monthly: planPrice(p, "monthly"), yearly: planPrice(p, "yearly") },
      trialDays: resolveTrialDays(p, defaultTrial),
      highlights: [include, ...limits, ...flags, ...(p.highlights ?? [])],
      isDefault: p.isDefault,
    };
  });
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple pricing that grows with your business" lead="Choose the plan that fits today and change it any time. Every plan starts with a free trial, and prices are per workspace — not per module." />
      <section className="sr-section">
        <div className="sr-container">
          {rows.length > 0 ? (
            <PricingTable plans={rows} />
          ) : (
            <div className="sr-card mx-auto max-w-xl space-y-3 text-center">
              <h2 className="sr-h3">Talk to us about pricing</h2>
              <p className="sr-muted">Tell us about your business and we&apos;ll recommend a plan.</p>
              <Link href="/contact" className="sr-btn sr-btn-primary">Contact sales</Link>
            </div>
          )}
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container grid gap-6 md:grid-cols-3">
          {[
            { t: "Free trial on every plan", b: "Explore the whole platform before you pay anything. You can add a payment method when you are ready." },
            { t: "Change plans any time", b: "Upgrade as your team grows or move down when you need less. Your data stays in place." },
            { t: "Add-ons when you need more", b: "Need extra users, AI allowance or storage? Add them to your subscription without changing plan." },
          ].map((x) => (
            <div key={x.t} className="sr-card space-y-2"><h3 className="sr-h3">{x.t}</h3><p className="sr-muted leading-relaxed">{x.b}</p></div>
          ))}
        </div>
      </section>
      <CtaBand title="Not sure which plan fits?" lead="Tell us about your team and we'll recommend the right starting point." />
    </>
  );
}
