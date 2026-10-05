import "server-only";
import { getDb } from "@/lib/mongodb";
import { escapeRegExp } from "@/lib/text-search";
import { newId, createStamp, updateStamp, notDeleted, nextYearSequence, formatYearCode, type AuditFields } from "@/lib/fms/db";
import { round2, canTransitionRefund, DEFAULT_REFUND_STATUS, type RefundStatus } from "@/lib/fms/constants";
import { getReceipt } from "@/lib/fms/receipts";
import { postSystemTransaction } from "@/lib/fms/transactions";

/**
 * Refunds (§26) — every refund references its original receipt. Workflow
 * `requested → approved → processing → completed/failed` (§26's own list).
 * Completion posts a reversing `fms_transaction` (an `adjustment`, money
 * going back out) — refunds aren't reachable straight from `requested`.
 */

export const REFUNDS_COLLECTION = "fms_refunds";
const REFUND_NUMBER_PREFIX = "RFD";

export interface Refund extends AuditFields {
  _id: string;
  refundNumber: string;
  receiptId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  transactionId: string | null;
}

export interface SerializedRefund extends Omit<Refund, "createdAt" | "updatedAt" | "deletedAt" | "approvedAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  approvedAt: string | null;
}

export function serializeRefund(r: Refund): SerializedRefund {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
  };
}

let indexesEnsured = false;
async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Refund>(REFUNDS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ refundNumber: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ receiptId: 1 }).catch(() => {}),
      collection.createIndex({ customerId: 1 }).catch(() => {}),
      collection.createIndex({ status: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function generateRefundNumber(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextYearSequence(REFUND_NUMBER_PREFIX, year);
  return formatYearCode(REFUND_NUMBER_PREFIX, year, seq);
}

export async function getRefund(id: string): Promise<Refund | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function listRefundsForReceipt(receiptId: string): Promise<Refund[]> {
  const collection = await getCollection();
  return collection.find({ receiptId, ...notDeleted }).sort({ createdAt: -1 }).toArray();
}

export interface RefundFilter {
  search?: string;
  customerId?: string;
  status?: RefundStatus;
}
function buildFilter(opts: RefundFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...notDeleted };
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    filter.$or = [{ refundNumber: rx }, { receiptNumber: rx }, { customerName: rx }];
  }
  if (opts.customerId) filter.customerId = opts.customerId;
  if (opts.status) filter.status = opts.status;
  return filter;
}

export async function searchRefunds(opts: RefundFilter & { page?: number; pageSize?: number } = {}) {
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const filter = buildFilter(opts);
  const [items, total] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
}

export interface RefundWriteData {
  receiptId: string;
  amount: number;
  reason: string;
}

export async function requestRefund(
  data: RefundWriteData,
  actorId: string
): Promise<{ ok: true; refund: Refund } | { ok: false; reason: string }> {
  const receipt = await getReceipt(data.receiptId);
  if (!receipt) return { ok: false, reason: "Receipt not found." };
  const amount = round2(data.amount);
  if (amount <= 0) return { ok: false, reason: "Enter a refund amount." };

  const collection = await getCollection();
  const existingRefunds = await collection
    .find({ receiptId: receipt._id, status: { $ne: "failed" }, ...notDeleted })
    .toArray();
  const alreadyRefunded = existingRefunds.reduce((s, r) => s + r.amount, 0);
  if (amount + alreadyRefunded > receipt.amount + 0.01) {
    return { ok: false, reason: `Refund exceeds the receipt's amount (already refunded: ${alreadyRefunded}).` };
  }

  const doc: Refund = {
    _id: newId(),
    refundNumber: await generateRefundNumber(),
    receiptId: receipt._id,
    receiptNumber: receipt.receiptNumber,
    customerId: receipt.customerId,
    customerName: receipt.customerName,
    amount,
    reason: data.reason,
    status: DEFAULT_REFUND_STATUS,
    approvedBy: null,
    approvedAt: null,
    transactionId: null,
    ...createStamp(actorId),
  };
  await collection.insertOne(doc);
  return { ok: true, refund: doc };
}

export async function changeRefundStatus(
  id: string,
  toStatus: RefundStatus,
  actorId: string,
  actorEmail: string | null
): Promise<{ ok: boolean; reason?: string }> {
  const collection = await getCollection();
  const existing = await collection.findOne({ _id: id, ...notDeleted });
  if (!existing) return { ok: false, reason: "Refund not found." };
  if (!canTransitionRefund(existing.status, toStatus)) {
    return { ok: false, reason: `Cannot move a ${existing.status} refund to ${toStatus}.` };
  }

  const patch: Record<string, unknown> = { status: toStatus };
  if (toStatus === "approved") {
    patch.approvedBy = actorId;
    patch.approvedAt = new Date();
  }

  if (toStatus === "completed") {
    const txn = await postSystemTransaction(
      {
        type: "adjustment",
        transactionDate: new Date(),
        postingDate: new Date(),
        amount: existing.amount,
        currency: "INR",
        paymentMethod: "bank_transfer",
        sourceModule: "fms",
        sourceRecordId: existing._id,
        customerId: existing.customerId,
        vendorId: null,
        employeeId: null,
        projectId: null,
        department: null,
        accountId: null,
        taxAmount: 0,
        referenceNumber: null,
        description: `Refund ${existing.refundNumber} for ${existing.customerName} (receipt ${existing.receiptNumber})`,
        attachments: [],
      },
      actorId,
      actorEmail
    );
    if ("ok" in txn) return txn;
    patch.transactionId = txn._id;
  }

  await collection.updateOne({ _id: id, ...notDeleted }, { $set: { ...patch, ...updateStamp(actorId) } });
  return { ok: true };
}
