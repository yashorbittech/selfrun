import "server-only";
import { getDb } from "@/lib/mongodb";
import { updateStamp } from "@/lib/hrms/db";

/**
 * Statutory payroll configuration (single doc). India defaults. Edited in
 * Settings → Payroll (super_admin only).
 */

export const PAYROLL_CONFIG_COLLECTION = "hrms_payroll_config";
const PAYROLL_CONFIG_ID = "org";

export interface PayrollConfig {
  _id: string;
  /** Provident Fund — % of (capped) basic, employee side. */
  pfEmployeePercent: number;
  /** Wage ceiling for PF/EPS (₹15,000 basic by statute). Set 0 to disable the cap. */
  pfWageCeiling: number;
  /** Employer PF split: EPS % (8.33) of ceiling, remainder to EPF. */
  epsPercent: number;
  pfEmployerPercent: number;
  /** ESI — only when monthly gross is at or below the threshold. */
  esiEmployeePercent: number;
  esiEmployerPercent: number;
  esiGrossThreshold: number;
  /** Professional Tax — flat monthly amount (state-specific; ₹200 typical). */
  professionalTaxMonthly: number;
  /** Income-tax regime used for auto-TDS. Only "new" is auto-computed; "manual" disables auto-TDS. */
  tdsRegime: "new" | "manual";
  /** Financial year start month (India = 4 / April). */
  financialYearStartMonth: number;
  updatedAt: Date;
  updatedBy: string | null;
}

const DEFAULTS: Omit<PayrollConfig, "_id" | "updatedAt" | "updatedBy"> = {
  pfEmployeePercent: 12,
  pfWageCeiling: 15000,
  epsPercent: 8.33,
  pfEmployerPercent: 12,
  esiEmployeePercent: 0.75,
  esiEmployerPercent: 3.25,
  esiGrossThreshold: 21000,
  professionalTaxMonthly: 200,
  tdsRegime: "new",
  financialYearStartMonth: 4,
};

export async function getPayrollConfig(): Promise<PayrollConfig> {
  const db = await getDb();
  const collection = db.collection<PayrollConfig>(PAYROLL_CONFIG_COLLECTION);
  const existing = await collection.findOne({ _id: PAYROLL_CONFIG_ID });
  if (existing) return { ...DEFAULTS, ...existing };
  const doc: PayrollConfig = { _id: PAYROLL_CONFIG_ID, ...DEFAULTS, updatedAt: new Date(), updatedBy: null };
  await collection.updateOne({ _id: PAYROLL_CONFIG_ID }, { $setOnInsert: doc }, { upsert: true });
  return doc;
}

export type PayrollConfigInput = Omit<PayrollConfig, "_id" | "updatedAt" | "updatedBy">;

export async function updatePayrollConfig(data: PayrollConfigInput, actorId: string): Promise<PayrollConfig> {
  const db = await getDb();
  const collection = db.collection<PayrollConfig>(PAYROLL_CONFIG_COLLECTION);
  const result = await collection.findOneAndUpdate(
    { _id: PAYROLL_CONFIG_ID },
    { $set: { ...data, ...updateStamp(actorId) } },
    { upsert: true, returnDocument: "after" }
  );
  return { ...DEFAULTS, ...(result as PayrollConfig) };
}

/** Months remaining in the financial year that contains `month` ("yyyy-mm"), inclusive. */
export function monthsRemainingInFY(month: string, fyStartMonth: number): number {
  const m = Number(month.slice(5, 7));
  // FY month index 0..11 starting at fyStartMonth.
  const idx = (m - fyStartMonth + 12) % 12;
  return 12 - idx;
}

/** The "yyyy-mm" of the first month of the FY containing `month`. */
export function fyStartMonthString(month: string, fyStartMonth: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const startYear = m >= fyStartMonth ? y : y - 1;
  return `${startYear}-${String(fyStartMonth).padStart(2, "0")}`;
}
