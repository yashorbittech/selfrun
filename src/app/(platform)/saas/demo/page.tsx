import FaqSection from "@/components/platform/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "@/components/platform/saas/InquiryForm";
import { Blobs, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Reveal from "@/components/platform/saas/Reveal";
import DemoExperience from "@/components/platform/saas/DemoExperience";
import DemoAgenda from "@/components/platform/saas/DemoAgenda";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "See SelfRun AI in action. We'll walk you through the platform using your own business scenarios — CRM, HR, finance, projects, AI and automation.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <>
      <PageHero art="demo" photo="presentation" shot="workspace" shotName="SelfRun CommandOS" eyebrow="Request a demo" title="See your business" accent="running on SelfRun." lead="In a 30-minute session we map the platform to your own processes and show how much of the repetitive work it can take over." chip={{ title: "30-minute walkthrough", text: "Built around your own scenarios" }} />
      <DemoExperience />
      <section className="sr-section relative bg-muted/10">
        <Blobs />
        <div className="sr-grid-bg" aria-hidden />
        <div className="sr-container relative">
          <SectionHead icon="rocket" eyebrow="Guided walkthrough" title="Make the demo" accent="about your business." lead="Bring one process you want to improve. We’ll focus the session on your team’s workflow and leave time for your questions." />
          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="space-y-5">
            <Reveal><DemoAgenda /></Reveal>
            <p className="px-1 text-sm text-muted-foreground">Prefer to explore independently? <a href="#self-guided-demo" className="font-bold text-primary">Open the interactive product tour above</a>, or <Link href="/signup" className="font-bold text-primary">get started free</Link>.</p>
          </div>
          <Reveal delay={80} className="group relative">
            {/* the system's gradient edge glow, blooming behind the form on hover (FeatureGrid pattern) */}
            <span className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/0 to-brand-accent/25 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
            <div className="relative rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 sm:p-7">
              <p className="sr-eyebrow">Request a session</p>
              <h3 className="mt-2 text-2xl font-black">Let’s plan your walkthrough</h3>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">Share a few details and the team will follow up to arrange a session around your needs.</p>
              <InquiryForm kind="demo" />
            </div>
          </Reveal>
          </div>
        </div>
      </section>
      <FaqSection topics={["General", "Setup", "Plans & pricing"]} limit={5} title="Before your" accent="demo." lead="What people ask before booking a walkthrough." />
    </>
  );
}
