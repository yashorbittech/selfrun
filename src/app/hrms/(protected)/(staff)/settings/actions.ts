"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManageSettings } from "@/lib/hrms-roles";
import { updateOrgSettings } from "@/lib/hrms/settings";
import { upsertLeaveType, deleteLeaveType } from "@/lib/hrms/leave";
import { updatePayrollConfig } from "@/lib/hrms/payroll-config";
import { updateCompanyDetails } from "@/lib/hrms/company";
import { validateOrgSettings, validateLeaveType, validateCompanyDetails } from "@/lib/hrms/validation-ops";
import { validatePayrollConfig } from "@/lib/hrms/validation-payroll";
import { recordAudit } from "@/lib/hrms/audit";

export interface SettingsActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function requireSettings() {
  const user = await getCurrentHrmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageSettings(user)) throw new Error("Forbidden");
  return user;
}

export async function saveOrgSettingsAction(input: Record<string, unknown>): Promise<SettingsActionResult> {
  const user = await requireSettings();
  const v = validateOrgSettings(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  await updateOrgSettings(v.data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "org_settings",
    entityId: "org",
    entityLabel: "Work schedule",
    summary: `shift ${v.data.shiftStart}–${v.data.shiftEnd}, grace ${v.data.graceMinutes}m`,
  });

  revalidatePath("/hrms/settings");
  revalidatePath("/hrms/attendance");
  return { ok: true };
}

export async function saveLeaveTypeAction(input: Record<string, unknown>, id?: string): Promise<SettingsActionResult> {
  const user = await requireSettings();
  const v = validateLeaveType(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  const result = await upsertLeaveType(v.data, user.id, id);
  if (!result.ok) return { ok: false, error: result.reason };

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? "update" : "create",
    entity: "leave_type",
    entityId: id ?? v.data.code,
    entityLabel: v.data.label,
  });

  revalidatePath("/hrms/settings");
  revalidatePath("/hrms/leave");
  return { ok: true };
}

export async function deleteLeaveTypeAction(id: string): Promise<SettingsActionResult> {
  const user = await requireSettings();
  const result = await deleteLeaveType(id, user.id);
  if (!result.ok) return { ok: false, error: result.reason };

  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "delete", entity: "leave_type", entityId: id });
  revalidatePath("/hrms/settings");
  revalidatePath("/hrms/leave");
  return { ok: true };
}

export async function saveCompanyDetailsAction(input: Record<string, unknown>): Promise<SettingsActionResult> {
  const user = await requireSettings();
  const v = validateCompanyDetails(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  await updateCompanyDetails(v.data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "company",
    entityId: "org",
    entityLabel: "Company details",
    summary: `${v.data.name}${v.data.pan ? ` · PAN ${v.data.pan}` : ""}`,
  });
  revalidatePath("/hrms/settings");
  return { ok: true };
}

export async function savePayrollConfigAction(input: Record<string, unknown>): Promise<SettingsActionResult> {
  const user = await requireSettings();
  const v = validatePayrollConfig(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  await updatePayrollConfig(v.data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "payroll_config",
    entityId: "org",
    entityLabel: "Statutory rates",
    summary: `PF ${v.data.pfEmployeePercent}%, PT ₹${v.data.professionalTaxMonthly}, ESI ≤ ₹${v.data.esiGrossThreshold}`,
  });
  revalidatePath("/hrms/settings");
  revalidatePath("/hrms/payroll");
  return { ok: true };
}
