import HubSidebarShell from "@/components/hub/HubSidebarShell";
import HubTopbar from "@/components/hub/HubTopbar";
import { SidebarCollapseProvider } from "@/components/lms/SidebarCollapseContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BillingNotice from "@/components/platform/BillingNotice";
import { workspaceUnreadCount } from "@/lib/workspace/notifications";
import type { CurrentHubUser } from "@/lib/hub-auth";
import type { ResolvedNav } from "@/lib/workspace/nav";
import SetupBanner from "@/components/workspace/SetupBanner";
import { setupStripNeeded } from "@/lib/platform/onboarding/state";
import VerifyEmailBanner, { VerifiedNotice } from "@/components/workspace/VerifyEmailBanner";
import { showVerifyStrip } from "@/lib/platform/email-verification-rule";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";

/**
 * The Workspace frame: sidebar, top bar, billing notice. One layout
 * (`src/app/workspace/(protected)/layout.tsx`) wraps every Workspace page —
 * the dashboard, the registers, company settings (`/workspace/settings/*`),
 * onboarding and upgrade — so the whole company-level area is one application.
 *
 * A company owner whose setup is not completed also gets the "Complete setup"
 * strip (`SetupBanner`) on every page except the wizard itself; a user whose
 * email isn't verified gets the "Verify email" strip (`VerifyEmailBanner`) above it.
 * Neither blocks anything.
 */
export default async function WorkspaceShell({ user, nav, children }: { user: CurrentHubUser; nav: ResolvedNav; children: React.ReactNode }) {
  const [unread, setup, ownCompany] = await Promise.all([
    workspaceUnreadCount(user).catch(() => 0),
    setupStripNeeded(user.roles).catch(() => ({ show: false, done: 0, total: 0 })),
    isPlatformOwnerContext().catch(() => false),
  ]);
  const verifyStrip = showVerifyStrip({ emailVerified: user.emailVerified !== false, isPlatformOwnerCompany: ownCompany });

  return (
    <TooltipProvider delay={200}>
      <SidebarCollapseProvider>
        <div className="relative flex h-screen gap-3 overflow-hidden bg-canvas p-3">
          <div className="lms-ambient pointer-events-none absolute inset-0 overflow-hidden">
            <div className="lms-ambient-mid" />
            <div className="absolute inset-0 bg-grid-slate-900/[0.015] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <HubSidebarShell email={user.email} nav={nav.sections} lastLoginAt={user.lastLoginAt ? user.lastLoginAt.toISOString() : null} />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="lms-surface relative z-30 shrink-0 rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md dark:bg-card/85">
              <HubTopbar email={user.email} nav={nav.sections} unread={unread} />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 empty:hidden">
              <BillingNotice />
              {verifyStrip && <VerifyEmailBanner email={user.email} />}
              {setup.show && <SetupBanner done={setup.done} total={setup.total} />}
            </div>
            <main id="workspace-content" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-2xl">
              {children}
            </main>
          </div>
        </div>
      </SidebarCollapseProvider>
      <VerifiedNotice />
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
