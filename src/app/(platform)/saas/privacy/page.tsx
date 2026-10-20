import { pageMeta } from "@/lib/platform/saas/seo-meta";
import type { Metadata } from "next";
import { saasContact } from "@/lib/platform/saas/brand";
import { saasCanonicalHost } from "@/lib/platform/saas/hosts";
import { requestHostOrNull } from "@/lib/platform/saas/request";
import LegalPage from "@/components/platform/saas/LegalPage";
import { SAAS_BRAND } from "@/lib/platform/saas/brand";

export const metadata: Metadata = pageMeta({ path: "/privacy", title: "Privacy Policy", description: "How SelfRun AI collects, uses and protects personal information on this website and in the service. Read what we collect, why, and the choices you have.", keywords: ["privacy policy for business software", "SaaS privacy policy", "data privacy SaaS", "how personal data is handled"], tag: "Legal" });

export default async function PrivacyPage() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  const us = SAAS_BRAND.operator || SAAS_BRAND.name;
  const name = SAAS_BRAND.name;
  return (
    <LegalPage
      doc={{
        title: "Privacy Policy",
        intro: <>How {name} handles personal information — on this website, in your account and inside the products you use.</>,
        highlights: [
          { icon: "shield", title: "We do not sell personal information", text: "We use it to run, secure and improve the service, and to answer you." },
          { icon: "lock", title: "Your workspace data is yours", text: "We process it only to provide the service, isolated to your company." },
          { icon: "brain", title: "AI only sees what the asker may see", text: "AI features run on your own workspace with the permissions of the person asking." },
        ],
        sections: [
          { heading: "Who this policy covers", body: [`In this policy “we” and “us” mean ${us}. It applies to visitors of this website and to people who register for ${name}. Customers who use the service for their own business act as the controller of the data they store in their workspace; for that data we act as their processor, under their instructions.`] },
          {
            heading: "Information we collect",
            list: [
              "Information you give us: your name, work email, company, phone number and message when you register, request a demo or contact us.",
              "Account and billing information: workspace details, plan, invoices and payment status. Card details are handled by our payment provider and are not stored by us.",
              "Sign-in and device information: sign-in events, the list of devices and sessions on your account, and basic technical data such as browser type and approximate location, used to run and secure the service and to show you your own sign-in history.",
              "Usage information: which features are used, so we can run and improve the product.",
            ],
          },
          {
            heading: "What the products store for you",
            body: [`${name} is a set of business products, and what is stored in them is what a customer chooses to put there. Depending on the products switched on, that can include:`],
            list: [
              "Sales and clients: leads, clients, messages with them, offers, coupons and wallet or referral records.",
              "People: employee records, attendance, leave, payroll and documents.",
              "Money and work: invoices, bills, payments, projects, timesheets, purchase requests and vendors.",
              "Knowledge and documents: SOPs, agreements and signatures, and credentials and files in the secure vault.",
              "Conversations: team chat, AI assistant chats, and website chatbot and voice conversations with a customer's own visitors.",
            ],
          },
          { heading: "How we use information", body: ["We use personal information to provide and secure the service, respond to your requests, send account and billing messages, prevent abuse and fraud, and improve the product. We do not sell personal information."] },
          { heading: "Customer data", body: ["Data a customer stores in a workspace belongs to that customer. We process it only to provide the service. Every record is isolated to its company, and access inside a company follows the roles and permissions its administrators set. Sign-ins, changes and exports are recorded in an audit log the customer can read."] },
          {
            heading: "AI features",
            body: ["When someone uses an AI feature — asking a question of their data, an AI assistant, drafting content, the website chatbot or a voice conversation — the content needed to answer is processed by an AI provider at the customer's request. AI features run only against the requesting customer's own workspace and with the permissions of the person asking. Questions about data are answered with read-only queries, so the AI cannot change records, and answers show how they were calculated. AI usage is metered according to the plan."],
          },
          { heading: "Your clients, students and website visitors", body: ["Customers can give their own clients, students, applicants and website visitors a portal, forms, a chatbot and push notifications under the customer's brand. Information those people provide is stored in the customer's workspace and is the customer's to control; if you are one of them, direct requests about your information to the company you deal with."] },
          { heading: "Sharing", body: ["We share information only with service providers who help us operate the service (hosting, email delivery, payments and AI processing at the customer's request), with services a customer chooses to connect through integrations and webhooks, when the law requires it, or to protect rights and safety. Providers are bound to protect the information and use it only for the service. The Sub-processors page lists them."] },
          {
            heading: "How long we keep information",
            list: [
              "Your account and workspace data: for as long as the account is active. If a company is deleted, it is scheduled for deletion after a 30-day period in which it can still be restored, then deleted for good. Safety copies made before a restore or wipe are kept for 30 days.",
              "Backups: the most recent scheduled backups (eight) and manual backups (ten) are kept, and older ones are removed automatically.",
              "Sign-in history and security events: 180 days. Active sign-ins end when their session expires or you sign out.",
              "Cookie choices on a company's website: three years, as evidence of the choice.",
              "Billing and tax records: as long as tax and accounting law requires.",
              "Enquiries and support messages: as long as needed to answer them and for a reasonable period after.",
              "Privacy requests and our answers: three years.",
            ],
          },
          { heading: "Security", body: ["We use access control, per-action permissions, audit logging, encryption of stored secrets and vault documents, and strict tenant isolation to protect information. No system is perfectly secure, so we also encourage strong passwords and least-privilege access within your workspace."] },
          { heading: "Your rights", body: ["Depending on where you live, you can ask to access, correct, delete or export your personal information, object to or restrict how it is used, withdraw consent, and complain to your data protection authority. We do not sell or share personal information for advertising. Customers should direct requests about data in their workspace to their workspace administrator. The Data Rights page explains the rights by country, how to use them, and what to expect, and has the request form."] },
          { heading: "Controller, contact and grievance officer", body: [`The controller of the information described here is ${us}. Write to us about privacy at ${c.privacy}. That address is also our grievance contact for the purposes of India's Digital Personal Data Protection Act. We reply to every request within 30 days.`] },
          {
            heading: "Why we may use your information",
            list: [
              "To provide the service you asked for and to take steps before you sign up (contract).",
              "To keep the service secure, prevent fraud and abuse, and improve the product (our legitimate interests, balanced against your rights).",
              "To meet legal duties such as tax, accounting and responding to lawful requests (legal obligation).",
              "To send marketing messages or load non-essential cookies, only where you have agreed (consent), which you can withdraw at any time.",
            ],
          },
          { heading: "International transfers", body: ["We and our providers process information in more than one country. When personal information is transferred across borders we use the safeguard the applicable law requires, such as an adequacy decision, standard contractual clauses or the UK International Data Transfer Agreement or Addendum. The Sub-processors page lists our providers and what each one receives."] },
          { heading: "Children", body: ["The service is for businesses and is not directed at children. You must be at least 18 to register, and we do not knowingly collect personal information from children under 13 (or under 16 where the law sets that age). If you think a child has given us information, write to us and we will delete it."] },
          { heading: "Automated decisions and AI", body: ["We do not make decisions about you that have legal or similarly significant effects by solely automated means. AI features in the product produce answers and drafts at a customer's request; a person decides what to do with them, and any change an AI assistant proposes waits for a person's approval."] },
          { heading: "Cookies", body: ["We use cookies that are necessary to keep you signed in and secure, and to remember preferences. We do not run third-party analytics or advertising trackers on this website. The Cookie Policy lists what is stored."] },
          { heading: "Changes to this policy", body: ["We may update this policy as the service evolves. Material changes will be announced on this page or by email."] },
        ],
      }}
    />
  );
}
