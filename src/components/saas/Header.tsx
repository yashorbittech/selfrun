"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Home, Layers, LogIn, Mail, Menu, Sparkles, Tag, Users, X, type LucideIcon } from "lucide-react";
import Logo from "@/components/saas/Logo";
import { NAV_LINKS } from "@/lib/saas/site";
import ThemeToggle from "@/components/saas/ThemeToggle";

const ICON: Record<string, LucideIcon> = { "/": Home, "/features": Layers, "/pricing": Tag, "/docs": BookOpen, "/about": Users, "/contact": Mail };

/** One-click header: five links, Log in and Get started free. No dropdowns. */
export default function Header() {
  const path = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  // The mobile drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawer = drawerOn === path;
  const header = useRef<HTMLElement>(null);
  // The drawer starts right under the header, wherever the header is (below the offer strip at the top of the page, or stuck to the top).
  const [drawerTop, setDrawerTop] = useState(76);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [drawer]);

  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <>
    <header ref={header} className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-border/50 bg-background/80 shadow-sm backdrop-blur-xl" : "border-transparent bg-background/60 backdrop-blur-md"}`}>
      <nav className="mx-auto flex h-[76px] max-w-[var(--sr-max)] items-center gap-6 px-6 lg:px-8" aria-label="Main">
        <Logo />
        <div className="ml-auto hidden items-center gap-0.5 lg:flex xl:gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors xl:px-3.5 ${active(l.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60 hover:text-primary"}`}>
              <span className="flex items-center gap-1.5">{(() => { const I = ICON[l.href]; return I ? <I className="hidden h-[15px] w-[15px] opacity-70 xl:block" aria-hidden /> : null; })()}{l.label}</span>
            </Link>
          ))}
          <span className="mx-1.5 h-6 w-px bg-border" aria-hidden />
          <ThemeToggle />
          <Link href="/login" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"><LogIn className="h-4 w-4 opacity-70" aria-hidden />Log in</Link>
          <Link href="/signup" className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:scale-105 active:scale-95">
            <Sparkles className="h-4 w-4" /> Get started free
          </Link>
        </div>
        <ThemeToggle className="ml-auto lg:hidden" />
        <button type="button" onClick={() => { setDrawerTop(Math.max(0, Math.round(header.current?.getBoundingClientRect().bottom ?? 76))); setDrawerOn(drawer ? null : path); }} aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} className="rounded-full border border-border/50 bg-muted/30 p-2.5 transition-all hover:bg-muted/80 lg:hidden">
          {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
    </header>

    {/* Outside the header: its backdrop blur would otherwise become the containing block of this fixed panel and collapse it to nothing. */}
      <AnimatePresence>
      {drawer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-background lg:hidden" style={{ top: drawerTop }}>
          <div className="mx-auto max-w-[var(--sr-max)] px-6 py-4">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href} className="border-b border-border/50">
                  <Link href={l.href} className="flex items-center gap-4 py-4">
                    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl ${active(l.href) ? "sr-icon" : "bg-muted text-muted-foreground"}`}>{(() => { const I = ICON[l.href]; return I ? <I className="h-5 w-5" aria-hidden /> : null; })()}</span>
                    <span><span className={`block text-lg font-bold ${active(l.href) ? "text-primary" : ""}`}>{l.label}</span><span className="block text-sm text-muted-foreground">{l.hint}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-border/50 bg-muted/30 py-3 text-center text-sm font-bold"><LogIn className="h-4 w-4" />Log in</Link>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground py-3 text-center text-sm font-bold text-background"><Sparkles className="h-4 w-4" />Get started free</Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
