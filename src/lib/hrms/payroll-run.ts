import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, notDeleted } from "@/lib/hrms/db";
import { getOrgSettings, classifyDay } from "@/lib/hrms/settings";
import { monthBounds, eachDateString } from "@/lib/hrms/time";
import { holidaySetInRange } from "@/lib/hrms/holidays";
import {
  EMPLOYEES_COLLECTION,
  employeeFullName,
  descendantEmployeeIds,
  type Employee,
} from "@/lib/hrms/employees";
import { ACTIVE_EMPLOYEE_STATUSES } from "@/lib/hrms/employee-status";
import { ATTENDANCE_COLLECTION } from "@/lib/hrms/attendance";
import { effectiveStructure, structureGross } from "@/lib/hrms/salary-revisions";
import { getPayrollConfig, monthsRemainingInFY, fyStartMonthString } from "@/lib/hrms/payroll-config";
import { monthlyTds } from "@/lib/hrms/payroll-tax";
import { LEAVE_REQUESTS_COLLECTION, LEAVE_TYPES_COLLECTION } from "@/lib/hrms/leave";

export const PAYROLL_RUNS_COLLECTION = "hrms_payroll_runs";
export const PAYSLIPS_COLLECTION = "hrms_payslips";

export type PayrollRunStatus = "draft" | "approved" | "paid";

export interface PayrollRun {
  _id: string;
  month: string; // "yyyy-mm"
  status: PayrollRunStatus;
  payslipCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerCost: number;
  generatedBy: string;
  generatedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  paidBy: string | null;
  paidAt: Date | null;
}

export interface PayComponentLine {
  name: string;
  amount: number;
}

export interface Payslip {
  _id: string;
  runId: string;
  month: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  workingDays: number;
  lopDays: number;
  lopAmount: number;
  earnings: PayComponentLine[];
  grossPay: number;
  deductions: PayComponentLine[];
  totalDeductions: number;
  employerContributions: PayComponentLine[];
  employerCost: number;
  netPay: number;
  overrides: { arrears: number; manualTds: number | null; otherDeductions: number };
  /** Snapshot of the employee's primary bank account at generation. */
  bankAccountId: string | null;
  bankAccountLast4: string | null;
  bankName: string | null;
  ifsc: string | null;
  updatedAt: Date;
}

export interface SerializedPayrollRun extends Omit<PayrollRun, "generatedAt" | "approvedAt" | "paidAt"> {
  generatedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
}
export interface SerializedPayslip extends Omit<Payslip, "updatedAt"> {
  updatedAt: string;
}

let indexesEnsured = false;
async function collections() {
  const db = await getDb();
  const runs = db.collection<PayrollRun>(PAYROLL_RUNS_COLLECTION);
  const payslips = db.collection<Payslip>(PAYSLIPS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      runs.createIndex({ month: 1 }, { unique: true }).catch(() => {}),
      payslips.createIndex({ runId: 1 }).catch(() => {}),
      payslips.createIndex({ employeeId: 1, month: 1 }).catch(() => {}),
    ]);
  }
  return { db, runs, payslips };
}

