import type { Metadata } from "next";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { CtaBand, PageHero } from "@/components/saas/blocks";
import PlanShowcase from "@/components/billing/PlanShowcase";
import { buildShowcase } from "@/lib/platform/billing/showcase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing: free for one person, then 10, 50 or 200 people at one monthly price. Every plan lists its users, storage, AI, email and voice allowance.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  // Always the five plans, whatever the catalogue holds.
  const rows = buildShowcase(await getStandardPlans());
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple pricing that grows with your business" lead="Every plan has every panel and every feature. Start free for life with one person, then choose 10, 50 or 200 people at one simple price. Larger teams: talk to us." />
      <section className="sr-section">
        <div className="sr-container">
          <PlanShowcase plans={rows} />
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container grid gap-6 md:grid-cols-3">
          {[
            { t: "Every feature, every plan", b: "Free or paid, you get every panel and feature. Upgrade only when your team grows or you need more storage, AI, email or voice." },
            { t: "Change plans any time", b: "Upgrade as your team grows or move down when you need less. Your data stays in place." },
            { t: "One simple subscription", b: "No add-ons and no per-module charges. The only thing that grows with your plan is your team and the allowance of storage, AI, email and voice." },
          ].map((x) => (
            <div key={x.t} className="sr-card space-y-2"><h3 className="sr-h3">{x.t}</h3><p className="sr-muted leading-relaxed">{x.b}</p></div>
          ))}
        </div>
      </section>
      <CtaBand title="Not sure which plan fits?" lead="Tell us about your team and we'll recommend the right starting point." />
    </>
  );
}
