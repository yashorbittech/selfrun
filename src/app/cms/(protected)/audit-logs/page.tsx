import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { listAudit, AUDIT_ACTION_LABEL } from "@/lib/cms/audit";
import GlassCard from "@/components/lms/GlassCard";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsAuditLogsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  if (!can(viewer, "VIEW_AUDIT")) redirect("/cms");

  const { items } = await listAudit({ pageSize: 100 });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Audit Logs" }]}
        icon={ScrollText}
        title="Audit Log"
        description={<>Every change made in the CMS.</>}
      />
      <PanelListFilters>
<div className="space-y-2">
        {items.map((log) => (
          <GlassCard key={log._id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                <Badge variant="outline" className="mr-2">
                  {AUDIT_ACTION_LABEL[log.action]}
                </Badge>
                {log.entity}
                {log.entityLabel ? ` — ${log.entityLabel}` : ""}
              </p>
              {log.summary && <p className="mt-1 text-xs text-muted-foreground">{log.summary}</p>}
              {log.path && <p className="mt-1 text-xs text-muted-foreground">{log.path}</p>}
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <p>{log.actorEmail}</p>
              <p>{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </GlassCard>
        ))}
        {items.length === 0 && <GlassCard className="p-8 text-center text-sm text-muted-foreground">No activity yet.</GlassCard>}
      </div>
</PanelListFilters>
    </div>
  );
}
