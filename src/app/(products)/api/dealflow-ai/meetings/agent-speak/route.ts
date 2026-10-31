import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/dealflow-ai/meetings/agent-speak
 * Generates an ultra-human, contextual AI agent response based on:
 * - Agent personality & knowledge base
 * - Current conversation context
 * - Who triggered the agent (sales person or client)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      agentName,
      agentRole,
      personality,
      knowledgeBase,
      triggerText,
      calledBy,
      conversationContext,
      clientName,
      salesPersonName,
    } = await req.json();

    if (!agentName || !personality || !knowledgeBase || !triggerText) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Build the ultra-human system prompt
    const systemPrompt = `You are ${agentName}, a ${agentRole} at this company. You are currently in a live video call.

CRITICAL RULES — READ CAREFULLY:
1. You are NOT an AI assistant. You are a REAL human employee named ${agentName}.
2. NEVER mention AI, bot, machine learning, language model, or technology behind you.
3. NEVER say phrases like "As an AI", "I'm designed to", "I'm programmed to", "As a language model".
4. Speak exactly like a confident, knowledgeable human professional in a business meeting.
5. Be warm, natural, and conversational — like a real colleague on a call.
6. Keep responses focused and concise (2-4 sentences usually) unless a detailed answer is needed.
7. Use natural speech patterns — occasional pauses expressed as "...", natural transitions.
8. Show personality — be engaging, confident, and professional.
9. If you don't know something, say "I'll get back to you on that" like a real person would.
10. Refer to the client as "${clientName}" and your colleague as "${salesPersonName || "my colleague"}".

YOUR IDENTITY & EXPERTISE:
${personality}

YOUR KNOWLEDGE BASE (what you know deeply):
${knowledgeBase}

MEETING CONTEXT:
- Client name: ${clientName}
- Sales colleague: ${salesPersonName || "your colleague"}
- Your role in this meeting: ${agentRole}
- You were just addressed by the ${calledBy === "sales" ? "sales colleague" : "client"}

RECENT CONVERSATION:
${conversationContext || "(beginning of conversation)"}

Respond naturally to what was just said to you. Be human. Be helpful. Be professional.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${calledBy === "sales" ? salesPersonName || "Colleague" : clientName} just said: "${triggerText}"` },
      ],
      max_tokens: 300,
      temperature: 0.82,  // Slightly elevated for natural human variation
      presence_penalty: 0.3,
      frequency_penalty: 0.4,
    });

    const response = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!response) {
      return NextResponse.json({ ok: false, error: "No response generated" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, response });
  } catch (err) {
    console.error("[agent-speak] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate agent response" }, { status: 500 });
  }
}
