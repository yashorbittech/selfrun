"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageFinance } from "@/lib/prms-roles";
import {
  createInvoice,
  updateInvoice,
  setInvoiceStatus,
  deleteInvoice,
  getInvoice,
  type InvoiceWriteData,
} from "@/lib/prms/invoices";
import { recordPayment, markPaymentProcessed, deletePayment, getPayment, type PaymentWriteData } from "@/lib/prms/payments";
import { getVendor } from "@/lib/prms/vendors";
import { getPurchaseOrderByNumber } from "@/lib/prms/purchase-orders";
import { recordAudit } from "@/lib/prms/audit";
import { notifyStaff } from "@/lib/prms/notifications";
import { isValidPaymentMethod, isValidInvoiceStatus, type InvoiceStatus } from "@/lib/prms/constants";
import { saveAttachmentFile, isAllowedAttachment } from "@/lib/prms/attachment-storage";

export interface InvoiceActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

async function requireFinance() {
  const user = await getCurrentPrmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageFinance(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(id?: string) {
  revalidatePath("/prms/invoices");
  revalidatePath("/prms");
  if (id) revalidatePath(`/prms/invoices/${id}`);
}

export async function saveInvoiceAction(input: Record<string, unknown>, id?: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();

  const vendorId = String(input.vendorId ?? "");
  const vendor = vendorId ? await getVendor(vendorId) : null;
  if (!vendor) return { ok: false, fieldErrors: { vendorId: "Select a vendor." } };

  const invoiceDate = String(input.invoiceDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) return { ok: false, fieldErrors: { invoiceDate: "Enter a valid date." } };
  const subtotal = Number(input.subtotal);
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { ok: false, fieldErrors: { subtotal: "Enter the taxable amount." } };

  let poId: string | null = null;
  let poNumber: string | null = null;
  const poRef = String(input.poNumber ?? "").trim();
  if (poRef) {
    const po = await getPurchaseOrderByNumber(poRef);
    if (po) {
      poId = po._id;
      poNumber = po.poNumber;
    }
  }

  const data: InvoiceWriteData = {
    vendorId,
    vendorName: vendor.companyName,
    vendorInvoiceNumber: (input.vendorInvoiceNumber as string)?.trim() || null,
    poId,
    poNumber,
    invoiceDate,
    dueDate: (input.dueDate as string) || null,
    subtotal,
    gstAmount: Number(input.gstAmount) || 0,
    tdsRate: Number(input.tdsRate) || 0,
    currency: String(input.currency ?? vendor.currency ?? "INR"),
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
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "create",
    entity: "invoice",
    entityId: created._id,
    entityLabel: created.invoiceNumber,
    summary: `${created.poMatched ? "PO-matched" : "no PO match"} · ${created.grnMatched ? "GRN-matched" : "no GRN"}`,
  });
  revalidate(created._id);
  return { ok: true, id: created._id };
}

export async function uploadInvoiceFileAction(id: string, formData: FormData): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const before = await getInvoice(id);
  if (!before) return { ok: false, error: "Invoice not found." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file." };
  const check = isAllowedAttachment(file);
  if (!check.ok) return { ok: false, error: check.error };
  const stored = await saveAttachmentFile(file);
  await updateInvoice(
    id,
    {
      vendorId: before.vendorId,
      vendorName: before.vendorName,
      vendorInvoiceNumber: before.vendorInvoiceNumber,
      poId: before.poId,
      poNumber: before.poNumber,
      invoiceDate: before.invoiceDate,
      dueDate: before.dueDate,
      subtotal: before.subtotal,
      gstAmount: before.gstAmount,
      tdsRate: before.tdsRate,
      currency: before.currency,
      notes: before.notes,
      storageKey: stored.storageKey,
      filename: stored.filename,
    },
    user.id
  );
  revalidate(id);
  return { ok: true, id };
}

export async function decideInvoiceAction(id: string, status: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  if (!isValidInvoiceStatus(status)) return { ok: false, error: "Unknown status." };
  const before = await getInvoice(id);
  await setInvoiceStatus(id, status as InvoiceStatus, user.id);
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

export async function recordPaymentAction(input: Record<string, unknown>): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const method = String(input.method ?? "bank_transfer");
  if (!isValidPaymentMethod(method)) return { ok: false, error: "Unknown payment method." };
  const status = input.status === "scheduled" ? "scheduled" : "processed";
  const data: PaymentWriteData = {
    invoiceId: String(input.invoiceId ?? ""),
    amount: Number(input.amount) || 0,
    paymentDate: String(input.paymentDate ?? new Date().toISOString().slice(0, 10)),
    method,
    transactionReference: (input.transactionReference as string) || null,
    tdsDeducted: Number(input.tdsDeducted) || 0,
    status,
    notes: (input.notes as string) || null,
  };
  const res = await recordPayment(data, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "record", entity: "payment", entityId: res.id!, entityLabel: null, summary: `amount ${data.amount}` });
  const inv = await getInvoice(data.invoiceId);
  if (inv?.status === "paid") {
    await notifyStaff(
      { type: "invoice_paid", title: `Invoice ${inv.invoiceNumber} fully paid`, body: inv.vendorName, link: `/prms/invoices/${inv._id}`, dedupeKey: `invoice_paid:${inv._id}` },
      ["super_admin", "prms_admin", "finance"]
    );
  }
  revalidate(data.invoiceId);
  revalidatePath("/prms/payments");
  return { ok: true, id: data.invoiceId };
}

export async function processPaymentAction(id: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const res = await markPaymentProcessed(id, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  const p = await getPayment(id);
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "record", entity: "payment", entityId: id, entityLabel: p?.paymentCode, summary: "processed" });
  revalidatePath("/prms/payments");
  if (p) revalidate(p.invoiceId);
  return { ok: true, id };
}

export async function deletePaymentAction(id: string): Promise<InvoiceActionResult> {
  const user = await requireFinance();
  const p = await getPayment(id);
  const res = await deletePayment(id, user.id);
  if (!res.ok) return { ok: false, error: res.reason };
  await recordAudit({ actorId: user.id, actorEmail: user.email, action: "delete", entity: "payment", entityId: id, entityLabel: p?.paymentCode });
  revalidatePath("/prms/payments");
  if (p) revalidate(p.invoiceId);
  return { ok: true };
}
