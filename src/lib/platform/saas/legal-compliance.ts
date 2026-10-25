import type { LegalDoc } from "@/lib/platform/saas/site";

/**
 * The documents a business customer, a regulator or a security researcher looks for: the data processing addendum, the list of
 * sub-processors with how data crosses borders, the data-subject request procedure and the vulnerability disclosure policy. They describe
 * what the platform actually does (see docs/compliance/ for the control each sentence rests on). They are written as a starting point for
 * legal review: the company's legal entity, registered address and governing law belong to the owner and are added there.
 */
const SERVICE = "SelfRun AI";

export interface Mailboxes { privacy: string; security: string; sales: string }

export function dpaDoc(m: Mailboxes): LegalDoc {
  return {
    slug: "dpa",
    title: "Data Processing Addendum",
    description: `How ${SERVICE} processes personal data on behalf of its customers: roles, instructions, security, sub-processors, international transfers, breach notice, and return or deletion of data.`,
    intro: `This addendum applies when you use ${SERVICE} to store or process personal data about your own people, clients, students, applicants or website visitors. It forms part of the Terms of Service and sets out how we handle that data for you.`,
    highlights: [
      { icon: "building", title: "You decide, we process", text: "You are the controller of what you store. We process it only to provide the service, on your instructions." },
      { icon: "lock", title: "Kept apart and protected", text: "Every company's data is isolated, access is by role, and administrators use two-step sign-in." },
      { icon: "file", title: "Clear exit", text: "Export your data at any time. On leaving, it is removed on a stated schedule." },
    ],
    sections: [
      {
        heading: "Roles",
        body: [
          `For the personal data you put into your workspace, you are the controller (the data fiduciary under India's Digital Personal Data Protection Act, the controller under the UK GDPR, the UAE and Saudi Arabian data protection laws, and the business under California law) and ${SERVICE} is your processor (the processor, or service provider in California).`,
          "For the account, billing and website information about you as our customer, we act as a controller. The Privacy Policy describes that.",
        ],
      },
      {
        heading: "Your instructions",
        list: [
          "We process your personal data only to provide the service to you, and as you instruct us through the product, its settings, its API and your written requests.",
          "Features you switch on (AI, automations, integrations, your website, push notifications) are instructions to process data in that way.",
          "If we believe an instruction breaks the law, we will tell you and may pause it until it is clarified.",
        ],
      },
      {
        heading: "Confidentiality and access",
        body: ["Only people who need access to operate and support the service have it, and they are bound by confidentiality. What platform staff do in the Platform Console is recorded in a platform audit log. Inside your company, access follows the roles and permissions your administrators set."],
      },
      {
        heading: "Security measures",
        list: [
          "Strict isolation: every record carries its company, and every database query is confined to it.",
          "Roles and per-action permissions, enforced on the server, with extra permission for payroll, salaries, bank details and stored credentials.",
          "Two-step sign-in, mandatory for company Directors and every Platform Console user; account lock-out after repeated wrong passwords; passwords stored only as salted scrypt hashes.",
          "Encryption of connection secrets and vault documents at rest, HTTPS with HSTS for all traffic, and a hardened set of security headers.",
          "Uploaded files are checked by type and size and scanned before they are accepted.",
          "Sign-ins, changes, exports and administrative actions are recorded in audit logs; sign-in records are kept for 180 days.",
          "Backups of your workspace, with restore and deletion controls for your Director. The Security & Trust page describes these in full.",
        ],
      },
      {
        heading: "Sub-processors",
        body: [`You authorise us to use the sub-processors listed on the Sub-processors page. We bind each one to data protection terms no less protective than these. We update that page before a new sub-processor starts handling your personal data; if you object on reasonable data protection grounds, write to ${m.privacy} and we will work with you on an alternative, or you may end the service.`],
      },
      {
        heading: "International transfers",
        body: ["Where personal data is transferred across borders, we rely on the safeguard the applicable law requires (such as an adequacy decision, standard contractual clauses, the UK International Data Transfer Agreement or Addendum, or the consent or contractual mechanisms the UAE, India and Saudi Arabia permit) and we record each transfer in a register. The Sub-processors page lists the providers and what they receive."],
      },
      {
        heading: "Helping you answer people's requests",
        body: [`People can ask you to access, correct, export or delete their personal data. Your workspace has export and deletion tools. If someone writes to us about data in your workspace, we send them to you and do not answer on your behalf. If you need our help to find or remove data, write to ${m.privacy}.`],
      },
      {
        heading: "Personal data breach",
        body: ["If we become aware of a breach of security leading to the accidental or unlawful destruction, loss, alteration or unauthorised disclosure of your personal data, we tell you without undue delay, with what we know: what happened, the data and people affected, the likely consequences, and what we have done and will do. Open incidents are shown on the System status page. We help you meet your own duty to notify regulators and people within the time the law gives you."],
      },
      {
        heading: "Return and deletion",
        body: [
          "You can export your data at any time while your plan is active. If you cancel, your workspace stays readable for a period so you can export it. A Director can delete the company: it is scheduled for deletion after a 30-day grace period during which it can be restored, then deleted for good. Safety copies made before a restore or wipe are kept for 30 days.",
          "Backups roll off on their stated schedule after deletion. We keep information beyond that only where the law requires it, such as tax and accounting records.",
        ],
      },
      {
        heading: "Information and audits",
        body: [`We make available the information needed to show we meet this addendum, including the Security & Trust page and the description of our controls. If you need more, or an audit that your regulator requires, write to ${m.security}; we will agree reasonable scope, timing and confidentiality so it does not put other customers at risk.`],
      },
      {
        heading: "Order of precedence",
        body: ["If this addendum and the Terms of Service conflict about the processing of personal data, this addendum applies. Liability is as set out in the Terms of Service."],
      },
    ],
  };
}

