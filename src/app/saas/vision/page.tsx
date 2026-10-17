import type { Metadata } from "next";
import Link from "next/link";
import { productPath } from "@/lib/saas/product-routes";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Layers,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { CtaBand, SectionHead } from "@/components/saas/blocks";
import Reveal from "@/components/saas/Reveal";
import { marketingFor } from "@/lib/saas/screens";

export const metadata: Metadata = {
  title: "Product Vision — One Platform. 100x Productivity.",
  description:
    "SelfRun AI's product vision: make every business automated, 24/7. Replace 20 expensive subscriptions with one AI-powered operating system built for Startups, MSMEs, and SMBs.",
  alternates: { canonical: "/vision" },
};

/* ─── DATA ─────────────────────────────────────────────────────── */

const PAIN_TOOLS = [
  { name: "Salesforce", price: "₹12,000", color: "from-blue-500/20 to-blue-600/10" },
  { name: "Jira", price: "₹800", color: "from-blue-400/20 to-indigo-500/10" },
  { name: "QuickBooks", price: "₹2,500", color: "from-green-500/20 to-emerald-600/10" },
  { name: "Slack", price: "₹600", color: "from-purple-500/20 to-violet-600/10" },
  { name: "BambooHR", price: "₹3,500", color: "from-rose-500/20 to-pink-600/10" },
  { name: "Moodle LMS", price: "₹1,200", color: "from-amber-500/20 to-orange-600/10" },
  { name: "Zendesk", price: "₹2,000", color: "from-yellow-500/20 to-amber-600/10" },
  { name: "DocuSign", price: "₹1,800", color: "from-cyan-500/20 to-teal-600/10" },
  { name: "HubSpot", price: "₹4,200", color: "from-orange-500/20 to-red-600/10" },
  { name: "Ahrefs", price: "₹8,000", color: "from-fuchsia-500/20 to-purple-600/10" },
  { name: "Webflow", price: "₹2,400", color: "from-teal-500/20 to-cyan-600/10" },
  { name: "+ 9 More", price: "₹6,000+", color: "from-gray-500/20 to-slate-600/10" },
];

const LEAD_SOURCES = [
  { label: "Meta Ads", icon: "📱", desc: "Facebook & Instagram lead forms → instant pipeline sync" },
  { label: "Google Ads", icon: "🔍", desc: "Search & Display leads via Google Ads Conversions API" },
  { label: "LinkedIn", icon: "💼", desc: "B2B lead gen forms → auto-qualified into CRM deals" },
  { label: "Upwork", icon: "🌐", desc: "Freelance job proposals tracked as deal opportunities" },
  { label: "Website Forms", icon: "📋", desc: "Native forms on your SiteCraft website → zero webhook setup" },
  { label: "WhatsApp", icon: "💬", desc: "WhatsApp Cloud API two-way automated conversation flows" },
  { label: "Email Campaigns", icon: "✉️", desc: "Click tracking → intent scoring → deal stage advancement" },
  { label: "Referral Network", icon: "🎁", desc: "Wallet-credit referral programs auto-attributed to source" },
];

const BUSINESS_SCENARIOS = [
  {
    type: "Startup Founder",
    icon: "🚀",
    gradient: "from-violet-500/20 via-indigo-500/10 to-transparent",
    border: "border-violet-500/30",
    story: "Riya started her D2C brand with ₹50,000. SelfRun runs her website, captures Instagram leads, sends invoices, and her AI agent replies to customers at 2 AM — all free.",
    automation: ["Website live in 20 minutes", "First lead captured from Instagram", "Invoice sent automatically on order", "AI agent handles 3 AM customer query"],
  },
  {
    type: "MSME Owner",
    icon: "🏭",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    border: "border-emerald-500/30",
    story: "Suresh runs a 40-person manufacturing unit. SelfRun manages attendance biometrics, calculates PF/ESI/PT automatically, generates GST e-Invoices, and pays vendors via H2H banking.",
    automation: ["Biometric attendance auto-sync daily", "PF, ESI, PT calculated in one click", "GST e-Invoice generated with IRN", "Bulk vendor payout via H2H API"],
  },
  {
    type: "Agency Owner",
    icon: "🎯",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    border: "border-amber-500/30",
    story: "Priya's 15-person digital agency uses SelfRun for project tracking, client contracts, employee payroll, and social media scheduling — saving ₹85,000/month in subscriptions.",
    automation: ["Project milestone billed automatically", "Client contract e-signed in minutes", "Payroll processed on the 1st", "30 social posts scheduled for the month"],
  },
  {
    type: "Training Institute",
    icon: "🎓",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    border: "border-rose-500/30",
    story: "Akash's coding institute runs 12 batches. SelfRun manages admissions from LinkedIn ads, collects fees, conducts proctored assessments, and issues blockchain-verified certificates.",
    automation: ["LinkedIn lead → admission in one flow", "Fee installment link sent automatically", "Proctored online assessment in minutes", "Blockchain certificate issued on graduation"],
  },
];

