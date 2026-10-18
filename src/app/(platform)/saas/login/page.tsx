import FaqSection from "@/components/platform/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import FindWorkspaceForm from "@/components/platform/saas/FindWorkspaceForm";
import { Blobs, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Reveal from "@/components/platform/saas/Reveal";
import { ArrowRight, Bot, BarChart3, Briefcase, Check, Globe, LayoutDashboard, MessageSquare, ShieldCheck, Users, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SelfRun AI workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your workspace address",
    text: "Type your company slug (e.g. acme) or your custom domain. It's in your invitation email or the URL you use every day.",
  },
  {
    step: "02",
    title: "Land on your company's sign-in",
    text: "We route you to your workspace's own login page — isolated from every other company on the platform.",
  },
  {
    step: "03",
    title: "One login, every product",
    text: "Sign in once and reach HR, Projects, CRM, Finance, AI and every other product your role gives you access to.",
  },
];

const PRODUCTS = [
  { icon: Users,         label: "HR & Payroll",       text: "Employees, attendance, leave, payroll, recruitment" },
  { icon: Briefcase,     label: "Projects",            text: "Clients, tasks, timesheets, costing, approvals" },
  { icon: BarChart3,     label: "CRM & Sales",         text: "Leads, pipeline, campaigns, offers, wallet" },
  { icon: Wallet,        label: "Finance",             text: "Invoices, payments, accounting, reports" },
  { icon: MessageSquare, label: "Team Chat",           text: "Channels, DMs, calls, announcements" },
  { icon: Globe,         label: "Website & SEO",       text: "Pages, blog, forms, SEO, custom domain" },
  { icon: Bot,           label: "AI Assistants",       text: "Custom bots trained on your business data" },
  { icon: LayoutDashboard, label: "Command Center",    text: "Users, roles, billing, audit log, settings" },
];

const TRUST = [
  "Role-based access — each person sees only what their role allows",
  "Full audit trail on every action across every product",
  "Encrypted credentials and strict company isolation",
  "Rate-limited sign-in with optional two-factor auth",
  "Your own workspace address or custom domain with automatic SSL",
  "Data never shared between companies — scoped at the database layer",
];

export default function LoginPage() {
  return (
    <>
      <PageHero
        art="login"
        photo="team-desk"
        shot="workspace"
        shotName="Workspace"
        eyebrow="Log in"
        title="Sign in to"
        accent="your workspace."
        lead={<>Every company has its own workspace address. Enter yours and we&apos;ll take you to its sign-in page. New here? <Link href="/signup" className="font-bold text-primary">Get started free</Link>.</>}
      >
        <div className="w-full max-w-md"><FindWorkspaceForm /></div>
      </PageHero>

      {/* ── How it works + form ── */}
      <section className="sr-section relative bg-muted/10">
        <Blobs />
        <div className="sr-grid-bg" aria-hidden />
        <div className="sr-container relative">
          <SectionHead
            icon="lock"
            eyebrow="How sign-in works"
            title="Your address,"
            accent="your workspace."
            lead="SelfRun is multi-tenant — every company is completely isolated. Your workspace address is the key that takes you straight to your company's sign-in."
          />

          <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">

            {/* Left: 3-step flow */}
            <Reveal className="flex flex-col gap-4">
              {HOW_IT_WORKS.map(({ step, title, text }) => (
                <div key={step} className="group relative flex gap-5 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 sm:p-6">
                  <span className="sr-numeral text-7xl font-black leading-none">{step}</span>
                  <div className="relative z-10">
                    <p className="sr-eyebrow">Step {step}</p>
                    <p className="mt-1 text-lg font-black leading-snug">{title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
                <p className="text-sm font-bold">Don't know your workspace address?</p>
                <p className="mt-1 text-sm text-muted-foreground">Check your invitation email — it contains your workspace URL. Or ask your company's Super Admin.</p>
                <Link href="/contact" className="sr-link mt-3 inline-flex">
                  Contact support <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            {/* Right: form card */}
            <Reveal delay={80} className="group relative h-full">
              <span className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/0 to-brand-accent/25 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
              <div className="relative flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 sm:p-7">
                <p className="sr-eyebrow">Find your workspace</p>
                <h3 className="mt-2 text-2xl font-black">Enter your workspace address</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your slug (e.g. <span className="font-semibold text-foreground">acme</span>) or custom domain — it's in your invitation email.
                </p>
                <div className="mt-6">
                  <FindWorkspaceForm plain />
                </div>
                <div className="mt-6 space-y-2">
                  {["No separate login per product", "Works on any device — browser or installed app", "Session stays active across all your products"].map((t) => (
                    <p key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> {t}
                    </p>
                  ))}
                </div>
                <div className="mt-auto pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Don't have a workspace?{" "}
                    <Link href="/signup" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                      Get started free — it's free forever <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── Products inside the workspace ── */}
      <section className="sr-section relative">
        <Blobs />
        <div className="sr-container relative">
          <SectionHead
            icon="layers"
            eyebrow="What's inside"
            title="Every product,"
            accent="one sign-in."
            lead="Sign in once and your sidebar shows every product your plan includes and your role gives you access to — no separate logins, no switching accounts."
          />
          <Reveal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {PRODUCTS.map(({ icon: Icon, label, text }) => (
                <div key={label} className="group flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <span className="sr-icon h-10 w-10 shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-black leading-snug">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Security & trust ── */}
      <section className="sr-section relative bg-muted/10">
        <Blobs />
        <div className="sr-grid-bg" aria-hidden />
        <div className="sr-container relative">
          <SectionHead
            icon="shield"
            eyebrow="Security & trust"
            title="Built for"
            accent="real businesses."
            lead="Every workspace is isolated, every action is logged, and every person sees only what their role allows."
          />
          <Reveal>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TRUST.map((t) => (
                <div key={t} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            <div className="sr-band rounded-3xl p-6 shadow-xl shadow-primary/20 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black text-white">Ready to get started?</p>
                  <p className="mt-1 text-sm text-white/70">Free plan includes every product. No credit card, no trial expiry.</p>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
                >
                  Create your workspace free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection topics={["Setup", "Data & security", "General"]} limit={5} />
    </>
  );
}
