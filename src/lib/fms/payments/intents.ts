import "server-only";
import { getDb } from "@/lib/mongodb";
import {
  newId,
  createStamp,
  updateStamp,
  notDeleted,
  nextYearSequence,
  formatYearCode,
  type AuditFields,
} from "@/lib/fms/db";
import { recordAudit } from "@/lib/fms/audit";
import { getInvoice, applyReceiptToInvoice } from "@/lib/fms/invoices";
import { recordReceipt } from "@/lib/fms/receipts";
import { PaymentProviderId, getPaymentProvider } from "./provider";
import "./providers";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";
import { NOT_CONNECTED, NOT_CONNECTED_MESSAGE, resolveRazorpayCredentials } from "@/lib/platform/integrations/payments";

/**
 * Gateways a company can connect its own account for (Settings → Payments &
 * payouts). The others have no per-company credentials and no real
 * integration yet (they resolve to the mock provider), so they stay limited
 * to the platform owner, exactly as before.
 */
const CONNECTABLE_GATEWAYS = new Set<string>(["razorpay"]);
const OWNER_ONLY_GATEWAYS = new Set<string>(["stripe", "cashfree", "payu"]);

export const PAYMENT_INTENTS_COLLECTION = "fms_payment_intents";
const INTENT_NUMBER_PREFIX = "PAY";

export type PaymentSourceModule =
  | "TMS"
  | "PMS"
  | "PRMS"
  | "LMS"
  | "PORTAL"
  | "FMS"
  | "HRMS"
  | "WEBSITE"
  | "DIRECT"
  | "OFFERS";

export type PaymentIntentStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "RECONCILED";

export type PaymentMethod =
  | "UPI"
  | "CARD"
  | "NET_BANKING"
  | "WALLET"
  | "BANK_TRANSFER"
  | "CASH"
  | "CHEQUE"
  | "PAYMENT_LINK";

export interface PaymentIntent extends AuditFields {
  _id: string;
  paymentNumber: string;
  sourceModule: PaymentSourceModule;
  sourceType: string;
  sourceId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  invoiceId: string | null;
  amount: number;
  walletCreditsUsed: number;
  offerDiscountAmount: number;
  netAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProviderId;
  paymentSessionId: string | null;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  gatewaySignature: string | null;
  checkoutUrl: string | null;
  status: PaymentIntentStatus;
  utr: string | null;
  failureReason: string | null;
  receiptId: string | null;
  receiptNumber: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  initiatedAt: Date;
  completedAt: Date | null;
}

export interface SerializedPaymentIntent
  extends Omit<PaymentIntent, "createdAt" | "updatedAt" | "deletedAt" | "initiatedAt" | "completedAt"> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  initiatedAt: string;
  completedAt: string | null;
}

export function serializePaymentIntent(pi: PaymentIntent): SerializedPaymentIntent {
  return {
    ...pi,
    createdAt: pi.createdAt.toISOString(),
    updatedAt: pi.updatedAt.toISOString(),
    deletedAt: pi.deletedAt ? pi.deletedAt.toISOString() : null,
    initiatedAt: pi.initiatedAt.toISOString(),
    completedAt: pi.completedAt ? pi.completedAt.toISOString() : null,
  };
}

let indexesEnsured = false;
async function getCollection() {
  const db = await getDb();
  const collection = db.collection<PaymentIntent>(PAYMENT_INTENTS_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ paymentNumber: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ idempotencyKey: 1 }, { sparse: true }).catch(() => {}),
      collection.createIndex({ sourceModule: 1, sourceId: 1 }).catch(() => {}),
      collection.createIndex({ invoiceId: 1 }).catch(() => {}),
      collection.createIndex({ customerId: 1 }).catch(() => {}),
      collection.createIndex({ gatewayOrderId: 1 }, { sparse: true }).catch(() => {}),
      collection.createIndex({ gatewayPaymentId: 1 }, { sparse: true }).catch(() => {}),
      collection.createIndex({ status: 1 }).catch(() => {}),
      collection.createIndex({ createdAt: -1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function generatePaymentNumber(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextYearSequence(INTENT_NUMBER_PREFIX, year);
  return formatYearCode(INTENT_NUMBER_PREFIX, year, seq);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getPaymentIntent(id: string): Promise<PaymentIntent | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id, ...notDeleted });
}

export async function getPaymentIntentByNumber(paymentNumber: string): Promise<PaymentIntent | null> {
  const collection = await getCollection();
  return collection.findOne({ paymentNumber, ...notDeleted });
}

export async function getPaymentIntentByIdempotencyKey(key: string): Promise<PaymentIntent | null> {
  const collection = await getCollection();
  return collection.findOne({ idempotencyKey: key, ...notDeleted });
}

