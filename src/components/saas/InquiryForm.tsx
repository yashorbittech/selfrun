"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/saas/actions";
import type { InquiryKind } from "@/lib/saas/inquiries";

const SIZES = ["1–10 people", "11–50 people", "51–200 people", "201–1,000 people", "More than 1,000"];
const INTERESTS = ["Complete business platform", "CRM & sales", "HR & payroll", "Finance & accounting", "Projects", "Procurement & assets", "Training", "Website & marketing", "AI & automation"];

export default function InquiryForm({ kind }: { kind: InquiryKind }) {
  const [state, action, pending] = useActionState<InquiryState | null, FormData>(submitInquiry.bind(null, kind), null);
  if (state?.ok) {
    return (
      <div className="sr-card space-y-3 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10" style={{ color: "var(--sr-accent)" }} />
        <h2 className="sr-h3">{kind === "demo" ? "Thank you — we'll be in touch shortly" : "Thanks for reaching out"}</h2>
        <p className="sr-muted leading-relaxed">{kind === "demo" ? "Our team will contact you within one business day to arrange a walkthrough built around your business." : "We've received your message and will reply by email within one business day."}</p>
      </div>
    );
  }
  const err = (f: string) => state && !state.ok && state.field === f ? <p className="mt-1 text-sm" style={{ color: "#c0262d" }}>{state.error}</p> : null;
  return (
    <form action={action} className="sr-card space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="sr-label">Full name</label>
          <input id="name" name="name" className="sr-input" autoComplete="name" required maxLength={120} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="sr-label">Work email</label>
          <input id="email" name="email" type="email" className="sr-input" autoComplete="email" required maxLength={200} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="company" className="sr-label">Company{kind === "contact" ? " (optional)" : ""}</label>
          <input id="company" name="company" className="sr-input" autoComplete="organization" maxLength={160} required={kind === "demo"} />
          {err("company")}
        </div>
        <div>
          <label htmlFor="phone" className="sr-label">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" className="sr-input" autoComplete="tel" maxLength={40} />
        </div>
        {kind === "demo" && (
          <>
            <div>
              <label htmlFor="teamSize" className="sr-label">Team size</label>
              <select id="teamSize" name="teamSize" className="sr-input" defaultValue="">
                <option value="" disabled>Select</option>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="interest" className="sr-label">I&apos;m most interested in</label>
              <select id="interest" name="interest" className="sr-input" defaultValue="">
                <option value="" disabled>Select</option>
                {INTERESTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
      <div>
        <label htmlFor="message" className="sr-label">{kind === "demo" ? "Anything we should know? (optional)" : "How can we help?"}</label>
        <textarea id="message" name="message" className="sr-input" maxLength={3000} required={kind === "contact"} />
        {err("message")}
      </div>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {state && !state.ok && !state.field && <p role="alert" className="text-sm" style={{ color: "#c0262d" }}>{state.error}</p>}
      <button type="submit" className="sr-btn sr-btn-primary w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {kind === "demo" ? "Request my demo" : "Send message"}
      </button>
      <p className="text-center text-xs sr-muted">We use your details only to respond to this request. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
    </form>
  );
}
