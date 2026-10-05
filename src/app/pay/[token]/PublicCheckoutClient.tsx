"use client";

import { useState } from "react";
import { SerializedPaymentLink } from "@/lib/fms/payments/links";
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BrandMark from "@/components/BrandMark";
import { formatMoney } from "@/lib/fms/constants";
import { BrandName } from "@/components/platform/BrandProvider";
import { useBrand } from "@/components/platform/BrandProvider";

export default function PublicCheckoutClient({ link }: { link: SerializedPaymentLink }) {
  const brand = useBrand();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "FAILED">(
    link.status === "PAID" ? "SUCCESS" : "IDLE"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  const isExpired = link.status === "EXPIRED" || (link.expiresAt && new Date(link.expiresAt) < new Date());
  const isPaid = link.status === "PAID" || status === "SUCCESS";

  const handlePay = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const intentRes = await fetch("/api/fms/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The link's secret token authorises this payment; the server takes amount, invoice and customer from the link itself.
          linkToken: link.token,
          sourceModule: link.sourceModule,
          sourceType: "DIRECT_LINK",
          sourceId: link._id,
          invoiceId: link.invoiceId,
          customerName: link.customerName,
          customerEmail: link.customerEmail,
          customerPhone: link.customerPhone,
          amount: link.amount,
          currency: link.currency,
          paymentProvider: "mock",
        }),
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.ok) {
        throw new Error(intentData.error || "Failed to initialize payment");
      }

      const intentId = intentData.paymentIntent._id;

      // Verify payment
      const verifyRes = await fetch("/api/fms/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.ok) {
        setStatus("SUCCESS");
        setReceiptNumber(verifyData.intent?.receiptNumber || "REC-PENDING");
      } else {
        throw new Error(verifyData.error || "Payment verification failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("FAILED");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lms-surface rounded-3xl border border-border/60 bg-background/95 p-6 md:p-8 shadow-xl backdrop-blur-md dark:bg-card/90">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          <BrandMark className="size-7 shrink-0" />
          <div>
            <span className="text-lg font-bold">
              <BrandName />
            </span>
            <p className="text-xs text-muted-foreground">Financial Operations</p>
          </div>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1 text-xs">
          <ShieldCheck className="size-3.5" />
          Secure Checkout
        </Badge>
      </div>

      {/* Main Content State Machine */}
      {isPaid ? (
        <div className="py-8 text-center space-y-4">
          <div className="size-16 bg-green-500/15 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <CheckCircle2 className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
            <p className="text-sm text-muted-foreground mt-1">Thank you for your payment.</p>
          </div>
          <div className="bg-muted/40 rounded-2xl p-4 text-left border border-border/60 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-foreground">
                {formatMoney(link.amount, link.currency)}
              </span>
            </div>
            {receiptNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt No:</span>
                <span className="font-mono text-primary font-medium">{receiptNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="text-foreground font-medium">{link.customerName}</span>
            </div>
          </div>
        </div>
      ) : isExpired ? (
        <div className="py-8 text-center space-y-4">
          <div className="size-16 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Payment Link Expired</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This payment link has expired or been deactivated. Please request a new link from {brand.name}.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-6">
          {/* Payment Details */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Payment Request
            </span>
            <h2 className="text-lg font-bold text-foreground mt-0.5">{link.title}</h2>
            {link.description && (
              <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
            )}
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-muted-foreground">Total Payable</span>
              <span className="text-2xl font-black text-primary">
                {formatMoney(link.amount, link.currency)}
              </span>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span className="text-foreground font-medium">{link.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Email:</span>
                <span className="text-foreground font-medium">{link.customerEmail}</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            onClick={handlePay}
            disabled={loading}
            size="lg"
            className="w-full text-base font-semibold gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Pay Securely {formatMoney(link.amount, link.currency)}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
