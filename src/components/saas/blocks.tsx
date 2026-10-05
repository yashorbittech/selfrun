import Link from "next/link";
import { Check } from "lucide-react";
import Icon from "@/components/saas/Icon";
import type { Feature, IconKey } from "@/lib/saas/content";

export function SectionHead({ eyebrow, title, lead, center = true }: { eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode; center?: boolean }) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl space-y-4`}>
      {eyebrow && <span className="sr-eyebrow">{eyebrow}</span>}
      <h2 className="sr-h2">{title}</h2>
      {lead && <p className="sr-lead">{lead}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="sr-hero-glow" />
      <div className="sr-container relative z-10 py-16 md:py-24">
        <div className="max-w-3xl space-y-5">
          <span className="sr-eyebrow">{eyebrow}</span>
          <h1 className="sr-h1">{title}</h1>
          <p className="sr-lead">{lead}</p>
          {children && <div className="flex flex-wrap gap-3 pt-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({ items, cols = 3 }: { items: Feature[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((f) => (
        <div key={f.title} className="sr-card sr-card-hover space-y-3">
          <span className="sr-icon"><Icon name={f.icon as IconKey} /></span>
          <h3 className="sr-h3">{f.title}</h3>
          <p className="sr-muted leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i} className="flex gap-2.5 leading-relaxed">
          <Check className="sr-check mt-1 size-4" aria-hidden />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function CtaBand({ title = "Put your business on autopilot", lead = "Start a free trial in minutes, or let us show you the platform with your own business scenarios." }: { title?: string; lead?: string }) {
  return (
    <section className="sr-dark">
      <div className="sr-container flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
        <div className="max-w-2xl space-y-3">
          <h2 className="sr-h2">{title}</h2>
          <p className="sr-lead">{lead}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="sr-btn sr-btn-light">Start free trial</Link>
          <Link href="/demo" className="sr-btn" style={{ border: "1px solid rgba(255,255,255,.35)", color: "#fff" }}>Request a demo</Link>
        </div>
      </div>
    </section>
  );
}
