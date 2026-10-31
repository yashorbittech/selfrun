import { NextResponse } from "next/server";
import {
  triggerWhatsAppNotification,
  listWhatsAppNotifications,
  sendOmnichannelMessage,
} from "@/lib/dealflow-ai/store";

export async function GET() {
  const notifications = listWhatsAppNotifications();
  return NextResponse.json({ ok: true, notifications });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, triggerType, entityId, recipientPhone, name, position, company, service, budget, textMessage } = body;

    if (action === "send_message") {
      if (!recipientPhone || !textMessage) {
        return NextResponse.json({ ok: false, error: "recipientPhone and textMessage are required." }, { status: 400 });
      }

      const msg = sendOmnichannelMessage({
        pipeline: (body.entityType === "applicant" ? "jobs" : "clients"),
        contactId: entityId || "CLIENT-FB-01",
        channel: "whatsapp",
        direction: "outbound",
        senderName: "DealFlow AI Operations",
        senderIdentifier: "+91 80000 12345",
        recipientIdentifier: recipientPhone,
        body: textMessage,
      });

      return NextResponse.json({ ok: true, message: "WhatsApp message sent successfully!", chatMessage: msg });
    }

    // Default: trigger automated WhatsApp notification
    const notif = triggerWhatsAppNotification({
      triggerType: triggerType || "new_lead",
      entityId: entityId || "LEAD-MANUAL",
      recipientPhone: recipientPhone || "+91 98000 00000",
      name: name || "Demo Contact",
      company,
      service,
      budget,
      position,
    });

    return NextResponse.json({
      ok: true,
      message: `WhatsApp notification successfully triggered for ${triggerType === "new_lead" ? "New Lead" : "New Job Application"}!`,
      notification: notif,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
