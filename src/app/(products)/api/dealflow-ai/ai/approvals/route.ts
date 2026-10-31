import { NextResponse } from "next/server";
import {
  listAiApprovalDrafts,
  resolveAiApprovalDraft,
  createAiApprovalDraft,
} from "@/lib/dealflow-ai/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || "all";
  const status = searchParams.get("status") || "all";
  const entityType = searchParams.get("entityType") || "all";

  const drafts = listAiApprovalDrafts({ channel, status, entityType });
  return NextResponse.json({ ok: true, drafts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, draftId, editedText, reviewerName } = body;

    if (!draftId || !action) {
      return NextResponse.json(
        { ok: false, error: "draftId and action ('approve' | 'edit_and_approve' | 'reject') are required." },
        { status: 400 }
      );
    }

    const res = resolveAiApprovalDraft(draftId, action, editedText, reviewerName);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Draft not found or already resolved." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      draft: res.draft,
      sentMessage: res.sentMessage,
      message:
        action === "reject"
          ? "AI response draft rejected."
          : action === "edit_and_approve"
            ? "AI response draft edited and approved! Dispatched to communication channel."
            : "AI response approved and dispatched to channel successfully!",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
