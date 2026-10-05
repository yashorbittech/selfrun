import "server-only";
import { getDb } from "@/lib/mongodb";
import { recordAudit } from "@/lib/fms/audit";
import { newId } from "@/lib/fms/db";

export interface PaymentReminderLog {
  _id: string;
  invoiceId?: string;
  paymentLinkId?: string;
  customerEmail: string;
  reminderType: "DUE_7D" | "DUE_3D" | "DUE_TODAY" | "OVERDUE";
  sentAt: Date;
  status: "SENT" | "FAILED";
}

export async function processPaymentReminders(): Promise<{ processed: number; sent: number }> {
  const db = await getDb();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const overdueInvoices = await db.collection("fms_invoices").find({
    status: { $in: ["sent", "partially_paid"] },
    dueDate: { $lt: todayStr },
    deletedAt: null,
  }).toArray();

  let sent = 0;
  for (const inv of overdueInvoices) {
    const logDoc: PaymentReminderLog = {
      _id: newId(),
      invoiceId: String(inv._id),
      customerEmail: inv.customerName || "customer@example.com",
      reminderType: "OVERDUE",
      sentAt: now,
      status: "SENT",
    };
    await db.collection("fms_payment_reminders").insertOne(logDoc as any);
    sent++;
  }

  await recordAudit({
    actorId: "system",
    actorEmail: "scheduler@internal.invalid",
    action: "reminder_cron",
    entity: "payment_reminders",
    entityId: `rem_${todayStr}`,
    entityLabel: `Reminders ${todayStr}`,
    summary: `Processed ${overdueInvoices.length} payment reminders`,
  });

  return { processed: overdueInvoices.length, sent };
}
