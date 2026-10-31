import { NextResponse } from "next/server";
import { sendOmnichannelMessage } from "@/lib/dealflow-ai/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      entityType,
      entityId,
      recipientEmail,
      subject,
      body: emailBody,
      senderName,
      attachments,
    } = body;

    if (!recipientEmail || !subject || !emailBody) {
      return NextResponse.json(
        { ok: false, error: "recipientEmail, subject, and body are required." },
        { status: 400 }
      );
    }

    const msg = sendOmnichannelMessage({
      pipeline: (entityType === "applicant" ? "jobs" : "clients"),
      contactId: entityId || "CLIENT-FB-01",
      channel: "email",
      direction: "outbound",
      senderName: senderName || "DealFlow AI Operations",
      senderIdentifier: "deals@selfrun.in",
      recipientIdentifier: recipientEmail,
      subject,
      body: emailBody,
      attachments: attachments || [],
    });

    return NextResponse.json({
      ok: true,
      message: `Email successfully dispatched to ${recipientEmail}`,
      email: msg,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
