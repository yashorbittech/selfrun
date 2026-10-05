import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { USE_CASES } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Use cases",
  description: "Lead to cash, hire to retire, procure to pay, training operations, always-on marketing and compliance — complete business processes automated end to end.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesPage() {
  return (
    <>
      <PageHero eyebrow="Use cases" title="Whole business processes, automated end to end" lead="Real value comes when work flows between teams without anyone re-entering it. These are the processes our customers run on SelfRun Business." />
      <section className="sr-section">
        <div className="sr-container grid gap-5 md:grid-cols-2">
          {USE_CASES.map((u) => (
            <Link key={u.slug} href={`/use-cases/${u.slug}`} className="sr-card sr-card-hover group space-y-3">
              <h2 className="sr-h3">{u.title}</h2>
              <p className="sr-muted leading-relaxed">{u.summary}</p>
              <p className="text-sm sr-muted"><strong style={{ color: "var(--sr-ink)" }}>The problem:</strong> {u.problem}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--sr-primary)" }}>See how it works <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
