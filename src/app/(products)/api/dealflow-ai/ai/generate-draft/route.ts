import { NextResponse } from "next/server";
import { generateContextualAiReply } from "@/lib/dealflow-ai/ai-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      channel,
      category,
      contactName,
      contactIdentifier,
      clientSource,
      serviceCategory,
      budgetOrSalary,
      previousMessages,
      specificPrompt,
    } = body;

    if (!channel || !category || !contactName) {
      return NextResponse.json(
        { ok: false, error: "channel, category, and contactName are required." },
        { status: 400 }
      );
    }

    const result = await generateContextualAiReply({
      channel,
      category,
      contactName,
      contactIdentifier,
      clientSource,
      serviceCategory,
      budgetOrSalary,
      previousMessages,
      specificPrompt,
    });

    return NextResponse.json({
      ok: true,
      draft: result.reply,
      subject: result.subject,
      rationale: result.rationale,
      suggestedAction: result.suggestedAction,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