const HORIZONS = [
  {
    num: "01",
    phase: "Live Today",
    title: "20 Standalone SaaS Engines",
    badge: "Production v1.0 ✓",
    badgeColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
    color: "text-emerald-500",
    ringColor: "ring-emerald-500/30",
    summary: "Every product is fully functional, independently deployable, and sharing one real-time database fabric. Free forever. Zero credit card.",
    items: [
      "CRM, HR, Finance, Projects, Procurement — all live",
      "One login, one permission system, zero data sync lag",
      "White-label: your logo, your domain, your brand",
      "Free forever plan with 100% features unlocked",
      "AI assistant grounded in your actual business data",
      "Immutable audit trail on every action across all products",
    ],
  },
  {
    num: "02",
    phase: "Q3/Q4 Active Engineering",
    title: "Deep Compliance & Banking APIs",
    badge: "In Development",
    badgeColor: "bg-primary/15 text-primary border-primary/30",
    color: "text-primary",
    ringColor: "ring-primary/30",
    summary: "Native Indian statutory compliance, government portal integrations, and direct H2H banking APIs — making SelfRun the most India-native business OS on the market.",
    items: [
      "PF (₹15K cap), ESI (₹21K limit), PT state slabs, LWF auto-deduction",
      "TDS Old & New Tax Regime with Form-16 auto-generation",
      "NIC/IRP GST e-Invoicing with IRN & QR Code signing",
      "H2H Banking APIs: ICICI, HDFC, SBI, Axis, RazorpayX",
      "ZKTeco & eSSL biometric real-time attendance push",
      "Visual Node-Canvas Workflow Builder — no-code automation",
    ],
  },
  {
    num: "03",
    phase: "2026-2027 Strategic Frontier",
    title: "The Autonomous AI Enterprise",
    badge: "Future Vision",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    color: "text-purple-400",
    ringColor: "ring-purple-500/30",
    summary: "From software that assists humans to an autonomous operating system where AI agents execute complex multi-step business processes with zero manual intervention.",
    items: [
      "Multi-agent swarms: qualify lead → draft contract → raise invoice autonomously",
      "1-click F&F Settlement: gratuity, notice period buyout, asset recovery",
      "SOC 2 Type II + ISO 27001 + India DPDP Act 2023 certification",
      "Voice AI SDRs calling inbound leads via conversational phone AI",
      "Predictive 90-day cash flow simulation from live ledger velocity",
      "Self-healing workflows that auto-repair on API schema changes",
    ],
  },
];

const PRODUCTS_SHOWCASE = [
  {
    key: "lms",
    name: "DealFlow AI",
    tagline: "CRM & Revenue Acceleration",
    desc: "Visual Kanban pipeline, omnichannel lead capture, campaign attribution, and AI deal scoring. Replaces Salesforce.",
    aura: "from-indigo-500/25 via-purple-500/10",
    border: "border-indigo-500/30",
    icon: "🎯",
  },
  {
    key: "hrms",
    name: "TalentOS",
    tagline: "HR, Payroll & Statutory Compliance",
    desc: "Employee records, biometric attendance, automated payroll with PF/ESI/PT/TDS. Replaces Keka, Darwinbox.",
    aura: "from-amber-500/25 via-orange-500/10",
    border: "border-amber-500/30",
    icon: "👥",
  },
  {
    key: "fms",
    name: "CashFlow AI",
    tagline: "Finance, GST & H2H Banking",
    desc: "Double-entry accounting, GST e-Invoicing, H2H bank payouts, and real-time P&L. Replaces QuickBooks, Tally.",
    aura: "from-emerald-500/25 via-teal-500/10",
    border: "border-emerald-500/30",
    icon: "💳",
  },
  {
    key: "pms",
    name: "SprintOS",
    tagline: "Agile Projects & Timesheets",
    desc: "Kanban boards, Gantt timelines, billable timesheets, and project margin tracking. Replaces Jira, Asana.",
    aura: "from-blue-500/25 via-sky-500/10",
    border: "border-blue-500/30",
    icon: "🚀",
  },
  {
    key: "aibots",
    name: "AgentOS",
    tagline: "Autonomous AI Agents & Copilots",
    desc: "Build specialized AI agents trained on your SOPs, with tool-calling powers over your live business data.",
    aura: "from-violet-500/25 via-fuchsia-500/10",
    border: "border-violet-500/30",
    icon: "🤖",
  },
  {
    key: "intelligence",
    name: "DataBrain AI",
    tagline: "Conversational Business Intelligence",
    desc: "Ask 'What was last month's net revenue?' in plain language. Get a chart, the SQL, and the math shown.",
    aura: "from-purple-500/25 via-indigo-500/10",
    border: "border-purple-500/30",
    icon: "🧠",
  },
  {
    key: "messenger",
    name: "Huddle AI",
    tagline: "Enterprise Chat & Video Meetings",
    desc: "Channels, DMs, video calls, and broadcast announcements — all anchored to your business records, not isolated chat.",
    aura: "from-cyan-500/25 via-blue-500/10",
    border: "border-cyan-500/30",
    icon: "💬",
  },
  {
    key: "tms",
    name: "Cohort AI",
    tagline: "LMS & Verifiable Credentials",
    desc: "Course builder, batch scheduling, proctored online exams, and cryptographically verifiable certificates.",
    aura: "from-rose-500/25 via-pink-500/10",
    border: "border-rose-500/30",
    icon: "🎓",
  },
  {
    key: "smms",
    name: "ViralPulse AI",
    tagline: "AI Social Media Marketing",
    desc: "Generate, approve, and auto-publish content across LinkedIn, Instagram, Facebook, and X from one calendar.",
    aura: "from-fuchsia-500/25 via-pink-500/10",
    border: "border-fuchsia-500/30",
    icon: "📱",
  },
  {
    key: "cms",
    name: "SiteCraft AI",
    tagline: "Website Builder & CMS",
    desc: "Drag-and-drop page builder with brand theme designer, built-in forms → CRM sync, and instant publish.",
    aura: "from-sky-500/25 via-blue-500/10",
    border: "border-sky-500/30",
    icon: "🌐",
  },
];

