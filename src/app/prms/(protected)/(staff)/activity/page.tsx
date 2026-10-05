import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canViewAuditLog } from "@/lib/prms-roles";
import { listAudit } from "@/lib/prms/audit";
import { formatDateTime } from "@/lib/utils";

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentPrmsUser();
  if (!user || !canViewAuditLog(user)) redirect("/prms");

  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const { items, total, totalPages } = await listAudit({ page, pageSize: 40 });

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms" }, { label: "Activity Log" }]}
        title={<>Activity Log</>}
        description={<>{total} recorded action{total === 1 ? "" : "s"}. Append-only.</>}
      />

      <PanelListFilters>
<GlassCard interactive={false}>
        <CardContent className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No activity recorded yet.</TableCell>
                </TableRow>
              )}
              {items.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.actorEmail ?? a.actorId}</TableCell>
                  <TableCell className="capitalize">{a.action.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <span className="capitalize">{a.entity.replace(/_/g, " ")}</span>
                    {a.entityLabel ? <span className="text-muted-foreground"> · {a.entityLabel}</span> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.summary ?? "—"}</TableCell>
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
            <Link href={`/prms/activity?page=${Math.max(page - 1, 1)}`} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
              <ChevronLeft className="size-3.5" data-icon="inline-start" />
              Previous
            </Link>
            <Link href={`/prms/activity?page=${Math.min(page + 1, totalPages)}`} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined}>
              Next
              <ChevronRight className="size-3.5" data-icon="inline-end" />
            </Link>
          </div>
        </div>
      )}
</PanelListFilters>
    </div>
  );
}
