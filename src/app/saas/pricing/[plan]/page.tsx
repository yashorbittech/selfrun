import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Minus } from "lucide-react";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { buildShowcase } from "@/lib/platform/billing/showcase";
import { formatMoney } from "@/lib/platform/billing/types";
import { getFeatureModules } from "@/lib/saas/modules";
import { featureCount } from "@/lib/saas/feature-lists";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import FaqSection from "@/components/saas/FaqSection";
import Icon from "@/components/saas/Icon";
import Reveal from "@/components/saas/Reveal";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const plans = buildShowcase(await getStandardPlans().catch(() => []));
  const i = plans.findIndex((p) => p.id === id);
  return i < 0 ? null : { plan: plans[i], plans, prev: plans[i - 1] ?? null, next: plans[i + 1] ?? null };
}

export async function generateMetadata({ params }: { params: Promise<{ plan: string }> }): Promise<Metadata> {
  const d = await load((await params).plan);
  return d ? { title: `${d.plan.name} plan`, description: `${d.plan.name}: ${d.plan.description} Every panel and every feature included.`, alternates: { canonical: `/pricing/${d.plan.id}` } } : {};
}

export default async function PlanDetailPage({ params }: { params: Promise<{ plan: string }> }) {
  const d = await load((await params).plan);
  if (!d) notFound();
  const { plan, plans, prev, next } = d;
  const modules = await getFeatureModules();
  const total = modules.reduce((n, m) => n + (featureCount(m.key) || m.capabilities.length), 0);
  const monthly = plan.kind === "paid" ? plan.offer.monthly : null;
  const yearly = plan.kind === "paid" ? plan.offer.yearly : null;
  return (
    <>
      <PageHero art={`plan-${plan.id}`} eyebrow={`${plan.name} plan`} title={`${plan.name}.`} accent={plan.kind === "free" ? "Free, forever." : plan.kind === "contact" ? "Built around your team." : "Everything included."} lead={plan.description} photo="analytics" shot="workspace" shotName="Workspace" chip={{ title: `All ${modules.length} panels`, text: `${total}+ features included` }}>
        <HeroCtas primary={{ label: plan.kind === "contact" ? "Contact us" : plan.kind === "free" ? "Start free forever" : "Get started", href: plan.kind === "contact" ? "/contact" : "/signup" }} secondary={{ label: "All plans", href: "/pricing" }} />
      </PageHero>

      <section className="sr-section">
        <div className="sr-container">
          <Link href="/pricing" className="sr-link mb-8"><ArrowLeft className="h-4 w-4" /> All plans</Link>
          <SectionHead icon="wallet" eyebrow="Price & allowances" title={`${plan.name}`} accent="at a glance." lead="The price, the people it covers and every allowance in this plan." />
          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal className="lg:col-span-1">
              <div className="sr-band h-full space-y-5 rounded-[2rem] p-8 shadow-2xl shadow-primary/30">
                <p className="text-xs font-bold uppercase tracking-widest text-white/75">Price</p>
                {plan.kind === "free" && <p className="text-5xl font-black">{formatMoney(0, plan.currency)}<span className="ml-2 text-base font-semibold text-white/70">forever</span></p>}
                {plan.kind === "contact" && <p className="text-4xl font-black">Let&apos;s talk</p>}
                {plan.kind === "paid" && (
                  <div className="space-y-2">
                    <p className="text-5xl font-black">{monthly != null ? formatMoney(monthly, plan.currency) : "—"}<span className="ml-2 text-base font-semibold text-white/70">/ month</span></p>
                    {yearly != null && <p className="text-sm text-white/75">or {formatMoney(yearly, plan.currency)} per year</p>}
                  </div>
                )}
                <p className="text-sm text-white/75">Excludes applicable taxes.</p>
                <p className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white"><b>People · </b>{plan.seats ? `Up to ${plan.seats.toLocaleString("en-IN")}` : "Unlimited"}</p>
                <Link href={plan.kind === "contact" ? "/contact" : "/signup"} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black shadow-xl transition-transform hover:scale-[1.03]">{plan.kind === "contact" ? "Contact us" : plan.kind === "free" ? "Start free forever" : "Get started"} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
            <Reveal delay={100} className="lg:col-span-2">
              <div className="h-full rounded-[2rem] border border-border/60 bg-background p-7 shadow-sm">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-primary">Allowances in this plan</p>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {plan.limits.map((l) => (
                    <li key={l.key} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <p className="text-sm text-muted-foreground">{l.label}</p>
                      <p className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight">{l.included ? l.value : <><Minus className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">{l.value}</span></>}</p>
                    </li>
                  ))}
                  {plan.flags.map((f) => <li key={f} className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm font-semibold"><Check className="h-4 w-4 text-primary" />{f}</li>)}
                  {plan.highlights.map((h) => <li key={h} className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm font-semibold"><Check className="h-4 w-4 text-primary" />{h}</li>)}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sr-section bg-muted/10">
        <div className="sr-container">
          <SectionHead center icon="layers" eyebrow="Included" title={`Every panel, in ${plan.name}.`} accent={`${total}+ features.`} lead="Nothing is held back in any plan. Open a panel to see every feature." />
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

      <section className="sr-section pb-0">
        <div className="sr-container max-w-4xl">
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[{ p: prev, d: "Smaller plan" }, { p: next, d: "Larger plan" }].map(({ p, d: dir }) => p ? (
              <Link key={dir} href={`/pricing/${p.id}`} className="group rounded-2xl border border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"><span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{dir}</span><span className="mt-1 block text-xl font-black">{p.name}</span></Link>
            ) : null)}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">{plans.length} plans in total · <Link href="/pricing" className="font-bold text-primary">Compare all</Link></p>
        </div>
      </section>
      <CtaBand />
      <FaqSection topics={["Plans & pricing", "Data & security"]} limit={6} title="About" accent={`${plan.name}.`} lead="What people ask before choosing a plan." />
    </>
  );
}
