import type { PageSection } from "@/lib/cms/section-registry";
import { fillName, type StarterPack } from "@/lib/platform/website/starter-packs";

/**
 * A neutral starter website for a new company — the pages the public site
 * can't render without (`/`, `/contact`) plus Services, About and a privacy
 * policy starting point. Built only from the CMS's existing section types, so
 * everything is editable in the company's CMS afterwards. Which copy, images
 * and section order a company gets comes from its starter pack
 * (`starter-packs.ts`), so new websites don't all look alike.
 *
 * Content is deliberately generic: no client names, testimonials, statistics
 * or promises that the company hasn't made.
 */

export interface StarterVars {
  name: string;
  /** Public contact email for the privacy page; blank until the company profile provides one. */
  email: string;
}

export interface StarterPage {
  path: string;
  title: string;
  sections: PageSection[];
  seo: { title: string; description: string };
}

const IMG = {
  contact: "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?q=80&w=1600&auto=format&fit=crop",
  privacy: "https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1200&auto=format&fit=crop",
};

/** `/services/<slug>` for a service title. */
export const serviceSlug = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let order = 0;
function section(type: string, config: Record<string, unknown>): PageSection {
  order += 1024;
  return { id: `${type}-${order}`, type, orderKey: order, enabled: true, config } as PageSection;
}

export function starterPages(v: StarterVars, pack: StarterPack): StarterPage[] {
  order = 0;
  const t = (text: string) => fillName(text, v.name);
  const servicesSection = () => section("listing-grid", { badge: "Services", badgeIcon: "Layers", sectionLabel: "What We Do", items: pack.services.map((s) => ({ ...s, href: `/services/${serviceSlug(s.title)}` })) });
  const homeSections: Record<string, () => PageSection> = {
    services: servicesSection,
    why: () => section("home-why-choose-us", { eyebrow: t(pack.why.eyebrow), headerIcon: pack.why.icon, heading: pack.why.heading, description: pack.why.description, reasons: pack.why.reasons }),
    steps: () => section("home-how-we-work", { eyebrow: pack.steps.eyebrow, headerIcon: pack.steps.icon, heading: pack.steps.heading, accent: pack.steps.accent, description: pack.steps.description, steps: pack.steps.items, linkLabel: pack.steps.linkLabel, linkHref: "/contact" }),
    faq: () => section("faq-accordion", { title: "Frequently asked questions", faqs: pack.faqs.map((f) => ({ question: t(f.question), answer: f.answer })) }),
    cta: () => section("detail-cta", { heading: pack.cta.heading, description: pack.cta.description, ctaLabel: pack.cta.label, external: false, checklist: pack.cta.checklist }),
  };

  const h = pack.hero;
  const home: StarterPage = {
    path: "/",
    title: "Home",
    seo: { title: `${v.name} — ${h.badge.split("·")[0].trim()}`, description: t(h.description) },
    sections: [
      section("home-hero", {
        badge: h.badge,
        titleLine1: h.line1,
        titleHighlight: h.highlight,
        description: t(h.description),
        primaryCtaLabel: h.primaryCta,
        primaryCtaHref: "/contact",
        secondaryCtaLabel: h.secondaryCta,
        secondaryCtaHref: "/services",
        chipOne: h.chips[0],
        chipTwo: h.chips[1],
        chipThree: h.chips[2],
        statusTitle: h.status[0],
        statusText: h.status[1],
        perfTitle: h.perf[0],
        perfText: h.perf[1],
        scrollLabel: "Scroll to explore",
        image: h.image,
      }),
      ...pack.home.map((key) => homeSections[key]()),
    ],
  };

  const services: StarterPage = {
    path: "/services",
    title: "Services",
    seo: { title: `Services | ${v.name}`, description: t(pack.servicesIntro) },
    sections: [
      section("listing-hero", { eyebrow: "services", title: "Our Services", description: t(pack.servicesIntro), icon: "Layers", image: pack.servicesImage }),
      servicesSection(),
      section("detail-cta", { heading: "Not sure what you need?", description: "Tell us about your idea and we'll recommend the right approach.", ctaLabel: "Contact Us", external: false, checklist: [] }),
    ],
  };

  const about: StarterPage = {
    path: "/about",
    title: "About",
    seo: { title: `About | ${v.name}`, description: `Learn about ${v.name} and how we work.` },
    sections: [
      section("listing-hero", { eyebrow: "about", title: `About ${v.name}`, description: t(pack.about.intro), icon: "Users", image: pack.about.image }),
      section("home-how-we-work", {
        eyebrow: "Our Approach",
        headerIcon: "Compass",
        heading: pack.about.approachHeading,
        accent: "",
        description: pack.about.approachDescription,
        steps: pack.about.principles,
        linkLabel: "Work with us",
        linkHref: "/contact",
      }),
      section("detail-cta", { heading: "Let's build something together", description: "Tell us about your project and we'll take it from there.", ctaLabel: "Contact Us", external: false, checklist: [] }),
    ],
  };

  const contact: StarterPage = {
    path: "/contact",
    title: "Contact",
    seo: { title: `Contact | ${v.name}`, description: `Get in touch with ${v.name}.` },
    sections: [
      section("contact-hero", {
        badge: "Get in touch",
        headingLead: "Let's build something ",
        headingHighlight: "great",
        headingTail: ".",
        description: "Have a project in mind or a question? Send us a message and we'll get back to you.",
        backgroundImage: IMG.contact,
        cardImage: IMG.contact,
        badgeOneTitle: "Quick response",
        badgeOneSubtitle: "Every enquiry answered",
        badgeTwoTitle: "Free consultation",
        badgeTwoSubtitle: "No commitment",
      }),
      section("contact-form", {
        heading: "Get in Touch",
        intro: "Fill out the form and we'll reach out to you.",
        emailTitle: "Email us",
        emailText: "For general enquiries and project proposals.",
        callTitle: "Call us",
        callText: "Available during business hours.",
        whatsappTitle: "Chat on WhatsApp",
        whatsappText: "Message us directly.",
        visitTitle: "Visit us",
        successDescription: "Thanks for reaching out. We'll get back to you soon.",
        submitLabel: "Send Message",
        submittingLabel: "Sending",
        interestLabel: "I'm interested in",
        subServiceLabel: "Specific Service",
        resumeLabel: "Resume / CV (PDF or Word, optional)",
        consentLead: "By submitting this form, you agree to our ",
        consentLinkLabel: "Privacy Policy",
        consentHref: "/privacy-policy",
        consentTail: ".",
      }),
    ],
  };

  const privacy: StarterPage = {
    path: "/privacy-policy",
    title: "Privacy Policy",
    seo: { title: `Privacy Policy | ${v.name}`, description: `How ${v.name} handles personal data.` },
    sections: [
      section("page-hero", { category: "legal", categoryLabel: "legal", title: "Privacy Policy", subtitle: "How we handle your information.", description: "A starting template — review and adapt it to your company's practices and applicable law before relying on it.", icon: "ShieldCheck", image: IMG.privacy, primaryCtaExternal: false }),
      section("legal-document", {
        sections: [
          { id: "collect", title: "Information we collect", icon: "FileText", paragraphs: [`${v.name} collects the information you choose to share with us — for example your name, email address, phone number and message when you contact us.`], bullets: [] },
          { id: "use", title: "How we use it", icon: "Settings", paragraphs: ["We use this information to respond to your enquiry, provide our services and improve our website. We don't sell your personal information."], bullets: [] },
          { id: "rights", title: "Your choices", icon: "UserCheck", paragraphs: [`You can ask us to access, correct or delete your information at any time${v.email ? ` by writing to ${v.email}` : ""}.`], bullets: [] },
        ],
      }),
      section("detail-cta", { heading: "Questions about your data?", description: "Reach out any time.", ctaLabel: "Contact Us", external: false, checklist: [] }),
    ],
  };

  // One detail page per service — so a listing card leads somewhere of its own.
  const details: StarterPage[] = pack.services.map((svc) => ({
    path: `/services/${serviceSlug(svc.title)}`,
    title: svc.title,
    seo: { title: `${svc.title} | ${v.name}`, description: t(svc.description) },
    sections: [
      section("page-hero", { category: "services", categoryLabel: "services", title: svc.title, subtitle: svc.subtitle, description: t(svc.description), icon: svc.icon, image: svc.image, primaryCtaLabel: pack.cta.label, primaryCtaHref: "/contact" }),
      section("feature-highlights", { title: "What's included", features: svc.highlights.slice(0, 6).map((h) => ({ name: h, desc: `${h} — planned, built and supported by the ${v.name} team.` })) }),
      homeSections.steps(),
      section("faq-accordion", { title: `${svc.title} — questions`, faqs: pack.faqs.slice(0, 2).map((f) => ({ question: t(f.question), answer: f.answer })) }),
      section("detail-cta", { heading: `Interested in ${svc.title}?`, description: "Tell us what you need and we'll reply with next steps.", ctaLabel: pack.cta.label, external: false, checklist: pack.cta.checklist }),
    ],
  }));

  return [home, services, about, contact, privacy, ...details];
}

