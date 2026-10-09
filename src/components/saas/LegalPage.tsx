import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { LEGAL_LINKS, type LegalDoc } from "@/lib/saas/site";
import { PageHero } from "@/components/saas/blocks";
import { IconColumns } from "@/components/saas/Modern";
import LegalToc from "@/components/saas/LegalToc";
import FaqSection from "@/components/saas/FaqSection";
import Reveal from "@/components/saas/Reveal";

const slug = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * A policy page: an at-a-glance row, the numbered sections with a table of contents that follows the reader, the other
 * policies one click away, and a way to ask a question.
 */
export default function LegalPage({ doc }: { doc: { title: string; intro: React.ReactNode; sections: LegalDoc["sections"]; highlights?: LegalDoc["highlights"] } }) {
  const toc = doc.sections.map((s) => ({ id: slug(s.heading), label: s.heading }));
  return (
    <>
      <PageHero art="legal" photo="office" shot="dlms" shotName="Digi Locker" eyebrow="Legal" title={doc.title} lead={doc.intro} />

      {doc.highlights && doc.highlights.length > 0 && (
        <section className="border-b border-border/50 bg-muted/10 py-14">
          <div className="sr-container">
            <p className="sr-eyebrow mb-8 text-center">At a glance</p>
            <IconColumns cols={3} items={doc.highlights} />
          </div>
        </section>
      )}

      <section className="sr-section">
        <div className="sr-container grid gap-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">On this page</p>
            <LegalToc items={toc} />
            <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">Other policies</p>
            <ul className="space-y-0.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} aria-current={doc.title === l.label ? "page" : undefined} className={`block rounded-xl px-3 py-2 text-sm transition-colors ${doc.title === l.label ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>{l.label}</Link></li>
              ))}
            </ul>
          </aside>

          <div className="min-w-0 max-w-3xl">
            {doc.sections.map((s, i) => (
              <Reveal key={s.heading}>
                <section id={slug(s.heading)} className="scroll-mt-32 border-t border-border/70 py-10 first:border-t-0 first:pt-0">
                  <div className="mb-4 flex items-start gap-5">
                    <span className="sr-outline w-14 flex-none text-5xl font-black leading-none" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="pt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">{s.heading}</h2>
                  </div>
                  <div className="space-y-4 pl-0 text-[17px] leading-[1.8] text-muted-foreground sm:pl-[76px]">
                    {s.body?.map((p) => <p key={p}>{p}</p>)}
                    {s.list && (
                      <ul className="space-y-3">
                        {s.list.map((l) => {
                          const k = l.indexOf(":");
                          const lead = k > 0 && k < 48 ? l.slice(0, k) : null;
                          return <li key={l} className="flex gap-3"><span className="sr-circle mt-2 h-2 w-2 flex-none" aria-hidden /><span>{lead ? <><strong className="text-foreground">{lead}:</strong>{l.slice(k + 1)}</> : l}</span></li>;
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              </Reveal>
            ))}

            <div className="sr-band mt-8 flex flex-col items-start gap-5 rounded-[2rem] p-8 shadow-2xl shadow-primary/25 sm:flex-row sm:items-center sm:p-10">
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30"><MessageCircle className="h-6 w-6" /></span>
              <div className="flex-1">
                <p className="text-xl font-black tracking-tight">Questions about this {doc.title.toLowerCase().replace(/ policy$/, " policy")}?</p>
                <p className="mt-1 text-white/80">Write to us — we reply within one business day.</p>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-xl transition-transform hover:scale-105">Contact us <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <FaqSection topics={["Data & security", "General"]} limit={4} tone="muted" title="Common" accent="questions." lead="What people ask about data, privacy and the service." />
    </>
  );
}
