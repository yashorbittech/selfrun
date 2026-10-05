import "server-only";
import { getDb } from "@/lib/mongodb";
import {
  recordPayment as prmsRecordPayment,
  markPaymentProcessed as prmsMarkPaymentProcessed,
  getPayment as getPrmsPayment,
  searchPayments as searchPrmsPayments,
  type PaymentWriteData as PrmsPaymentWriteData,
} from "@/lib/prms/payments";
import { getInvoice as getPrmsBill } from "@/lib/prms/invoices";
import { postSystemTransaction, type Transaction } from "@/lib/fms/transactions";
import type { PaymentMethod, FundAccountType } from "@/lib/fms/constants";

/**
 * FMS's "Vendor Payments" (§11 — "FMS should manage the financial portion:
 * Payment, Payment reference, Reconciliation"). Reuses PRMS's own tested
 * `recordPayment`/`markPaymentProcessed` (the same amountPaid/status math
 * every PRMS vendor payment already goes through) instead of reimplementing
 * it — then posts a linked, already-`completed` `fms_transaction` so the
 * general ledger has a matching entry. No new payment collection: PRMS's
 * `prms_payments` (and its `PAY-0001` numbering) stays the single source of
 * truth for the payment record itself.
 */

const TRANSACTIONS_COLLECTION = "fms_transactions";

async function postLinkedTransaction(
  paymentId: string,
  actorId: string,
  actorEmail: string | null,
  fundAccountId: string | null = null,
  fundAccountType: FundAccountType | null = null
): Promise<Transaction | null> {
  const payment = await getPrmsPayment(paymentId);
  if (!payment || payment.status !== "processed") return null;

  // Idempotent — `markPaymentProcessed` can be called on an already-processed
  // payment without creating a second linked transaction.
  const db = await getDb();
  const already = await db
    .collection(TRANSACTIONS_COLLECTION)
    .findOne({ sourceModule: "prms", sourceRecordId: paymentId, deletedAt: null });
  if (already) return null;

  const bill = await getPrmsBill(payment.invoiceId);
  const txn = await postSystemTransaction(
    {
      type: "expense",
      transactionDate: payment.paymentDate,
      postingDate: payment.paymentDate,
      amount: payment.amount,
      currency: bill?.currency ?? "INR",
      paymentMethod: (payment.method as PaymentMethod) || "bank_transfer",
      sourceModule: "prms",
      sourceRecordId: paymentId,
      customerId: null,
      vendorId: payment.vendorId,
      employeeId: null,
      projectId: null,
      department: null,
      accountId: null,
      fundAccountId,
      fundAccountType,
      taxAmount: payment.tdsDeducted,
      referenceNumber: payment.transactionReference,
      description: `Vendor payment ${payment.paymentCode} for bill ${payment.invoiceNumber}`,
      attachments: [],
    },
    actorId,
    actorEmail
  );
  // The PRMS payment itself already succeeded (this only runs after it's
  // "processed") — a closed-period rejection here means no matching FMS
  // ledger entry gets posted for it, not that the payment should be undone.
  return "ok" in txn ? null : txn;
}

export interface RecordVendorPaymentResult {
  ok: boolean;
  reason?: string;
  paymentId?: string;
}

export async function recordVendorPayment(
  data: PrmsPaymentWriteData,
  actorId: string,
  actorEmail: string | null,
  fundAccountId: string | null = null,
  fundAccountType: FundAccountType | null = null
): Promise<RecordVendorPaymentResult> {
  const res = await prmsRecordPayment(data, actorId);
  if (!res.ok || !res.id) return { ok: false, reason: res.reason };
  if (data.status === "processed") {
    await postLinkedTransaction(res.id, actorId, actorEmail, fundAccountId, fundAccountType);
  }
  return { ok: true, paymentId: res.id };
}

export async function markVendorPaymentProcessed(
  id: string,
  actorId: string,
  actorEmail: string | null
): Promise<{ ok: boolean; reason?: string }> {
  const res = await prmsMarkPaymentProcessed(id, actorId);
  if (!res.ok) return res;
  await postLinkedTransaction(id, actorId, actorEmail);
  return { ok: true };
}

export async function listVendorPayments(opts: Parameters<typeof searchPrmsPayments>[0] = {}) {
  return searchPrmsPayments(opts);
}
