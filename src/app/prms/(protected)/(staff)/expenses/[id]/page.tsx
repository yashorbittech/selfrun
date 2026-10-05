import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ExpenseSummary from "@/components/prms/ExpenseSummary";
import ExpenseWorkflow from "@/components/prms/ExpenseWorkflow";
import ExpenseForm from "@/components/prms/ExpenseForm";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageExpenses } from "@/lib/prms-roles";
import { getExpense, serializeExpense } from "@/lib/prms/expenses";
import { listVendorOptions } from "@/lib/prms/vendors";
import { listDepartments, listProjectOptions } from "@/lib/prms/pickers";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentPrmsUser();
  if (!user) notFound();

  const expense = await getExpense(id);
  if (!expense) notFound();
  const e = serializeExpense(expense);

  const canApprove = canManageExpenses(user);
  const isOwner = e.raisedByUserId === user.id;

  const [vendors, departments, projects] = e.approvalStatus === "pending"
    ? await Promise.all([listVendorOptions({ activeOnly: true }), listDepartments(), listProjectOptions()])
    : [[], [], []];

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms" }, { label: "Expense Management", href: "/prms/expenses" }, { label: e.expenseCode }]}
        title={<>{e.expenseCode}</>}
        actions={<>{e.approvalStatus === "pending" && (isOwner || canApprove) && (
          <ExpenseForm
            expense={e}
            vendors={vendors.map((v) => ({ _id: v._id, companyName: v.companyName }))}
            departments={departments.map((d) => ({ _id: d._id, name: d.name }))}
            projects={projects.map((p) => ({ _id: p._id, name: p.name }))}
            canApprove={canApprove}
            trigger={
              <Button type="button" size="sm" variant="outline">
                <Pencil className="size-3.5" data-icon="inline-start" />
                Edit
              </Button>
            }
          />
        )}</>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ExpenseSummary expense={e} />
        <ExpenseWorkflow expense={e} isOwner={isOwner} canApprove={canApprove} backPath="/prms/expenses" />
      </div>
    </div>
  );
}
