import { redirect } from "next/navigation";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { getStaleLeadsSummary, getRecentLeadsSummary, type Lead } from "@/lib/leads";
import { getStaleApplicationsSummary, getRecentApplicationsSummary, type CareerApplication } from "@/lib/career-applications";
import LmsSidebarShell from "@/components/lms/LmsSidebarShell";
import LmsTopbar from "@/components/lms/LmsTopbar";
import { SidebarCollapseProvider } from "@/components/lms/SidebarCollapseContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SerializedLead, SerializedCareerApplication } from "@/components/lms/types";
import { requireModule } from "@/lib/platform/billing/enforce";
import PanelBackBar from "@/components/hub/PanelBackBar";

function serializeLead(lead: Lead): SerializedLead {
  return {
    ...lead,
    _id: String(lead._id),
    createdAt: new Date(lead.createdAt).toISOString(),
    updatedAt: new Date(lead.updatedAt).toISOString(),
  };
}

function serializeApplication(application: CareerApplication): SerializedCareerApplication {
  return {
    _id: String(application._id),
    positionSlug: application.positionSlug,
    positionTitle: application.positionTitle,
    name: application.name,
    email: application.email,
    phone: application.phone,
    coverNote: application.coverNote,
    status: application.status,
    notes: application.notes,
    resume: application.resume,
    source: application.source,
    createdAt: new Date(application.createdAt).toISOString(),
    updatedAt: new Date(application.updatedAt).toISOString(),
  };
}

export default async function ProtectedLmsLayout({ children }: { children: React.ReactNode }) {
  await requireModule("lms");
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) redirect("/lms/login");

  const [staleLeadsSummary, staleApplicationsSummary, recentLeadsSummary, recentApplicationsSummary] = await Promise.all([
    getStaleLeadsSummary(),
    getStaleApplicationsSummary(),
    getRecentLeadsSummary(),
    getRecentApplicationsSummary(),
  ]);

  const staleLeads = staleLeadsSummary.items.map(serializeLead);
  const staleApplications = staleApplicationsSummary.items.map(serializeApplication);
  const recentLeads = recentLeadsSummary.items.map(serializeLead);
  const recentApplications = recentApplicationsSummary.items.map(serializeApplication);

  return (
    <TooltipProvider delay={200}>
      <SidebarCollapseProvider>
        <div className="relative flex h-screen gap-3 overflow-hidden bg-canvas p-3">
          {/* `position: fixed` here used to escape this wrapper's own stacking
              context straight to the document root — where <body>'s own
              opaque `bg-background` paints ON TOP of it (a fixed + negative
              z-index element is promoted out of a non-stacking-context
              ancestor, so it stacks against the root, not against this div).
              `absolute` keeps it a normal child of this `relative` wrapper, so
              it paints right after the wrapper's own background and before
              the sidebar/topbar/main that follow it in the DOM — same visual
              result the Services page's ListingHero blobs get for free. */}
          <div className="lms-ambient pointer-events-none absolute inset-0 overflow-hidden">
            <div className="lms-ambient-mid" />
            <div className="absolute inset-0 bg-grid-slate-900/[0.015] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <LmsSidebarShell
            userEmail={lmsUser.email}
            createdAt={lmsUser.createdAt.toISOString()}
            lastLoginAt={lmsUser.lastLoginAt ? lmsUser.lastLoginAt.toISOString() : null}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="lms-surface relative z-30 shrink-0 rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md dark:bg-card/85">
              <LmsTopbar
                roles={lmsUser.roles}
                userEmail={lmsUser.email}
                staleLeads={staleLeads}
                staleLeadsCount={staleLeadsSummary.count}
                staleApplications={staleApplications}
                staleApplicationsCount={staleApplicationsSummary.count}
                recentLeads={recentLeads}
                recentApplications={recentApplications}
              />
            </div>
            {/* The fixed .lms-ambient layer above is positioned to this
                whole shell (not to main's scroll content), so it stays put
                behind every translucent panel at any scroll depth — no
                per-page blobs needed on top of it. */}
            <PanelBackBar />
            <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-2xl">{children}</main>
          </div>
        </div>
      </SidebarCollapseProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
