"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Compass, ExternalLink, KeyRound, X } from "lucide-react";
import CopyDemoValue from "@/components/platform/saas/CopyDemoValue";
import { DEMO_ACCESS } from "@/components/platform/saas/demo-access";

const KEY = "sr-demo-access-closed";
const QUIET = ["/signup", "/login", "/register"];

export default function DemoAccessPopup() {
  const path = usePathname() || "/";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") return;
    } catch {
      // Continue showing the demo when session storage is unavailable.
    }

    const timer = window.setTimeout(() => setVisible(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible || QUIET.some((route) => path === route || path.startsWith(`${route}/`))) return null;

  function close() {
    setVisible(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      // The popup still closes for the current page when storage is unavailable.
    }
  }

  return (
    <aside
      aria-label="Explore the SelfRun demo"
      className="fixed bottom-4 left-4 z-[55] w-[min(22rem,calc(100vw-5.5rem))] sm:bottom-5 sm:left-5 sm:w-[22rem]"
      style={{ animation: "sr-in .45s ease both" }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/95 p-4 shadow-[0_24px_60px_-18px_rgb(15_23_42/.45)] backdrop-blur-xl sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <button
          type="button"
          onClick={close}
          aria-label="Close demo invitation"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
            <Compass className="h-3.5 w-3.5" />
            Interactive product tour
          </p>
          <h2 className="mt-3 pr-6 text-lg font-black leading-tight tracking-tight">
            Explore the full SelfRun workspace
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Try the live demo with shared access. Explore products and workflows at your own pace.
          </p>

          <div className="mt-3 space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
            <Credential label="Email" value={DEMO_ACCESS.email} />
            <Credential label="Password" value={DEMO_ACCESS.password} />
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
            <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
            Shared demo account — please don’t enter personal or payment information.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={DEMO_ACCESS.workspace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-3 py-2 text-xs font-bold text-background transition-transform hover:scale-[1.02]"
            >
              Explore workspace <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={DEMO_ACCESS.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-2 text-xs font-bold transition-colors hover:border-primary/40 hover:text-primary"
            >
              Visit demo site <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
        <code className="mt-0.5 block break-all text-xs font-semibold">{value}</code>
      </div>
      <CopyDemoValue value={value} />
    </div>
  );
}
