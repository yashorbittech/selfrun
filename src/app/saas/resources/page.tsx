import type { Metadata } from "next";
import Link from "next/link";
import { RESOURCES } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Resources & documentation",
  description: "Guides for getting started, automation, AI, your website and administration in SelfRun Business.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Resources" title="Guides and documentation" lead="Practical guides for getting set up and getting more from the platform. Customers also get a searchable help center and an AI help assistant inside their workspace." />
      <section className="sr-section">
        <div className="sr-container grid gap-5 md:grid-cols-2">
          {RESOURCES.map((r) => (
            <Link key={r.slug} href={`/resources/${r.slug}`} className="sr-card sr-card-hover space-y-3">
              <div className="flex items-center gap-3"><span className="sr-chip">{r.category}</span><span className="text-sm sr-muted">{r.readMinutes} min read</span></div>
              <h2 className="sr-h3">{r.title}</h2>
              <p className="sr-muted leading-relaxed">{r.summary}</p>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
