import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import AuditFilters from "@/components/sop/AuditFilters";
import { PageHeader } from "@/components/ots/OtsUi";
import { getViewer, can } from "@/lib/ots/viewer";
import { listAudit, AUDIT_ACTION_LABEL, AUDIT_ENTITIES } from "@/lib/ots/audit";
import { formatDateTime } from "@/lib/utils";

const TONE: Record<string, string> = {
  security_event: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  auto_submit: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  delete: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  certificate_revoked: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  marks_modified: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  archive: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  cancel: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export default async function OtsActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "VIEW_AUDIT_LOG")) redirect("/ots");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const filters = { search: sp.search ?? "", action: sp.action ?? "", entity: sp.entity ?? "", from: sp.from ?? "", to: sp.to ?? "", sop: "" };
  const { items, total, totalPages } = await listAudit({ testId: sp.testId, action: filters.action || undefined, entity: filters.entity || undefined, from: filters.from || undefined, to: filters.to || undefined, q: filters.search || undefined, page, pageSize: 40 });
  const pageHref = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `/ots/activity?${qs.toString()}`;
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Activity Logs" crumbs={[{ label: "Activity Logs" }]} description={`${total} recorded action${total === 1 ? "" : "s"}: tests, questions, assignments, attempts (start / submit / auto-submit), evaluation and mark changes, results, certificates and exam security events. Append-only — answers and answer keys are never logged.`} />
      <AuditFilters
        values={filters}
        actions={Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value, label }))}
        entities={AUDIT_ENTITIES.map((e) => ({ value: e, label: e.replace(/^\w/, (c) => c.toUpperCase()) }))}
        exportHref="/api/ots/export/audit"
        searchPlaceholder="Actor, record or details"
      />
      <GlassCard interactive={false}>
        <CardContent className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No activity matches.</TableCell>
                </TableRow>
              )}
              {items.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.actorEmail ?? (a.actorId === "system" ? "System" : a.actorId.startsWith("portal:") ? "Portal user" : a.actorId)}</TableCell>
                  <TableCell><Badge className={TONE[a.action] ?? "bg-primary/10 text-primary"}>{AUDIT_ACTION_LABEL[a.action] ?? a.action}</Badge></TableCell>
                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">{a.entity} · </span>
                    {a.entity === "test" ? <Link href={`/ots/tests/${a.entityId}`} className="hover:text-primary">{a.entityLabel ?? a.entityId}</Link> : a.entity === "attempt" || a.entity === "result" ? <Link href={`/ots/results/${a.entityId}`} className="hover:text-primary">{a.entityLabel ?? a.entityId}</Link> : a.entity === "question" && a.entityId !== "import" ? <Link href={`/ots/questions/${a.entityId}`} className="hover:text-primary">{a.entityLabel ?? a.entityId}</Link> : a.entityLabel ?? a.entityId}
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
          <span>{`Page ${page} of ${totalPages}`}</span>
          <div className="flex gap-2">
            <Link href={pageHref(Math.max(page - 1, 1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1}>
              <ChevronLeft className="size-3.5" /> Previous
            </Link>
            <Link href={pageHref(Math.min(page + 1, totalPages))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= totalPages}>
              Next <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
