"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import { markPaymentProcessed, deletePayment, getPayment } from "@/lib/prms/payments";
import { recordAudit } from "@/lib/prms/audit";

function revalidate() {
  revalidatePath("/workspace/prms/payments");
}

export async function markPaymentProcessedAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("manage.prms.payments");
  const before = await getPayment(id);
  const result = await markPaymentProcessed(id, admin.id);
  if (!result.ok) return { ok: false, error: result.reason };
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "status_change",
    entity: "payment",
    entityId: id,
    entityLabel: before?.paymentCode ?? null,
    summary: "marked processed",
  });
  revalidate();
  return { ok: true };
}

export async function deletePaymentAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireWorkspaceAction("manage.prms.payments");
  const before = await getPayment(id);
  const result = await deletePayment(id, admin.id);
  if (!result.ok) return { ok: false, error: result.reason ?? "Could not delete payment." };
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "delete",
    entity: "payment",
    entityId: id,
    entityLabel: before?.paymentCode ?? null,
  });
  revalidate();
  return { ok: true };
}

export async function bulkDeletePaymentsAction(ids: string[]): Promise<{ deleted: number }> {
  const admin = await requireWorkspaceAction("manage.prms.payments");
  let deleted = 0;
  for (const id of ids) {
    const before = await getPayment(id);
    const result = await deletePayment(id, admin.id);
    if (result.ok) {
      deleted += 1;
      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "delete",
        entity: "payment",
        entityId: id,
        entityLabel: before?.paymentCode ?? null,
      });
    }
  }
  revalidate();
  return { deleted };
}
