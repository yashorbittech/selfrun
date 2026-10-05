import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INDUSTRIES } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Industries",
  description: "How IT companies, training institutes, agencies, trading businesses, professional services and growing SMEs run on SelfRun Business.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero eyebrow="Industries" title="Built for businesses like yours" lead="The same platform adapts to how different businesses work. Pick the modules your industry needs and ignore the rest." />
      <section className="sr-section">
        <div className="sr-container grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((i) => (
            <Link key={i.slug} href={`/industries/${i.slug}`} className="sr-card sr-card-hover group space-y-3">
              <h2 className="sr-h3">{i.name}</h2>
              <p className="sr-muted leading-relaxed">{i.summary}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--sr-primary)" }}>Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
