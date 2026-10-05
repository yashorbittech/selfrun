"use client";

import { useState } from "react";
import { PaymentSourceModule } from "@/lib/fms/payments/intents";
import { createFmsPaymentIntent, verifyFmsPayment } from "@/lib/fms/client";
import { CreditCard, Loader2, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import BrandMark from "@/components/BrandMark";
import { formatMoney } from "@/lib/fms/constants";
import { BrandName } from "@/components/platform/BrandProvider";

export interface PayNowProps {
  sourceModule: PaymentSourceModule;
  sourceType: string;
  sourceId: string;
  amount: number;
  invoiceId?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  buttonText?: string;
  onSuccess?: (receiptNumber?: string) => void;
  className?: string;
}

export default function PayNow({
  sourceModule,
  sourceType,
  sourceId,
  amount,
  invoiceId,
  customerId,
  customerName,
  customerEmail,
  buttonText,
  onSuccess,
  className = "",
}: PayNowProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "FAILED">("IDLE");
  const [receiptNo, setReceiptNo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInitiatePayment = async () => {
    setLoading(true);
    setErrorMsg("");
    setDialogOpen(true);

    try {
      const res = await createFmsPaymentIntent({
        sourceModule,
        sourceType,
        sourceId,
        invoiceId,
        customerId,
        customerName,
        customerEmail,
        amount,
        paymentProvider: "mock",
      });

      if (!res.ok || !res.paymentIntent) {
        throw new Error(res.error || "Failed to initialize payment");
      }

      // Verify completion
      const verifyRes = await verifyFmsPayment(res.paymentIntent._id);
      if (verifyRes.ok && verifyRes.paymentIntent?.status === "SUCCESS") {
        setStatus("SUCCESS");
        const receipt = verifyRes.paymentIntent.receiptNumber || "REC-PENDING";
        setReceiptNo(receipt);
        if (onSuccess) onSuccess(receipt);
      } else {
        throw new Error(verifyRes.error || "Payment verification failed");
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
    <>
      <Button
        onClick={handleInitiatePayment}
        disabled={loading}
        size="sm"
        className={className}
      >
        <CreditCard className="size-4" />
        <span>{buttonText || `Pay ${formatMoney(amount)}`}</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandMark className="size-5 shrink-0" />
                <DialogTitle className="text-base font-bold">
                  <BrandName /> <span className="text-muted-foreground font-normal">Payment</span>
                </DialogTitle>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]">
                <ShieldCheck className="size-3" />
                Secure Checkout
              </Badge>
            </div>
          </DialogHeader>

          <div className="py-6 text-center space-y-4">
            {loading ? (
              <div className="space-y-3 py-4">
                <Loader2 className="size-10 text-primary animate-spin mx-auto" />
                <p className="text-sm font-semibold text-foreground">Processing FMS Payment...</p>
                <p className="text-xs text-muted-foreground">Connecting to Central Financial Engine</p>
              </div>
            ) : status === "SUCCESS" ? (
              <div className="space-y-3 py-4">
                <div className="size-12 bg-green-500/15 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Payment Complete</h3>
                <p className="text-xs text-muted-foreground">
                  Receipt Generated: <span className="font-mono font-medium text-primary">{receiptNo}</span>
                </p>
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(false)} className="mt-2">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <p className="text-sm text-destructive font-medium">{errorMsg || "Payment could not be completed."}</p>
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
