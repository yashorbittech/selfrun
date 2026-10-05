import type { Metadata } from "next";
import InquiryForm from "@/components/saas/InquiryForm";
import { requestHostOrNull } from "@/lib/saas/request";
import { saasCanonicalHost } from "@/lib/saas/hosts";
import { saasContact } from "@/lib/saas/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contact us",
  description: "Talk to the SelfRun Business team about plans, a demo, support or partnerships.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  const ways = [
    { t: "Sales and demos", v: c.sales, d: "Plans, pricing and a walkthrough for your team." },
    { t: "Customer support", v: c.support, d: "Existing customers can also open a request from inside their workspace." },
    { t: "Security", v: c.security, d: "Report a vulnerability or ask about our security practices." },
  ];
  return (
    <section className="sr-section">
      <div className="sr-container grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <span className="sr-eyebrow">Contact us</span>
          <h1 className="sr-h1" style={{ fontSize: "clamp(2rem,4.4vw,3.2rem)" }}>Let&apos;s talk about your business</h1>
          <p className="sr-lead">Questions about plans, how the platform fits your business, or a partnership? Send us a message and we&apos;ll reply within one business day.</p>
          <div className="space-y-4">
            {ways.map((w) => (
              <div key={w.t} className="sr-card space-y-1">
                <p className="font-bold">{w.t}</p>
                <a href={`mailto:${w.v}`} className="font-semibold" style={{ color: "var(--sr-primary)" }}>{w.v}</a>
                <p className="text-sm sr-muted">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
        <InquiryForm kind="contact" />
      </div>
    </section>
  );
}
