import Link from "next/link";
import { ArrowUpRight, ExternalLink, Globe2, KeyRound, LayoutDashboard, ShieldAlert } from "lucide-react";
import CopyDemoValue from "@/components/saas/CopyDemoValue";
import { SectionHead } from "@/components/saas/blocks";

const DEMO_SITE = "https://demo.selfrunbusiness.com/";
const DEMO_WORKSPACE = "https://demo-app.selfrunbusiness.com/";
const DEMO_EMAIL = "demo@selfrunbusiness.com";
const DEMO_PASSWORD = "Demo@123";

export default function DemoExperience() {
  return (
    <section id="self-guided-demo" className="sr-section scroll-mt-24 overflow-hidden bg-muted/10">
      <div className="sr-container">
        <SectionHead icon="layers" eyebrow="Self-guided product tour" title="Explore the full product" accent="at your own pace." lead="Visit the public website, then sign in to the demo workspace to explore the product interface and connected business modules for yourself." />

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5 sm:p-8">
            <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col">
              <span className="sr-icon mb-5"><Globe2 className="h-5 w-5" /></span>
              <p className="sr-eyebrow">Public website</p>
              <h3 className="mt-2 text-2xl font-black">See the product from the outside</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">Explore the demo company’s public website and see how its customer-facing experience connects with the workspace.</p>
              <a href={DEMO_SITE} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform group-hover:scale-[1.02]">Open demo website <ExternalLink className="h-4 w-4" /></a>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5 sm:p-8">
            <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col">
              <span className="sr-icon mb-5"><LayoutDashboard className="h-5 w-5" /></span>
              <p className="sr-eyebrow">Interactive workspace</p>
              <h3 className="mt-2 text-2xl font-black">Explore how the platform works</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">Sign in with the shared demo account to navigate the workspace and inspect the available product areas and workflows.</p>
              <a href={DEMO_WORKSPACE} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform group-hover:scale-[1.02]">Open demo workspace <ExternalLink className="h-4 w-4" /></a>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="flex flex-col justify-center">
            <span className="sr-icon mb-5"><KeyRound className="h-5 w-5" /></span>
            <p className="sr-eyebrow">Demo access</p>
            <h3 className="mt-2 text-2xl font-black">Use these sign-in details</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The demo account is shared with visitors. Use it to explore the product; avoid entering personal, confidential or payment information.</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
            <Credential label="Email" value={DEMO_EMAIL} />
            <Credential label="Password" value={DEMO_PASSWORD} />
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>This is shared demo access. Please don’t save personal data or change account and security settings.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold">Want a walkthrough tailored to your business?</p><p className="mt-1 text-sm text-muted-foreground">Our team can map the product to your processes and answer questions.</p></div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 font-bold text-primary">Talk to our team <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">{label}</p><code className="mt-1 block break-all text-sm font-semibold">{value}</code></div>
      <CopyDemoValue value={value} />
    </div>
  );
}
