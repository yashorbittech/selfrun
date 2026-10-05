import "server-only";
import {
  PaymentProvider,
  CreateProviderIntentParams,
  ProviderIntentResult,
  CreateProviderLinkParams,
  ProviderLinkResult,
  ProviderPaymentStatusResult,
  ProviderRefundParams,
  ProviderRefundResult,
  registerPaymentProvider,
} from "../provider";
import { randomUUID } from "node:crypto";
import { paymentPublicBaseUrl } from "@/lib/fms/payments/public-url";

export const MockPaymentProvider: PaymentProvider = {
  id: "mock",
  name: "Mock & Bank Transfer Provider",

  async createPaymentIntent(params: CreateProviderIntentParams): Promise<ProviderIntentResult> {
    const orderId = `mock_order_${randomUUID().slice(0, 8)}`;
    const paymentId = `mock_pay_${randomUUID().slice(0, 8)}`;

    return {
      ok: true,
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      clientSecret: `mock_sec_${randomUUID()}`,
      checkoutUrl: `/pay/mock-checkout?intentId=${params.intentId}&orderId=${orderId}`,
      rawPayload: {
        mode: "mock",
        amount: params.amountInRupees,
        currency: params.currency,
      },
    };
  },

  async createPaymentLink(params: CreateProviderLinkParams): Promise<ProviderLinkResult> {
    const linkId = `plink_mock_${randomUUID().slice(0, 8)}`;
    return {
      ok: true,
      providerLinkId: linkId,
      shortUrl: `${await paymentPublicBaseUrl()}/pay/${params.token}`,
      rawPayload: { mode: "mock", linkId },
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatusResult> {
    return {
      ok: true,
      status: "SUCCESS",
      providerPaymentId,
      providerOrderId: `mock_order_${providerPaymentId.slice(-8)}`,
      paymentMethod: "UPI",
      utr: `UTR${Date.now()}`,
      rawPayload: { status: "captured" },
    };
  },

  async refundPayment(params: ProviderRefundParams): Promise<ProviderRefundResult> {
    return {
      ok: true,
      providerRefundId: `mock_ref_${randomUUID().slice(0, 8)}`,
      status: "PROCESSED",
      rawPayload: { refundedAmount: params.refundAmount },
    };
  },

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || signature === "invalid") return false;
    return true;
  },
};

export const OfflineBankProvider: PaymentProvider = {
  id: "offline",
  name: "Direct Bank Transfer / Offline Verification",

  async createPaymentIntent(params: CreateProviderIntentParams): Promise<ProviderIntentResult> {
    const referenceId = `OFFLINE_${randomUUID().slice(0, 8).toUpperCase()}`;
    return {
      ok: true,
      providerOrderId: referenceId,
      providerPaymentId: referenceId,
      checkoutUrl: `/pay/offline-instructions?intentId=${params.intentId}`,
      rawPayload: { mode: "offline", type: "bank_transfer" },
    };
  },

  async createPaymentLink(params: CreateProviderLinkParams): Promise<ProviderLinkResult> {
    return {
      ok: true,
      providerLinkId: `offlink_${params.token}`,
      shortUrl: `${await paymentPublicBaseUrl()}/pay/${params.token}`,
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatusResult> {
    return {
      ok: true,
      status: "PENDING",
      providerPaymentId,
      rawPayload: { note: "Awaiting Finance Team Manual Approval" },
    };
  },

  async refundPayment(params: ProviderRefundParams): Promise<ProviderRefundResult> {
    return {
      ok: true,
      providerRefundId: `offref_${randomUUID().slice(0, 8)}`,
      status: "PROCESSED",
    };
  },

  verifyWebhookSignature(): boolean {
    return true;
  },
};

registerPaymentProvider(MockPaymentProvider);
registerPaymentProvider(OfflineBankProvider);
