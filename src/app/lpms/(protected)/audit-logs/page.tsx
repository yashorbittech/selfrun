import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/lpms/viewer";
import { lpmsCan } from "@/lib/lpms-roles";
import { listAuditEvents } from "@/lib/lpms/audit";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; entityType?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/lpms/login");

  const ctx = { roles: viewer.roles, permissionOverrides: viewer.overrides };
  if (!lpmsCan(ctx, "VIEW_AUDIT")) redirect("/lpms");

  const sp = await searchParams;
  const { items, total } = await listAuditEvents(
    {
      action: sp.action,
      entityType: sp.entityType,
      page: sp.page ? parseInt(sp.page) : 1,
      pageSize: 50,
    },
    viewer
  );

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "LPMS", href: "/lpms" }, { label: "Audit Logs" }]}
        title={<>Audit Logs</>}
        description={<>{total} events recorded</>}
      />

      <PanelListFilters>
<GlassCard interactive={false}>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ScrollText className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No audit events found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {items.map((event: any, i: number) => (
                <li key={event._id ?? i} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {(event.action ?? "?")[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{event.actorEmail}</span>{" "}
                      <span className="text-muted-foreground">
                        {event.action?.toLowerCase().replace(/_/g, " ")}
                      </span>{" "}
                      {event.entityLabel && (
                        <span className="font-medium">{event.entityLabel}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.entityType} · {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
