import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, GitBranch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/lpms/viewer";
import { lpmsCan } from "@/lib/lpms-roles";
import { listWorkflows } from "@/lib/lpms/workflows";

export default async function WorkflowsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/lpms/login");

  const ctx = { roles: viewer.roles, permissionOverrides: viewer.overrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) redirect("/lpms");

  const workflows = await listWorkflows(viewer);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "LPMS", href: "/lpms" }, { label: "Workflows" }]}
        title={<>Approval Workflows</>}
        description={<>Configure multi-step approval workflows for document types.</>}
        actions={<><Link href="/lpms/workflows/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="size-3.5" />
          New Workflow
        </Link></>}
      />

      <PanelListFilters>
{workflows.length === 0 ? (
        <GlassCard interactive={false}>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <GitBranch className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No workflows configured. Create one to enable multi-step approvals.
            </p>
          </CardContent>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf: any) => (
            <GlassCard key={wf.id} interactive>
              <CardContent className="flex items-center gap-4 py-4">
                <GitBranch className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{wf.name}</p>
                  {wf.description && (
                    <p className="text-xs text-muted-foreground">{wf.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(wf.steps ?? []).length} step{(wf.steps ?? []).length !== 1 ? "s" : ""}
                    {wf.isDefault && (
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        Default
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/lpms/workflows/${wf.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Edit
                </Link>
              </CardContent>
            </GlassCard>
          ))}
        </div>
      )}
</PanelListFilters>
    </div>
  );
}
