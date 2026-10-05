import "server-only";
import { getDb } from "@/lib/mongodb";
import { escapeRegExp } from "@/lib/text-search";
import { newId, createStamp, updateStamp, notDeleted, nextYearSequence, formatYearCode, type AuditFields } from "@/lib/fms/db";
import { DEFAULT_CURRENCY, round2, type PaymentMethod, type FundAccountType } from "@/lib/fms/constants";
import { getInvoice, applyReceiptToInvoice, invoiceBalance, type Invoice } from "@/lib/fms/invoices";
import { postSystemTransaction, changeTransactionStatus } from "@/lib/fms/transactions";

/**
 * Payment receipts (§8) — money received from a customer, applied against
 * one or more outstanding invoices (multi-invoice allocation), with any
 * leftover tracked as an unallocated advance. Every recorded receipt posts a
 * linked, already-`completed` `fms_transaction` via `postSystemTransaction`
 * (a receipt is a record of money that already moved, not a proposal).
 */

export const RECEIPTS_COLLECTION = "fms_receipts";
const RECEIPT_NUMBER_PREFIX = "REC";

export interface ReceiptAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
}

export interface Receipt extends AuditFields {
  _id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  receiptDate: Date;
  amount: number;
  method: PaymentMethod;
  transactionReference: string | null;
  allocations: ReceiptAllocation[];
  /** `amount` minus the sum of `allocations` — an unapplied advance. */
  advanceAmount: number;
  currency: string;
  status: "completed" | "voided";
  transactionId: string | null;
  notes: string | null;
}

export interface SerializedReceipt extends Omit<Receipt, "createdAt" | "updatedAt" | "deletedAt" | "receiptDate"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  receiptDate: string;
}

export function serializeReceipt(r: Receipt): SerializedReceipt {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    receiptDate: r.receiptDate.toISOString().slice(0, 10),
  };
}

let indexesEnsured = false;
async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Receipt>(RECEIPTS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ receiptNumber: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ customerId: 1 }).catch(() => {}),
      collection.createIndex({ "allocations.invoiceId": 1 }).catch(() => {}),
      collection.createIndex({ receiptDate: -1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function generateReceiptNumber(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextYearSequence(RECEIPT_NUMBER_PREFIX, year);
  return formatYearCode(RECEIPT_NUMBER_PREFIX, year, seq);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
  const collection = await getCollection();
  return collection.findOne({ receiptNumber, ...notDeleted });
}

export async function listReceiptsForCustomer(customerId: string, limit = 200): Promise<Receipt[]> {
  const collection = await getCollection();
  return collection.find({ customerId, ...notDeleted }).sort({ receiptDate: -1 }).limit(limit).toArray();
}

export async function listReceiptsForInvoice(invoiceId: string): Promise<Receipt[]> {
  const collection = await getCollection();
  return collection.find({ "allocations.invoiceId": invoiceId, ...notDeleted }).sort({ receiptDate: -1 }).toArray();
}

export interface ReceiptFilter {
  search?: string;
  customerId?: string;
  status?: Receipt["status"];
}

function buildFilter(opts: ReceiptFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...notDeleted };
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    filter.$or = [{ receiptNumber: rx }, { customerName: rx }, { transactionReference: rx }];
  }
  if (opts.customerId) filter.customerId = opts.customerId;
  if (opts.status) filter.status = opts.status;
  return filter;
}

