import "server-only";
import { isDateString } from "@/lib/hrms/time";
import type { PayComponent } from "@/lib/hrms/payroll";
import type { PayrollConfigInput } from "@/lib/hrms/payroll-config";
import type { SalaryStructure } from "@/lib/hrms/salary-revisions";
import { isValidDocumentCategory, EMPLOYEE_UPLOADABLE_CATEGORIES, type DocumentCategory } from "@/lib/hrms/document-categories";
import { isValidAccountType, type AccountType } from "@/lib/hrms/payout-status";

const IFSC_RE = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
const ACCOUNT_NUMBER_RE = /^\d{6,18}$/;
const UTR_RE = /^[A-Za-z0-9]{6,22}$/;

type Ok<T> = { valid: true; data: T };
type Err = { valid: false; errors: Record<string, string> };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(str(v));
  return Number.isFinite(n) ? n : NaN;
}
function optStr(v: unknown, max = 300): string | null {
  const s = str(v);
  return s ? s.slice(0, max) : null;
}
function components(v: unknown, errors: Record<string, string>, key: string): PayComponent[] {
  if (!Array.isArray(v)) return [];
  const out: PayComponent[] = [];
  for (const raw of v) {
    const rec = (raw ?? {}) as Record<string, unknown>;
    const name = str(rec.name).slice(0, 60);
    if (!name) continue;
    const amount = num(rec.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors[key] = "Amounts must be zero or positive.";
      continue;
    }
    out.push({ name, amount: Math.round(amount) });
  }
  return out;
}

// ---------------------------------------------------------------------------

export function validatePayrollConfig(input: Record<string, unknown>): Ok<PayrollConfigInput> | Err {
  const errors: Record<string, string> = {};
  const pct = (v: unknown, k: string, max = 100) => {
    const n = num(v);
    if (!(n >= 0 && n <= max)) errors[k] = `Enter a percentage between 0 and ${max}.`;
    return n;
  };
  const money = (v: unknown, k: string) => {
    const n = num(v);
    if (!(n >= 0 && n <= 10_000_000)) errors[k] = "Enter a valid amount.";
    return Math.round(n);
  };

  const data: PayrollConfigInput = {
    pfEmployeePercent: pct(input.pfEmployeePercent, "pfEmployeePercent", 50),
    pfWageCeiling: money(input.pfWageCeiling, "pfWageCeiling"),
    epsPercent: pct(input.epsPercent, "epsPercent", 50),
    pfEmployerPercent: pct(input.pfEmployerPercent, "pfEmployerPercent", 50),
    esiEmployeePercent: pct(input.esiEmployeePercent, "esiEmployeePercent", 20),
    esiEmployerPercent: pct(input.esiEmployerPercent, "esiEmployerPercent", 20),
    esiGrossThreshold: money(input.esiGrossThreshold, "esiGrossThreshold"),
    professionalTaxMonthly: money(input.professionalTaxMonthly, "professionalTaxMonthly"),
    tdsRegime: str(input.tdsRegime) === "manual" ? "manual" : "new",
    financialYearStartMonth: (() => {
      const n = Math.round(num(input.financialYearStartMonth));
      if (!(n >= 1 && n <= 12)) errors.financialYearStartMonth = "Month 1–12.";
      return n;
    })(),
  };

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data };
}

export function validateSalaryRevision(
  input: Record<string, unknown>
): Ok<SalaryStructure & { effectiveFrom: string; reason: string | null }> | Err {
  const errors: Record<string, string> = {};
  const effectiveFrom = str(input.effectiveFrom);
  if (!isDateString(effectiveFrom)) errors.effectiveFrom = "Select an effective date.";
  const basic = num(input.basic);
  if (!(basic >= 0)) errors.basic = "Enter a valid basic amount.";
  const hra = num(input.hra);
  if (!(hra >= 0)) errors.hra = "Enter a valid HRA amount.";
  const allowances = components(input.allowances, errors, "allowances");
  const deductions = components(input.deductions, errors, "deductions");

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: { effectiveFrom, reason: optStr(input.reason, 300), basic: Math.round(basic), hra: Math.round(hra), allowances, deductions },
  };
}

