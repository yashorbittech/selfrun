"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/saas/Logo";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/modules", label: "Modules" },
  { href: "/ai", label: "AI" },
  { href: "/automation", label: "Automation" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "/";
  const active = (href: string) => path === href || path.startsWith(`${href}/`) || path.startsWith(`/saas${href}`);
  return (
    <header className="sticky top-0 z-50 border-b bg-white/85 backdrop-blur-lg">
      <div className="sr-container flex h-[68px] items-center justify-between gap-6">
        <Logo />
        <nav className="ml-8 mr-auto hidden items-center gap-1 xl:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors hover:bg-[var(--sr-surface)]" style={{ color: active(n.href) ? "var(--sr-primary)" : "var(--sr-ink)" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/login" className="sr-btn sr-btn-ghost sr-btn-sm">Log in</Link>
          <Link href="/demo" className="sr-btn sr-btn-ghost sr-btn-sm">Request demo</Link>
          <Link href="/signup" className="sr-btn sr-btn-primary sr-btn-sm">Start free trial</Link>
        </div>
        <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg border xl:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-white xl:hidden">
          <div className="sr-container flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-semibold" style={{ color: active(n.href) ? "var(--sr-primary)" : "var(--sr-ink)" }}>
                {n.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="sr-btn sr-btn-ghost">Log in</Link>
              <Link href="/demo" onClick={() => setOpen(false)} className="sr-btn sr-btn-ghost">Request demo</Link>
            </div>
            <Link href="/signup" onClick={() => setOpen(false)} className="sr-btn sr-btn-primary mt-2">Start free trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}
