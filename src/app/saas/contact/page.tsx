import type { Metadata } from "next";
import InquiryForm from "@/components/saas/InquiryForm";
import { PageHero, SectionHead } from "@/components/saas/blocks";
import { TimelineSteps } from "@/components/saas/Modern";
import FaqSection from "@/components/saas/FaqSection";
import { requestHostOrNull } from "@/lib/saas/request";
import { saasCanonicalHost } from "@/lib/saas/hosts";
import { saasContact } from "@/lib/saas/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact Us", description: "Talk to the SelfRun AI team about plans, a demo, support or security.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  const ways = [
    { t: "Sales and demos", v: c.sales, d: "Plans, pricing and a walkthrough for your team." },
    { t: "Customer support", v: c.support, d: "Existing customers can also open a request from inside their workspace." },
    { t: "Security", v: c.security, d: "Report a vulnerability or ask about our security practices." },
  ];
  return (
    <>
      <PageHero art="contact" photo="colleagues" shot="support" shotName="Help & Support" eyebrow="Contact Us" title="Let's talk about" accent="your business." lead="Questions about plans, how the platform fits your business, or security? Send a message and we'll reply within one business day." chip={{ title: "Reply within one business day", text: "From the people who build the platform" }} />
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead icon="chat" eyebrow="Get in touch" title="Reach the" accent="right team." lead="Pick the address that fits, or send a message with the form and we will route it for you." />
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div className="space-y-4">
            {ways.map((w) => (
              <div key={w.t} className="group flex gap-5 border-t border-border/70 py-6 transition-all hover:bg-gradient-to-r hover:from-primary/[0.06] hover:to-transparent hover:pl-2">
                <span className="sr-outline w-14 flex-none text-4xl font-black leading-none" aria-hidden>{String(ways.indexOf(w) + 1).padStart(2, "0")}</span>
                <div className="space-y-1">
                  <p className="text-lg font-black group-hover:text-primary">{w.t}</p>
                  <a href={`mailto:${w.v}`} className="break-all text-sm font-semibold text-primary">{w.v}</a>
                  <p className="text-sm text-muted-foreground">{w.d}</p>
                </div>
              </div>
            ))}
          </div>
          <InquiryForm kind="contact" />
          </div>
        </div>
      </section>

      <section className="sr-band sr-section">
        <div className="sr-container relative">
          <SectionHead tone="dark" icon="workflow" eyebrow="What happens next" title="From your message" accent="to a reply." lead="Three simple steps — no queue of forms, no sales script." />
          <TimelineSteps cols={3} items={[
            { title: "Tell us what you need", text: "Send the form or write to the address that fits — plans, a demo, support or security.", icon: "chat" },
            { title: "The right team picks it up", text: "Sales, support and security each have their own address, so your message goes to people who can answer it.", icon: "users" },
            { title: "You hear back in one business day", text: "We reply within one business day — from the people who build the platform.", icon: "rocket" },
          ]} />
        </div>
      </section>

      <FaqSection topics={["Support", "Setup", "General"]} limit={6} title="Before you" accent="write to us." lead="Quick answers to what people ask most." />
    </>
  );
}
