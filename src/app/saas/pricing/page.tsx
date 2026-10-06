import type { Metadata } from "next";
import Link from "next/link";
import { listPlans } from "@/lib/platform/billing/plans";
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
  const plans = await listPlans({ activeOnly: true }).catch(() => []);
  const rows = buildShowcase(plans);
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple pricing that grows with your business" lead="Start free for life with one person. Add your team when you are ready: 10, 50 or 200 people, one simple monthly price. No per-module charges." />
      <section className="sr-section">
        <div className="sr-container">
          {rows.length > 0 ? (
            <PlanShowcase plans={rows} />
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
            { t: "Free for life, no card", b: "Run your own work on the Free plan for as long as you like. Upgrade only when your team joins." },
            { t: "Change plans any time", b: "Upgrade as your team grows or move down when you need less. Your data stays in place." },
            { t: "Pay once for extra usage", b: "Need more storage, AI, emails or voice? Add as much as you like with a one-time payment. More people means a bigger plan." },
          ].map((x) => (
            <div key={x.t} className="sr-card space-y-2"><h3 className="sr-h3">{x.t}</h3><p className="sr-muted leading-relaxed">{x.b}</p></div>
          ))}
        </div>
      </section>
      <CtaBand title="Not sure which plan fits?" lead="Tell us about your team and we'll recommend the right starting point." />
    </>
  );
}
