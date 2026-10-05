"use server";

import { revalidatePath } from "next/cache";
import { requirePortalEmployee } from "@/lib/hrms/portal-guard";
import { clockIn, clockOut } from "@/lib/hrms/self-service";
import { isMonthLocked } from "@/lib/hrms/payroll-run";
import { nowInOrgTz } from "@/lib/hrms/time";
import { getOrgSettings } from "@/lib/hrms/settings";
import { recordAudit } from "@/lib/hrms/audit";

export interface ClockResult {
  ok: boolean;
  time?: string;
  error?: string;
}

async function assertUnlocked(): Promise<string | null> {
  const { date } = nowInOrgTz((await getOrgSettings()).timezone);
  const month = date.slice(0, 7);
  if (await isMonthLocked(month)) return "Payroll for this month is finalised — attendance is locked.";
  return null;
}

export async function clockInAction(): Promise<ClockResult> {
  const { employeeId, userId, email } = await requirePortalEmployee();
  const locked = await assertUnlocked();
  if (locked) return { ok: false, error: locked };

  const result = await clockIn(employeeId);
  if (!result.ok) return result;

  await recordAudit({
    actorId: userId,
    actorEmail: email,
    action: "clock_in",
    entity: "attendance",
    entityId: employeeId,
    summary: `Clocked in ${result.time}`,
  });
  revalidatePath("/hrms/me");
  revalidatePath("/hrms/me/attendance");
  return result;
}

export async function clockOutAction(): Promise<ClockResult> {
  const { employeeId, userId, email } = await requirePortalEmployee();
  const locked = await assertUnlocked();
  if (locked) return { ok: false, error: locked };

  const result = await clockOut(employeeId);
  if (!result.ok) return result;

  await recordAudit({
    actorId: userId,
    actorEmail: email,
    action: "clock_out",
    entity: "attendance",
    entityId: employeeId,
    summary: `Clocked out ${result.time}`,
  });
  revalidatePath("/hrms/me");
  revalidatePath("/hrms/me/attendance");
  return result;
}
