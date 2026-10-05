import type { Metadata } from "next";
import { CORE_FEATURES, MODULE_COPY, SECURITY_POINTS } from "@/lib/saas/content";
import { CtaBand, FeatureGrid, PageHero, SectionHead } from "@/components/saas/blocks";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything in SelfRun Business: one platform for every business function, AI that answers from your data, no-code automation, a built-in website and enterprise-grade security.",
  alternates: { canonical: "/features" },
};

const DEEP = [
  { title: "Connected by design", body: "A deal won in the CRM creates the client and the project. A completed milestone raises the invoice. A paid invoice updates the ledger. Because every module shares the same data, work flows between teams without anyone re-typing it.", points: ["One company record, one login, one permission model", "Cross-module links: CRM → Projects → Finance, HR → Payroll → Finance, Procurement → Finance", "A single audit trail across everything"] },
  { title: "Automation without developers", body: "Workflows are built from a trigger, optional conditions and actions. Notify people, send emails, call signed webhooks and keep a full run history — all configured from a settings screen.", points: ["Events from every module are available as triggers", "Email, in-app notifications and webhooks as actions", "Switch workflows on and off without deleting them"] },
  { title: "AI across the product", body: "Ask questions about your data, build assistants on your own documents, draft social posts and get explained SEO fixes. Each AI feature respects who is asking.", points: ["Answers show how they were calculated", "AI usage is metered per plan", "Bring your own AI provider key"] },
  { title: "Your website included", body: "Every workspace has a full website builder with themes, pages, blog, forms and SEO tools, served from your own domain with automatic SSL.", points: ["Draft and publish workflow", "Forms feed your CRM directly", "Custom domain on plans that include it"] },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="Everything your business needs to run itself" lead="One platform that connects your teams, your data and your processes — with AI and automation doing the repetitive work.">
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/pricing" className="sr-btn sr-btn-ghost">See pricing</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Platform" title="Built around how a real business works" />
          <FeatureGrid items={CORE_FEATURES} />
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container space-y-16">
          {DEEP.map((d, i) => (
            <div key={d.title} className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div className="space-y-4">
                <h2 className="sr-h2">{d.title}</h2>
                <p className="sr-lead">{d.body}</p>
              </div>
              <ul className="sr-card space-y-3">
                {d.points.map((p) => (
                  <li key={p} className="flex gap-3 leading-relaxed"><span className="mt-2 size-2 flex-none rounded-full" style={{ background: "var(--sr-accent)" }} />{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Security" title="Control and protection built in" />
          <FeatureGrid items={SECURITY_POINTS.slice(0, 3)} />
          <p className="text-center sr-muted">Modules available: {Object.keys(MODULE_COPY).length}. <Link href="/modules" className="font-bold" style={{ color: "var(--sr-primary)" }}>Browse all modules</Link></p>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