export async function searchReceipts(
  opts: ReceiptFilter & { page?: number; pageSize?: number; sortBy?: "receiptDate" | "amount"; sortDir?: "asc" | "desc" } = {}
) {
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const filter = buildFilter(opts);
  const sortField = opts.sortBy ?? "receiptDate";
  const sortDir = opts.sortDir === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    collection.find(filter).sort({ [sortField]: sortDir }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
}

export interface RecordReceiptData {
  customerId: string;
  customerName: string;
  receiptDate: string;
  amount: number;
  method: PaymentMethod;
  transactionReference: string | null;
  allocations: { invoiceId: string; amount: number }[];
  currency: string;
  fundAccountId?: string | null;
  fundAccountType?: FundAccountType | null;
  notes: string | null;
}

export async function recordReceipt(
  data: RecordReceiptData,
  actorId: string,
  actorEmail: string | null
): Promise<{ ok: true; receipt: Receipt } | { ok: false; reason: string }> {
  const amount = round2(data.amount);
  if (amount <= 0) return { ok: false, reason: "Enter a receipt amount." };

  const allocatedTotal = round2(data.allocations.reduce((s, a) => s + a.amount, 0));
  if (allocatedTotal > amount + 0.01) {
    return { ok: false, reason: "Allocated amount cannot exceed the receipt total." };
  }

  const invoices: Invoice[] = [];
  for (const alloc of data.allocations) {
    if (alloc.amount <= 0) continue;
    const inv = await getInvoice(alloc.invoiceId);
    if (!inv) return { ok: false, reason: "One of the selected invoices was not found." };
    if (inv.customerId !== data.customerId) return { ok: false, reason: `${inv.invoiceNumber} does not belong to this customer.` };
    const outstanding = invoiceBalance(inv);
    if (alloc.amount > outstanding + 0.01) {
      return { ok: false, reason: `Allocation to ${inv.invoiceNumber} (${alloc.amount}) exceeds its outstanding balance (${outstanding}).` };
    }
    invoices.push(inv);
  }

  const receiptDate = new Date(`${data.receiptDate}T00:00:00`);
  const collection = await getCollection();
  const doc: Receipt = {
    _id: newId(),
    receiptNumber: await generateReceiptNumber(receiptDate.getFullYear()),
    customerId: data.customerId,
    customerName: data.customerName,
    receiptDate,
    amount,
    method: data.method,
    transactionReference: data.transactionReference,
    allocations: invoices
      .map((inv) => {
        const alloc = data.allocations.find((a) => a.invoiceId === inv._id)!;
        return { invoiceId: inv._id, invoiceNumber: inv.invoiceNumber, amount: round2(alloc.amount) };
      })
      .filter((a) => a.amount > 0),
    advanceAmount: round2(amount - allocatedTotal),
    currency: data.currency || DEFAULT_CURRENCY,
    status: "completed",
    transactionId: null,
    notes: data.notes,
    ...createStamp(actorId),
  };

  for (const alloc of doc.allocations) {
    await applyReceiptToInvoice(alloc.invoiceId, alloc.amount, actorId);
  }

  const txn = await postSystemTransaction(
    {
      type: "income",
      transactionDate: receiptDate,
      postingDate: receiptDate,
      amount,
      currency: doc.currency,
      paymentMethod: data.method,
      sourceModule: "fms",
      sourceRecordId: doc._id,
      customerId: data.customerId,
      vendorId: null,
      employeeId: null,
      projectId: null,
      department: null,
      accountId: null,
      fundAccountId: data.fundAccountId ?? null,
      fundAccountType: data.fundAccountType ?? null,
      taxAmount: 0,
      referenceNumber: data.transactionReference,
      description: `Receipt ${doc.receiptNumber} from ${data.customerName}`,
      attachments: [],
    },
    actorId,
    actorEmail
  );
  if ("ok" in txn) return txn;
  doc.transactionId = txn._id;

  await collection.insertOne(doc);

  // Wallet & Credits: a real receipt is the "first payment" qualifying event for a pending referral. Best-effort; never affects the receipt.
  try {
    const { qualifyReferralForRecord } = await import("@/lib/wallet/referrals");
    await qualifyReferralForRecord({ clientId: data.customerId });
  } catch {
    /* non-blocking */
  }

  return { ok: true, receipt: doc };
}

/** Reverses every allocation and the linked transaction. Used to correct a mis-entered receipt. */
export async function voidReceipt(id: string, actorId: string): Promise<{ ok: boolean; reason?: string }> {
  const collection = await getCollection();
  const receipt = await collection.findOne({ _id: id, ...notDeleted });
  if (!receipt) return { ok: false, reason: "Receipt not found." };
  if (receipt.status === "voided") return { ok: true };

  for (const alloc of receipt.allocations) {
    await applyReceiptToInvoice(alloc.invoiceId, -alloc.amount, actorId);
  }
  if (receipt.transactionId) {
    await changeTransactionStatus(receipt.transactionId, "reversed", actorId, null);
  }
  await collection.updateOne({ _id: id, ...notDeleted }, { $set: { status: "voided", ...updateStamp(actorId) } });
  return { ok: true };
}
