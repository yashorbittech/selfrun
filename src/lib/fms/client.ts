import { PaymentSourceModule, PaymentMethod } from "./payments/intents";

export interface CreateIntentRequest {
  sourceModule: PaymentSourceModule;
  sourceType: string;
  sourceId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  invoiceId?: string;
  amount: number;
  walletCreditsUsed?: number;
  offerDiscountAmount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResponse {
  ok: boolean;
  paymentIntent?: {
    _id: string;
    paymentNumber: string;
    amount: number;
    netAmount: number;
    status: string;
    receiptNumber?: string;
    checkoutUrl?: string;
  };
  checkoutUrl?: string;
  error?: string;
}

export async function createFmsPaymentIntent(req: CreateIntentRequest): Promise<PaymentIntentResponse> {
  const res = await fetch("/api/fms/payments/create-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function verifyFmsPayment(intentId: string, gatewayPaymentId?: string, utr?: string): Promise<PaymentIntentResponse> {
  const res = await fetch("/api/fms/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intentId, gatewayPaymentId, utr }),
  });
  return res.json();
}

export async function createFmsPaymentLink(params: {
  title: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  sourceModule?: PaymentSourceModule;
  invoiceId?: string;
}) {
  const res = await fetch("/api/fms/payments/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
