import "server-only";
import type { TemplateBlock, LpmsViewer } from "@/lib/lpms/types";
import { getOpenAI } from "@/lib/openai";

interface GenerateOptions {
  prompt: string;
  makerTypeId?: string;
  templateId?: string;
  fieldValues?: Record<string, unknown>;
  documentTitle?: string;
  userId: string;
  companyId: string;
}

interface GenerateResult {
  ok: true;
  blocks: TemplateBlock[];
  tokensUsed: number;
}

export async function generateLpmsDocument(
  opts: GenerateOptions,
  _viewer?: LpmsViewer
): Promise<GenerateResult | { ok: false; error: string }> {
  let openai: any;
  try {
    openai = await getOpenAI();
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "OpenAI client not configured" };
  }

  const systemPrompt = `You are a professional legal and business document writer.
Generate a structured document based on the user's request.
Return a JSON array of document blocks using ONLY these block types:
- { type: "heading", level: 1|2|3|4, content: "..." }
- { type: "paragraph", content: "..." }
- { type: "bullets", items: ["...", "..."] }
- { type: "numbered", items: ["...", "..."] }
- { type: "note", variant: "info"|"warning"|"important", content: "..." }
- { type: "divider" }

Use variables with {{variable.name}} syntax for dynamic data.
Keep the document professional, clear and legally appropriate.
Return ONLY the JSON array, no other text.`;

  const userMessage = [
    opts.prompt,
    opts.documentTitle && `Document title: ${opts.documentTitle}`,
    opts.fieldValues &&
      Object.keys(opts.fieldValues).length > 0 &&
      `Known field values: ${JSON.stringify(opts.fieldValues)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const tokensUsed = response.usage?.total_tokens ?? 0;

    let rawBlocks: any[];
    try {
      const clean = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      rawBlocks = JSON.parse(clean);
      if (!Array.isArray(rawBlocks)) rawBlocks = [];
    } catch {
      rawBlocks = [{ type: "paragraph", content }];
    }

    const { randomUUID } = await import("node:crypto");
    const blocks: TemplateBlock[] = rawBlocks.map((b: any) => ({
      id: randomUUID(),
      ...b,
    }));

    return { ok: true, blocks, tokensUsed };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "AI generation failed",
    };
  }
}
