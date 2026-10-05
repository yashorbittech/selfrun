import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { formatInvoiceDate } from "@/lib/platform/billing/invoices";
import { getCompanyBillingHistory } from "@/lib/workspace/company";
import { formatMoney } from "@/lib/platform/billing/types";

export const metadata: Metadata = { title: "Invoices", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { paid: "Paid", unpaid: "Unpaid", void: "Void" };

export default async function BillingInvoicesPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  const { invoices, payments } = await getCompanyBillingHistory();
  const lastPayment = payments.find((p) => p.kind === "payment") ?? null;

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Plan & billing", href: "/workspace/settings/billing" }, { label: "Invoices" }]}
          title={<>Invoices</>}
          description={<>GST tax invoices for your subscription (a paid invoice is also your receipt), and any credit notes against them.</>}
        />
<div className="space-y-4">
        <GlassCard>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <FileText className="size-8 opacity-40" />
                No invoices yet — one is issued automatically after every subscription payment.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv._id} data-invoice-id={inv._id} data-invoice-number={inv.number}>
                      <TableCell>
                        <span className="font-medium">{inv.number}</span>
                        <span className="block text-xs text-muted-foreground">
                          {inv.kind === "credit_note"
                            ? `Credit note against ${inv.original?.number ?? ""}`
                            : [inv.planName, inv.interval === "yearly" ? "Yearly" : inv.interval === "monthly" ? "Monthly" : null, STATUS[inv.status]].filter(Boolean).join(" · ")}
                        </span>
                      </TableCell>
                      <TableCell>{formatInvoiceDate(inv.issuedAt)}</TableCell>
                      <TableCell className="text-xs">{inv.periodStart && inv.periodEnd ? `${formatInvoiceDate(inv.periodStart)} – ${formatInvoiceDate(inv.periodEnd)}` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {inv.kind === "credit_note" ? "− " : ""}
                        {formatMoney(inv.total, inv.currency)}
                        <span className="block text-xs text-muted-foreground">incl. GST {formatMoney(inv.taxTotal, inv.currency)}</span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/api/platform/billing/invoices/${inv._id}/pdf?download=1`}
                          aria-label={`Download ${inv.number}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Download className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Money movements, read from the same invoices and credit notes — there is no separate payments ledger. */}
        <GlassCard id="saas-payments">
          <CardHeader>
            <CardTitle className="text-xl">Payments &amp; refunds</CardTitle>
            <CardDescription>
              {lastPayment
                ? `Last payment: ${formatMoney(lastPayment.amount, lastPayment.currency)} on ${formatInvoiceDate(lastPayment.at)}.`
                : "Every payment made for your subscription, and any refund, appears here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.documentId} data-payment-kind={p.kind} data-payment-document={p.documentNumber}>
                        <TableCell>{formatInvoiceDate(p.at)}</TableCell>
                        <TableCell>{p.kind === "payment" ? "Payment" : "Refund / credit"}</TableCell>
                        <TableCell className="text-xs">{p.documentNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.reference ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.kind === "refund" ? "− " : ""}
                          {formatMoney(p.amount, p.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>
</div>
    </div>
  );
}
