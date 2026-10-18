import FaqSection from "@/components/platform/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import FindWorkspaceForm from "@/components/platform/saas/FindWorkspaceForm";
import { Blobs, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Reveal from "@/components/platform/saas/Reveal";
import { ArrowRight, Building2, Globe, LayoutDashboard, ShieldCheck, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SelfRun AI workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

const FEATURES = [
  { icon: LayoutDashboard, title: "One login", text: "Sign in once and reach every product your role gives you access to." },
  { icon: Users, title: "Role-based access", text: "Each person sees only the products and data their role allows." },
  { icon: Globe, title: "Your own address", text: "Every company gets its own workspace URL or custom domain." },
  { icon: ShieldCheck, title: "Secure by default", text: "Rate-limited, logged, and protected with optional two-factor auth." },
  { icon: Building2, title: "Multi-company ready", text: "Platform staff and company teams sign in through the same flow." },
  { icon: Sparkles, title: "AI in every product", text: "Assistants, intelligence and automation are built in, not bolted on." },
];

export default function LoginPage() {
  return (
    <>
      <PageHero art="login" photo="team-desk" shot="workspace" shotName="Workspace" eyebrow="Log in" title="Sign in to" accent="your workspace." lead={<>Every company has its own workspace address. Enter yours and we&apos;ll take you to its sign-in page. New here? <Link href="/signup" className="font-bold text-primary">Get started free</Link>.</>}>
        <div className="w-full max-w-md"><FindWorkspaceForm /></div>
      </PageHero>

      {/* ── Section below hero: left interaction + right info ── */}
      <section className="sr-section relative bg-muted/10">
        <Blobs />
        <div className="sr-grid-bg" aria-hidden />
        <div className="sr-container relative">
          <SectionHead icon="lock" eyebrow="How it works" title="One address," accent="one login." lead="Your workspace address is the key. Enter it once and you'll always land in the right place." />

          <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">

            {/* Left: feature cards */}
            <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8">
                  <span className="sr-icon h-10 w-10">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            {/* Right: form card */}
            <Reveal delay={80} className="group relative h-full">
              <span className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/0 to-brand-accent/25 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
              <div className="relative flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 sm:p-7">
                <p className="sr-eyebrow">Find your workspace</p>
                <h3 className="mt-2 text-2xl font-black">Enter your workspace address</h3>
                <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
                  Your slug (e.g. <span className="font-semibold text-foreground">acme</span>) or custom domain — it's in your invitation email.
                </p>
                <FindWorkspaceForm plain />
                <p className="mt-5 text-sm text-muted-foreground">
                  Don't have a workspace?{" "}
                  <Link href="/signup" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                    Get started free <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      <FaqSection topics={["Setup", "Data & security", "General"]} limit={5} />
    </>
  );
}
