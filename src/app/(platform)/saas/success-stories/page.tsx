import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Reveal from "@/components/platform/saas/Reveal";
import CustomerStoriesSection from "@/components/platform/saas/CustomerStoriesSection";
import { USE_CASES } from "@/lib/platform/saas/content";
import { getFeatureModules } from "@/lib/platform/saas/modules";
import { productPath } from "@/lib/platform/saas/product-routes";

export const metadata: Metadata = {
  title: "Customer Success Stories",
  description: "Read customer stories published with permission and based on verified experience using SelfRun AI.",
  alternates: { canonical: "/success-stories" },
};

export default async function SuccessStoriesPage() {
  const modules = await getFeatureModules();
  const moduleNames = new Map(modules.map((module) => [module.key, module.name]));
  return (
    <>
      <PageHero
        eyebrow="Customer stories & workflows"
        title="Built around work"
        accent="that crosses teams."
        lead="Explore product-grounded stories that show how SelfRun connects work across teams. Each follows capabilities available in the platform, without inventing customer names, quotations or results."
        photo="colleagues"
        shot="workspace"
        shotName="SelfRun CommandOS"
      >
        <Link href="/contact" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">Talk with our team <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
      </PageHero>
      <section className="sr-section"><div className="sr-container"><CustomerStoriesSection /></div></section>
      <section className="sr-section bg-muted/10">
        <div className="sr-container">
          <SectionHead icon="workflow" eyebrow="Stories from the product" title="See how the work" accent="can connect." lead="These realistic workflow narratives are built from SelfRun’s documented product capabilities. They are examples, not accounts of named customers or claims about customer results." />
          <div className="grid gap-5 lg:grid-cols-2">
            {USE_CASES.map((workflow, index) => (
              <Reveal key={workflow.slug} delay={(index % 2) * 60}>
                <article className="group h-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-transparent to-brand-accent/[0.08] p-6 sm:p-8">
                    <div className="flex items-start gap-4"><span className="sr-icon shrink-0"><GitBranch className="h-5 w-5" /></span><div><p className="sr-eyebrow">Illustrative product story · {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-xl font-black">{workflow.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflow.summary}</p></div></div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="mb-6 text-sm leading-relaxed text-foreground/80">{workflow.narrative}</p>
                    <div className="mb-6 rounded-2xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The workflow challenge</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflow.problem}</p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Connected steps</p>
                    <ol className="mt-4 space-y-3">
                      {workflow.solution.map((step, stepIndex) => <li key={step} className="flex gap-3 text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{stepIndex + 1}</span><span>{step}</span></li>)}
                    </ol>
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-border/50 pt-5">
                      {workflow.modules.map((key) => <Link key={key} href={productPath(key)} className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary">{moduleNames.get(key) ?? key}</Link>)}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