export interface SubProcessor { name: string; purpose: string; data: string; scope: "platform" | "company" }

/** The providers behind the service. Platform: used by everyone. Company: only if that company connects it, with its own account and keys. */
export const SUB_PROCESSORS: SubProcessor[] = [
  { name: "MongoDB Atlas", purpose: "The database every workspace's records live in", data: "All data a customer stores, and account details", scope: "platform" },
  { name: "Vercel", purpose: "Hosting and delivery of the website and the products, and file storage (Vercel Blob)", data: "Requests to the service, and files customers upload", scope: "platform" },
  { name: "Resend", purpose: "Delivery of the service's own emails (sign-up, invitations, alerts, receipts)", data: "Recipient email address, name and the message", scope: "platform" },
  { name: "Razorpay", purpose: "Taking payment for plans and add-ons", data: "Billing contact details and payment status. Card details go to Razorpay, not to us", scope: "platform" },
  { name: "OpenAI", purpose: "AI features, only when a person uses one", data: "The question or content needed to answer, and the answer", scope: "platform" },
  { name: "GitHub", purpose: "Building and publishing a company's desktop and mobile apps, only when a Director presses Generate", data: "The company's name, icon and app address. No personal data", scope: "platform" },
  { name: "ElevenLabs", purpose: "Voice features, when a company connects it", data: "Audio and text of a voice conversation", scope: "company" },
  { name: "Twilio and WhatsApp Business", purpose: "SMS and WhatsApp messages, when a company connects them", data: "Phone numbers and message content", scope: "company" },
  { name: "SMTP, Resend or SendGrid (a company's own account)", purpose: "A company sending email from its own address", data: "Recipient details and message content", scope: "company" },
  { name: "Social platforms a company connects", purpose: "Publishing a company's posts and reading its analytics", data: "Posts, media and account analytics", scope: "company" },
];

