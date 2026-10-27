"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManagePayrollConfig, canRunPayroll } from "@/lib/hrms-roles";
import { recordAudit } from "@/lib/products/talentos/audit";
import { setSalaryAccount } from "@/lib/products/talentos/payroll-config";
import { addCompanyAccount, payingAccounts, recordTopUp, validateAccount } from "@/lib/products/talentos/payroll-bank";

export interface BankResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
}

async function requirePayroll() {
  const user = await getCurrentHrmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canRunPayroll(user) && !canManagePayrollConfig(user)) throw new Error("Forbidden");
  return user;
}

function refresh() {
  revalidatePath("/talentos/payroll");
  revalidatePath("/talentos/payroll/bank");
  revalidatePath("/talentos/payroll/compliance");
  revalidatePath("/talentos/payroll/payouts");
}

export async function addAccountAction(input: Record<string, unknown>): Promise<BankResult> {
  const user = await requirePayroll();
  const v = validateAccount(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };
  const r = await addCompanyAccount(v.data, user.id);
  if (!r.ok) return { ok: false, error: r.error };
  // The first account becomes the one salaries are paid from.
  if ((await payingAccounts()).length === 1) await setSalaryAccount(r.id, user.id);
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "create", entity: "payroll_config", entityId: r.id, entityLabel: `Company account ${v.data.accountName}`, summary: `${v.data.bankName} ••${v.data.accountNumber.slice(-4)}` });
  refresh();
  return { ok: true };
}

export async function setSalaryAccountAction(accountId: string): Promise<BankResult> {
  const user = await requirePayroll();
  if (!(await payingAccounts()).some((a) => a._id === accountId)) return { ok: false, error: "That account is not available." };
  await setSalaryAccount(accountId, user.id);
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "update", entity: "payroll_config", entityId: accountId, entityLabel: "Salary account", summary: "Salaries are paid from this account" });
  refresh();
  return { ok: true };
}

export async function topUpAction(input: Record<string, unknown>): Promise<BankResult> {
  const user = await requirePayroll();
  const amount = Number(String(input.amount ?? "").replace(/[, ]/g, ""));
  const r = await recordTopUp({ fromAccountId: String(input.fromAccountId ?? ""), amount, date: String(input.date ?? ""), reference: String(input.reference ?? "").trim().slice(0, 60) || null }, { id: user.id, email: user.email });
  if (!r.ok) return { ok: false, error: r.error };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "create", entity: "payroll_config", entityId: String(input.fromAccountId ?? ""), entityLabel: "RazorpayX top-up", summary: `₹${amount} on ${String(input.date)}` });
  refresh();
  return { ok: true, message: "Recorded. Your RazorpayX balance in the books has gone up by that amount." };
}
