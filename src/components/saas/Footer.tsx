import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Logo from "@/components/saas/Logo";
import { SAAS_BRAND } from "@/lib/saas/brand";
import { LEGAL_LINKS, NAV_LINKS } from "@/lib/saas/site";
import { DOCS } from "@/lib/saas/docs";
import { getFeatureModules } from "@/lib/saas/modules";

/** The footer: what the platform is, every panel, the way in, the docs — and the legal pages beside the copyright line. */
export default async function Footer({}: { host?: string }) {
  const panels = await getFeatureModules();
  const byKey = new Map(panels.map((m) => [m.key, m]));
  const guides = ["getting-started", "brand-your-workspace", "your-own-apps", "custom-domain"].map((slug) => DOCS.find((d) => d.slug === slug)).filter((d): d is NonNullable<typeof d> => !!d);
  /** Four categories of five panels each, so every column holds five links. */
  const CATEGORIES: { title: string; keys: string[] }[] = [
    { title: "Sales & marketing", keys: ["lms", "smms", "seo", "cms", "website"] },
    { title: "People & finance", keys: ["hrms", "tms", "ots", "fms", "pms"] },
    { title: "Operations & control", keys: ["workspace", "prms", "sop", "lpms", "dlms"] },
    { title: "AI & collaboration", keys: ["intelligence", "aibots", "messenger", "portal", "support"] },
  ];
  const explore = NAV_LINKS.filter((l) => l.href !== "/docs");
  return (
    <footer className="relative overflow-hidden border-t border-border/50 bg-muted/20">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-9 lg:px-8">
        <div className="sr-band relative mb-9 rounded-[2rem] p-6 shadow-xl shadow-primary/25 sm:px-9 sm:py-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">Put your business on <span className="text-white/70">autopilot.</span></h2>
              <p className="mt-1.5 max-w-xl text-[15px] text-white/80">Free forever for one person, with every panel and every feature — or talk to the team first.</p>
            </div>
            <div className="flex flex-none flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-[15px] font-bold text-black shadow-xl transition-transform hover:scale-105">Get started free <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
              <Link href="/contact" className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3 text-[15px] font-bold text-white backdrop-blur transition-all hover:bg-white/20"><MessageCircle className="h-5 w-5" />Contact us</Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-3 lg:grid-cols-[2.2fr_0.7fr_repeat(5,1fr)]">
          <div className="col-span-2 space-y-4 md:col-span-3 lg:col-span-1">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{SAAS_BRAND.tagline}. One AI-powered platform for sales, people, finance, projects and your website — under your own brand, on web, Android, iOS and desktop.</p>
            <p className="text-xs text-muted-foreground">Free forever for one person. Every panel, every feature.</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Explore</p>
            <ul className="space-y-2">
              {explore.map((l) => <li key={l.href}><Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{l.label}</Link></li>)}
            </ul>
          </div>
          {CATEGORIES.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-sm font-bold">{c.title}</p>
              <ul className="space-y-2">
                {c.keys.map((k) => byKey.get(k)).filter((m): m is NonNullable<typeof m> => !!m).map((m) => <li key={m.key}><Link href={`/features/${m.key}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">{m.name}</Link></li>)}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-3 text-sm font-bold">Documentation</p>
            <ul className="space-y-2">
              {guides.map((g) => <li key={g.slug}><Link href={`/docs/${g.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">{g.title.split(":")[0]}</Link></li>)}
              <li><Link href="/docs" className="text-sm font-semibold text-primary">All guides →</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/50 pt-5 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} {SAAS_BRAND.name}. All rights reserved.
            {SAAS_BRAND.operator ? <span> · Operated by {SAAS_BRAND.operator}</span> : null}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            {LEGAL_LINKS.map((l) => <li key={l.href}><Link href={l.href} className="transition-colors hover:text-primary">{l.label}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
