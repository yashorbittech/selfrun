import { redirect } from "next/navigation";
import { getCurrentSeoUser } from "@/lib/seo-auth";
import { hasSeoAccess } from "@/lib/seo-roles";
import { getViewer, can } from "@/lib/seo-panel/viewer";
import { listSeoNotifications } from "@/lib/seo-panel/notifications";
import { issueStats } from "@/lib/seo-panel/issues";
import { taskStats } from "@/lib/seo-panel/tasks";
import SeoSidebarShell from "@/components/seo/SeoSidebarShell";
import SeoTopbar from "@/components/seo/SeoTopbar";
import type { SeoNavFlags } from "@/components/seo/SeoSidebar";
import { SidebarCollapseProvider } from "@/components/lms/SidebarCollapseContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import { requireModule } from "@/lib/platform/billing/enforce";
import PanelBackBar from "@/components/hub/PanelBackBar";

export const generateMetadata = () => brandedMetadata("{brand} {panel:seo}", { robots: { index: false, follow: false } });

export default async function ProtectedSeoLayout({ children }: { children: React.ReactNode }) {
  await requireModule("seo");
  const user = await getCurrentSeoUser();
  if (!user) redirect("/seo/login");
  if (user.mustChangePassword) redirect("/seo/change-password");
  if (!hasSeoAccess(user.roles)) redirect("/seo/login");
  const viewer = await getViewer();
  if (!viewer) redirect("/seo/login");

  const [bell, issues, tasks] = await Promise.all([listSeoNotifications(viewer.userId), issueStats(), taskStats(viewer.userId)]);
  const flags: SeoNavFlags = {
    settings: can(viewer, "MANAGE_INTEGRATIONS"),
    audit: can(viewer, "VIEW_AUDIT"),
    critical: issues.bySeverity.critical,
    myTasks: tasks.mine,
  };

  return (
    <TooltipProvider delay={200}>
      <SidebarCollapseProvider>
        <div className="relative flex h-screen gap-3 overflow-hidden bg-canvas p-3">
          <div className="lms-ambient pointer-events-none absolute inset-0 overflow-hidden">
            <div className="lms-ambient-mid" />
            <div className="absolute inset-0 bg-grid-slate-900/[0.015] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <SeoSidebarShell
            email={user.email}
            roles={user.roles}
            flags={flags}
            createdAt={user.createdAt.toISOString()}
            lastLoginAt={user.lastLoginAt ? user.lastLoginAt.toISOString() : null}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="lms-surface relative z-30 shrink-0 rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md dark:bg-card/85">
              <SeoTopbar roles={user.roles} flags={flags} notifications={bell.items} unread={bell.unread} />
            </div>
            <PanelBackBar />
            <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-2xl">{children}</main>
          </div>
        </div>
      </SidebarCollapseProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
