import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHero } from "@/components/saas/blocks";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const metadata: Metadata = {
  title: "About us",
  description: "Why SelfRun Business exists: to give every business one platform that runs its repetitive work, so people can focus on customers and growth.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { t: "Built for every business", b: "We design for the many businesses that use the platform, never for one special case. If one customer needs something, it becomes a feature everyone can use." },
  { t: "Automation with accountability", b: "Automation is only useful if you can trust it. Every automated action is logged, explained and under your control." },
  { t: "Your data stays yours", b: "Strict isolation between companies, clear permissions and the ability to export your data at any time." },
  { t: "Simple on the surface", b: "Powerful software should still be easy to start with. Guided setup, sensible defaults and one consistent design across every module." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="We believe a business should be able to run itself" lead="Too many companies spend their best hours copying data between tools, chasing approvals and compiling reports. SelfRun Business exists to take that work off people's plates." />
      <section className="sr-section">
        <div className="sr-container grid gap-10 lg:grid-cols-2">
          <div className="sr-prose">
            <h2>Our mission</h2>
            <p>Give every business — from a ten-person firm to a growing enterprise — a single, intelligent platform that handles the repetitive parts of running a company, so people can spend their time on customers, craft and growth.</p>
            <h2>What we build</h2>
            <p>SelfRun Business combines the systems a company normally buys separately — CRM, HR and payroll, finance, projects, procurement, training, documents, a website builder and team chat — on one database with one set of permissions. On top of that sits AI that answers questions from your data and a workflow engine that acts on events across the whole platform.</p>
            <h2>How we work</h2>
            <p>The platform is multi-tenant by design: every company is a customer of the same product, with the same features, the same onboarding and the same safeguards. There is no special version for anyone.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.t} className="sr-card space-y-2"><h3 className="sr-h3">{v.t}</h3><p className="sr-muted leading-relaxed">{v.b}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container text-center space-y-4">
          <h2 className="sr-h2">Talk to the team</h2>
          <p className="sr-lead mx-auto max-w-2xl">We&apos;d love to hear how your business runs today and where it loses time.</p>
          <Link href="/contact" className="sr-btn sr-btn-primary">Contact us</Link>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
