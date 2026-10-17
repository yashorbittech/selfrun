import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, LockKeyhole } from "lucide-react";
import { PageHero, SectionHead } from "@/components/saas/blocks";
import { STORIES } from "@/lib/saas/site";

export const metadata: Metadata = {
  title: "Onboarded Businesses and Clients",
  description: "Learn how to get a business workspace started with SelfRun AI and why customer identities are shared only with permission.",
  alternates: { canonical: "/onboarded-businesses" },
};

export default function OnboardedBusinessesPage() {
  return (
    <>
      <PageHero
        eyebrow="Businesses & clients"
        title="A workspace built"
        accent="around your business."
        lead="Each company sets up its own workspace, team access and brand. Customer names and account details are private, so we publish a directory only when a business has explicitly agreed to be featured."
        photo="open-office"
        shot="workspace"
        shotName="SelfRun CommandOS"
      >
        <Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">Create a workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        <Link href="/docs/getting-started" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-6 py-3.5 text-sm font-bold">Read the setup guide</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead icon="building" eyebrow="Getting started" title="Set up your company" accent="on your terms." lead="The documented setup flow takes you from registration to a configured workspace. You choose what to enable and who can access it." />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Building2, title: "Create your workspace", text: "Register your company workspace and set its name and identity." },
              { icon: BookOpen, title: "Configure your setup", text: "Follow the getting started guide to configure your workspace, invite people and begin using the products you need." },
              { icon: LockKeyhole, title: "Manage access", text: "Use workspace roles and permissions to control who can see and work with company information." },
            ].map(({ icon: Icon, title, text }) => <article key={title} className="sr-card"><span className="sr-icon mb-5"><Icon className="h-5 w-5" /></span><h3 className="text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>)}
          </div>
        </div>
      </section>
      <section className="sr-section bg-muted/10">
        <div className="sr-container grid gap-8 lg:grid-cols-2 lg:items-center">
          <SectionHead center={false} icon="lock" eyebrow="Customer privacy" title="No customer directory" accent="without consent." lead="We do not publish private account, workspace or client information as marketing content." />
          <div className="sr-card">
            {STORIES.length > 0 ? <p className="text-sm text-muted-foreground">Customer stories approved for publication are available on our <Link href="/success-stories" className="font-bold text-primary">success stories page</Link>.</p> : <><h3 className="text-lg font-black">No businesses are listed publicly</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">There are no onboarded businesses currently approved for public listing. This page will show a business only after it has agreed to be named and featured.</p></>}
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Ask about onboarding <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
