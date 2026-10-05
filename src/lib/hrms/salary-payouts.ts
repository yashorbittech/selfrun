import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, updateStamp, notDeleted, type AuditFields } from "@/lib/hrms/db";
import { escapeRegExp } from "@/lib/text-search";
import { recordAudit } from "@/lib/hrms/audit";
import {
  getPrimaryBankAccount,
  getBankAccount,
  bankAccountForPayout,
  cacheProviderIds,
} from "@/lib/hrms/bank-accounts";
import { getPayoutProvider } from "@/lib/hrms/payout-provider";
import { canPayoutTransition, type PayoutStatus } from "@/lib/hrms/payout-status";
import { EMPLOYEES_COLLECTION, type Employee } from "@/lib/hrms/employees";
import type { PayrollRun, Payslip } from "@/lib/hrms/payroll-run";

export const SALARY_PAYOUTS_COLLECTION = "hrms_salary_payouts";
const PAYROLL_RUNS_COLLECTION = "hrms_payroll_runs";

export interface SalaryPayout extends AuditFields {
  _id: string;
  runId: string;
  payslipId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  month: string;
  grossSalary: number;
  totalDeductions: number;
  netPayable: number;
  paymentAmount: number;
  bankAccountId: string | null;
  bankAccountLast4: string | null;
  bankName: string | null;
  ifsc: string | null;
  status: PayoutStatus;
  paymentProvider: "manual" | "razorpay";
  providerPayoutId: string | null;
  utr: string | null;
  initiatedBy: string | null;
  initiatedAt: Date | null;
  processedAt: Date | null;
  paidAt: Date | null;
  failureReason: string | null;
  remarks: string | null;
  reconciledAt: Date | null;
  reconciledBy: string | null;
}

export interface SerializedPayout
  extends Omit<SalaryPayout, "createdAt" | "updatedAt" | "deletedAt" | "initiatedAt" | "processedAt" | "paidAt" | "reconciledAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  initiatedAt: string | null;
  processedAt: string | null;
  paidAt: string | null;
  reconciledAt: string | null;
  bankAccountMasked: string;
}

let indexesEnsured = false;

