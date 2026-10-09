import "@/app/saas/saas.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";
import { getSignupMode } from "@/lib/platform/settings";
import { platformRootDomain } from "@/lib/platform/tenancy/provisioning";
import { getFeatureModules } from "@/lib/saas/modules";
import { SAAS_THEME } from "@/lib/saas/theme";
import { themeCssVars } from "@/lib/cms/theme-shared";
import Header from "@/components/saas/Header";
import Footer from "@/components/saas/Footer";
import Interactions from "@/components/saas/Interactions";
import MarketingShot from "@/components/saas/MarketingShot";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your workspace",
  description: "Create your SelfRun AI workspace and run sales, HR, finance, projects and your website from one AI-powered platform. Free forever for one person.",
};

const POINTS = [
  "CRM, HR, finance, projects, procurement and training in one platform",
  "AI that answers from your data, and automations that run on their own",
  "Your own workspace address, website and client portal",
  "Invite your team — one login for every module",
];

export default async function SignupPage() {
  // Sign-up belongs to the platform's own site, not to a company's workspace.
  if (!(await isPlatformOwnerContext())) notFound();
  const [mode, modules] = await Promise.all([getSignupMode(), getFeatureModules()]);

  return (
    <div className="sr" style={themeCssVars(SAAS_THEME) as React.CSSProperties}>
      <Interactions />
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div className="sr-blobs" aria-hidden>
            <span className="-left-[10%] -top-[10%] h-[45vw] w-[45vw] bg-primary/15 blur-[120px]" />
            <span className="right-[0%] top-[25%] h-[35vw] w-[35vw] bg-brand-accent/15 blur-[110px]" style={{ animationDelay: "-4s" }} />
          </div>
          <div className="sr-grid-bg" aria-hidden />
          <div className="sr-container relative grid items-start gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_520px] lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur">Free forever for one person</p>
              <h1 className="sr-h1 mt-6">
                The business that <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">runs itself.</span>
              </h1>
              <p className="sr-lead mt-5 max-w-xl">Create your workspace in about two minutes. Every panel and every feature is included — pay only when your team grows.</p>

              <ul className="mt-8 space-y-4">
                {POINTS.map((p) => (
                  <li key={p} className="flex gap-3.5 text-[17px] leading-snug">
                    <span className="sr-circle mt-0.5 h-6 w-6"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-9 grid max-w-md grid-cols-3 border-y border-border/60">
                {[{ v: String(modules.length), l: "panels" }, { v: "1", l: "login" }, { v: "₹0", l: "to start" }].map((s, i) => (
                  <div key={s.l} className={`py-5 text-center ${i ? "border-l border-border/60" : ""}`}>
                    <p className="bg-gradient-to-br from-primary to-brand-accent bg-clip-text text-3xl font-black tracking-tight text-transparent">{s.v}</p>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 hidden max-w-xl lg:block"><MarketingShot screenKey="workspace" name="Workspace" /></div>
              <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Your data is isolated to your company&apos;s workspace.</p>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-transparent to-brand-accent/20 blur-2xl" aria-hidden />
              <div className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-[0_40px_100px_-30px] shadow-primary/30 sm:p-9">
                {mode === "closed" ? (
                  <p className="py-10 text-center text-muted-foreground">New sign-ups are paused right now. Please check back soon.</p>
                ) : (
                  <SignupForm rootDomain={platformRootDomain()} approval={mode === "approval"} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
