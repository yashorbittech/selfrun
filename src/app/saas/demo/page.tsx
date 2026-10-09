import FaqSection from "@/components/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "@/components/saas/InquiryForm";
import { PageHero, SectionHead } from "@/components/saas/blocks";
import { NumberedRows } from "@/components/saas/Modern";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "See SelfRun AI in action. We'll walk you through the platform using your own business scenarios — CRM, HR, finance, projects, AI and automation.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <>
      <PageHero art="demo" photo="presentation" shot="workspace" shotName="Workspace" eyebrow="Request a demo" title="See your business" accent="running on SelfRun." lead="In a 30-minute session we map the platform to your own processes and show how much of the repetitive work it can take over." chip={{ title: "30-minute walkthrough", text: "Built around your own scenarios" }} />
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead icon="rocket" eyebrow="Your demo" title="What you" accent="will see." lead="A short, focused session built around your own business." />
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div className="space-y-6">
            <NumberedRows cols={1} items={["A walkthrough of the panels that matter to your business", "A live example of AI answering a question from your kind of data", "Automations for the processes that cost you the most time", "How your own brand, domain and apps would look", "A clear view of plans, users and what a rollout looks like"].map((t) => ({ title: t }))} />
            <p className="text-muted-foreground">Prefer to explore on your own? <Link href="/signup" className="font-bold text-primary">Get started free</Link>.</p>
          </div>
          <InquiryForm kind="demo" />
          </div>
        </div>
      </section>
      <FaqSection topics={["General", "Setup", "Plans & pricing"]} limit={5} title="Before your" accent="demo." lead="What people ask before booking a walkthrough." />
    </>
  );
}
