import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import AuditFilters from "@/components/sop/AuditFilters";
import { getViewer } from "@/lib/sop/viewer";
import { sopCan } from "@/lib/sop-roles";
import { listAudit } from "@/lib/sop/audit";
import { ACTIONS_LABEL } from "@/lib/sop/constants";
import { formatDateTime } from "@/lib/utils";

const ENTITIES = ["sop", "assignment", "file", "feedback", "template", "category", "department", "function", "process", "settings", "export"];

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sop/login");
  if (!sopCan({ roles: viewer.roles, permissionOverrides: viewer.overrides }, "VIEW_AUDIT")) redirect("/sop");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const filters = { search: sp.search ?? "", action: sp.action ?? "", entity: sp.entity ?? "", from: sp.from ?? "", to: sp.to ?? "", sop: sp.sop ?? "" };
  const { items, total, totalPages } = await listAudit({ sopId: filters.sop || undefined, action: filters.action || undefined, entity: filters.entity || undefined, from: filters.from || undefined, to: filters.to || undefined, q: filters.search || undefined, page, pageSize: 40 });

  const pageHref = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `/sop/audit-logs?${qs.toString()}`;
  };

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "SOP", href: "/sop" }, { label: "Audit Logs" }]}
        title={<>Audit Logs</>}
        description={<>{total} recorded action{total === 1 ? "" : "s"}{filters.sop ? " for this SOP" : ""}. Append-only — entries can't be edited or removed.
          {filters.sop && <Link href={`/sop/library/${filters.sop}`} className="ml-2 text-primary hover:underline">Open SOP</Link>}</>}
      />

      <AuditFilters
        values={filters}
        actions={Object.entries(ACTIONS_LABEL).map(([value, label]) => ({ value, label }))}
        entities={ENTITIES.map((e) => ({ value: e, label: e[0].toUpperCase() + e.slice(1) }))}
        exportHref="/api/sop/export/audit"
      />

      <GlassCard interactive={false}>
        <CardContent className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Subject</TableHead><TableHead>Details</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No activity matches.</TableCell></TableRow>}
              {items.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.actorEmail ?? a.actorId}</TableCell>
                  <TableCell><Badge className="bg-primary/10 text-primary">{ACTIONS_LABEL[a.action] ?? a.action}</Badge></TableCell>
                  <TableCell>
                    <span className="text-[11px] text-muted-foreground capitalize">{a.entity} · </span>
                    {a.sopId ? <Link href={`/sop/library/${a.sopId}`} className="hover:underline">{a.entityLabel ?? a.entityId}</Link> : (a.entityLabel ?? a.entityId)}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-muted-foreground">{a.summary ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Link href={pageHref(Math.max(page - 1, 1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}><ChevronLeft className="size-3.5" data-icon="inline-start" />Previous</Link>
            <Link href={pageHref(Math.min(page + 1, totalPages))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined}>Next<ChevronRight className="size-3.5" data-icon="inline-end" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}
