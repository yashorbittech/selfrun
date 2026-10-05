"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageTransactions } from "@/lib/fms-roles";
import {
  createInvoice,
  updateInvoice,
  setInvoiceStatus,
  deleteInvoice,
  getInvoice,
  type InvoiceWriteData,
} from "@/lib/fms/invoices";
import { getClient } from "@/lib/pms/clients";
import { isValidInvoiceStatus } from "@/lib/fms/constants";
import { recordAudit } from "@/lib/fms/audit";
import type { FmsLineItemInput } from "@/lib/fms/pricing";
import { writeBlockReason } from "@/lib/platform/billing/enforce";

export interface InvoiceActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

async function requireFinance() {
  const user = await getCurrentFmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageTransactions(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(id?: string) {
  revalidatePath("/fms/invoices");
  revalidatePath("/fms/customers");
  revalidatePath("/fms/receivables");
  revalidatePath("/fms");
  if (id) revalidatePath(`/fms/invoices/${id}`);
}

interface RawLine {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
}

function parseItems(raw: unknown): FmsLineItemInput[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawLine[])
    .filter((l) => l.description?.trim())
    .map((l) => ({
      description: l.description.trim(),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      taxRate: Number(l.taxRate) || 0,
    }));
}

export async function saveInvoiceAction(input: Record<string, unknown>, id?: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const readOnly = await writeBlockReason();
  if (readOnly) return { ok: false, error: readOnly };

  const customerId = String(input.customerId ?? "");
  const customer = customerId ? await getClient(customerId) : null;
  if (!customer) return { ok: false, fieldErrors: { customerId: "Select a customer." } };

  const invoiceDate = String(input.invoiceDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) return { ok: false, fieldErrors: { invoiceDate: "Enter a valid date." } };
  const dueDate = String(input.dueDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { ok: false, fieldErrors: { dueDate: "Enter a valid due date." } };

  const items = parseItems(input.items);
  if (items.length === 0) return { ok: false, fieldErrors: { items: "Add at least one line item." } };

  const data: InvoiceWriteData = {
    customerId,
    customerName: customer.companyName,
    projectId: (input.projectId as string) || null,
    invoiceDate,
    dueDate,
    items,
    discount: Number(input.discount) || 0,
    currency: String(input.currency ?? customer.billing?.currency ?? "INR"),
    paymentTerms: (input.paymentTerms as string)?.trim() || null,
    poNumber: (input.poNumber as string)?.trim() || null,
    notes: (input.notes as string)?.trim() || null,
  };

  if (id) {
    const before = await getInvoice(id);
    if (!before) return { ok: false, error: "Invoice not found." };
    const res = await updateInvoice(id, data, user.id);
    if (!res.ok) return { ok: false, error: res.reason };
    await recordAudit({ actorId: user.id, actorEmail: user.email, action: "update", entity: "invoice", entityId: id, entityLabel: before.invoiceNumber });
    revalidate(id);
    return { ok: true, id };
  }

  const created = await createInvoice(data, user.id);
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "create", entity: "invoice", entityId: created._id, entityLabel: created.invoiceNumber });
  revalidate(created._id);
  return { ok: true, id: created._id };
}

export async function changeInvoiceStatusAction(id: string, status: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  if (!isValidInvoiceStatus(status)) return { ok: false, error: "Unknown status." };
  const before = await getInvoice(id);
  const res = await setInvoiceStatus(id, status, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "status_change", entity: "invoice", entityId: id, entityLabel: before?.invoiceNumber, summary: `status → ${status}` });
  revalidate(id);
  return { ok: true, id };
}

export async function deleteInvoiceAction(id: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const before = await getInvoice(id);
  const res = await deleteInvoice(id, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "delete", entity: "invoice", entityId: id, entityLabel: before?.invoiceNumber });
  revalidate(id);
  return { ok: true };
}