const COMPETITOR_TABLE = [
  {
    dimension: "Total Monthly Cost",
    them: "₹45,000–₹1,20,000/month for a 20-person team across Salesforce, Jira, QuickBooks, Slack, BambooHR, Zendesk, and others",
    us: "Free forever plan. Paid plans from a fraction of any single legacy tool — for the entire platform.",
    highlight: true,
  },
  {
    dimension: "Data Silos & Sync",
    them: "16 databases. Manual CSV exports, broken Zapier webhooks, duplicate entries, and billing mismatches every month.",
    us: "One unified relational database. A deal won in CRM creates the client in finance, opens a project, and starts onboarding — instantly.",
    highlight: false,
  },
  {
    dimension: "Indian Statutory Compliance",
    them: "US-built SaaS ignores Indian laws. You pay a separate payroll bureau for PF/ESI and manually upload GST JSON to IRP.",
    us: "Native PF, ESI, PT, LWF, TDS calculation engine. Direct NIC/IRP GST e-Invoicing and H2H bank APIs built into the platform.",
    highlight: false,
  },
  {
    dimension: "AI Integration",
    them: "Generic 'AI' add-on at ₹2,500/user/month extra. It has no access to your actual CRM, payroll, or financial data.",
    us: "AI runs natively inside every module — from conversational BI over your live ledger to agents that call your own database tools.",
    highlight: false,
  },
  {
    dimension: "Setup & Onboarding",
    them: "3-month enterprise onboarding, dedicated consultants, and ₹5 lakh implementation fees before you see a single screen.",
    us: "Sign up → your entire business is live in under 5 minutes. No implementation partner, no credit card, no hidden setup fee.",
    highlight: false,
  },
  {
    dimension: "Your Brand Identity",
    them: "Your team logs into Jira.com, Slack.com, BambooHR.com. Clients see 6 different vendor logos and get confused.",
    us: "100% your brand. Your domain, your colors, your logo everywhere. Installable PWA apps with your company name on the homescreen.",
    highlight: false,
  },
];

