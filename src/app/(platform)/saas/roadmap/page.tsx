import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MessageSquareText, ShieldCheck } from "lucide-react";
import { PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Reveal from "@/components/platform/saas/Reveal";
import { getFeatureGroups } from "@/lib/platform/saas/modules";
import { productPath } from "@/lib/platform/saas/product-routes";

export const metadata: Metadata = {
  title: "Product Roadmap",
  description: "See what SelfRun AI currently offers and how to share feedback. We publish roadmap commitments only when they are ready to communicate clearly.",
  alternates: { canonical: "/roadmap" },
};

export default async function RoadmapPage() {
  const groups = await getFeatureGroups();
  return (
    <>
      <PageHero
        eyebrow="Product roadmap"
        title="A clear view of"
        accent="what’s available today."
        lead="SelfRun AI evolves across the products teams use every day. This page separates the capabilities currently available in the product from future plans, so you can make decisions using information you can verify."
        photo="team-desk"
        shot="workspace"
        shotName="SelfRun CommandOS"
        chip={{ title: `${groups.reduce((n, group) => n + group.items.length, 0)} active product areas`, text: "From the live product registry" }}
      >
        <Link href="/products" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">Explore products <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-6 py-3.5 text-sm font-bold">Share feedback</Link>
      </PageHero>

      <section className="sr-section">
        <div className="sr-container">
          <SectionHead icon="layers" eyebrow="Available now" title="Explore the product" accent="as it exists today." lead="These areas are drawn from the active product registry. Open any group to see its current product pages and documentation." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group, index) => (
              <Reveal key={group.id} delay={(index % 3) * 60}>
                <article className="sr-card h-full">
                  <p className="sr-eyebrow">{group.items.length} {group.items.length === 1 ? "product" : "products"}</p>
                  <h3 className="mt-2 text-xl font-black">{group.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.lead}</p>
                  <ul className="mt-5 space-y-2.5">
                    {group.items.map((item) => <li key={item.key}><Link href={productPath(item.key)} className="flex items-center gap-2 text-sm font-semibold hover:text-primary"><Check className="h-4 w-4 text-primary" />{item.name}<ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" /></Link></li>)}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sr-section bg-muted/10">
        <div className="sr-container grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHead center={false} icon="shield" eyebrow="Roadmap commitments" title="No dates without" accent="a dependable plan." lead="We do not publish speculative release dates or label ideas as committed work. There are no dated roadmap commitments published here at this time." />
          <div className="sr-card flex gap-4">
            <span className="sr-icon h-12 w-12 shrink-0"><ShieldCheck className="h-5 w-5" /></span>
            <div><h3 className="font-bold">Your feedback helps shape priorities</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Tell us about the workflow you need to improve. The team can discuss current capabilities and record product feedback without promising an unannounced delivery date.</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">Send product feedback <MessageSquareText className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