async function getCollection() {
  const db = await getDb();
  const collection = db.collection<SalaryPayout>(SALARY_PAYOUTS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ runId: 1 }).catch(() => {}),
      collection.createIndex({ employeeId: 1, month: 1 }).catch(() => {}),
      collection.createIndex({ status: 1 }).catch(() => {}),
      collection.createIndex({ providerPayoutId: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export function serializePayout(p: SalaryPayout): SerializedPayout {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    initiatedAt: p.initiatedAt ? p.initiatedAt.toISOString() : null,
    processedAt: p.processedAt ? p.processedAt.toISOString() : null,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    reconciledAt: p.reconciledAt ? p.reconciledAt.toISOString() : null,
    bankAccountMasked: p.bankAccountLast4 ? `XXXXXX${p.bankAccountLast4}` : "—",
  };
}

// ---------------------------------------------------------------------------
// Creation (from approveRun)
// ---------------------------------------------------------------------------

export async function createPayoutsForRun(run: PayrollRun, payslips: Payslip[], actorId: string): Promise<void> {
  const collection = await getCollection();
  const provider = await getPayoutProvider();
  for (const slip of payslips) {
    const exists = await collection.findOne({ payslipId: slip._id });
    if (exists) continue;
    const account = await getPrimaryBankAccount(slip.employeeId);
    await collection.insertOne({
      _id: newId(),
      runId: run._id,
      payslipId: slip._id,
      employeeId: slip.employeeId,
      employeeCode: slip.employeeCode,
      employeeName: slip.employeeName,
      month: run.month,
      grossSalary: slip.grossPay,
      totalDeductions: slip.totalDeductions,
      netPayable: slip.netPay,
      paymentAmount: slip.netPay,
      bankAccountId: account?._id ?? null,
      bankAccountLast4: account?.accountNumberLast4 ?? null,
      bankName: account?.bankName ?? null,
      ifsc: account?.ifsc ?? null,
      status: "pending",
      paymentProvider: provider.key,
      providerPayoutId: null,
      utr: null,
      initiatedBy: null,
      initiatedAt: null,
      processedAt: null,
      paidAt: null,
      failureReason: null,
      remarks: null,
      reconciledAt: null,
      reconciledBy: null,
      ...createStamp(actorId),
    });
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getPayout(id: string): Promise<SalaryPayout | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function getPayoutForPayslip(payslipId: string): Promise<SalaryPayout | null> {
  const collection = await getCollection();
  return collection.findOne({ payslipId, ...notDeleted });
}

export async function payoutsForRun(runId: string): Promise<SalaryPayout[]> {
  const collection = await getCollection();
  return collection.find({ runId, ...notDeleted }).sort({ employeeName: 1 }).toArray();
}

export async function payoutsForEmployee(employeeId: string): Promise<SalaryPayout[]> {
  const collection = await getCollection();
  return collection.find({ employeeId, ...notDeleted }).sort({ month: -1 }).toArray();
}

export interface PayoutSearch {
  month?: string;
  status?: PayoutStatus;
  departmentId?: string;
  employeeId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function searchPayouts(opts: PayoutSearch = {}) {
  const db = await getDb();
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);

  const filter: Record<string, unknown> = { ...notDeleted };
  if (opts.month) filter.month = opts.month;
  if (opts.status) filter.status = opts.status;
  if (opts.employeeId) filter.employeeId = opts.employeeId;
  if (opts.q?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.q.trim()), "i");
    filter.$or = [{ employeeName: rx }, { employeeCode: rx }, { utr: rx }];
  }
  if (opts.departmentId) {
    const ids = await db
      .collection<Employee>(EMPLOYEES_COLLECTION)
      .find({ "professional.departmentId": opts.departmentId, ...notDeleted }, { projection: { _id: 1 } })
      .toArray();
    filter.employeeId = { $in: ids.map((e) => e._id) };
  }

  const [rows, total, statusAgg] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
    collection.aggregate<{ _id: string; count: number; amount: number }>([
      { $match: { ...notDeleted, ...(opts.month ? { month: opts.month } : {}) } },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$paymentAmount" } } },
    ]).toArray(),
  ]);

  return {
    items: rows.map(serializePayout),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    byStatus: Object.fromEntries(statusAgg.map((s) => [s._id, { count: s.count, amount: s.amount }])),
  };
}