export function subprocessorsDoc(m: Mailboxes): LegalDoc {
  return {
    slug: "subprocessors",
    title: "Sub-processors and International Transfers",
    description: `The providers ${SERVICE} uses to run the service, what each one receives, and how personal data is protected when it crosses borders.`,
    intro: `${SERVICE} uses a small number of providers to run the service. This page lists them, what they do and what data they receive, and explains how data crossing borders is protected.`,
    highlights: [
      { icon: "layers", title: "A short, named list", text: "Each provider, its purpose and the data it handles." },
      { icon: "globe", title: "Transfers recorded", text: "Cross-border transfers use the safeguard the law requires and are kept in a register." },
      { icon: "check", title: "Told before changes", text: "This page is updated before a new provider handles customer data." },
    ],
    sections: [
      { heading: "Providers we use for everyone", list: SUB_PROCESSORS.filter((p) => p.scope === "platform").map((p) => `${p.name}: ${p.purpose}. Receives: ${p.data}.`) },
      { heading: "Services a company connects itself", body: ["These are used only if a company connects them in Settings → Integrations, with its own account and keys. The company chooses them and is responsible for its agreement with them; we send data to them only as the company's automations and settings direct."], list: SUB_PROCESSORS.filter((p) => p.scope === "company").map((p) => `${p.name}: ${p.purpose}. Receives: ${p.data}.`) },
      { heading: "Where data is processed", body: ["Hosting and database regions are chosen when the service is deployed, and the AI, email and payment providers process data in the countries where they operate. To learn which regions are used for your workspace, write to the privacy address below."] },
      { heading: "International transfers", body: ["When personal data moves from one country to another we use the safeguard the applicable law requires. For data from the United Kingdom and the European Economic Area that is an adequacy decision, standard contractual clauses or the UK International Data Transfer Agreement or Addendum. For the UAE (including DIFC and ADGM), India and Saudi Arabia we follow the transfer conditions of the Personal Data Protection Laws, the Digital Personal Data Protection Act and its rules, and the Regulation on Personal Data Transfer Outside the Kingdom. Each transfer is recorded in a register with its safeguard."] },
      { heading: "How we choose providers", body: ["Before a provider handles customer data we check what it receives, how it protects it, where it processes it and what its security attestations say, and we bind it to data protection terms. We review providers at least once a year and when what they receive changes."] },
      { heading: "Changes and objections", body: [`We update this page before a new provider starts handling customer data. If you object on reasonable data protection grounds, write to ${m.privacy}.`] },
      { heading: "Contact", body: [`Data protection questions: ${m.privacy}.`] },
    ],
  };
}

export function dataRequestsDoc(m: Mailboxes): LegalDoc {
  return {
    slug: "data-requests",
    title: "Your Data Rights and Requests",
    description: `How to ask ${SERVICE} to access, correct, delete or export your personal information, or to object, withdraw consent or opt out, and what to expect.`,
    intro: `You can ask us about the personal information we hold about you. Use the form at the end of this page, or write to ${m.privacy}. If your information is in a company's workspace, that company decides what happens to it, so ask the company.`,
    highlights: [
      { icon: "check", title: "One place to ask", text: "A form, a reference number and a confirmation email." },
      { icon: "clock", title: "Answered within 30 days", text: "We reply to every request, and tell you if we need more time and why." },
      { icon: "shield", title: "Your identity checked", text: "So your information is never given to someone else." },
    ],
    sections: [
      { heading: "Who to ask", list: ["Information about you as a visitor, a sign-up or a customer of " + SERVICE + " (your account, billing contacts, enquiries): ask us, using the form below.", "Information a company holds in its workspace (its people, clients, students, applicants, website visitors): ask that company. We process it for the company and send requests we receive to them."] },
      { heading: "What you can ask for", list: ["Access: a copy of the personal information we hold about you and how we use it.", "Correction: fix information that is wrong or incomplete.", "Deletion: remove your information, unless we must keep it by law (for example tax and accounting records).", "Export: your information in a common, machine-readable format.", "Objection or restriction: stop or limit a particular use.", "Withdrawing consent: where we rely on your consent, you can take it back at any time.", "Opt-out (California): we do not sell or share personal information for advertising, so there is nothing to opt out of, but you can ask us to confirm that."] },
      { heading: "Your rights by country", list: ["United Kingdom: the rights above under the UK GDPR and the Data Protection Act 2018, and the right to complain to the Information Commissioner's Office.", "United Arab Emirates: access, correction, erasure, restriction, portability and objection under the Personal Data Protection Law (and the DIFC and ADGM regimes where they apply), and the right to complain to the UAE Data Office or the relevant free-zone authority.", "India: access to a summary of your data, correction, completion and erasure, grievance redressal, and the right to nominate someone to act for you, under the Digital Personal Data Protection Act, 2023; you may complain to the Data Protection Board of India after using our grievance process.", "Saudi Arabia: to know, access, correct, destroy and obtain a copy of your data, and to withdraw consent, under the Personal Data Protection Law; you may complain to the Saudi Data and AI Authority (SDAIA).", "United States: if you live in California or another state with a privacy law, the rights to know, delete, correct and, where offered, opt out; we do not discriminate against you for using them."] },
      { heading: "How we handle a request", list: ["We send a confirmation email with a reference number straight away.", "We may ask you to confirm who you are, using the email address you wrote from or details only the account holder knows.", "We reply within 30 days. If a request is complex we may extend that where the law allows, and we tell you why before the 30 days end.", "We do not charge for a reasonable request. If we cannot do what you ask, we say why and tell you how to complain.", `Every request and its outcome is recorded, so we can show how it was handled.`] },
      { heading: "Complaints", body: [`If you are not happy with our answer, write to ${m.privacy} and we will review it. You also have the right to complain to the authority in your country, listed above.`] },
      { heading: "Contact", body: [`Privacy and data protection: ${m.privacy}. This address is also our grievance contact for the purposes of India's Digital Personal Data Protection Act.`] },
    ],
  };
}

