"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import { decideExpense, markExpenseReimbursed, deleteExpense, getExpense } from "@/lib/prms/expenses";
import { recordAudit } from "@/lib/prms/audit";

function revalidate() {
  revalidatePath("/workspace/prms/expenses");
}

export async function decideExpenseAction(id: string, approve: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("manage.prms.expenses");
  const before = await getExpense(id);
  const result = await decideExpense(id, approve, approve ? null : "Rejected by super admin", admin.id);
  if (!result.ok) return { ok: false, error: result.reason };
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "status_change",
    entity: "expense",
    entityId: id,
    entityLabel: before?.expenseCode ?? null,
    summary: approve ? "approved" : "rejected",
  });
  revalidate();
  return { ok: true };
}

export async function markExpenseReimbursedAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("manage.prms.expenses");
  const before = await getExpense(id);
  const result = await markExpenseReimbursed(id, admin.id);
  if (!result.ok) return { ok: false, error: result.reason };
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "status_change",
    entity: "expense",
    entityId: id,
    entityLabel: before?.expenseCode ?? null,
    summary: "reimbursed",
  });
  revalidate();
  return { ok: true };
}

export async function deleteExpenseAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("manage.prms.expenses");
  const before = await getExpense(id);
  const result = await deleteExpense(id, admin.id);
  if (!result.ok) return { ok: false, error: result.reason ?? "Could not delete expense." };
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "delete",
    entity: "expense",
    entityId: id,
    entityLabel: before?.expenseCode ?? null,
  });
  revalidate();
  return { ok: true };
}

export async function bulkDecideExpensesAction(ids: string[], approve: boolean): Promise<{ updated: number; skipped: number }> {
  const admin = await requireWorkspaceAction("manage.prms.expenses");
  let updated = 0;
  for (const id of ids) {
    const before = await getExpense(id);
    const result = await decideExpense(id, approve, approve ? null : "Rejected by super admin", admin.id);
    if (result.ok) {
      updated += 1;
      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "status_change",
        entity: "expense",
        entityId: id,
        entityLabel: before?.expenseCode ?? null,
        summary: approve ? "approved" : "rejected",
      });
    }
  }
  revalidate();
  return { updated, skipped: ids.length - updated };
}

export async function bulkDeleteExpensesAction(ids: string[]): Promise<{ deleted: number; skipped: string[] }> {
  const admin = await requireWorkspaceAction("manage.prms.expenses");
  let deleted = 0;
  const skipped: string[] = [];
  for (const id of ids) {
    const before = await getExpense(id);
    const result = await deleteExpense(id, admin.id);
    if (result.ok) {
      deleted += 1;
      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "delete",
        entity: "expense",
        entityId: id,
        entityLabel: before?.expenseCode ?? null,
      });
    } else {
      skipped.push(before?.expenseCode ?? id);
    }
  }
  revalidate();
  return { deleted, skipped };
}
