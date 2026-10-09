import type { Metadata } from "next";
import LegalPage from "@/components/saas/LegalPage";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SelfRun AI collects, uses and protects personal information on this website and in the service.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const us = SAAS_BRAND.operator || SAAS_BRAND.name;
  const name = SAAS_BRAND.name;
  return (
    <LegalPage
      doc={{
        title: "Privacy Policy",
        intro: <>How {name} handles personal information — on this website, in your account and inside the panels you use.</>,
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
            heading: "What the panels store for you",
            body: [`${name} is a set of business panels, and what is stored in them is what a customer chooses to put there. Depending on the panels switched on, that can include:`],
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
          { heading: "Sharing", body: ["We share information only with service providers who help us operate the service (hosting, email delivery, payments and AI processing at the customer's request), with services a customer chooses to connect through integrations and webhooks, when the law requires it, or to protect rights and safety. Providers are bound to protect the information and use it only for the service."] },
          { heading: "Retention", body: ["We keep information for as long as an account is active and for a reasonable period afterwards to meet legal, accounting and security obligations. Customers can export their data and ask us to delete it."] },
          { heading: "Security", body: ["We use access control, per-action permissions, audit logging, encryption of stored secrets and vault documents, and strict tenant isolation to protect information. No system is perfectly secure, so we also encourage strong passwords and least-privilege access within your workspace."] },
          { heading: "Your rights", body: ["You can ask to access, correct, export or delete your personal information, or object to certain processing, by contacting us. Customers should direct requests about data in their workspace to their workspace administrator."] },
          { heading: "Cookies", body: ["We use cookies that are necessary to keep you signed in and secure, and to remember preferences. We use first-party analytics only to understand how the website is used. The Cookie Policy lists them."] },
          { heading: "Changes to this policy", body: ["We may update this policy as the service evolves. Material changes will be announced on this page or by email."] },
        ],
      }}
    />
  );
}