export async function getPaymentIntentByGatewayOrder(gatewayOrderId: string): Promise<PaymentIntent | null> {
  const collection = await getCollection();
  return collection.findOne({ gatewayOrderId, ...notDeleted });
}

export async function getPaymentIntentByGatewayPayment(gatewayPaymentId: string): Promise<PaymentIntent | null> {
  const collection = await getCollection();
  return collection.findOne({ gatewayPaymentId, ...notDeleted });
}

export interface PaymentIntentFilter {
  search?: string;
  sourceModule?: PaymentSourceModule;
  status?: PaymentIntentStatus;
  customerId?: string;
  invoiceId?: string;
}

export async function searchPaymentIntents(
  opts: PaymentIntentFilter & { page?: number; pageSize?: number; sortBy?: "createdAt" | "amount"; sortDir?: "asc" | "desc" } = {}
) {
  const collection = await getCollection();
  const page = Math.max(opts.page ?? 1, 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const filter: Record<string, unknown> = { ...notDeleted };

  if (opts.sourceModule) filter.sourceModule = opts.sourceModule;
  if (opts.status) filter.status = opts.status;
  if (opts.customerId) filter.customerId = opts.customerId;
  if (opts.invoiceId) filter.invoiceId = opts.invoiceId;

  if (opts.search?.trim()) {
    const rx = new RegExp(opts.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { paymentNumber: rx },
      { customerName: rx },
      { customerEmail: rx },
      { gatewayPaymentId: rx },
      { utr: rx },
    ];
  }

  const sortField = opts.sortBy ?? "createdAt";
  const sortDir = opts.sortDir === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    collection.find(filter).sort({ [sortField]: sortDir }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
}

// ---------------------------------------------------------------------------
// Writes & Intent Creation
// ---------------------------------------------------------------------------

export interface CreatePaymentIntentData {
  sourceModule: PaymentSourceModule;
  sourceType: string;
  sourceId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  invoiceId?: string | null;
  amount: number;
  walletCreditsUsed?: number;
  offerDiscountAmount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  paymentProvider?: PaymentProviderId;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export async function createPaymentIntent(
  data: CreatePaymentIntentData
): Promise<{ ok: true; intent: PaymentIntent } | { ok: false; reason: string; code?: typeof NOT_CONNECTED }> {
  if (data.idempotencyKey) {
    const existing = await getPaymentIntentByIdempotencyKey(data.idempotencyKey);
    if (existing) {
      return { ok: true, intent: existing };
    }
  }

  const grossAmount = Math.max(data.amount, 0);
  const walletCredits = Math.max(data.walletCreditsUsed ?? 0, 0);
  const offerDiscount = Math.max(data.offerDiscountAmount ?? 0, 0);
  const netAmount = Math.max(grossAmount - walletCredits - offerDiscount, 0);

  if (data.invoiceId) {
    const inv = await getInvoice(data.invoiceId);
    if (inv) {
      const outstanding = inv.totalAmount - inv.amountPaid - inv.amountCredited;
      if (grossAmount > outstanding + 0.01) {
        return { ok: false, reason: `Requested payment amount (₹${grossAmount}) exceeds outstanding invoice balance (₹${outstanding}).` };
      }
    }
  }

  const providerId = data.paymentProvider || "mock";
  // Live gateways collect into the company's OWN merchant account — never another company's.
  if (CONNECTABLE_GATEWAYS.has(providerId) && !(await resolveRazorpayCredentials("payments"))) {
    return { ok: false, reason: NOT_CONNECTED_MESSAGE, code: NOT_CONNECTED };
  }
  if (OWNER_ONLY_GATEWAYS.has(providerId) && !(await isPlatformOwnerContext())) {
    return { ok: false, reason: "Online payment collection isn't connected for this workspace yet. Record the payment offline instead." };
  }
  const provider = getPaymentProvider(providerId);
  const intentId = newId();
  const paymentNumber = await generatePaymentNumber();

  const providerRes = await provider.createPaymentIntent({
    intentId,
    paymentNumber,
    amount: Math.round(netAmount * 100),
    amountInRupees: netAmount,
    currency: data.currency || "INR",
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone || undefined,
    description: `Payment for ${data.sourceModule} (${data.sourceType}) - ${paymentNumber}`,
    metadata: {
      sourceModule: data.sourceModule,
      sourceId: data.sourceId,
    },
  });

  if (!providerRes.ok) {
    return { ok: false, reason: providerRes.error || "Failed to initialize payment gateway order." };
  }

  const now = new Date();
  const doc: PaymentIntent = {
    _id: intentId,
    paymentNumber,
    sourceModule: data.sourceModule,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    customerId: data.customerId ?? null,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone ?? null,
    invoiceId: data.invoiceId ?? null,
    amount: grossAmount,
    walletCreditsUsed: walletCredits,
    offerDiscountAmount: offerDiscount,
    netAmount,
    currency: data.currency || "INR",
    paymentMethod: data.paymentMethod || "UPI",
    paymentProvider: providerId,
    paymentSessionId: providerRes.clientSecret ?? null,
    gatewayOrderId: providerRes.providerOrderId ?? null,
    gatewayPaymentId: providerRes.providerPaymentId ?? null,
    gatewaySignature: null,
    checkoutUrl: providerRes.checkoutUrl ?? null,
    status: providerId === "offline" ? "PENDING" : "CREATED",
    utr: null,
    failureReason: null,
    receiptId: null,
    receiptNumber: null,
    idempotencyKey: data.idempotencyKey ?? null,
    metadata: data.metadata || {},
    initiatedAt: now,
    completedAt: null,
    ...createStamp(data.actorId ?? null),
  };

  const collection = await getCollection();
  await collection.insertOne(doc);

  await recordAudit({
    actorId: data.actorId || "system",
    actorEmail: data.customerEmail,
    action: "create",
    entity: "payment_intent",
    entityId: doc._id,
    entityLabel: doc.paymentNumber,
    summary: `Created Payment Intent ${doc.paymentNumber} for ₹${netAmount} via ${providerId}`,
  });

  return { ok: true, intent: doc };
}

/**
 * Transitions a payment intent to SUCCESS, generates receipt, updates invoice, and triggers ledger posting.
 * Atomically guarded against duplicate completions.
 */
export async function markPaymentIntentSuccessful(
  intentId: string,
  opts: {
    gatewayPaymentId?: string;
    gatewaySignature?: string;
    utr?: string;
    paymentMethod?: PaymentMethod;
    actorId?: string | null;
  }
): Promise<{ ok: boolean; intent?: PaymentIntent; reason?: string }> {
  const collection = await getCollection();
  const intent = await collection.findOne({ _id: intentId, ...notDeleted });
  if (!intent) return { ok: false, reason: "Payment intent not found." };
  if (intent.status === "SUCCESS") return { ok: true, intent };

  if (["CANCELLED", "EXPIRED"].includes(intent.status)) {
    return { ok: false, reason: `Cannot complete a ${intent.status} payment intent.` };
  }

  const now = new Date();
  let receiptId: string | null = null;
  let receiptNumber: string | null = null;

  if (intent.invoiceId) {
    const inv = await getInvoice(intent.invoiceId);
    if (inv) {
      const recRes = await recordReceipt(
        {
          customerId: inv.customerId,
          customerName: inv.customerName,
          receiptDate: now.toISOString().slice(0, 10),
          amount: intent.netAmount,
          method: (opts.paymentMethod || intent.paymentMethod || "UPI") as any,
          transactionReference: opts.utr || opts.gatewayPaymentId || intent.paymentNumber,
          allocations: [{ invoiceId: inv._id, amount: intent.netAmount }],
          currency: intent.currency,
          notes: `Automated payment for ${intent.paymentNumber} (${intent.sourceModule})`,
        },
        opts.actorId || "system",
        "system@internal.invalid"
      );
      if (recRes.ok) {
        receiptId = recRes.receipt._id;
        receiptNumber = recRes.receipt.receiptNumber;
      }
    }
  }

  const updated = await collection.findOneAndUpdate(
    { _id: intentId, status: { $ne: "SUCCESS" } },
    {
      $set: {
        status: "SUCCESS",
        completedAt: now,
        gatewayPaymentId: opts.gatewayPaymentId || intent.gatewayPaymentId,
        gatewaySignature: opts.gatewaySignature || intent.gatewaySignature,
        utr: opts.utr || intent.utr,
        receiptId,
        receiptNumber,
        ...updateStamp(opts.actorId || null),
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) return { ok: false, reason: "Concurrent state change prevented update." };

  await recordAudit({
    actorId: opts.actorId || "system",
    actorEmail: intent.customerEmail,
    action: "status_change",
    entity: "payment_intent",
    entityId: intentId,
    entityLabel: intent.paymentNumber,
    summary: `Payment ${intent.paymentNumber} completed successfully. Receipt: ${receiptNumber || "N/A"}`,
  });

  return { ok: true, intent: updated };
}

export async function markPaymentIntentFailed(
  intentId: string,
  failureReason: string,
  actorId: string | null = null
): Promise<boolean> {
  const collection = await getCollection();
  const res = await collection.updateOne(
    { _id: intentId, status: { $in: ["CREATED", "PENDING", "PROCESSING"] } },
    {
      $set: {
        status: "FAILED",
        failureReason,
        ...updateStamp(actorId),
      },
    }
  );
  return res.modifiedCount === 1;
}
