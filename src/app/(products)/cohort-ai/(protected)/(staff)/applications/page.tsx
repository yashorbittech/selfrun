import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Plus, Inbox, Clock, CheckCircle2, KanbanSquare } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import KpiCard from "@/components/products/dealflow-ai/KpiCard";
import KpiGrid from "@/components/products/dealflow-ai/KpiGrid";
import ApplicationsDataTable from "@/components/products/cohort-ai/ApplicationsDataTable";
import ApplicationForm from "@/components/products/cohort-ai/ApplicationForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageStudents } from "@/lib/tms-roles";
import { searchApplications, countApplications, listApplicationSources, serializeApplication } from "@/lib/products/cohort-ai/applications";
import { listProgramOptions } from "@/lib/products/cohort-ai/programs";
import { isValidApplicationStatus, type ApplicationStatus } from "@/lib/products/cohort-ai/constants";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentTmsUser();
  const canManage = user ? canManageStudents(user) : false;

  const page = Math.max(Number(sp.page) || 1, 1);
  const status = sp.status && isValidApplicationStatus(sp.status) ? (sp.status as ApplicationStatus) : undefined;

  const [result, programs, sources, total, pending, enrolled] = await Promise.all([
    searchApplications({ search: sp.search, status, programId: sp.programId, source: sp.source, page, pageSize: 25 }),
    listProgramOptions(),
    listApplicationSources(),
    countApplications(),
    countApplications({ status: "new" }),
    countApplications({ status: "enrolled" }),
  ]);

  const shortlisted = await countApplications({ status: "shortlisted" });
  const programOptions = programs.map((p) => ({ _id: p._id, name: p.name }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Cohort AI", href: "/cohort-ai" }, { label: "Applications" }]}
        title={<>Applications</>}
        description={<>{total} application{total === 1 ? "" : "s"} in the pipeline.</>}
        actions={<><div className="flex items-center gap-2">
          <Link href="/cohort-ai/applications/board" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <KanbanSquare className="size-3.5" data-icon="inline-start" />
            Board
          </Link>
          {canManage && (
            <ApplicationForm
              programs={programOptions}
              trigger={
                <Button type="button" size="sm">
                  <Plus className="size-3.5" data-icon="inline-start" />
                  New Application
                </Button>
              }
            />
          )}
        </div></>}
      />

      <KpiGrid>
        <KpiCard label="Total" value={total} accent icon={<Inbox className="size-4" />} />
        <KpiCard label="New" value={pending} tone={pending > 0 ? "down" : undefined} icon={<Clock className="size-4" />} />
        <KpiCard label="Shortlisted" value={shortlisted} icon={<CheckCircle2 className="size-4" />} />
        <KpiCard label="Enrolled" value={enrolled} icon={<CheckCircle2 className="size-4" />} />
      </KpiGrid>

      <ApplicationsDataTable
        items={result.items.map((a) => ({ ...serializeApplication(a), programName: a.programName }))}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        programs={programOptions}
        sources={sources}
        initial={{
          search: sp.search ?? "",
          status: sp.status ?? "",
          programId: sp.programId ?? "",
          source: sp.source ?? "",
        }}
      />

      {result.total === 0 && !sp.search && !sp.status && !sp.programId && !sp.source && (
        <p className="text-center text-sm text-muted-foreground">
          No applications yet.{" "}
          {canManage
            ? programOptions.length > 0
              ? "Use “New Application” to add one."
              : "Create a program first."
            : "Ask a training manager to add one."}
        </p>
      )}
    </div>
  );
}