export function starterNavigation(pack: StarterPack): { name: string; href: string; iconKey: string; featured: { title: string; description: string; image: string }; items: { name: string; href: string; description: string; iconKey: string }[] }[] {
  return [
    {
      name: "Services",
      href: "/services",
      iconKey: "Layers",
      featured: { title: "What We Do", description: pack.servicesIntro, image: pack.servicesImage },
      items: [
        ...pack.services.slice(0, 4).map((s) => ({ name: s.title, href: `/services/${serviceSlug(s.title)}`, description: s.subtitle, iconKey: s.icon })),
        { name: "Start a Project", href: "/contact", description: "Tell us about your idea", iconKey: "Rocket" },
      ],
    },
    {
      name: "About",
      href: "/about",
      iconKey: "Compass",
      featured: { title: "About Us", description: "Who we are and how we work.", image: pack.about.image },
      items: [
        { name: "About Us", href: "/about", description: "Our team and approach", iconKey: "Users" },
        { name: "Contact", href: "/contact", description: "Get in touch", iconKey: "Mail" },
      ],
    },
  ];
}

export function starterFooter(): { title: string; viewAllHref?: string; viewAllLabel?: string; links: { label: string; href: string }[] }[] {
  return [
    { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Services", href: "/services" }, { label: "Contact", href: "/contact" }] },
    { title: "Legal", links: [{ label: "Privacy Policy", href: "/privacy-policy" }] },
  ];
}
