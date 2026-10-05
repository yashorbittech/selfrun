import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import AuditFilters from "@/components/sop/AuditFilters";
import { PageHeader } from "@/components/seo/SeoUi";
import { getViewer, can } from "@/lib/seo-panel/viewer";
import { listAudit, AUDIT_ACTION_LABEL, AUDIT_ENTITIES } from "@/lib/seo-panel/audit";
import { formatDateTime } from "@/lib/utils";

export default async function SeoAuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/seo/login");
  if (!can(viewer, "VIEW_AUDIT")) redirect("/seo");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const filters = { search: sp.search ?? "", action: sp.action ?? "", entity: sp.entity ?? "", from: sp.from ?? "", to: sp.to ?? "", sop: "" };
  const { items, total, totalPages } = await listAudit({ action: filters.action || undefined, entity: filters.entity || undefined, from: filters.from || undefined, to: filters.to || undefined, q: filters.search || undefined, page, pageSize: 40 });
  const pageHref = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `/seo/audit-logs?${qs.toString()}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Audit Logs" crumbs={[{ label: "Audit Logs" }]} description={`${total} recorded action${total === 1 ? "" : "s"}: metadata, keyword, sitemap, robots.txt, schema, issue, task, integration and settings changes, audit runs and exports. Append-only.`} />
      <AuditFilters
        values={filters}
        actions={Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value, label }))}
        entities={AUDIT_ENTITIES.map((e) => ({ value: e, label: e.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }))}
        exportHref="/api/seo/export/audit"
        searchPlaceholder="Actor, subject, path or details"
      />
      <GlassCard interactive={false}>
        <CardContent className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Subject</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No activity matches.</TableCell></TableRow>}
              {items.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.actorEmail ?? a.actorId}</TableCell>
                  <TableCell><Badge className="bg-primary/10 text-primary">{AUDIT_ACTION_LABEL[a.action] ?? a.action}</Badge></TableCell>
                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">{a.entity.replace(/_/g, " ")} · </span>
                    {a.entityLabel ?? a.entityId}
                    {a.path && <span className="block text-[11px] text-muted-foreground">{a.path}</span>}
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
