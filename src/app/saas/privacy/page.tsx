import type { Metadata } from "next";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How SelfRun Business collects, uses and protects personal information on this website and in the service.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="sr-section">
      <div className="sr-container max-w-3xl">
        <h1 className="sr-h1" style={{ fontSize: "clamp(2rem,4.4vw,3rem)" }}>Privacy policy</h1>
        <p className="sr-muted mt-3">How {SAAS_BRAND.name} handles personal information.</p>
        <div className="sr-prose mt-8">
          <h2>Who this policy covers</h2>
          <p>In this policy “we” and “us” mean {SAAS_BRAND.operator || SAAS_BRAND.name}. It applies to visitors of this website and to people who register for {SAAS_BRAND.name}. Customers who use the service for their own business act as the controller of the data they store in their workspace; for that data we act as their processor, under their instructions.</p>
          <h2>Information we collect</h2>
          <ul>
            <li><strong>Information you give us:</strong> your name, work email, company, phone number and message when you register, request a demo or contact us.</li>
            <li><strong>Account and billing information:</strong> workspace details, plan, invoices and payment status. Card details are handled by our payment provider and are not stored by us.</li>
            <li><strong>Usage information:</strong> sign-in events, feature usage and basic technical data such as browser type and approximate location, used to run, secure and improve the service.</li>
          </ul>
          <h2>How we use information</h2>
          <p>We use personal information to provide and secure the service, respond to your requests, send account and billing messages, prevent abuse and fraud, and improve the product. We do not sell personal information.</p>
          <h2>Customer data</h2>
          <p>Data a customer stores in a workspace belongs to that customer. We process it only to provide the service. Every record is isolated to its company, and AI features run only against the requesting customer&apos;s own workspace with the permissions of the person asking.</p>
          <h2>Sharing</h2>
          <p>We share information only with service providers who help us operate the service (hosting, email delivery, payments and AI processing at the customer&apos;s request), when the law requires it, or to protect rights and safety. Providers are bound to protect the information and use it only for the service.</p>
          <h2>Retention</h2>
          <p>We keep information for as long as an account is active and for a reasonable period afterwards to meet legal, accounting and security obligations. Customers can export their data and ask us to delete it.</p>
          <h2>Security</h2>
          <p>We use access control, audit logging, encryption of stored secrets and strict tenant isolation to protect information. No system is perfectly secure, so we also encourage strong passwords and least-privilege access within your workspace.</p>
          <h2>Your rights</h2>
          <p>You can ask to access, correct, export or delete your personal information, or object to certain processing, by contacting us. Customers should direct requests about data in their workspace to their workspace administrator.</p>
          <h2>Cookies</h2>
          <p>We use cookies that are necessary to keep you signed in and secure, and to remember preferences. We use first-party analytics only to understand how the website is used.</p>
          <h2>Changes to this policy</h2>
          <p>We may update this policy as the service evolves. Material changes will be announced on this page or by email.</p>
          <h2>Contact</h2>
          <p>Questions about privacy can be sent through our <a href="/contact" style={{ color: "var(--sr-primary)" }}>contact page</a>.</p>
        </div>
      </div>
    </section>
  );
}
