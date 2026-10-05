import { redirect } from "next/navigation";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { hasFmsAccess } from "@/lib/fms-roles";
import FmsSidebarShell from "@/components/fms/FmsSidebarShell";
import FmsTopbar from "@/components/fms/FmsTopbar";
import { SidebarCollapseProvider } from "@/components/lms/SidebarCollapseContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireModule } from "@/lib/platform/billing/enforce";
import PanelBackBar from "@/components/hub/PanelBackBar";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const generateMetadata = () => brandedMetadata("{brand} {panel:fms}", { robots: { index: false, follow: false } });

export default async function ProtectedFmsLayout({ children }: { children: React.ReactNode }) {
  await requireModule("fms");
  const user = await getCurrentFmsUser();
  if (!user) redirect("/fms/login");
  if (user.mustChangePassword) redirect("/fms/change-password");
  if (!hasFmsAccess(user.roles)) redirect("/fms/login");

  return (
    <TooltipProvider delay={200}>
      <SidebarCollapseProvider>
        <div className="relative flex h-screen gap-3 overflow-hidden bg-canvas p-3">
          <div className="lms-ambient pointer-events-none absolute inset-0 overflow-hidden">
            <div className="lms-ambient-mid" />
            <div className="absolute inset-0 bg-grid-slate-900/[0.015] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <FmsSidebarShell
            email={user.email}
            roles={user.roles}
            permissionOverrides={user.permissionOverrides}
            createdAt={user.createdAt.toISOString()}
            lastLoginAt={user.lastLoginAt ? user.lastLoginAt.toISOString() : null}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="lms-surface relative z-30 shrink-0 rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md dark:bg-card/85">
              <FmsTopbar roles={user.roles} permissionOverrides={user.permissionOverrides} />
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
