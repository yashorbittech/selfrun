import type { Metadata } from "next";
import InquiryForm from "@/components/saas/InquiryForm";
import { Checklist } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "See SelfRun Business in action. We'll walk you through the platform using your own business scenarios — CRM, HR, finance, projects, AI and automation.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <section className="sr-section">
      <div className="sr-container grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <span className="sr-eyebrow">Request a demo</span>
          <h1 className="sr-h1" style={{ fontSize: "clamp(2rem,4.4vw,3.2rem)" }}>See your business running on SelfRun</h1>
          <p className="sr-lead">In a 30-minute session we map the platform to your own processes and show how much of the repetitive work it can take over.</p>
          <Checklist items={["A walkthrough of the modules that matter to your business", "A live example of AI answering a question from your kind of data", "Automations for the processes that cost you the most time", "A clear view of plans, users and what a rollout looks like"]} />
          <p className="sr-muted">Prefer to explore on your own? <a href="/signup" className="font-bold" style={{ color: "var(--sr-primary)" }}>Start a free trial</a>.</p>
        </div>
        <InquiryForm kind="demo" />
      </div>
    </section>
  );
}
