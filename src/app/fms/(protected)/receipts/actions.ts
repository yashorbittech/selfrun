"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageTransactions } from "@/lib/fms-roles";
import { recordReceipt, voidReceipt, type RecordReceiptData } from "@/lib/fms/receipts";
import { listOutstandingInvoicesForCustomer, serializeInvoice, type SerializedInvoice } from "@/lib/fms/invoices";
import { getClient } from "@/lib/pms/clients";
import { isValidPaymentMethod, isValidFundAccountType } from "@/lib/fms/constants";
import { recordAudit } from "@/lib/fms/audit";

export interface ReceiptActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

async function requireFinance() {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageTransactions(user)) throw new Error("Forbidden");
  return user;
}

function revalidate() {
  revalidatePath("/fms/receipts");
  revalidatePath("/fms/invoices");
  revalidatePath("/fms/customers");
  revalidatePath("/fms/receivables");
  revalidatePath("/fms");
}

export async function listOutstandingInvoicesAction(customerId: string): Promise<SerializedInvoice[]> {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!customerId) return [];
  const invoices = await listOutstandingInvoicesForCustomer(customerId);
  return invoices.map(serializeInvoice);
}

export async function recordReceiptAction(input: Record<string, unknown>): Promise<ReceiptActionResult> {
  const user = await requireFinance();

  const customerId = String(input.customerId ?? "");
  const customer = customerId ? await getClient(customerId) : null;
  if (!customer) return { ok: false, fieldErrors: { customerId: "Select a customer." } };

  const receiptDate = String(input.receiptDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receiptDate)) return { ok: false, fieldErrors: { receiptDate: "Enter a valid date." } };

  const method = String(input.method ?? "bank_transfer");
  if (!isValidPaymentMethod(method)) return { ok: false, fieldErrors: { method: "Unknown payment method." } };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, fieldErrors: { amount: "Enter a receipt amount." } };

  const allocationsRaw = Array.isArray(input.allocations) ? (input.allocations as { invoiceId: string; amount: string }[]) : [];
  const allocations = allocationsRaw
    .map((a) => ({ invoiceId: a.invoiceId, amount: Number(a.amount) || 0 }))
    .filter((a) => a.amount > 0);

  const fundAccountKey = String(input.fundAccountKey ?? "");
  let fundAccountId: string | null = null;
  let fundAccountType: RecordReceiptData["fundAccountType"] = null;
  if (fundAccountKey) {
    const [type, accountId] = fundAccountKey.split(":");
    if (isValidFundAccountType(type) && accountId) {
      fundAccountType = type;
      fundAccountId = accountId;
    }
  }

  const data: RecordReceiptData = {
    customerId,
    customerName: customer.companyName,
    receiptDate,
    amount,
    method,
    transactionReference: (input.transactionReference as string)?.trim() || null,
    allocations,
    currency: String(input.currency ?? customer.billing?.currency ?? "INR"),
    fundAccountId,
    fundAccountType,
    notes: (input.notes as string)?.trim() || null,
  };

  const res = await recordReceipt(data, user.id, user.email);
  if (!res.ok) return { ok: false, error: res.reason };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "create",
    entity: "receipt",
    entityId: res.receipt._id,
    entityLabel: res.receipt.receiptNumber,
  });
  revalidate();
  return { ok: true, id: res.receipt._id };
}

export async function voidReceiptAction(id: string): Promise<ReceiptActionResult> {
  const user = await requireFinance();
  const res = await voidReceipt(id, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  revalidate();
  return { ok: true };
}