const PRICING_PLANS = [
  {
    name: "Free Forever",
    price: "₹0",
    period: "/ month",
    badge: "No Credit Card",
    gradient: "from-card to-muted/20",
    border: "border-border/70",
    button: "Start Free — Today",
    buttonStyle: "bg-foreground text-background hover:bg-foreground/90",
    highlight: false,
    features: [
      "All 20 products fully unlocked",
      "Unlimited team members",
      "AI assistant included",
      "Custom domain support",
      "White-label branding",
      "Audit trail & security",
    ],
  },
  {
    name: "Growth",
    price: "₹999",
    period: "/ month",
    badge: "Most Popular",
    gradient: "from-primary/10 via-card to-brand-accent/10",
    border: "border-primary/50",
    button: "Start Free Trial",
    buttonStyle: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30",
    highlight: true,
    features: [
      "Everything in Free",
      "Advanced automations",
      "Priority AI model access",
      "H2H banking integrations",
      "GST e-Invoicing (IRN)",
      "Dedicated onboarding call",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    badge: "For Large Teams",
    gradient: "from-card to-muted/20",
    border: "border-border/70",
    button: "Talk to Us",
    buttonStyle: "bg-foreground text-background hover:bg-foreground/90",
    highlight: false,
    features: [
      "Everything in Growth",
      "Multi-entity consolidation",
      "Dedicated cloud infrastructure",
      "SOC 2 Type II on request",
      "SLA-backed uptime guarantee",
      "Assigned customer success",
    ],
  },
];

const SECURITY_CERTS = [
  { label: "AES-256", sub: "Field-Level Encryption", icon: <Lock className="h-5 w-5" /> },
  { label: "Zero-Trust", sub: "Architecture", icon: <ShieldCheck className="h-5 w-5" /> },
  { label: "SOC 2 Type II", sub: "Roadmap 2026", icon: <Shield className="h-5 w-5" /> },
  { label: "ISO 27001", sub: "Roadmap 2026", icon: <Shield className="h-5 w-5" /> },
  { label: "DPDP Act", sub: "India Compliance", icon: <Shield className="h-5 w-5" /> },
  { label: "VAPT Audited", sub: "Annual Pentest", icon: <Shield className="h-5 w-5" /> },
];

/* ─── PAGE ──────────────────────────────────────────────────────── */

export default function VisionPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO — Emotional Opening
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-0 pt-20 sm:pt-28 lg:pt-36">
        {/* Background aura */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-primary/20 via-brand-accent/10 to-transparent blur-3xl opacity-70" />
          <div className="absolute right-0 top-32 h-[400px] w-[600px] bg-gradient-to-l from-violet-500/10 to-transparent blur-3xl opacity-60" />
        </div>

        <div className="sr-container text-center">
          {/* Live badge */}
          <Reveal>
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-bold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              20 Products Live in Production · Free Forever · Zero Credit Card
            </div>
          </Reveal>

          {/* Main headline */}
          <Reveal delay={60}>
            <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
              <span className="block text-foreground">You had the idea.</span>
              <span className="block bg-gradient-to-r from-primary via-brand-accent to-violet-500 bg-clip-text text-transparent">
                We built the engine.
              </span>
            </h1>
          </Reveal>

          {/* Sub headline */}
          <Reveal delay={120}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Most people have incredible business ideas — but expensive SaaS subscriptions,
              manual processes, and 16 fragmented tools kill the dream before it begins.
              <span className="font-bold text-foreground"> SelfRun AI changes that forever.</span>
            </p>
          </Reveal>

          {/* The promise pill */}
          <Reveal delay={180}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
              {["100x Productivity", "24/7 AI Automation", "1 Platform · 20 Software Engines", "Replace 20+ Tools"].map((pill) => (
                <span key={pill} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-5 py-2 text-foreground backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {pill}
                </span>
              ))}
            </div>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
              >
                Start Free — No Card Needed
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-8 py-4 text-sm font-bold text-foreground backdrop-blur transition-all hover:bg-muted"
              >
                See All 20 Products
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {/* Hero product screenshots grid — 3 floating screens */}
          <Reveal delay={300}>
            <div className="relative mx-auto mt-16 max-w-6xl">
              {/* Central glow */}
              <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[300px] w-[700px] rounded-full bg-gradient-to-b from-primary/30 to-transparent blur-3xl opacity-50" />

              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                {(["lms", "hrms", "fms"] as const).map((key, i) => {
                  const img = marketingFor(key);
                  const tilts = ["[transform:rotateY(-4deg)_rotateX(3deg)]", "[transform:rotateX(2deg)]", "[transform:rotateY(4deg)_rotateX(3deg)]"];
                  return (
                    <div key={key} style={{ perspective: "1200px" }}>
                      <div className={`overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl shadow-primary/15 transition-transform duration-700 hover:rotate-0 hover:scale-[1.02] ${tilts[i]}`}>
                        <div className="flex items-center gap-1.5 border-b border-border/40 bg-muted/50 px-3 py-2">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        </div>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" style={{ transform: "scale(1.1)", transformOrigin: "50% 45%" }} />
                        ) : (
                          <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-background to-brand-accent/10" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STICKY NAV
      ══════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Vision sections"
        className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl shadow-sm"
      >
        <div className="sr-container sr-scroll-x flex gap-2 py-3.5">
          {[
            { href: "#problem", label: "The Problem" },
            { href: "#ai-engine", label: "AI Engine" },
            { href: "#automation", label: "24/7 Automation" },
            { href: "#products", label: "20 Products" },
            { href: "#scenarios", label: "For Every Business" },
            { href: "#horizons", label: "Roadmap" },
            { href: "#competitors", label: "vs Legacy Stack" },
            { href: "#pricing", label: "Pricing" },
            { href: "#security", label: "Security" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1 text-xs font-bold text-foreground transition-all hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: THE PROBLEM — "The ₹45,000/Month Trap"
      ══════════════════════════════════════════════════════════ */}
      <section id="problem" className="sr-section border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 mb-6">
                The Real Problem
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-foreground">The SaaS Tax is</span>{" "}
                <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                  killing your dream.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Every great business idea is buried under a mountain of software bills.
                A 20-person startup today pays ₹45,000–₹1,20,000 every single month —
                just to keep 16 disconnected tools running. That&apos;s money that should go into growth.
              </p>
            </div>
          </Reveal>

          {/* Tool cost grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-12">
            {PAIN_TOOLS.map((tool, i) => (
              <Reveal key={tool.name} delay={i * 40}>
                <div className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${tool.color} p-4 transition-all hover:scale-105 hover:shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{tool.name}</span>
                    <span className="font-mono text-xs font-black text-rose-500">{tool.price}/mo</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-rose-500/20">
                    <div className="h-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-700 group-hover:w-full" style={{ width: `${60 + i * 3}%` }} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Big impact number */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-transparent p-10 text-center shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)]" />
              <p className="text-7xl font-black text-rose-500 sm:text-9xl">₹45K+</p>
              <p className="mt-2 text-2xl font-black text-foreground sm:text-3xl">wasted every month on fragmented SaaS</p>
              <p className="mt-4 text-muted-foreground">
                For a 20-person team. Plus hidden costs: integration consultants, data migration, broken automations, and 16 different learning curves.
              </p>
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-8 py-4">
                <span className="text-2xl font-black text-emerald-500">SelfRun AI: ₹0/month</span>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Free Forever</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: THE AI ENGINE — 24/7 Automation
      ══════════════════════════════════════════════════════════ */}
      <section id="ai-engine" className="sr-section border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-6">
                The AI Core
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-foreground">Your business runs</span>{" "}
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  while you sleep.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                The SelfRun Conversational AI Agent never takes a day off. It qualifies leads at 3 AM,
                answers customer queries instantly, follows up on overdue invoices, and hands off to
                your team only when human judgment is truly needed.
              </p>
            </div>
          </Reveal>

          {/* AI Agent visual */}
          <div className="grid gap-8 lg:grid-cols-2 items-center mb-20">
            <Reveal>
              <div className="relative">
                {/* Agent terminal card */}
                <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-2xl shadow-primary/15">
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/60 px-5 py-3.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-3 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                      SelfRun AI Agent · Online
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                    </span>
                  </div>
                  <div className="space-y-4 p-6 font-mono text-sm">
                    {[
                      { side: "right", msg: "Hi! I found your ad on Instagram. I need accounting software for my 25-person team.", time: "3:17 AM" },
                      { side: "left", msg: "Hello! I'm the SelfRun AI. Great to hear — I'd love to understand your needs. Are you currently using any accounting software, or starting fresh?", time: "3:17 AM" },
                      { side: "right", msg: "We use Tally but it's too complicated. We also need HR and payroll.", time: "3:18 AM" },
                      { side: "left", msg: "Perfect. SelfRun includes CashFlow AI (replaces Tally), TalentOS for HR & payroll, and 18 more modules — all free. Shall I book a 15-minute call with our team?", time: "3:18 AM" },
                    ].map((m, i) => (
                      <div key={i} className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${m.side === "left" ? "bg-primary/15 text-foreground border border-primary/25" : "bg-muted/60 text-muted-foreground border border-border/50"}`}>
                          <p>{m.msg}</p>
                          <p className={`mt-1 text-[10px] ${m.side === "left" ? "text-primary/60" : "text-muted-foreground/60"}`}>{m.time}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      AI Agent booked a demo call and created a deal in DealFlow CRM automatically
                    </div>
                  </div>
                </div>

                {/* Floating time badge */}
                <div className="absolute -bottom-4 -right-4 flex items-center gap-2 rounded-2xl border border-border/80 bg-background/95 px-5 py-3 text-xs font-bold shadow-2xl backdrop-blur ring-1 ring-primary/20">
                  <Clock className="h-4 w-4 text-amber-500" />
                  3:18 AM · Lead qualified · Deal created · Zero human involvement
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="space-y-5">
                <h3 className="text-3xl font-black tracking-tight sm:text-4xl">
                  The AI Agent that never clocks out.
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your SelfRun Conversational AI is trained on your products, pricing, and SOPs.
                  It handles inquiries from any channel — WhatsApp, website chat, email — with
                  context-aware responses grounded in your real business data, not generic scripts.
                </p>
                {[
                  { icon: <Bot className="h-5 w-5" />, title: "Handles inquiries 24/7", body: "Qualifies leads, answers FAQs, and books meetings even at midnight — for any timezone, any language." },
                  { icon: <Brain className="h-5 w-5" />, title: "Grounded in your data", body: "Knows your pricing, your product capabilities, your team schedules — because it reads your live business records." },
                  { icon: <Workflow className="h-5 w-5" />, title: "Triggers real actions", body: "Creates CRM deals, sends invoices, assigns tasks, and notifies your team — it doesn't just chat, it works." },
                  { icon: <TrendingUp className="h-5 w-5" />, title: "Learns from outcomes", body: "Win rates, response quality, and customer satisfaction scores feed back into agent refinement continuously." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-black text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: AUTOMATED LEAD ENGINE
      ══════════════════════════════════════════════════════════ */}
      <section id="automation" className="sr-section bg-muted/10 border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-violet-500/10 border border-violet-500/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-500 mb-6">
                Automated Lead Capture
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Every lead, from every platform.{" "}
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Automatically.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Stop manually exporting CSVs from Meta Ads. Stop copying leads from LinkedIn into spreadsheets.
                SelfRun captures every lead from every channel, enriches it, routes it to the right sales rep,
                and starts an AI follow-up sequence — without a single human touch.
              </p>
            </div>
          </Reveal>

          {/* Lead sources grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-16">
            {LEAD_SOURCES.map((src, i) => (
              <Reveal key={src.label} delay={i * 50}>
                <div className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 backdrop-blur">
                  <span className="text-3xl">{src.icon}</span>
                  <span className="font-black text-foreground">{src.label}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{src.desc}</span>
                  <div className="mt-auto flex items-center gap-1.5 text-[10px] font-bold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Auto-sync
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Automation flow visualization */}
          <Reveal>
            <div className="overflow-hidden rounded-[2.5rem] border border-border/70 bg-gradient-to-br from-card via-card/95 to-muted/20 p-8 shadow-2xl">
              <p className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
                The Automated Lead Journey — Zero Manual Steps
              </p>
              <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-start sm:justify-between">
                {[
                  { icon: "📱", step: "01", title: "Lead Captured", desc: "Instagram ad form submitted at 2 AM" },
                  { icon: "🤖", step: "02", title: "AI Qualifies", desc: "Conversational agent asks 3 questions" },
                  { icon: "📊", step: "03", title: "CRM Deal Created", desc: "Score assigned, owner notified" },
                  { icon: "📧", step: "04", title: "Drip Sequence Starts", desc: "Personalized emails & WhatsApp" },
                  { icon: "📅", step: "05", title: "Demo Booked", desc: "Calendar invite sent automatically" },
                  { icon: "🎉", step: "06", title: "Deal Won", desc: "Contract, invoice, onboarding — auto-triggered" },
                ].map((step, i, arr) => (
                  <div key={step.step} className="flex flex-col items-center sm:flex-1">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/50 text-2xl shadow-sm">
                        {step.icon}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-primary">{step.step}</span>
                      <span className="font-black text-foreground text-sm">{step.title}</span>
                      <span className="text-[11px] text-muted-foreground max-w-[120px]">{step.desc}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="my-4 h-5 w-5 shrink-0 text-primary/40 rotate-90 sm:rotate-0 sm:absolute sm:hidden" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: 20 PRODUCTS SHOWCASE
      ══════════════════════════════════════════════════════════ */}
      <section id="products" className="sr-section border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-6">
                20 Standalone Products
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Each product is a{" "}
                <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">
                  complete SaaS.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Every module below is an independent, market-ready software engine.
                Sell subscriptions to just the CRM. Run just HR. Or deploy the full platform.
                Each one replaces an expensive legacy tool — and all 20 share one database.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS_SHOWCASE.map((p, i) => {
              const img = marketingFor(p.key);
              return (
                <Reveal key={p.key} delay={(i % 3) * 80}>
                  <div className={`group relative overflow-hidden rounded-[2rem] border ${p.border} bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}>
                    {/* Aura glow */}
                    <span className={`pointer-events-none absolute -inset-8 -z-10 bg-gradient-to-br ${p.aura} to-transparent blur-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`} aria-hidden />

                    {/* Product screenshot */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ transform: "scale(1.08)", transformOrigin: "50% 45%" }}
                        />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${p.aura} to-background/50 flex items-center justify-center`}>
                          <span className="text-5xl">{p.icon}</span>
                        </div>
                      )}
                      {/* Bottom gradient overlay */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card via-card/60 to-transparent" />

                      {/* Live badge */}
                      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-background/90 px-2.5 py-1 text-[10px] font-bold text-emerald-500 backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{p.icon}</span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.tagline}</p>
                          <h3 className="font-black text-foreground">{p.name}</h3>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground mb-4">{p.desc}</p>
                      <Link
                        href={productPath(p.key)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all hover:gap-2.5"
                      >
                        Explore {p.name} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}

            {/* +10 more products card */}
            <Reveal delay={240}>
              <Link
                href="/products"
                className="group flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-border/60 bg-muted/20 p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5 min-h-[300px]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-2xl font-black text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                  +10
                </span>
                <div>
                  <p className="font-black text-foreground">10 More Products</p>
                  <p className="mt-1 text-sm text-muted-foreground">SEO, Social Media, Contracts, Support, Assessments, Procurement, Training, Credentials, Client Portal, Sites</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                  See All 20 <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5: FOR EVERY BUSINESS
      ══════════════════════════════════════════════════════════ */}
      <section id="scenarios" className="sr-section bg-muted/10 border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-6">
                For Every Business Type
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Automate your business,{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  whatever you do.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Whether you are a solo founder, a 500-person manufacturer, a coaching institute, or a digital agency —
                SelfRun AI runs your entire operation, automatically.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            {BUSINESS_SCENARIOS.map((scenario, i) => (
              <Reveal key={scenario.type} delay={i * 80}>
                <div className={`group relative overflow-hidden rounded-[2rem] border ${scenario.border} bg-gradient-to-br from-card via-card/95 to-muted/20 p-8 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`}>
                  <span className={`pointer-events-none absolute -inset-8 -z-10 bg-gradient-to-br ${scenario.gradient} to-transparent blur-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`} aria-hidden />

                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/50 text-3xl">
                      {scenario.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Real-World Scenario</p>
                      <h3 className="text-xl font-black text-foreground">{scenario.type}</h3>
                    </div>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground italic">
                    &ldquo;{scenario.story}&rdquo;
                  </p>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">What SelfRun Automates</p>
                    {scenario.automation.map((action, j) => (
                      <div key={j} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm font-medium text-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6: 3-HORIZON ROADMAP
      ══════════════════════════════════════════════════════════ */}
      <section id="horizons" className="sr-section border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-6">
                3-Horizon Roadmap
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Where we are.{" "}
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  Where we&apos;re going.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            {HORIZONS.map((h, i) => (
              <Reveal key={h.num} delay={i * 100}>
                <div className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card/95 to-muted/20 p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ring-1 ${h.ringColor}`}>
                  {/* Number watermark */}
                  <span className={`absolute right-6 top-4 font-mono text-8xl font-black opacity-[0.04] ${h.color}`}>{h.num}</span>

                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">{h.phase}</p>
                      <h3 className="mt-1 text-xl font-black text-foreground">{h.title}</h3>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold ${h.badgeColor}`}>
                      {h.badge}
                    </span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{h.summary}</p>

                  <ul className="mt-auto space-y-2.5">
                    {h.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${h.color}`} />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 7: COMPETITOR COMPARISON
      ══════════════════════════════════════════════════════════ */}
      <section id="competitors" className="sr-section bg-muted/10 border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 mb-6">
                SelfRun AI vs Legacy Stack
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                The honest comparison.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                We compared ourselves against the status quo — 16+ fragmented tools, per-seat pricing,
                and zero Indian compliance. Here is what the data says.
              </p>
            </div>
          </Reveal>

          <div className="overflow-hidden rounded-[2rem] border border-border/70 shadow-2xl">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border/70 bg-muted/50">
              <div className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimension</div>
              <div className="border-l border-border/50 p-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-500">
                  ❌ Legacy Stack
                </span>
              </div>
              <div className="border-l border-border/50 p-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-500">
                  ✅ SelfRun AI
                </span>
              </div>
            </div>

            {COMPETITOR_TABLE.map((row, i) => (
              <div
                key={row.dimension}
                className={`grid grid-cols-[1fr_1fr_1fr] border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20 ${row.highlight ? "bg-primary/[0.03]" : ""}`}
              >
                <div className="p-5">
                  <span className="text-sm font-black text-foreground">{row.dimension}</span>
                </div>
                <div className="border-l border-border/40 p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{row.them}</p>
                </div>
                <div className="border-l border-border/40 bg-emerald-500/[0.03] p-5">
                  <p className="text-sm leading-relaxed text-foreground font-medium">{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 8: PRICING DISRUPTION
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="sr-section border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-500 mb-6">
                Pricing Disruption
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Software for every business.{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Not just enterprise.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Per-seat pricing is a predatory model that punishes growth. We believe every business —
                a solo founder or a 500-person company — deserves access to world-class software.
                So we give it all away for free, and charge only for scale.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`relative flex flex-col overflow-hidden rounded-[2rem] border ${plan.highlight ? "border-primary/60" : "border-border/70"} bg-gradient-to-br ${plan.gradient} p-8 shadow-xl h-full transition-all hover:-translate-y-1 hover:shadow-2xl`}>
                  {plan.highlight && (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                      <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black text-primary-foreground">
                        {plan.badge}
                      </span>
                    </>
                  )}

                  <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{plan.name}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-5xl font-black text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-lg text-muted-foreground">{plan.period}</span>}
                    </div>
                    {!plan.highlight && (
                      <span className="mt-1.5 inline-block text-xs font-bold text-muted-foreground">{plan.badge}</span>
                    )}
                  </div>

                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition-all hover:scale-105 ${plan.buttonStyle}`}
                  >
                    {plan.button}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Pricing manifesto */}
          <Reveal>
            <div className="mt-12 overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 text-center">
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h3 className="text-2xl font-black text-foreground sm:text-3xl">
                Why is the Free plan so generous?
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                Because 80% of businesses that fail, fail not from bad ideas — but from the inability to afford
                the tools they need to execute. We believe access to enterprise-grade software is a right, not a privilege.
                When your business grows, we grow with you. That&apos;s our bet on you.
              </p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/20"
              >
                See full pricing details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 9: SECURITY & CERTIFICATIONS
      ══════════════════════════════════════════════════════════ */}
      <section id="security" className="sr-section bg-muted/10 border-b border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500 mb-6">
                Security & Certifications
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Enterprise-grade security.{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                  Zero compromises.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Your business data is your most critical asset. SelfRun AI is built on zero-trust architecture
                with cryptographic isolation between every company workspace — we cannot read your data even if we wanted to.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {SECURITY_CERTS.map((cert, i) => (
              <Reveal key={cert.label} delay={i * 60}>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {cert.icon}
                  </span>
                  <div>
                    <p className="font-black text-foreground">{cert.label}</p>
                    <p className="text-xs text-muted-foreground">{cert.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: <Lock className="h-6 w-6" />,
                color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
                title: "Cryptographic Data Isolation",
                body: "Every company's data is cryptographically isolated at the ORM layer. Multi-tenant architecture with zero cross-tenant data leakage risk by design.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                title: "Granular RBAC",
                body: "Role-based access control down to individual buttons, views, and actions. Define exactly who can read, write, export, or delete — per product, per module.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                title: "Immutable Audit Trail",
                body: "Every sign-in, data export, permission change, and administrative action is logged immutably. Full compliance trail always available for auditors.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
                title: "Annual Penetration Testing",
                body: "Third-party VAPT (Vulnerability Assessment & Penetration Testing) conducted annually. All critical findings remediated within 72 hours.",
              },
              {
                icon: <Layers className="h-6 w-6" />,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                title: "99.9% Uptime SLA",
                body: "Multi-availability-zone cloud deployment with automated failover, health monitoring, and zero-downtime rolling deployments on the Enterprise plan.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
                title: "India DPDP Act 2023",
                body: "Architected for compliance with India's Digital Personal Data Protection Act 2023 — data residency, consent management, and grievance officer workflows on the roadmap.",
              },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 transition-all hover:shadow-lg hover:border-indigo-500/30">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl border ${item.color} mb-4`}>
                    {item.icon}
                  </span>
                  <h3 className="font-black text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 10: ZERO TO BUSINESS IN 5 MIN
      ══════════════════════════════════════════════════════════ */}
      <section className="sr-section border-b border-border/50">
        <div className="sr-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-500 mb-6">
                Zero-to-Live
              </span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Your entire business live{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  in under 5 minutes.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                No implementation partner. No 3-month onboarding. No ₹5 lakh setup fee.
                Sign up, configure, and your business is running — today.
              </p>
            </div>
          </Reveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-8 hidden -translate-x-1/2 h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent lg:block" />

            <div className="space-y-6">
              {[
                { min: "0:00", icon: "🚀", title: "Create Your Workspace", body: "Sign up with Google or email. Your workspace is provisioned instantly — company name, timezone, and currency configured in 30 seconds." },
                { min: "1:00", icon: "🎨", title: "Set Your Brand", body: "Upload your logo, set your primary color, and enter your custom domain. Your workspace instantly reflects your brand — everywhere." },
                { min: "2:00", icon: "👥", title: "Invite Your Team", body: "Add team members with role-based permissions. Assign them to the exact products they need. They get an email and are in." },
                { min: "3:00", icon: "🔗", title: "Connect Your Channels", body: "Plug in Meta Ads, Google Ads, WhatsApp Cloud API, and payment gateways. Leads start flowing in from all platforms automatically." },
                { min: "4:30", icon: "🤖", title: "Activate AI Agents", body: "Configure your conversational AI with your product knowledge. It starts answering customer queries on your website immediately." },
                { min: "5:00", icon: "🎉", title: "Your Business is Live", body: "CRM, HR, Finance, Projects, Website, AI — all running. Your competitors are still waiting for an enterprise SaaS demo call." },
              ].map((step, i) => (
                <Reveal key={step.min} delay={i * 60}>
                  <div className={`relative flex items-start gap-6 rounded-2xl border border-border/60 bg-card/80 p-6 transition-all hover:border-primary/40 hover:shadow-lg ${i % 2 === 1 ? "lg:ml-16" : "lg:mr-16"}`}>
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/50 text-center">
                      <span className="text-xl">{step.icon}</span>
                      <span className="text-[9px] font-mono font-bold text-primary mt-0.5">{step.min}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-foreground">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-1" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="sr-section">
        <div className="sr-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 p-12 text-center shadow-2xl sm:p-20">
              {/* Background decoration */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/30 to-transparent blur-3xl opacity-50" />
                <div className="absolute right-0 bottom-0 h-[300px] w-[500px] rounded-full bg-gradient-to-t from-brand-accent/20 to-transparent blur-3xl opacity-40" />
              </div>

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-xs font-bold text-white/80 mb-8">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  The future of business is autonomous. It starts today.
                </span>

                <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Run your business.{" "}
                  <span className="bg-gradient-to-r from-primary via-brand-accent to-violet-400 bg-clip-text text-transparent">
                    24/7. On autopilot.
                  </span>
                </h2>

                <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 leading-relaxed">
                  Join thousands of Startups, MSMEs, and SMBs who replaced their entire SaaS stack with SelfRun AI.
                  Free forever. No credit card. No implementation fee. Just results.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-9 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/40 transition-all hover:scale-105 hover:bg-primary/90"
                  >
                    Start Free — All 20 Products Unlocked
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-9 py-4 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/20"
                  >
                    View Pricing
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 font-medium">
                  {["✓ No Credit Card Required", "✓ Setup in Under 5 Minutes", "✓ 20 Products Fully Unlocked", "✓ Cancel Anytime"].map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
