"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { PORTAL_SESSION_CHANGED_EVENT } from "@/components/chat/ChatProvider";
import { useSiteInfo } from "@/components/cms/SiteInfoContext";

type Session = { signedIn: boolean; firstName: string | null } | null;

/**
 * Public-header account entry: "Login / Sign up" for visitors, "Dashboard" for
 * signed-in portal users. Checked client-side (one tiny no-store request) so
 * the public pages stay statically renderable. Renders nothing until known,
 * so a signed-in user never sees a flash of "Login".
 *
 * Also re-checks on `portal:session-changed` — fired by the Ask AI chat when
 * the pre-chat form auto-creates and signs in an account — so this flips to
 * Dashboard immediately without a page reload or leaving the chat.
 */
export default function PortalAuthLink({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const [session, setSession] = useState<Session>(null);
  const { header } = useSiteInfo();

  const refresh = useCallback(() => {
    fetch("/api/portal/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setSession(j))
      .catch(() => setSession({ signedIn: false, firstName: null }));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(PORTAL_SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PORTAL_SESSION_CHANGED_EVENT, refresh);
  }, [refresh]);

  if (!session) return variant === "desktop" ? <span className="h-9 w-28" aria-hidden /> : null;

  if (session.signedIn) {
    return variant === "desktop" ? (
      <Link href="/portal" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
        <LayoutDashboard className="h-4 w-4" />{` ${header.dashboardLabel}`}
      </Link>
    ) : (
      <Link href="/portal" onClick={onNavigate} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-3.5 text-base font-semibold text-primary">
        <LayoutDashboard className="h-5 w-5" />{` ${header.dashboardLabel}`}{session.firstName ? ` · ${session.firstName}` : ""}
      </Link>
    );
  }

  return variant === "desktop" ? (
    <div className="inline-flex items-center whitespace-nowrap rounded-full border border-border/60 bg-muted/30 text-sm font-semibold">
      <Link href="/login" className="inline-flex items-center gap-1.5 rounded-l-full px-3.5 py-2 text-foreground transition-colors hover:bg-muted/70 hover:text-primary">
        <LogIn className="h-4 w-4" />{` ${header.loginLabel}`}
      </Link>
      <span className="h-4 w-px bg-border" aria-hidden />
      <Link href="/register" className="rounded-r-full px-3.5 py-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
        {header.signupLabel}
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/login" onClick={onNavigate} className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-3.5 text-base font-semibold text-foreground">
        <LogIn className="h-5 w-5" />{` ${header.loginLabel}`}
      </Link>
      <Link href="/register" onClick={onNavigate} className="flex items-center justify-center rounded-xl border border-primary/40 bg-primary/10 px-3 py-3.5 text-base font-semibold text-primary">
        {header.signupLabel}
      </Link>
    </div>
  );
}
