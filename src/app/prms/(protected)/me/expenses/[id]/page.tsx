import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ExpenseSummary from "@/components/prms/ExpenseSummary";
import ExpenseWorkflow from "@/components/prms/ExpenseWorkflow";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { hasPrmsStaffRole } from "@/lib/prms-roles";
import { getExpense, serializeExpense } from "@/lib/prms/expenses";

export default async function MyExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentPrmsUser();
  if (!user) notFound();

  const expense = await getExpense(id);
  if (!expense) notFound();
  const isOwner = expense.raisedByUserId === user.id;
  if (!isOwner && !hasPrmsStaffRole(user.roles)) redirect("/prms/me/expenses");

  const e = serializeExpense(expense);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms/me" }, { label: "My Expenses", href: "/prms/me/expenses" }, { label: e.expenseCode }]}
        title={<>{e.expenseCode}</>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ExpenseSummary expense={e} />
        <ExpenseWorkflow expense={e} isOwner={isOwner} canApprove={false} backPath="/prms/me/expenses" />
      </div>
    </div>
  );
}
