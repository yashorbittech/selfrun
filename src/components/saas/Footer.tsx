import Link from "next/link";
import Logo from "@/components/saas/Logo";
import { SAAS_BRAND, saasContact } from "@/lib/saas/brand";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Product", links: [{ href: "/features", label: "Features" }, { href: "/modules", label: "Modules" }, { href: "/ai", label: "AI capabilities" }, { href: "/automation", label: "Business automation" }, { href: "/integrations", label: "Integrations" }, { href: "/pricing", label: "Pricing" }] },
  { title: "Solutions", links: [{ href: "/use-cases", label: "Use cases" }, { href: "/industries", label: "Industries" }, { href: "/how-it-works", label: "How it works" }, { href: "/security", label: "Security" }] },
  { title: "Resources", links: [{ href: "/resources", label: "Guides & documentation" }, { href: "/faq", label: "FAQ" }, { href: "/demo", label: "Request a demo" }, { href: "/contact", label: "Contact us" }] },
  { title: "Company", links: [{ href: "/about", label: "About us" }, { href: "/privacy", label: "Privacy policy" }, { href: "/terms", label: "Terms of service" }, { href: "/login", label: "Log in" }, { href: "/signup", label: "Start free trial" }] },
];

export default function Footer({ host }: { host: string }) {
  const contact = saasContact(host);
  return (
    <footer className="sr-dark">
      <div className="sr-container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="space-y-5">
            <Logo light />
            <p className="max-w-sm text-[15px] leading-relaxed" style={{ color: "#b9c0d8" }}>{SAAS_BRAND.tagline}. One platform for sales, people, finance, projects, procurement, training and your website — automated with AI.</p>
            <p className="text-sm" style={{ color: "#b9c0d8" }}>
              <a href={`mailto:${contact.hello}`} className="font-semibold text-white hover:underline">{contact.hello}</a>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] transition-colors hover:text-white" style={{ color: "#b9c0d8" }}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center" style={{ borderColor: "rgba(255,255,255,.12)", color: "#9aa3bf" }}>
          <p>© {new Date().getFullYear()} {SAAS_BRAND.name}. All rights reserved.</p>
          {SAAS_BRAND.operator ? <p>Powered by {SAAS_BRAND.operator}</p> : null}
        </div>
      </div>
    </footer>
  );
}
