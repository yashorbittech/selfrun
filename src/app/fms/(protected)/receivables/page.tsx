import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { panelNameMap } from "@/lib/platform/panels/store";
import Link from "next/link";
import {
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  QrCode,
  Link2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import { getDb } from "@/lib/mongodb";
import { Badge } from "@/components/ui/badge";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import PaymentLinkDialog from "@/components/fms/PaymentLinkDialog";
import CopyButton from "@/components/fms/CopyButton";
import { revalidatePath } from "next/cache";

export default async function CollectMoneyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const panelName = await panelNameMap();
  const sp = await searchParams;
  const user = await getCurrentFmsUser();

  const db = await getDb();

  // Fetch pending customer/student receivables from invoices & payment links
  const pendingInvoices = await db
    .collection("fms_invoices")
    .find({ status: { $in: ["SENT", "PARTIALLY_PAID", "OVERDUE", "pending"] }, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();

  // Fetch payment links created
  const activeLinks = await db
    .collection("fms_payment_links")
    .find({ status: "ACTIVE", deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  const totalOutstanding = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0);
  const overdueCount = pendingInvoices.filter((inv) => inv.status === "OVERDUE").length;

  async function createInstantCollectLinkAction(formData: FormData) {
    "use server";
    const currUser = await getCurrentFmsUser();
    if (!currUser) return;

    const name = formData.get("payerName") as string;
    const amount = Number(formData.get("amount") || 0);
    const purpose = formData.get("purpose") as string;
    const portal = formData.get("portal") as string; // TMS, PMS, DIRECT

    if (!name || amount <= 0) return;

    const token = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    const newLinkDoc: Record<string, unknown> = {
      _id: `PL-${Date.now()}`,
      token,
      title: purpose || "Payment Collection",
      amount: amount,
      currency: "INR",
      customerName: name,
      sourceModule: portal || "DIRECT",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currUser.id,
      deletedAt: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_payment_links").insertOne(newLinkDoc as any);

    revalidatePath("/fms/receivables");
    revalidatePath("/fms/payment-links");
  }

  return (
    <div className="relative space-y-6">

      <PanelPageHeader
        title={<>Collect Money</>}
        description={<>Generate 1-click payment links &amp; send instant payment requests to Students (TMS) or Clients (PMS).</>}
        actions={
            <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
          <Sparkles className="size-3.5 mr-1" />
          UPI QR Code &amp; Card Gateway Active
        </Badge>
          }
        />

      <PanelListFilters>

      {/* Summary Cards */}
      <KpiGrid>
        <KpiCard
          label="Total Money to Collect"
          value={totalOutstanding}
          format="currency"
          accent
          icon={<ArrowDownLeft className="size-4" />}
        />
        <KpiCard
          label="Pending Customer Invoices"
          value={pendingInvoices.length}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Active Payment Links"
          value={activeLinks.length}
          icon={<Link2 className="size-4" />}
        />
        <KpiCard
          label="Overdue Invoices"
          value={overdueCount}
          tone={overdueCount > 0 ? "down" : undefined}
          icon={<AlertCircle className="size-4" />}
        />
      </KpiGrid>

      {/* 1-CLICK INSTANT COLLECT LINK GENERATOR */}
      <GlassCard className="p-5 border-border/40 bg-card/60 backdrop-blur-md">
        <div className="border-b border-border/40 pb-3 mb-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            1-Click Collect Money Request
          </h3>
          <p className="text-xs text-muted-foreground">Type student/client name &amp; amount to instantly create and send a payment link</p>
        </div>

        <form action={createInstantCollectLinkAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Payer / Customer / Student Name *</label>
            <input
              type="text"
              name="payerName"
              required
              placeholder="e.g. Rahul Sharma / ABC Tech"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Amount to Collect (₹) *</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              required
              placeholder="e.g. 25000"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Purpose / Title</label>
            <input
              type="text"
              name="purpose"
              placeholder="e.g. AI Batch Course Fee / Milestone 2"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Target Portal / Channel</label>
            <select
              name="portal"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="TMS">{panelName("tms", "TMS")} Student Portal (Course Fee)</option>
              <option value="PMS">{panelName("pms", "PMS")} Client Portal (Project Invoice)</option>
              <option value="DIRECT">Direct Payment Link (Public URL)</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 flex items-center gap-1.5 shadow-sm"
            >
              <Link2 className="size-4" />
              Generate &amp; Send Payment Link Now
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ACTIVE PAYMENT LINKS LISTING WITH DIRECT CTA */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Active Collection Links ({activeLinks.length})
          </h3>
          <span className="text-xs text-muted-foreground">Click link to copy or share with customer</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Payer / Customer</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action CTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {activeLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No active collection links. Use the form above to generate your first link.
                  </td>
                </tr>
              ) : (
                activeLinks.map((l) => (
                  <tr key={l._id.toString()} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground">{l.customerName || "Customer"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.title || "Fee Collection"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="uppercase text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                        {l.sourceModule || "DIRECT"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">₹{(l.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {l.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a
                        href={`/pay/${l.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1 text-[11px] font-bold text-foreground hover:bg-primary/10 transition-colors border border-border/60"
                      >
                        Open Link ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* PENDING CUSTOMER & STUDENT INVOICES TABLE WITH DIRECT CTA */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Pending Money to Collect ({pendingInvoices.length})
          </h3>
          <span className="text-xs text-muted-foreground">Open invoices awaiting student/client payment</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Payer / Customer</th>
                <th className="px-4 py-3">Source Panel</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Link</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    All customer and student payments are collected! No pending invoices.
                  </td>
                </tr>
              ) : (
                pendingInvoices.map((inv) => {
                  const isPaid = inv.status === "completed" || inv.status === "reconciled";
                  const isLinkSent = inv.status === "link_sent";
                  const invId = inv._id.toString();
                  return (
                    <tr key={invId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{inv.invoiceNumber || invId.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{inv.customerName || "Customer"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="uppercase text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                          {inv.sourceModule || "PMS"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">₹{(inv.amount || inv.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={isPaid ? "default" : isLinkSent ? "secondary" : "outline"}
                          className={`text-[10px] capitalize ${
                            isPaid
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : isLinkSent
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              : ""
                          }`}
                        >
                          {isPaid ? "✓ Paid" : isLinkSent ? "🔗 Link Sent" : inv.status || "pending"}
                        </Badge>
                      </td>
                      {/* Payment Link column */}
                      <td className="px-4 py-3">
                        {inv.paymentLink ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={inv.paymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-primary underline underline-offset-2 hover:opacity-80 truncate max-w-[120px] block"
                            >
                              {inv.paymentLink.replace(/^https?:\/\//, "").slice(0, 22)}…
                            </a>
                            <CopyButton value={inv.paymentLink} label="Link" />
                            <a href={inv.paymentLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[10px]">Not generated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" />
                            Collected
                          </span>
                        ) : (
                          <PaymentLinkDialog
                            defaultTitle={`Invoice: ${inv.invoiceNumber || "Payment"}`}
                            defaultCustomerName={inv.customerName || "Customer"}
                            defaultAmount={inv.amount || inv.totalAmount || 0}
                            defaultSourceModule={inv.sourceModule || "DIRECT"}
                            sourceTransactionId={invId}
                            triggerLabel={isLinkSent ? "Resend Link" : "Send Payment Link"}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      </PanelListFilters>
    </div>
  );
}