export function validatePayslipOverrides(
  input: Record<string, unknown>
): Ok<{ arrears: number; manualTds: number | null; otherDeductions: number }> | Err {
  const errors: Record<string, string> = {};
  const arrears = num(input.arrears) || 0;
  if (!(arrears >= 0)) errors.arrears = "Zero or positive.";
  const otherDeductions = num(input.otherDeductions) || 0;
  if (!(otherDeductions >= 0)) errors.otherDeductions = "Zero or positive.";
  const manualRaw = str(input.manualTds);
  const manualTds = manualRaw === "" ? null : num(input.manualTds);
  if (manualTds != null && !(manualTds >= 0)) errors.manualTds = "Zero or positive, or blank for auto.";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data: { arrears: Math.round(arrears), manualTds: manualTds == null ? null : Math.round(manualTds), otherDeductions: Math.round(otherDeductions) } };
}

export function validateEmployeeLogin(input: Record<string, unknown>): Ok<{ email: string; tempPassword: string }> | Err {
  const errors: Record<string, string> = {};
  const email = str(input.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  const tempPassword = str(input.tempPassword);
  if (tempPassword.length < 10) errors.tempPassword = "At least 10 characters.";
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data: { email, tempPassword } };
}

export function validateDocumentMeta(
  input: Record<string, unknown>,
  actorRole: "staff" | "employee"
): Ok<{ category: DocumentCategory; title: string; issuedDate: string | null; expiryDate: string | null }> | Err {
  const errors: Record<string, string> = {};
  const category = str(input.category);
  if (!isValidDocumentCategory(category)) errors.category = "Choose a category.";
  else if (actorRole === "employee" && !EMPLOYEE_UPLOADABLE_CATEGORIES.includes(category)) {
    errors.category = "You can only upload documents in the allowed categories.";
  }
  const title = str(input.title);
  if (!title) errors.title = "Give the document a title.";
  else if (title.length > 120) errors.title = "Title must be 120 characters or fewer.";

  const issuedDate = str(input.issuedDate);
  const expiryDate = str(input.expiryDate);
  if (issuedDate && !isDateString(issuedDate)) errors.issuedDate = "Invalid date.";
  if (expiryDate && !isDateString(expiryDate)) errors.expiryDate = "Invalid date.";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: { category: category as DocumentCategory, title, issuedDate: issuedDate || null, expiryDate: expiryDate || null },
  };
}

export function validateOffer(
  input: Record<string, unknown>
): Ok<{ applicationId: string; offerDate: string | null; proposedJoiningDate: string | null; annualCtc: number | null; notes: string | null }> | Err {
  const errors: Record<string, string> = {};
  const applicationId = str(input.applicationId);
  if (!applicationId) errors.applicationId = "Select an applicant.";
  const offerDate = str(input.offerDate);
  const proposedJoiningDate = str(input.proposedJoiningDate);
  if (offerDate && !isDateString(offerDate)) errors.offerDate = "Invalid date.";
  if (proposedJoiningDate && !isDateString(proposedJoiningDate)) errors.proposedJoiningDate = "Invalid date.";
  const ctcRaw = str(input.annualCtc);
  const annualCtc = ctcRaw === "" ? null : num(input.annualCtc);
  if (annualCtc != null && !(annualCtc >= 0 && annualCtc <= 100_000_000)) errors.annualCtc = "Enter a valid annual CTC.";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      applicationId,
      offerDate: offerDate || null,
      proposedJoiningDate: proposedJoiningDate || null,
      annualCtc: annualCtc == null ? null : Math.round(annualCtc),
      notes: optStr(input.notes, 1000),
    },
  };
}

export function validateOfferDetails(
  input: Record<string, unknown>
): Ok<{ offerDate: string | null; proposedJoiningDate: string | null; annualCtc: number | null; notes: string | null }> | Err {
  const v = validateOffer({ ...input, applicationId: "placeholder" });
  if (!v.valid) return v;
  const { offerDate, proposedJoiningDate, annualCtc, notes } = v.data;
  return { valid: true, data: { offerDate, proposedJoiningDate, annualCtc, notes } };
}

