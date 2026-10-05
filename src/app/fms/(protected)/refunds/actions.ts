"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageTransactions, canApproveTransactions } from "@/lib/fms-roles";
import { requestRefund, changeRefundStatus, getRefund, type RefundWriteData } from "@/lib/fms/refunds";
import { isValidRefundStatus } from "@/lib/fms/constants";
import { recordAudit } from "@/lib/fms/audit";

export interface RefundActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

function revalidate() {
  revalidatePath("/fms/refunds");
  revalidatePath("/fms/receipts");
  revalidatePath("/fms/transactions");
  revalidatePath("/fms");
}

export async function requestRefundAction(input: Record<string, unknown>): Promise<RefundActionResult> {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageTransactions(user)) throw new Error("Forbidden");

  const receiptId = String(input.receiptId ?? "");
  const amount = Number(input.amount);
  if (!receiptId) return { ok: false, fieldErrors: { receiptId: "Select the receipt to refund." } };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, fieldErrors: { amount: "Enter a refund amount." } };
  const reason = String(input.reason ?? "").trim();
  if (!reason) return { ok: false, fieldErrors: { reason: "Enter a reason." } };

  const data: RefundWriteData = { receiptId, amount, reason };
  const res = await requestRefund(data, user.id);
  if (!res.ok) return { ok: false, error: res.reason };

  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "create", entity: "refund", entityId: res.refund._id, entityLabel: res.refund.refundNumber });
  revalidate();
  return { ok: true, id: res.refund._id };
}

export async function changeRefundStatusAction(id: string, status: string): Promise<RefundActionResult> {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!isValidRefundStatus(status)) return { ok: false, error: "Unknown status." };

  const needsApproval = status === "approved";
  if (needsApproval ? !canApproveTransactions(user) : !canManageTransactions(user)) throw new Error("Forbidden");

  const before = await getRefund(id);
  const res = await changeRefundStatus(id, status, user.id, user.email);
  if (!res.ok) return { ok: false, error: res.reason };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: status === "completed" ? "approve" : status === "failed" ? "reject" : "status_change",
    entity: "refund",
    entityId: id,
    entityLabel: before?.refundNumber,
    summary: `status → ${status}`,
  });
  revalidate();
  return { ok: true, id };
}
