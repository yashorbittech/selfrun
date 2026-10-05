import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, notDeleted, nextYearSequence, formatYearCode, type AuditFields } from "@/lib/fms/db";
import { round2, type PaymentMethod, type FundAccountType } from "@/lib/fms/constants";
import { getExpense, markExpenseReimbursed, type Expense } from "@/lib/prms/expenses";
import { postSystemTransaction } from "@/lib/fms/transactions";

/**
 * Reimbursements (§13) — fills a real gap: PRMS's `markExpenseReimbursed`
 * is a bare status flip with no amount, method, date or reference captured
 * anywhere. Recording one here creates the actual payment record, calls
 * PRMS's own real `markExpenseReimbursed()` (reuse, not duplicate — same
 * precedent as Phase 2's vendor-payment wrapper calling PRMS's
 * `recordPayment`), and posts a linked, already-`completed`
 * `fms_transaction` via `postSystemTransaction`.
 */

export const REIMBURSEMENTS_COLLECTION = "fms_reimbursements";
const REIMBURSEMENT_NUMBER_PREFIX = "RMB";

export interface Reimbursement extends AuditFields {
  _id: string;
  reimbursementNumber: string;
  expenseId: string;
  expenseCode: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  method: PaymentMethod;
  transactionReference: string | null;
  paymentDate: Date;
  transactionId: string | null;
  notes: string | null;
}

export interface SerializedReimbursement extends Omit<Reimbursement, "createdAt" | "updatedAt" | "deletedAt" | "paymentDate"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  paymentDate: string;
}

export function serializeReimbursement(r: Reimbursement): SerializedReimbursement {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    paymentDate: r.paymentDate.toISOString().slice(0, 10),
  };
}

let indexesEnsured = false;
async function getCollection() {
  const db = await getDb();
  const collection = db.collection<Reimbursement>(REIMBURSEMENTS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ reimbursementNumber: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ expenseId: 1 }).catch(() => {}),
      collection.createIndex({ employeeId: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function generateReimbursementNumber(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextYearSequence(REIMBURSEMENT_NUMBER_PREFIX, year);
  return formatYearCode(REIMBURSEMENT_NUMBER_PREFIX, year, seq);
}

export async function listReimbursementsForExpense(expenseId: string): Promise<Reimbursement[]> {
  const collection = await getCollection();
  return collection.find({ expenseId, ...notDeleted }).sort({ paymentDate: -1 }).toArray();
}

export async function getReimbursement(id: string): Promise<Reimbursement | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function searchReimbursements(opts: { page?: number; pageSize?: number } = {}) {
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const filter = { ...notDeleted };
  const [items, total] = await Promise.all([
    collection.find(filter).sort({ paymentDate: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
}

export interface RecordReimbursementData {
  expenseId: string;
  amount: number;
  method: PaymentMethod;
  transactionReference: string | null;
  paymentDate: string;
  fundAccountId?: string | null;
  fundAccountType?: FundAccountType | null;
  notes: string | null;
}

export async function recordReimbursement(
  data: RecordReimbursementData,
  actorId: string,
  actorEmail: string | null
): Promise<{ ok: true; reimbursement: Reimbursement } | { ok: false; reason: string }> {
  const expense: Expense | null = await getExpense(data.expenseId);
  if (!expense) return { ok: false, reason: "Expense not found." };
  if (expense.vendorId) return { ok: false, reason: "This is a vendor-billed expense, not a personal claim." };
  if (expense.approvalStatus !== "approved") return { ok: false, reason: "Only approved expenses can be reimbursed." };

  const amount = round2(data.amount);
  if (amount <= 0) return { ok: false, reason: "Enter a reimbursement amount." };

  const existing = await listReimbursementsForExpense(data.expenseId);
  const alreadyPaid = existing.reduce((s, r) => s + r.amount, 0);
  if (amount + alreadyPaid > expense.totalAmount + 0.01) {
    return { ok: false, reason: `Amount exceeds the claim total (already reimbursed: ${alreadyPaid}).` };
  }

  const mark = await markExpenseReimbursed(expense._id, actorId);
  if (!mark.ok) return { ok: false, reason: mark.reason ?? "Could not mark the expense reimbursed." };

  const paymentDate = new Date(`${data.paymentDate}T00:00:00`);
  const txn = await postSystemTransaction(
    {
      type: "expense",
      transactionDate: paymentDate,
      postingDate: paymentDate,
      amount,
      currency: expense.currency,
      paymentMethod: data.method,
      sourceModule: "prms",
      sourceRecordId: expense._id,
      customerId: null,
      vendorId: null,
      employeeId: expense.raisedByUserId,
      projectId: expense.projectId,
      department: expense.departmentName,
      accountId: null,
      fundAccountId: data.fundAccountId ?? null,
      fundAccountType: data.fundAccountType ?? null,
      taxAmount: 0,
      referenceNumber: data.transactionReference,
      description: `Reimbursement for ${expense.expenseCode} to ${expense.raisedByName}`,
      attachments: [],
    },
    actorId,
    actorEmail
  );
  if ("ok" in txn) return txn;

  const collection = await getCollection();
  const doc: Reimbursement = {
    _id: newId(),
    reimbursementNumber: await generateReimbursementNumber(paymentDate.getFullYear()),
    expenseId: expense._id,
    expenseCode: expense.expenseCode,
    employeeId: expense.raisedByUserId,
    employeeName: expense.raisedByName,
    amount,
    method: data.method,
    transactionReference: data.transactionReference,
    paymentDate,
    transactionId: txn._id,
    notes: data.notes,
    ...createStamp(actorId),
  };
  await collection.insertOne(doc);
  return { ok: true, reimbursement: doc };
}
