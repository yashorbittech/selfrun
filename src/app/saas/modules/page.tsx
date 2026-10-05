import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MODULE_COPY } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";
import Icon from "@/components/saas/Icon";
import { listPanels } from "@/lib/platform/panels/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Modules",
  description: "CRM, HR & payroll, finance, projects, procurement, training, SOPs, documents, AI assistants, social media, SEO, website builder, portal and team chat — every module in SelfRun Business.",
  alternates: { canonical: "/modules" },
};

export default async function ModulesPage() {
  const panels = (await listPanels().catch(() => [])).filter((p) => p.active && MODULE_COPY[p.key] && p.key !== "website");
  return (
    <>
      <PageHero eyebrow="Modules" title="One platform. Every function of your business." lead="Switch on the modules you need today and add more as you grow. They share one login, one database and one set of permissions, so they work together from the first day." />
      <section className="sr-section">
        <div className="sr-container">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {panels.map((p) => {
              const c = MODULE_COPY[p.key];
              return (
                <Link key={p.key} href={`/modules/${p.key}`} className="sr-card sr-card-hover group flex flex-col gap-3">
                  <span className="sr-icon"><Icon name={c.icon} /></span>
                  <h2 className="sr-h3">{p.name}</h2>
                  <p className="sr-muted leading-relaxed">{p.description}</p>
                  <ul className="mt-1 space-y-1 text-sm sr-muted">
                    {c.capabilities.slice(0, 3).map((x) => <li key={x}>• {x}</li>)}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold" style={{ color: "var(--sr-primary)" }}>View module <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
