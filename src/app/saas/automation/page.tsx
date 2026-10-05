import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand, PageHero, SectionHead } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Business automation",
  description: "Build no-code Trigger → Condition → Action workflows across sales, HR, finance and projects. Notify, email, approve and integrate automatically.",
  alternates: { canonical: "/automation" },
};

const PARTS = [
  { label: "Trigger", title: "Something happens", body: "A lead is created, a deal is won, a leave is requested, an invoice goes overdue, a task is assigned." },
  { label: "Condition", title: "…and it matters", body: "Only when the deal is above a value, the leave is longer than three days, or the invoice is more than seven days late." },
  { label: "Action", title: "Then the platform acts", body: "Notify the right people, send an email, ask for approval or call a signed webhook to another system." },
];

const RECIPES = [
  { area: "Sales", name: "New lead alert", flow: "When a lead is created → notify the owner and send a welcome message" },
  { area: "Sales", name: "Follow-up guard", flow: "When a follow-up is overdue → remind the owner and their manager" },
  { area: "Finance", name: "Payment reminder", flow: "When an invoice is 7 days overdue → email the client and notify finance" },
  { area: "HR", name: "Leave routing", flow: "When a leave request is filed → notify the manager for approval" },
  { area: "Projects", name: "Milestone billing", flow: "When a milestone completes → draft the invoice and notify the account owner" },
  { area: "Procurement", name: "Spend approval", flow: "When a purchase request exceeds a limit → route to the budget owner" },
];

export default function AutomationPage() {
  return (
    <>
      <PageHero eyebrow="Business automation" title="Automate the work nobody should be doing by hand" lead="Workflows connect what happens in one module to what should happen next — across sales, HR, finance, projects and more. You build them from a settings screen, with no code.">
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/how-it-works" className="sr-btn sr-btn-ghost">How it works</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="The model" title="Trigger → Condition → Action" lead="Simple enough for a manager to build, powerful enough to run a department." />
          <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {PARTS.map((p, i) => (
              <div key={p.label} className="contents">
                <div className="sr-card space-y-2">
                  <span className="sr-chip">{p.label}</span>
                  <h3 className="sr-h3">{p.title}</h3>
                  <p className="sr-muted leading-relaxed">{p.body}</p>
                </div>
                {i < PARTS.length - 1 && <ArrowRight className="hidden size-6 self-center md:block" style={{ color: "var(--sr-primary)" }} aria-hidden />}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Ready-to-use ideas" title="Automations teams set up first" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RECIPES.map((r) => (
              <div key={r.name} className="sr-card space-y-2">
                <span className="sr-chip">{r.area}</span>
                <h3 className="sr-h3">{r.name}</h3>
                <p className="sr-muted leading-relaxed">{r.flow}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sr-section">
        <div className="sr-container grid gap-8 lg:grid-cols-3">
          {[
            { t: "Safe by default", b: "Imports never trigger workflows, every run is logged with what happened and why, and workflows can be paused at any time." },
            { t: "People stay in control", b: "Use approvals and notifications instead of automatic changes wherever a person should decide — especially for money and customer-facing messages." },
            { t: "Connected to everything", b: "Events from every module are available as triggers, and signed webhooks let a workflow talk to the systems you already use." },
          ].map((x) => (
            <div key={x.t} className="sr-card space-y-2">
              <h3 className="sr-h3">{x.t}</h3>
              <p className="sr-muted leading-relaxed">{x.b}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