export function vulnerabilityDisclosureDoc(m: Mailboxes): LegalDoc {
  return {
    slug: "vulnerability-disclosure",
    title: "Vulnerability Disclosure Policy",
    description: `How to report a security vulnerability in ${SERVICE} to us privately, what is in scope, the rules for good-faith research, and what we do with your report.`,
    intro: `If you believe you have found a security problem in ${SERVICE}, please tell us. This policy explains how to report it, what is in scope, and how we treat good-faith research.`,
    highlights: [
      { icon: "shield", title: "Report privately", text: `Write to ${m.security}; do not open a public issue.` },
      { icon: "check", title: "Good faith is protected", text: "We will not take legal action against research that follows this policy." },
      { icon: "clock", title: "A reply in 3 business days", text: "We acknowledge every report and keep you informed." },
    ],
    sections: [
      { heading: "How to report", list: [`Email ${m.security}. Our security.txt file at /.well-known/security.txt lists the same contact.`, "Describe what you found, where it is, how to reproduce it and the impact you expect. Screenshots or a short video help.", "Do not include other people's data. If you saw some, tell us the type and where, not the data itself."] },
      { heading: "In scope", list: ["The product website and the workspace and product applications served from it.", "Our public APIs and the sign-in, billing and file-upload flows.", "The desktop and mobile apps we build."] },
      { heading: "Out of scope", list: ["Denial-of-service, volumetric attacks, and spam or social engineering of our people or customers.", "Findings that need a rooted or jailbroken device, or physical access.", "Missing best-practice headers or settings with no demonstrated impact, and reports from automated scanners without a working proof.", "Attacks on providers we use (report those to the provider), and on a customer's own systems."] },
      { heading: "Rules for research", list: ["Test only against accounts you own or have permission to use, and never touch another company's data.", "Do not degrade the service, run automated attacks at volume, or keep access longer than needed to show the issue.", "Do not publish details until we have fixed the issue or agreed a date with you."] },
      { heading: "What we do", list: ["We acknowledge your report within three business days.", "We reproduce it, assess its severity and tell you what we found.", "We fix critical and high issues before the next release goes out and verify the fix.", "We tell you when it is fixed, and credit you if you wish."] },
      { heading: "Safe harbour", body: ["If you follow this policy in good faith, we will treat your research as authorised, we will not pursue legal action against you for it, and we will say so if a third party brings a claim. This does not cover activity outside the policy, and it cannot bind other parties."] },
      { heading: "Contact", body: [`Security reports: ${m.security}.`] },
    ],
  };
}
