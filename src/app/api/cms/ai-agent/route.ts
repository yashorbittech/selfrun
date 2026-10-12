import { NextRequest, NextResponse } from "next/server";
import type OpenAI from "openai";
import { getViewer } from "@/lib/cms/viewer";
import { limitOr429 } from "@/lib/security/rate-limit";
import { getOpenAI } from "@/lib/openai";
import { setAiFeature } from "@/lib/platform/billing/ai-usage-log";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";
import { getCompanyBrand } from "@/lib/platform/branding";
import { BillingLimitError } from "@/lib/platform/billing/enforce";
import { MUTATING_TOOLS, TOOL_SCHEMAS, runTool } from "@/lib/cms/ai-agent/tools";
import { getSiteInfoForEdit } from "@/lib/cms/site-info";

export const maxDuration = 300;

const MODEL = () => process.env.CMS_AI_MODEL || "gpt-4.1";
const MAX_STEPS = 12;

type Msg = { role: "user" | "assistant"; content: string };

function system(name: string, brand: string) {
  return `You are the website assistant inside the CMS of "${name}". You can read the whole website and change any part of it with your tools, exactly as a person in the CMS can: page content and sections, new pages, menus, the footer, site identity and contact details, colours, fonts and layout, and photos. You work only on this company's own website.

How to work:
- Look before you change. Call site_overview and/or get_page first, and describe_section_type before setting fields of a section type you have not used, so you use the real field keys. Never guess ids.
- Make the change the person asked for, completely, then PUBLISH the affected pages with publish_page so it is live, unless they asked to keep it as a draft. Say plainly what you changed (page, section, what it now says).
- Be truthful. Never invent facts about the business: no statistics, years, clients, reviews, awards, prices, addresses, phone numbers or guarantees. If the person gives you a fact, use it exactly. If you need a fact you do not have (a price, an address, opening hours), ask for it instead of making it up. Write copy in the voice of this kind of business, concrete and plain, never filler.
- Ask one short question when a request is genuinely ambiguous; otherwise just do it.
- Before deleting a page or removing several things, confirm in the chat first.
- If a tool says you lack permission or something failed, tell the person plainly and what they can do instead. Do not retry the same failing call.
- Reply in the same language the person writes in (English, Hindi or Hinglish). Keep replies short.
- Theme changes (colours, fonts, header, footer, cards, density) never change the content.
${brand ? `\nWhat this business says about itself: ${brand}` : ""}`;
}

export async function POST(req: NextRequest) {
  const limited = await limitOr429(req, "cms-ai-agent", 40, 600);
  if (limited) return limited;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (await isPlatformOwnerContext()) return NextResponse.json({ error: "This assistant is for company websites." }, { status: 403 });

  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const history = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()).slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!history.length || history[history.length - 1].role !== "user") return NextResponse.json({ error: "Send a message first." }, { status: 400 });

  try {
    setAiFeature("CMS assistant");
    const client = await getOpenAI();
    const [brand, info] = await Promise.all([getCompanyBrand(), getSiteInfoForEdit()]);
    const about = [info.footer.about, info.footer.ctaText].filter(Boolean).join(" ");
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: system(brand.name, about) }, ...history];
    const changes: { tool: string; ok: boolean }[] = [];

    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await client.chat.completions.create({ model: MODEL(), temperature: 0.3, messages, tools: TOOL_SCHEMAS, tool_choice: "auto", parallel_tool_calls: false });
      const msg = res.choices[0]?.message;
      if (!msg) break;
      messages.push(msg);
      const calls = msg.tool_calls ?? [];
      if (!calls.length) return NextResponse.json({ reply: msg.content ?? "Done.", changes });
      for (const call of calls) {
        if (call.type !== "function") continue;
        const out = await runTool(call.function.name, call.function.arguments, viewer);
        if (MUTATING_TOOLS.has(call.function.name)) changes.push({ tool: call.function.name, ok: !("error" in out) });
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out).slice(0, 24_000) });
      }
    }
    return NextResponse.json({ reply: "I made progress but ran out of steps. Tell me to continue and I'll pick up from here.", changes });
  } catch (e) {
    if (e instanceof BillingLimitError) return NextResponse.json({ error: e.message }, { status: 402 });
    console.error("[cms-ai-agent]", e);
    return NextResponse.json({ error: e instanceof Error && /isn't available|not connected/i.test(e.message) ? e.message : "The assistant could not answer. Please try again." }, { status: 500 });
  }
}