export function validateOwnContact(input: Record<string, unknown>): Ok<{
  phone: string | null;
  personalEmail: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  emergencyContacts: { name: string; relationship: string; phone: string }[];
}> | Err {
  const errors: Record<string, string> = {};
  const phone = str(input.phone);
  if (phone && !/^[+]?[\d\s\-()]{7,20}$/.test(phone)) errors.phone = "Enter a valid phone number.";
  const personalEmail = str(input.personalEmail);
  if (personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) errors.personalEmail = "Enter a valid email.";

  const emergencyContacts = Array.isArray(input.emergencyContacts)
    ? input.emergencyContacts
        .map((c) => {
          const rec = (c ?? {}) as Record<string, unknown>;
          return { name: str(rec.name).slice(0, 120), relationship: str(rec.relationship).slice(0, 60), phone: str(rec.phone).slice(0, 20) };
        })
        .filter((c) => c.name && c.phone)
    : [];

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      phone: phone || null,
      personalEmail: personalEmail || null,
      addressLine: optStr(input.addressLine),
      city: optStr(input.city, 100),
      state: optStr(input.state, 100),
      postalCode: optStr(input.postalCode, 20),
      emergencyContacts,
    },
  };
}

// ---------------------------------------------------------------------------
// Bank accounts + payouts
// ---------------------------------------------------------------------------

export function validateBankAccount(input: Record<string, unknown>): Ok<{
  accountHolderName: string;
  bankName: string;
  branch: string | null;
  accountType: AccountType;
  accountNumber: string;
  ifsc: string;
  upiId: string | null;
  isPrimary: boolean;
}> | Err {
  const errors: Record<string, string> = {};

  const accountHolderName = str(input.accountHolderName);
  if (!accountHolderName) errors.accountHolderName = "Account holder name is required.";
  else if (accountHolderName.length > 120) errors.accountHolderName = "Must be 120 characters or fewer.";

  const bankName = str(input.bankName);
  if (!bankName) errors.bankName = "Bank name is required.";

  const accountType = str(input.accountType);
  if (!isValidAccountType(accountType)) errors.accountType = "Choose an account type.";

  const accountNumber = str(input.accountNumber).replace(/\s+/g, "");
  if (!accountNumber) errors.accountNumber = "Account number is required.";
  else if (!ACCOUNT_NUMBER_RE.test(accountNumber)) errors.accountNumber = "Enter a valid account number (6–18 digits).";

  const ifsc = str(input.ifsc).toUpperCase();
  if (!ifsc) errors.ifsc = "IFSC is required.";
  else if (!IFSC_RE.test(ifsc)) errors.ifsc = "Enter a valid IFSC code.";

  const upiRaw = str(input.upiId);
  if (upiRaw && !/^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/.test(upiRaw)) errors.upiId = "Enter a valid UPI ID (name@bank).";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      accountHolderName,
      bankName: bankName.slice(0, 120),
      branch: optStr(input.branch, 120),
      accountType: accountType as AccountType,
      accountNumber,
      ifsc,
      upiId: upiRaw || null,
      isPrimary: input.isPrimary === true || input.isPrimary === "true" || input.isPrimary === "on",
    },
  };
}

export function validateManualPayoutResult(
  input: Record<string, unknown>
): Ok<{ status: "paid" | "failed"; utr: string | null; failureReason: string | null; remarks: string | null }> | Err {
  const errors: Record<string, string> = {};
  const status = str(input.status);
  if (status !== "paid" && status !== "failed") errors.status = "Choose Paid or Failed.";

  const utr = str(input.utr);
  if (status === "paid") {
    if (!utr) errors.utr = "Enter the payment reference / UTR.";
    else if (!UTR_RE.test(utr)) errors.utr = "UTR must be 6–22 letters or digits.";
  }
  const failureReason = str(input.failureReason);
  if (status === "failed" && !failureReason) errors.failureReason = "Give a failure reason.";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      status: status as "paid" | "failed",
      utr: status === "paid" ? utr : null,
      failureReason: status === "failed" ? failureReason.slice(0, 500) : null,
      remarks: optStr(input.remarks, 500),
    },
  };
}
