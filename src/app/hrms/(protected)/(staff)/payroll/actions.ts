"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canRunPayroll } from "@/lib/hrms-roles";
import {
  createRun,
  deleteRun,
  approveRun,
  getRun,
  getPayslip,
  recomputePayslip,
  updatePayslipOverrides,
} from "@/lib/hrms/payroll-run";
import {
  initiatePayout,
  bulkInitiate,
  recordManualResult,
  retryPayout,
  cancelPayout,
  reconcilePayouts,
} from "@/lib/hrms/salary-payouts";
import { validatePayslipOverrides, validateManualPayoutResult } from "@/lib/hrms/validation-payroll";
import { recordAudit } from "@/lib/hrms/audit";

export interface PayrollActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function requirePayroll() {
  const user = await getCurrentHrmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canRunPayroll(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(month?: string) {
  revalidatePath("/hrms/payroll");
  revalidatePath("/hrms/payroll/payouts");
  if (month) revalidatePath(`/hrms/payroll/${month}`);
  revalidatePath("/hrms");
}

export async function createRunAction(month: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: "Pick a valid month." };

  const result = await createRun(month, user.id);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "generate",
    entity: "payroll_run",
    entityId: result.run._id,
    entityLabel: month,
    summary: `${result.run.payslipCount} payslip(s), net ${result.run.totalNet}`,
  });
  revalidate(month);
  return { ok: true, id: result.run._id };
}

export async function deleteRunAction(runId: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const run = await getRun(runId);
  const result = await deleteRun(runId);
  if (!result.ok) return { ok: false, error: result.error };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "delete", entity: "payroll_run", entityId: runId, entityLabel: run?.month });
  revalidate(run?.month);
  return { ok: true };
}

export async function approveRunAction(runId: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const run = await getRun(runId);
  const result = await approveRun(runId, user.id);
  if (!result.ok) return { ok: false, error: result.error };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "approve",
    entity: "payroll_run",
    entityId: runId,
    entityLabel: run?.month,
    summary: "Run approved — salary payouts created",
  });
  revalidate(run?.month);
  return { ok: true };
}

// ---- Payouts --------------------------------------------------------------

function revalidatePayouts(month?: string) {
  revalidate(month);
  revalidatePath("/hrms/attendance");
  revalidatePath("/hrms/leave");
}

export async function initiatePayoutAction(payoutId: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const result = await initiatePayout(payoutId, user);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePayouts();
  return { ok: true };
}

export async function bulkInitiatePayoutsAction(ids: string[]): Promise<PayrollActionResult & { initiated?: number }> {
  const user = await requirePayroll();
  const result = await bulkInitiate(ids, user);
  revalidatePayouts();
  return { ok: true, initiated: result.initiated, error: result.errors[0] };
}

export async function recordPayoutResultAction(payoutId: string, input: Record<string, unknown>): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const v = validateManualPayoutResult(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };
  const result = await recordManualResult(payoutId, v.data, user);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePayouts();
  return { ok: true };
}

export async function retryPayoutAction(payoutId: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const result = await retryPayout(payoutId, user);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePayouts();
  return { ok: true };
}

export async function cancelPayoutAction(payoutId: string): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const result = await cancelPayout(payoutId, user);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePayouts();
  return { ok: true };
}

export async function reconcilePayoutsAction(ids: string[]): Promise<PayrollActionResult & { reconciled?: number }> {
  const user = await requirePayroll();
  const n = await reconcilePayouts(ids, user);
  revalidate();
  return { ok: true, reconciled: n };
}

export async function recomputePayslipAction(payslipId: string): Promise<PayrollActionResult> {
  await requirePayroll();
  const slip = await getPayslip(payslipId);
  const result = await recomputePayslip(payslipId);
  if (!result.ok) return { ok: false, error: result.error };
  revalidate(slip?.month);
  return { ok: true };
}

export async function savePayslipOverridesAction(payslipId: string, input: Record<string, unknown>): Promise<PayrollActionResult> {
  const user = await requirePayroll();
  const slip = await getPayslip(payslipId);
  if (!slip) return { ok: false, error: "Payslip not found." };

  const v = validatePayslipOverrides(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  const result = await updatePayslipOverrides(payslipId, v.data);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "payslip",
    entityId: payslipId,
    entityLabel: `${slip.employeeName} · ${slip.month}`,
    summary: `arrears ${v.data.arrears}, other ${v.data.otherDeductions}${v.data.manualTds != null ? `, TDS ${v.data.manualTds}` : ""}`,
  });
  revalidate(slip.month);
  return { ok: true };
}