export async function distinctPayoutMonths(): Promise<string[]> {
  const collection = await getCollection();
  const months = await collection.distinct("month", notDeleted);
  return (months as string[]).sort((a, b) => b.localeCompare(a));
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

async function recomputeRunPaidState(runId: string): Promise<void> {
  const db = await getDb();
  const collection = await getCollection();
  const payouts = await collection.find({ runId, ...notDeleted }).toArray();
  const relevant = payouts.filter((p) => p.status !== "cancelled");
  if (relevant.length === 0) return;
  const allPaid = relevant.every((p) => p.status === "paid");

  const runs = db.collection<PayrollRun>(PAYROLL_RUNS_COLLECTION);
  const run = await runs.findOne({ _id: runId });
  if (!run) return;
  if (allPaid && run.status !== "paid") {
    await runs.updateOne({ _id: runId }, { $set: { status: "paid", paidBy: "system", paidAt: new Date() } });
  } else if (!allPaid && run.status === "paid") {
    await runs.updateOne({ _id: runId }, { $set: { status: "approved", paidBy: null, paidAt: null } });
  }
}

export async function initiatePayout(
  id: string,
  actor: { id: string; email: string }
): Promise<{ ok: boolean; error?: string }> {
  const collection = await getCollection();
  const payout = await collection.findOne({ _id: id, ...notDeleted });
  if (!payout) return { ok: false, error: "Payout not found." };
  if (!canPayoutTransition(payout.status, "initiated")) return { ok: false, error: `Can't initiate a payout that is ${payout.status}.` };
  if (!payout.bankAccountId) return { ok: false, error: "No bank account on file for this employee." };

  const provider = await getPayoutProvider();
  const now = new Date();

  if (provider.key === "manual") {
    await collection.updateOne(
      { _id: id },
      { $set: { status: "initiated", paymentProvider: "manual", initiatedBy: actor.id, initiatedAt: now, failureReason: null, ...updateStamp(actor.id) } }
    );
    await recordAudit({ actorId: actor.id, actorEmail: actor.email, action: "initiate", entity: "salary_payout", entityId: id, entityLabel: `${payout.employeeName} · ${payout.month}` });
    return { ok: true };
  }

  // Provider path (RazorpayX).
  try {
    const account = await getBankAccount(payout.bankAccountId);
    const full = await bankAccountForPayout(payout.bankAccountId);
    if (!account || !full) return { ok: false, error: "Could not read the employee's bank account." };

    // Cached beneficiary ids belong to the RazorpayX account that created them;
    // after the company switches accounts they're re-created on the new one.
    // Ids cached before accounts were tracked came from the owner's env account.
    const cachedRef = account.providerAccountRef ?? null;
    const cacheMatches = cachedRef !== null ? cachedRef === provider.accountRef : provider.usesPlatformEnv;
    let fundAccountId = cacheMatches ? account.providerFundAccountId : null;
    if (!fundAccountId) {
      const emp = await (await getDb()).collection<Employee>(EMPLOYEES_COLLECTION).findOne({ _id: payout.employeeId });
      const bene = await provider.ensureBeneficiary({
        contactName: payout.employeeName,
        contactEmail: emp?.workEmail ?? "",
        contactReference: payout.employeeId,
        accountHolderName: full.holder || payout.employeeName,
        accountNumber: full.accountNumber,
        ifsc: full.ifsc,
      });
      await cacheProviderIds(payout.bankAccountId, bene.providerContactId, bene.providerFundAccountId, provider.accountRef);
      fundAccountId = bene.providerFundAccountId;
    }

    const result = await provider.createPayout({
      payoutId: payout._id,
      amountPaise: Math.round(payout.paymentAmount * 100),
      fundAccountId,
      referenceId: `SAL-${payout.month}-${payout.employeeCode}`,
      narration: `Salary ${payout.month}`,
    });

    await collection.updateOne(
      { _id: id },
      {
        $set: {
          status: result.status === "paid" ? "paid" : "processing",
          paymentProvider: "razorpay",
          providerPayoutId: result.providerPayoutId,
          initiatedBy: actor.id,
          initiatedAt: now,
          processedAt: now,
          paidAt: result.status === "paid" ? now : null,
          failureReason: null,
          ...updateStamp(actor.id),
        },
      }
    );
    await recordAudit({ actorId: actor.id, actorEmail: actor.email, action: "initiate", entity: "salary_payout", entityId: id, summary: `RazorpayX ${result.providerPayoutId}` });
    if (result.status === "paid") await recomputeRunPaidState(payout.runId);
    return { ok: true };
  } catch (err) {
    // Never corrupt payout state — leave it as-is and surface the error.
    return { ok: false, error: err instanceof Error ? err.message : "Payout provider call failed." };
  }
}

export async function bulkInitiate(ids: string[], actor: { id: string; email: string }): Promise<{ initiated: number; errors: string[] }> {
  let initiated = 0;
  const errors: string[] = [];
  for (const id of ids) {
    const r = await initiatePayout(id, actor);
    if (r.ok) initiated += 1;
    else if (r.error) errors.push(r.error);
  }
  return { initiated, errors };
}

export interface ManualResult {
  status: "paid" | "failed";
  utr: string | null;
  failureReason: string | null;
  remarks: string | null;
}

export async function recordManualResult(
  id: string,
  result: ManualResult,
  actor: { id: string; email: string }
): Promise<{ ok: boolean; error?: string }> {
  const collection = await getCollection();
  const payout = await collection.findOne({ _id: id, ...notDeleted });
  if (!payout) return { ok: false, error: "Payout not found." };
  if (!canPayoutTransition(payout.status, result.status)) {
    return { ok: false, error: `Can't move a payout from ${payout.status} to ${result.status}.` };
  }
  const now = new Date();
  await collection.updateOne(
    { _id: id },
    {
      $set: {
        status: result.status,
        utr: result.status === "paid" ? result.utr : payout.utr,
        paidAt: result.status === "paid" ? now : null,
        processedAt: now,
        failureReason: result.status === "failed" ? result.failureReason : null,
        remarks: result.remarks ?? payout.remarks,
        ...updateStamp(actor.id),
      },
    }
  );
  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: result.status === "paid" ? "pay" : "reject",
    entity: "salary_payout",
    entityId: id,
    entityLabel: `${payout.employeeName} · ${payout.month}`,
    summary: result.status === "paid" ? `UTR ${result.utr}` : `Failed: ${result.failureReason}`,
  });
  await recomputeRunPaidState(payout.runId);
  return { ok: true };
}

