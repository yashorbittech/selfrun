"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageTransactions } from "@/lib/fms-roles";
import { recordVendorPayment, markVendorPaymentProcessed } from "@/lib/fms/vendor-payments";
import { isValidPaymentMethod, isValidFundAccountType } from "@/lib/fms/constants";
import { recordAudit } from "@/lib/fms/audit";
import type { PaymentWriteData } from "@/lib/prms/payments";

export interface VendorPaymentActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  paymentId?: string;
}

function revalidate(billId?: string) {
  revalidatePath("/fms/bills");
  revalidatePath("/fms/vendors");
  revalidatePath("/fms/payables");
  revalidatePath("/fms/transactions");
  revalidatePath("/fms");
  if (billId) revalidatePath(`/fms/bills/${billId}`);
}

export async function recordVendorPaymentAction(input: Record<string, unknown>): Promise<VendorPaymentActionResult> {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageTransactions(user)) throw new Error("Forbidden");

  const method = String(input.method ?? "bank_transfer");
  if (!isValidPaymentMethod(method)) return { ok: false, fieldErrors: { method: "Unknown payment method." } };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, fieldErrors: { amount: "Enter a payment amount." } };

  const billId = String(input.invoiceId ?? "");
  if (!billId) return { ok: false, fieldErrors: { invoiceId: "Missing bill reference." } };

  const status = input.status === "scheduled" ? "scheduled" : "processed";
  const data: PaymentWriteData = {
    invoiceId: billId,
    amount,
    paymentDate: String(input.paymentDate ?? new Date().toISOString().slice(0, 10)),
    method,
    transactionReference: (input.transactionReference as string)?.trim() || null,
    tdsDeducted: Number(input.tdsDeducted) || 0,
    status,
    notes: (input.notes as string)?.trim() || null,
  };

  const fundAccountKey = String(input.fundAccountKey ?? "");
  let fundAccountId: string | null = null;
  let fundAccountType: Parameters<typeof recordVendorPayment>[4] = null;
  if (fundAccountKey) {
    const [type, accountId] = fundAccountKey.split(":");
    if (isValidFundAccountType(type) && accountId) {
      fundAccountType = type;
      fundAccountId = accountId;
    }
  }

  const res = await recordVendorPayment(data, user.id, user.email, fundAccountId, fundAccountType);
  if (!res.ok) return { ok: false, error: res.reason };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "record",
    entity: "transaction",
    entityId: res.paymentId!,
    entityLabel: null,
    summary: `Vendor payment of ${amount} recorded via FMS (PRMS payment ${res.paymentId})`,
  });
  revalidate(billId);
  return { ok: true, paymentId: res.paymentId };
}

export async function markVendorPaymentProcessedAction(id: string, billId: string): Promise<VendorPaymentActionResult> {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageTransactions(user)) throw new Error("Forbidden");

  const res = await markVendorPaymentProcessed(id, user.id, user.email);
  if (!res.ok) return { ok: false, error: res.reason };
  revalidate(billId);
  return { ok: true, paymentId: id };
}
