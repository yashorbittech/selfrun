"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import Logo from "@/components/saas/Logo";
import { NAV_LINKS } from "@/lib/saas/site";

/** One-click header: five links, Log in and Get started free. No dropdowns. */
export default function Header() {
  const path = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  // The mobile drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawer = drawerOn === path;

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
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-border/50 bg-background/80 shadow-sm backdrop-blur-xl" : "border-transparent bg-background/60 backdrop-blur-md"}`}>
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center gap-6 px-6 lg:px-8" aria-label="Main">
        <Logo />
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active(l.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60 hover:text-primary"}`}>
              {l.label}
            </Link>
          ))}
          <span className="mx-2 h-6 w-px bg-border" aria-hidden />
          <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-primary">Log in</Link>
          <Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:scale-105 active:scale-95">
            <Sparkles className="h-4 w-4" /> Get started free
          </Link>
        </div>
        <button type="button" onClick={() => setDrawerOn(drawer ? null : path)} aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} className="ml-auto rounded-full border border-border/50 bg-muted/30 p-2.5 transition-all hover:bg-muted/80 lg:hidden">
          {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
    </header>

    {/* Outside the header: its backdrop blur would otherwise become the containing block of this fixed panel and collapse it to nothing. */}
      <AnimatePresence>
      {drawer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 top-[76px] bottom-0 z-40 overflow-y-auto bg-background lg:hidden">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href} className="border-b border-border/50">
                  <Link href={l.href} className="block py-4">
                    <span className={`block text-lg font-bold ${active(l.href) ? "text-primary" : ""}`}>{l.label}</span>
                    <span className="block text-sm text-muted-foreground">{l.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/login" className="rounded-full border border-border/50 bg-muted/30 py-3 text-center text-sm font-bold">Log in</Link>
              <Link href="/signup" className="rounded-full bg-foreground py-3 text-center text-sm font-bold text-background">Get started free</Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
