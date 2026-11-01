import { getOpenAI } from "@/lib/openai";
import { getCompanyBrand } from "@/lib/platform/branding";

export interface GenerateAiReplyOptions {
  channel: "chat" | "email" | "whatsapp" | "voice";
  category: "jobs" | "interns" | "trainees" | "clients";
  contactName: string;
  contactIdentifier?: string;
  clientSource?: string; // Facebook, Instagram, Meta Ads, Upwork, Website, etc.
  serviceCategory?: string;
  budgetOrSalary?: string;
  previousMessages?: { sender: string; text: string }[];
  specificPrompt?: string;
}

export interface GeneratedAiReplyResult {
  reply: string;
  subject?: string; // For emails
  rationale: string;
  suggestedAction: string;
}

export async function generateContextualAiReply(
  opts: GenerateAiReplyOptions
): Promise<GeneratedAiReplyResult> {
  const lastMessageText =
    opts.previousMessages && opts.previousMessages.length > 0
      ? opts.previousMessages[opts.previousMessages.length - 1].text
      : opts.specificPrompt || "";

  // Call OpenAI with the real system prompt
  try {
    const openai = await getOpenAI({ timeoutMs: 8000, maxRetries: 1 });
    const systemInstruction = `You are DealFlow AI, the senior customer and talent communication assistant for ${(await getCompanyBrand()).name}.
You communicate professionally across ${opts.channel.toUpperCase()}.
Entity Type: ${opts.category.toUpperCase()} (${opts.contactName}).
${opts.clientSource ? `Lead Origin Source: ${opts.clientSource.toUpperCase()}` : ""}
${opts.serviceCategory ? `Service / Position: ${opts.serviceCategory}` : ""}
${opts.budgetOrSalary ? `Budget / Expected Salary: ${opts.budgetOrSalary}` : ""}

INSTRUCTIONS:
- You have no company knowledge source. Do not state prices, salaries, stipends, dates, policies, technologies or process steps; say you will confirm the details and follow up. Never invent or estimate them.
- Generate a polite, contextual, highly specific reply.
- Address the user's inquiry directly.
- Offer clear next steps (call time, schedule link, or document attachment).
${opts.channel === "whatsapp" ? "- Use WhatsApp markdown like *bold*, bullet points, and friendly emojis." : ""}
${opts.channel === "email" ? "- Provide a formal professional email body with greeting and sign-off." : ""}
${opts.channel === "chat" ? "- Keep it crisp, conversational, and helpful." : ""}
${opts.channel === "voice" ? "- Provide a natural conversational voice script suitable for spoken speech." : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content: `Generate the ${opts.channel} reply to ${opts.contactName}. Last query: "${lastMessageText}"`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (reply) {
      return {
        reply,
        rationale: "Generated with GPT-4o-mini from the enquiry only; the draft makes no company-specific claims, so check details before sending.",
        suggestedAction: opts.category === "clients" ? "Send Proposal & Schedule Call" : "Schedule Interview Screening",
      };
    }
  } catch (err) {
    // No canned reply is ever substituted: the person is told the draft could not be written.
    throw new Error(err instanceof Error && err.message ? err.message : "The AI assistant could not write a draft right now. Try again.");
  }
  throw new Error("The AI assistant returned an empty draft. Try again.");
}
