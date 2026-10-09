import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { buildShowcase } from "@/lib/platform/billing/showcase";
import { FAQS, FAQS_MORE } from "@/lib/saas/content";
import { getFeatureModules } from "@/lib/saas/modules";
import { featureCount } from "@/lib/saas/feature-lists";
import { CtaBand, EmptyState, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import PricingPlans from "@/components/saas/PricingPlans";
import FaqSection from "@/components/saas/FaqSection";
import SavingsCalculator from "@/components/saas/SavingsCalculator";
import Icon from "@/components/saas/Icon";
import Reveal from "@/components/saas/Reveal";
import { jsonForScript } from "@/lib/security/json-script";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Free forever for one person. Every plan includes every panel and every feature; plans differ only by team size and by storage, AI, email and voice allowances.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const [plans, modules] = await Promise.all([getStandardPlans().then(buildShowcase).catch(() => []), getFeatureModules()]);
  const total = modules.reduce((n, m) => n + (featureCount(m.key) || m.capabilities.length), 0);
  const faqs = [...FAQS, ...FAQS_MORE];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const rows = plans[0]?.limits.map((l) => l.key) ?? [];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(ld) }} />
      <PageHero art="pricing" eyebrow="Pricing" title="Free forever." accent="Pay only as your team grows." lead={`Every plan includes every one of the ${modules.length} panels and ${total}+ features. A plan sets your team size and your storage, AI, email and voice allowance — nothing else. Prices exclude applicable taxes.`} photo="analytics" shot="fms" shotName="Finance" chip={{ title: "Every feature, every plan", text: "Nothing locked behind a higher tier" }}>
        <HeroCtas primary={{ label: "Start free forever", href: "/signup" }} secondary={{ label: "Talk to us", href: "/contact" }} />
      </PageHero>

      <section className="sr-section">
        <div className="sr-container">
          {plans.length ? <PricingPlans plans={plans} /> : <EmptyState title="Plans are being updated" body="Pricing isn't available right now. Contact us and we'll share the current plans."><Link href="/contact" className="sr-btn sr-btn-primary">Contact us</Link></EmptyState>}
        </div>
      </section>

      {plans.length > 0 && (
        <section className="sr-section bg-muted/10">
          <div className="sr-container">
            <SectionHead center icon="chart" eyebrow="Compare plans" title="Every allowance," accent="side by side." lead="Open any plan for its full details." />
            <Reveal>
              <div className="overflow-x-auto rounded-3xl border border-border/60 bg-background shadow-sm">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left">
                      <th className="p-4 font-bold text-muted-foreground">&nbsp;</th>
                      {plans.map((p) => <th key={p.id} className="p-4"><Link href={`/pricing/${p.id}`} className="font-black hover:text-primary">{p.name}</Link></th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/40"><td className="p-4 font-semibold">People</td>{plans.map((p) => <td key={p.id} className="p-4">{p.seats ? `Up to ${p.seats.toLocaleString("en-IN")}` : "Unlimited"}</td>)}</tr>
                    <tr className="border-b border-border/40 bg-muted/20"><td className="p-4 font-semibold">Panels and features</td>{plans.map((p) => <td key={p.id} className="p-4"><span className="inline-flex items-center gap-1.5 font-semibold text-primary"><Check className="h-4 w-4" />All {modules.length} panels</span></td>)}</tr>
                    {rows.map((k, i) => (
                      <tr key={k} className={`border-b border-border/40 ${i % 2 ? "" : "bg-muted/20"}`}>
                        <td className="p-4 font-semibold">{plans[0].limits.find((l) => l.key === k)?.label}</td>
                        {plans.map((p) => { const l = p.limits.find((x) => x.key === k); return <td key={p.id} className="p-4">{l?.included ? <span className="font-medium">{l.value}</span> : <Minus className="h-4 w-4 text-muted-foreground" />}</td>; })}
                      </tr>
                    ))}
                    <tr>
                      <td className="p-4 font-semibold">Details</td>
                      {plans.map((p) => <td key={p.id} className="p-4"><Link href={`/pricing/${p.id}`} className="inline-flex items-center gap-1 font-bold text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></Link></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="layers" eyebrow="Included in every plan" title={`All ${modules.length} panels,`} accent="from the free plan up." lead="You never pay extra to unlock a panel. Open any to see what it does." />
          <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m, i) => (
              <Reveal key={m.key} delay={(i % 4) * 50}>
                <Link href={`/features/${m.key}`} className="group flex items-center gap-3.5 border-b border-border/60 py-4 transition-all hover:bg-gradient-to-r hover:from-primary/[0.06] hover:to-transparent hover:pl-2">
                  <span className="sr-icon h-10 w-10 flex-none"><Icon name={m.icon} className="h-4.5 w-4.5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{m.name}</span><span className="block text-xs text-muted-foreground">{featureCount(m.key) || m.capabilities.length} features</span></span>
                  <Check className="h-4 w-4 flex-none text-primary" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {plans.length > 0 && (
        <section className="sr-band sr-section">
          <div className="sr-container relative">
            <SectionHead tone="dark" center icon="wallet" eyebrow="Cut your costs" title="What would you save?" accent="Do the maths." lead="Enter your own numbers: how many people, how many tools you pay for today and what they cost." />
            <Reveal><SavingsCalculator plans={plans} /></Reveal>
          </div>
        </section>
      )}

      <CtaBand title="Start free. Grow when you're ready." lead="Free forever for one person — with every panel and every feature." />
      <FaqSection all limit={60} lead={`${faqs.length} answers about plans, your own brand and apps, AI and automation, devices, data and setup.`} />
    </>
  );
}