export function serializeRun(r: PayrollRun): SerializedPayrollRun {
  return {
    ...r,
    generatedAt: r.generatedAt.toISOString(),
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
  };
}
export function serializePayslip(p: Payslip): SerializedPayslip {
  return { ...p, updatedAt: p.updatedAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Period locking — a "paid" run freezes that month's attendance & leave.
// ---------------------------------------------------------------------------

export async function isMonthLocked(month: string): Promise<boolean> {
  const { runs } = await collections();
  const run = await runs.findOne({ month, status: "paid" });
  return run !== null;
}

// ---------------------------------------------------------------------------
// Loss of pay
// ---------------------------------------------------------------------------

/** Working days in `month` after weekly-offs and holidays. */
async function workingDaysInMonth(month: string): Promise<number> {
  const { from, to } = monthBounds(month);
  const [settings, holidaySet] = await Promise.all([getOrgSettings(), holidaySetInRange(from, to)]);
  return eachDateString(from, to).filter((d) => classifyDay(d, settings, holidaySet) === "working").length;
}

/** Unpaid-leave days + unmarked/absent working days for an employee that month. */
async function lopDaysForEmployee(employeeId: string, month: string, workingDays: number): Promise<number> {
  const { db } = await collections();
  const { from, to } = monthBounds(month);
  const attendance = db.collection<{ _id: string; date: string; status: string; leaveRequestId: string | null }>(ATTENDANCE_COLLECTION);
  const leaveRequests = db.collection<{ _id: string }>(LEAVE_REQUESTS_COLLECTION);
  const leaveTypes = db.collection<{ _id: string; code: string; paid: boolean }>(LEAVE_TYPES_COLLECTION);

  const [rows, unpaidTypeRows] = await Promise.all([
    attendance.find({ employeeId, date: { $gte: from, $lte: to } }).toArray(),
    leaveTypes.find({ paid: false }).toArray(),
  ]);
  const unpaidCodes = new Set(unpaidTypeRows.map((t) => t.code));

  const byDate = new Map(rows.map((r) => [r.date, r]));

  let markedWorking = 0;
  let absent = 0;
  let unpaidLeave = 0;

  const settings = await getOrgSettings();
  const holidaySet = await holidaySetInRange(from, to);

  // Which leave-request ids are unpaid (for the on_leave rows).
  const approvedUnpaid = await leaveRequests
    .find({ employeeId, status: "approved", leaveTypeCode: { $in: Array.from(unpaidCodes) }, startDate: { $lte: to }, endDate: { $gte: from } } as Record<string, unknown>)
    .toArray();
  const unpaidRequestIds = new Set(approvedUnpaid.map((r) => r._id));

  for (const date of eachDateString(from, to)) {
    if (classifyDay(date, settings, holidaySet) !== "working") continue;
    const rec = byDate.get(date);
    const status = rec?.status;
    if (status === "present" || status === "half_day") {
      markedWorking += status === "half_day" ? 0.5 : 1;
    } else if (status === "on_leave") {
      const reqId = rec?.leaveRequestId ?? null;
      if (reqId && unpaidRequestIds.has(reqId)) unpaidLeave += 1;
      markedWorking += 1; // paid leave still counts as "not absent"
    } else if (status === "absent") {
      absent += 1;
    } else {
      // Unmarked working day.
      absent += 1;
    }
  }
  void markedWorking;
  void workingDays;
  return Math.min(workingDays, absent + unpaidLeave);
}

// ---------------------------------------------------------------------------
// Payslip computation
// ---------------------------------------------------------------------------

async function computePayslipFor(
  employee: Employee,
  month: string,
  workingDays: number,
  overrides: { arrears: number; manualTds: number | null; otherDeductions: number }
): Promise<Payslip | null> {
  const { to } = monthBounds(month);
  const { getPrimaryBankAccount } = await import("@/lib/hrms/bank-accounts");
  const [structure, config, bankAccount] = await Promise.all([
    effectiveStructure(employee._id, to),
    getPayrollConfig(),
    getPrimaryBankAccount(employee._id),
  ]);
  if (!structure) return null;

  const gross = structureGross(structure);
  const lopDays = await lopDaysForEmployee(employee._id, month, workingDays);
  const perDay = workingDays > 0 ? gross / workingDays : 0;
  const lopAmount = Math.round(perDay * lopDays);

  const earnings: PayComponentLine[] = [
    { name: "Basic", amount: structure.basic },
    { name: "HRA", amount: structure.hra },
    ...structure.allowances.map((a) => ({ name: a.name, amount: a.amount })),
  ];
  if (overrides.arrears > 0) earnings.push({ name: "Arrears", amount: overrides.arrears });
  const grossPay = earnings.reduce((s, e) => s + e.amount, 0);

  // Statutory
  const pfBase = config.pfWageCeiling > 0 ? Math.min(structure.basic, config.pfWageCeiling) : structure.basic;
  const pfEmployee = Math.round((pfBase * config.pfEmployeePercent) / 100);
  const pfEmployerTotal = Math.round((pfBase * config.pfEmployerPercent) / 100);
  const eps = Math.round((pfBase * config.epsPercent) / 100);
  const epf = Math.max(0, pfEmployerTotal - eps);

  const esiApplies = grossPay <= config.esiGrossThreshold;
  const esiEmployee = esiApplies ? Math.round((grossPay * config.esiEmployeePercent) / 100) : 0;
  const esiEmployer = esiApplies ? Math.round((grossPay * config.esiEmployerPercent) / 100) : 0;

  const pt = grossPay > 0 ? config.professionalTaxMonthly : 0;

  // TDS (new regime auto, or manual override)
  let tds = 0;
  if (config.tdsRegime === "new" || overrides.manualTds != null) {
    const { runs, payslips } = await collections();
    const fyStart = fyStartMonthString(month, config.financialYearStartMonth);
    const priorSlips = await payslips
      .find({ employeeId: employee._id, month: { $gte: fyStart, $lt: month } })
      .toArray();
    // Only count TDS from runs that still exist and aren't cancelled — cheap approximation: all.
    const tdsYtd = priorSlips.reduce((s, sl) => {
      const d = (sl.deductions ?? []).find((x) => x.name === "TDS");
      return s + (d?.amount ?? 0);
    }, 0);
    void runs;
    const projectedAnnualGross = grossPay * 12;
    tds = monthlyTds(projectedAnnualGross, tdsYtd, monthsRemainingInFY(month, config.financialYearStartMonth), overrides.manualTds);
  }

  const structureDeductions = structure.deductions.map((d) => ({ name: d.name, amount: d.amount }));
  const deductions: PayComponentLine[] = [
    { name: "Provident Fund", amount: pfEmployee },
    ...(esiEmployee > 0 ? [{ name: "ESI", amount: esiEmployee }] : []),
    ...(pt > 0 ? [{ name: "Professional Tax", amount: pt }] : []),
    ...(tds > 0 ? [{ name: "TDS", amount: tds }] : []),
    ...structureDeductions,
    ...(lopAmount > 0 ? [{ name: "Loss of Pay", amount: lopAmount }] : []),
    ...(overrides.otherDeductions > 0 ? [{ name: "Other Deductions", amount: overrides.otherDeductions }] : []),
  ];
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

  const employerContributions: PayComponentLine[] = [
    { name: "Employer PF", amount: epf },
    { name: "Employer EPS", amount: eps },
    ...(esiEmployer > 0 ? [{ name: "Employer ESI", amount: esiEmployer }] : []),
  ];
  const employerCost = grossPay + employerContributions.reduce((s, c) => s + c.amount, 0);

  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    _id: newId(),
    runId: "", // set by caller
    month,
    employeeId: employee._id,
    employeeCode: employee.employeeCode,
    employeeName: employeeFullName(employee),
    workingDays,
    lopDays,
    lopAmount,
    earnings,
    grossPay,
    deductions,
    totalDeductions,
    employerContributions,
    employerCost,
    netPay,
    overrides,
    bankAccountId: bankAccount?._id ?? null,
    bankAccountLast4: bankAccount?.accountNumberLast4 ?? null,
    bankName: bankAccount?.bankName ?? null,
    ifsc: bankAccount?.ifsc ?? null,
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------

export async function getRunByMonth(month: string): Promise<PayrollRun | null> {
  const { runs } = await collections();
  return runs.findOne({ month });
}
export async function getRun(id: string): Promise<PayrollRun | null> {
  const { runs } = await collections();
  return runs.findOne({ _id: id });
}
export async function listRuns(): Promise<PayrollRun[]> {
  const { runs } = await collections();
  return runs.find({}).sort({ month: -1 }).toArray();
}
export async function getPayslipsForRun(runId: string): Promise<Payslip[]> {
  const { payslips } = await collections();
  return payslips.find({ runId }).sort({ employeeName: 1 }).toArray();
}
export async function getPayslip(id: string): Promise<Payslip | null> {
  const { payslips } = await collections();
  return payslips.findOne({ _id: id });
}

/** Payslips visible to the employee — from approved or paid runs only. */
export async function payslipsForEmployee(employeeId: string): Promise<{ payslip: Payslip; run: PayrollRun }[]> {
  const { payslips, runs } = await collections();
  const visibleRuns = await runs.find({ status: { $in: ["approved", "paid"] } }).toArray();
  const runById = new Map(visibleRuns.map((r) => [r._id, r]));
  const slips = await payslips.find({ employeeId, runId: { $in: visibleRuns.map((r) => r._id) } }).sort({ month: -1 }).toArray();
  return slips.map((s) => ({ payslip: s, run: runById.get(s.runId)! }));
}

function rollupTotals(slips: Payslip[]) {
  return {
    payslipCount: slips.length,
    totalGross: slips.reduce((s, p) => s + p.grossPay, 0),
    totalDeductions: slips.reduce((s, p) => s + p.totalDeductions, 0),
    totalNet: slips.reduce((s, p) => s + p.netPay, 0),
    totalEmployerCost: slips.reduce((s, p) => s + p.employerCost, 0),
  };
}

export async function createRun(
  month: string,
  actorId: string,
  opts: { restrictToManagerId?: string } = {}
): Promise<{ ok: true; run: PayrollRun } | { ok: false; error: string }> {
  const { db, runs, payslips } = await collections();
  const existing = await runs.findOne({ month });
  if (existing) return { ok: false, error: `A payroll run for ${month} already exists.` };

  const workingDays = await workingDaysInMonth(month);
  const { to } = monthBounds(month);

  const empFilter: Record<string, unknown> = { status: { $in: ACTIVE_EMPLOYEE_STATUSES }, ...notDeleted };
  if (opts.restrictToManagerId) {
    empFilter._id = { $in: await descendantEmployeeIds(opts.restrictToManagerId) };
  }
  const employees = await db.collection<Employee>(EMPLOYEES_COLLECTION).find(empFilter).sort({ firstName: 1 }).toArray();

  const runId = newId();
  const slips: Payslip[] = [];
  for (const emp of employees) {
    // Skip employees relieved before this month began, or joined after it ended.
    if (emp.professional?.relievingDate && emp.professional.relievingDate < month.concat("-01")) continue;
    if (emp.professional?.joiningDate && emp.professional.joiningDate > to) continue;
    const slip = await computePayslipFor(emp, month, workingDays, { arrears: 0, manualTds: null, otherDeductions: 0 });
    if (slip) {
      slip.runId = runId;
      slips.push(slip);
    }
  }
  if (slips.length === 0) return { ok: false, error: "No employees have a salary structure for this month." };

  const run: PayrollRun = {
    _id: runId,
    month,
    status: "draft",
    ...rollupTotals(slips),
    generatedBy: actorId,
    generatedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    paidBy: null,
    paidAt: null,
  };
  await runs.insertOne(run);
  await payslips.insertMany(slips);
  return { ok: true, run };
}

async function refreshRunTotals(runId: string): Promise<void> {
  const { runs, payslips } = await collections();
  const slips = await payslips.find({ runId }).toArray();
  await runs.updateOne({ _id: runId }, { $set: rollupTotals(slips) });
}

export async function recomputePayslip(payslipId: string): Promise<{ ok: boolean; error?: string }> {
  const { db, runs, payslips } = await collections();
  const slip = await payslips.findOne({ _id: payslipId });
  if (!slip) return { ok: false, error: "Payslip not found." };
  const run = await runs.findOne({ _id: slip.runId });
  if (!run || run.status !== "draft") return { ok: false, error: "Only draft runs can be recomputed." };

  const emp = await db.collection<Employee>(EMPLOYEES_COLLECTION).findOne({ _id: slip.employeeId });
  if (!emp) return { ok: false, error: "Employee not found." };

  const fresh = await computePayslipFor(emp, slip.month, slip.workingDays, slip.overrides);
  if (!fresh) return { ok: false, error: "No salary structure for this employee." };

  await payslips.updateOne(
    { _id: payslipId },
    { $set: { ...fresh, _id: payslipId, runId: slip.runId } }
  );
  await refreshRunTotals(slip.runId);
  return { ok: true };
}

export async function updatePayslipOverrides(
  payslipId: string,
  overrides: { arrears: number; manualTds: number | null; otherDeductions: number }
): Promise<{ ok: boolean; error?: string }> {
  const { payslips, runs } = await collections();
  const slip = await payslips.findOne({ _id: payslipId });
  if (!slip) return { ok: false, error: "Payslip not found." };
  const run = await runs.findOne({ _id: slip.runId });
  if (!run || run.status !== "draft") return { ok: false, error: "Only draft runs can be edited." };
  await payslips.updateOne({ _id: payslipId }, { $set: { overrides } });
  return recomputePayslip(payslipId);
}

export async function approveRun(runId: string, actorId: string): Promise<{ ok: boolean; error?: string }> {
  const { runs, payslips } = await collections();
  const run = await runs.findOne({ _id: runId });
  if (!run) return { ok: false, error: "Run not found." };
  if (run.status !== "draft") return { ok: false, error: `Run is already ${run.status}.` };
  await runs.updateOne({ _id: runId }, { $set: { status: "approved", approvedBy: actorId, approvedAt: new Date() } });
  const approvedRun = { ...run, status: "approved" as const };

  const slips = await payslips.find({ runId }).toArray();

  // Create one salary payout per payslip (status: pending).
  const { createPayoutsForRun } = await import("@/lib/hrms/salary-payouts");
  await createPayoutsForRun(approvedRun, slips, actorId);

  const { notifyEmployee } = await import("@/lib/hrms/notifications");
  for (const s of slips) {
    await notifyEmployee(s.employeeId, {
      type: "payslip_published",
      title: `Your ${run.month} payslip is ready`,
      body: `Net pay ${Math.round(s.netPay).toLocaleString("en-IN")}`,
      link: `/hrms/me/salary/${run.month}`,
      entityType: "payslip",
      entityId: s._id,
    });
  }
  return { ok: true };
}

export async function deleteRun(runId: string): Promise<{ ok: boolean; error?: string }> {
  const { db, runs, payslips } = await collections();
  const run = await runs.findOne({ _id: runId });
  if (!run) return { ok: false, error: "Run not found." };
  if (run.status === "paid") return { ok: false, error: "A paid run cannot be deleted." };

  const inFlight = await db
    .collection("hrms_salary_payouts")
    .countDocuments({ runId, status: { $in: ["initiated", "processing", "paid"] } });
  if (inFlight > 0) return { ok: false, error: "This run has payouts that are initiated or paid. Delete is blocked." };

  await db.collection("hrms_salary_payouts").deleteMany({ runId });
  await payslips.deleteMany({ runId });
  await runs.deleteOne({ _id: runId });
  return { ok: true };
}