export async function retryPayout(id: string, actor: { id: string; email: string }): Promise<{ ok: boolean; error?: string }> {
  const collection = await getCollection();
  const payout = await collection.findOne({ _id: id, ...notDeleted });
  if (!payout) return { ok: false, error: "Payout not found." };
  if (payout.status !== "failed") return { ok: false, error: "Only a failed payout can be retried." };
  await collection.updateOne({ _id: id }, { $set: { status: "pending", failureReason: null, providerPayoutId: null, ...updateStamp(actor.id) } });
  return initiatePayout(id, actor);
}

export async function cancelPayout(id: string, actor: { id: string; email: string }): Promise<{ ok: boolean; error?: string }> {
  const collection = await getCollection();
  const payout = await collection.findOne({ _id: id, ...notDeleted });
  if (!payout) return { ok: false, error: "Payout not found." };
  if (!canPayoutTransition(payout.status, "cancelled")) return { ok: false, error: `Can't cancel a payout that is ${payout.status}.` };
  await collection.updateOne({ _id: id }, { $set: { status: "cancelled", ...updateStamp(actor.id) } });
  await recordAudit({ actorId: actor.id, actorEmail: actor.email, action: "cancel", entity: "salary_payout", entityId: id });
  await recomputeRunPaidState(payout.runId);
  return { ok: true };
}

export async function reconcilePayouts(ids: string[], actor: { id: string; email: string }): Promise<number> {
  const collection = await getCollection();
  const res = await collection.updateMany(
    { _id: { $in: ids }, status: "paid", reconciledAt: null },
    { $set: { reconciledAt: new Date(), reconciledBy: actor.id, ...updateStamp(actor.id) } }
  );
  if (res.modifiedCount > 0) {
    await recordAudit({ actorId: actor.id, actorEmail: actor.email, action: "reconcile", entity: "salary_payout", entityId: ids[0] ?? "batch", summary: `${res.modifiedCount} payout(s) reconciled` });
  }
  return res.modifiedCount;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export async function applyWebhookResult(result: { providerPayoutId: string; status: "paid" | "failed" | "reversed"; utr?: string; failureReason?: string }): Promise<void> {
  const collection = await getCollection();
  const payout = await collection.findOne({ providerPayoutId: result.providerPayoutId });
  if (!payout) return;

  const now = new Date();
  if (result.status === "paid" && payout.status !== "paid") {
    await collection.updateOne({ _id: payout._id }, { $set: { status: "paid", utr: result.utr ?? payout.utr, paidAt: now, processedAt: now, updatedAt: now } });
    await recomputeRunPaidState(payout.runId);
  } else if ((result.status === "failed" || result.status === "reversed") && payout.status !== "failed") {
    await collection.updateOne(
      { _id: payout._id },
      { $set: { status: "failed", failureReason: result.failureReason ?? `Payout ${result.status}`, updatedAt: now } }
    );
    await recomputeRunPaidState(payout.runId);
  }
}
