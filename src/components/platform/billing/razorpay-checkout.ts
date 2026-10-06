"use client";

/**
 * Razorpay Checkout for subscriptions, loaded from Razorpay's CDN only when
 * the user actually clicks to pay (never on page load). The handler's
 * response is only a claim — the server verifies its signature and re-reads
 * the subscription from Razorpay before anything is activated.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (resp: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout needs a browser"));
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Couldn't load Razorpay Checkout. Check your connection or ad blocker and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

/** Opens Checkout; resolves with the handler response, or null when the user closes it. */
export async function openSubscriptionCheckout(opts: {
  key: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  onPaymentFailed?: (message: string) => void;
}): Promise<RazorpayHandlerResponse | null> {
  await loadRazorpayCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay Checkout didn't load.");
  return new Promise((resolve) => {
    const rzp = new Razorpay({
      key: opts.key,
      subscription_id: opts.subscriptionId,
      name: opts.name,
      description: opts.description,
      prefill: opts.prefill,
      // The company's theme colour (the active theme's --primary), so checkout matches the panel.
      theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || undefined },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on("payment.failed", (resp) => opts.onPaymentFailed?.(resp.error?.description ?? "The payment failed."));
    rzp.open();
  });
}
