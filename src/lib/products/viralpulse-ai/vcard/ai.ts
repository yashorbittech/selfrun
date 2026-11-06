import "server-only";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { getSettings } from "@/lib/products/viralpulse-ai/settings";
import { resolveForCall } from "@/lib/products/viralpulse-ai/models";
import type { VCardDetail, VCardStyle, VCardLayout, VCardColorScheme } from "./types";
import { VCARD_COLOR_SCHEME_META } from "./types";

export interface VCardBriefInput {
  name: string;
  jobTitle: string;
  company: string;
  industry?: string;
  targetAudience?: string;
  coreServices?: string;
  achievements?: string;
  personality?: string;
  preferredLayout?: VCardLayout;
  preferredColorScheme?: VCardColorScheme;
}

export interface GeneratedVCardResult {
  title: string;
  bio: string;
  tagline: string;
  layout: VCardLayout;
  colorScheme: VCardColorScheme;
  style: VCardStyle;
  sections: Array<{
    id: string;
    type: "bio" | "services" | "skills" | "cta";
    title: string;
    content: Record<string, unknown>;
    hidden: boolean;
  }>;
  meta: { description: string; keywords: string };
}

export interface VCardContext {
  name: string;
  jobTitle: string;
  company: string;
  industry?: string;
  layout?: VCardLayout;
  colorScheme?: VCardColorScheme;
}

function newSectionId() {
  return "vs_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function colorSchemeToStyle(scheme: VCardColorScheme): VCardStyle {
  const meta = VCARD_COLOR_SCHEME_META[scheme] || VCARD_COLOR_SCHEME_META["professional-blue"];
  return {
    primaryColor: meta.primary,
    secondaryColor: meta.secondary,
    backgroundColor: meta.bg,
    textColor: meta.text,
    accentColor: meta.accent,
    fontFamily: "Inter",
    borderRadius: "lg",
  };
}

function pickLayoutForIndustry(industry: string, jobTitle: string): VCardLayout {
  const lc = (industry + " " + jobTitle).toLowerCase();
  if (lc.includes("creative") || lc.includes("design") || lc.includes("art") || lc.includes("media"))
    return "creative";
  if (lc.includes("ceo") || lc.includes("director") || lc.includes("executive") || lc.includes("president"))
    return "executive";
  if (lc.includes("consult") || lc.includes("finance") || lc.includes("legal") || lc.includes("law"))
    return "classic";
  if (lc.includes("tech") || lc.includes("engineer") || lc.includes("software") || lc.includes("developer"))
    return "modern";
  if (lc.includes("coach") || lc.includes("trainer") || lc.includes("speaker") || lc.includes("influencer"))
    return "bold";
  return "minimal";
}

function pickColorSchemeForIndustry(industry: string, jobTitle: string): VCardColorScheme {
  const lc = (industry + " " + jobTitle).toLowerCase();
  if (lc.includes("health") || lc.includes("medical") || lc.includes("doctor") || lc.includes("pharma"))
    return "forest-green";
  if (lc.includes("finance") || lc.includes("bank") || lc.includes("invest") || lc.includes("wealth"))
    return "professional-blue";
  if (lc.includes("law") || lc.includes("legal") || lc.includes("attorney"))
    return "midnight-black";
  if (lc.includes("creative") || lc.includes("design") || lc.includes("art"))
    return "coral-orange";
  if (lc.includes("ceo") || lc.includes("executive") || lc.includes("luxury"))
    return "midnight-black";
  if (lc.includes("coach") || lc.includes("wellness") || lc.includes("beauty"))
    return "rose-gold";
  if (lc.includes("tech") || lc.includes("software"))
    return "royal-purple";
  return "professional-blue";
}

// ── Main AI Content Generator ─────────────────────────────────────────────────

export async function generateVCardContent(
  input: VCardBriefInput
): Promise<GeneratedVCardResult> {
  const { name, jobTitle, company } = input;
  const industry = input.industry?.trim() || jobTitle;
  const services = input.coreServices?.trim() || "";
  const audience = input.targetAudience?.trim() || "Professionals and clients";
  const personality = input.personality?.trim() || "Professional and approachable";

  const layout = input.preferredLayout || pickLayoutForIndustry(industry, jobTitle);
  const colorScheme = input.preferredColorScheme || pickColorSchemeForIndustry(industry, jobTitle);
  const style = colorSchemeToStyle(colorScheme);

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are an expert personal branding consultant and copywriter.
Generate professional visiting card content for:
- Name: "${name}"
- Job Title: "${jobTitle}"
- Company: "${company}"
- Industry: "${industry}"
- Target Audience: "${audience}"
- Core Services/Expertise: "${services}"
- Key Achievements: "${input.achievements || "Not specified"}"
- Personality/Tone: "${personality}"

Create compelling, authentic, and professional content. Return strictly valid JSON:
{
  "tagline": "One punchy tagline (max 10 words, no clichés)",
  "bio": "Professional bio (2-3 sentences, first person, mentions key expertise and value proposition)",
  "servicesTitle": "Services section heading",
  "servicesList": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "skillsList": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "ctaHeadline": "Call-to-action headline (action-oriented, 5-8 words)",
  "ctaBody": "CTA supporting text (1 sentence)",
  "ctaButton": "CTA button label (2-3 words)",
  "metaDescription": "SEO meta description (max 160 chars)"
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You generate visiting card content. Return strictly valid JSON." },
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.75,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const p = JSON.parse(text);
        return {
          title: `${name}'s Visiting Card`,
          bio: p.bio || `${jobTitle} at ${company}.`,
          tagline: p.tagline || `${jobTitle} at ${company}`,
          layout,
          colorScheme,
          style,
          sections: [
            {
              id: newSectionId(),
              type: "services",
              title: p.servicesTitle || "Services",
              content: {
                items: (p.servicesList || []).map((s: string) => ({ label: s })),
              },
              hidden: false,
            },
            {
              id: newSectionId(),
              type: "skills",
              title: "Expertise",
              content: {
                items: (p.skillsList || []).map((s: string) => ({ label: s })),
              },
              hidden: false,
            },
            {
              id: newSectionId(),
              type: "cta",
              title: p.ctaHeadline || "Let's Connect",
              content: {
                headline: p.ctaHeadline || "Let's Work Together",
                body: p.ctaBody || `Reach out to ${name} to discuss how we can collaborate.`,
                buttonLabel: p.ctaButton || "Get in Touch",
              },
              hidden: false,
            },
          ],
          meta: {
            description: p.metaDescription || `${name} — ${jobTitle} at ${company}. Connect professionally.`,
            keywords: `${name}, ${jobTitle}, ${company}, ${industry}`,
          },
        };
      }
    }
  } catch (err) {
    console.warn("[generateVCardContent] OpenAI failed, using structured fallback:", err);
  }

  // Structured fallback
  const servicesList = services
    ? services.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [`${industry} Consulting`, "Strategic Advisory", "Expert Analysis", "Professional Support"];

  return {
    title: `${name}'s Visiting Card`,
    bio: `${name} is a ${jobTitle} at ${company}, specializing in ${services || industry} and delivering exceptional results for ${audience}.`,
    tagline: `${jobTitle} at ${company}`,
    layout,
    colorScheme,
    style,
    sections: [
      {
        id: newSectionId(),
        type: "services",
        title: "Services",
        content: { items: servicesList.map((s) => ({ label: s })) },
        hidden: false,
      },
      {
        id: newSectionId(),
        type: "skills",
        title: "Expertise",
        content: {
          items: [industry, jobTitle, "Leadership", "Strategy", "Innovation", "Client Success"]
            .filter(Boolean)
            .slice(0, 6)
            .map((s) => ({ label: s })),
        },
        hidden: false,
      },
      {
        id: newSectionId(),
        type: "cta",
        title: "Let's Connect",
        content: {
          headline: "Let's Work Together",
          body: `Reach out to discuss how ${name} can help you achieve your goals.`,
          buttonLabel: "Get in Touch",
        },
        hidden: false,
      },
    ],
    meta: {
      description: `${name} — ${jobTitle} at ${company}. ${services || industry} specialist.`,
      keywords: `${name}, ${jobTitle}, ${company}, ${industry}`,
    },
  };
}

// ── AI Field Rewriter ─────────────────────────────────────────────────────────

export async function aiUpdateVCardField(
  field: string,
  currentValue: string,
  prompt: string,
  context: VCardContext
): Promise<string> {
  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          {
            role: "system",
            content: `You rewrite visiting card fields for ${context.name}, ${context.jobTitle} at ${context.company}. Return only the new text value, no quotes, no explanation.`,
          },
          {
            role: "user",
            content: `Field: "${field}"\nCurrent value: "${currentValue}"\nInstruction: "${prompt}"\n\nReturn only the improved value:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return res.choices[0]?.message?.content?.trim() || currentValue;
    }
  } catch (err) {
    console.warn("[aiUpdateVCardField] OpenAI failed:", err);
  }
  return currentValue;
}

// ── AI Layout Suggestion ──────────────────────────────────────────────────────

export async function aiSuggestLayout(
  context: VCardContext
): Promise<{ layout: VCardLayout; colorScheme: VCardColorScheme; rationale: string }> {
  const layout = pickLayoutForIndustry(context.industry || context.jobTitle, context.jobTitle);
  const colorScheme = pickColorSchemeForIndustry(context.industry || context.jobTitle, context.jobTitle);

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          {
            role: "system",
            content: "You suggest visiting card layout and color scheme. Return strictly valid JSON.",
          },
          {
            role: "user",
            content: `Person: ${context.name}, ${context.jobTitle} at ${context.company} (${context.industry || "general"} industry).
Layouts: classic, modern, minimal, bold, creative, executive.
Color schemes: professional-blue, midnight-black, elegant-white, forest-green, royal-purple, rose-gold, coral-orange, slate-gray.
Return JSON: { "layout": "...", "colorScheme": "...", "rationale": "One sentence why" }`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const p = JSON.parse(text);
        if (p.layout && p.colorScheme) {
          return {
            layout: p.layout as VCardLayout,
            colorScheme: p.colorScheme as VCardColorScheme,
            rationale: p.rationale || "AI-selected for your industry and role.",
          };
        }
      }
    }
  } catch (err) {
    console.warn("[aiSuggestLayout] OpenAI failed:", err);
  }

  return {
    layout,
    colorScheme,
    rationale: `${layout} layout and ${colorScheme} color scheme selected for your industry.`,
  };
}

// ── Conversational AI Chat for Visiting Card ──────────────────────────────────

export interface VCardChatResult {
  reply: string;
  patch?: Partial<Pick<VCardDetail, "name" | "jobTitle" | "company" | "bio" | "layout" | "colorScheme" | "style" | "contact" | "branding" | "sections">>;
  suggestedPrompts?: string[];
}

export async function aiChatVCard(
  message: string,
  vcard: VCardDetail,
  history: Array<{ role: string; content: string }>
): Promise<VCardChatResult> {
  const lc = message.toLowerCase();

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are the AI Visiting Card Copilot for ViralPulse AI.
You help users update their professional visiting card via chat.

Current Card:
- Name: "${vcard.name}"
- Job Title: "${vcard.jobTitle}"
- Company: "${vcard.company}"
- Bio: "${vcard.bio || "Not set"}"
- Layout: "${vcard.layout}"
- Color Scheme: "${vcard.colorScheme}"
- Tagline: "${vcard.branding.tagline || "Not set"}"
- Contact: ${JSON.stringify(vcard.contact)}

User message: "${message}"

Classify the user's intent and return strictly valid JSON:
{
  "reply": "Friendly, helpful explanation of what you did or answered.",
  "action": "update_field" | "change_layout" | "change_colors" | "update_contact" | "none",
  "field"?: "name" | "jobTitle" | "company" | "bio" | "tagline",
  "newValue"?: "the new value for the field",
  "layout"?: "classic|modern|minimal|bold|creative|executive",
  "colorScheme"?: "professional-blue|midnight-black|elegant-white|forest-green|royal-purple|rose-gold|coral-orange|slate-gray",
  "contactPatch"?: { "email"?: "...", "phone"?: "...", "linkedin"?: "...", "website"?: "...", "whatsapp"?: "..." },
  "suggestedPrompts": ["Prompt 1", "Prompt 2", "Prompt 3"]
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You are the ViralPulse AI Visiting Card Chat Assistant. Return strictly valid JSON." },
          ...history.slice(-6).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const p = JSON.parse(text);
        const patch: VCardChatResult["patch"] = {};

        if (p.action === "update_field" && p.field && p.newValue) {
          if (p.field === "tagline") {
            patch.branding = { ...vcard.branding, tagline: p.newValue };
          } else if (["name", "jobTitle", "company", "bio"].includes(p.field)) {
            (patch as Record<string, unknown>)[p.field] = p.newValue;
          }
        }
        if (p.action === "change_layout" && p.layout) {
          patch.layout = p.layout as VCardLayout;
        }
        if (p.action === "change_colors" && p.colorScheme) {
          patch.colorScheme = p.colorScheme as VCardColorScheme;
          const colorMeta = VCARD_COLOR_SCHEME_META[p.colorScheme as VCardColorScheme];
          if (colorMeta) {
            patch.style = {
              ...vcard.style,
              primaryColor: colorMeta.primary,
              secondaryColor: colorMeta.secondary,
              backgroundColor: colorMeta.bg,
              textColor: colorMeta.text,
              accentColor: colorMeta.accent,
            };
          }
        }
        if (p.action === "update_contact" && p.contactPatch) {
          patch.contact = { ...vcard.contact, ...p.contactPatch };
        }

        return {
          reply: p.reply || "Done! Your visiting card has been updated.",
          patch: Object.keys(patch).length > 0 ? patch : undefined,
          suggestedPrompts: p.suggestedPrompts || [
            "Make my bio more confident",
            "Switch to executive layout",
            "Change colors to midnight black",
          ],
        };
      }
    }
  } catch (err) {
    console.warn("[aiChatVCard] OpenAI failed:", err);
  }

  // Local heuristic fallback
  if (lc.includes("bio") || lc.includes("about") || lc.includes("description")) {
    const updated = await aiUpdateVCardField("bio", vcard.bio || "", message, {
      name: vcard.name, jobTitle: vcard.jobTitle, company: vcard.company,
    });
    return {
      reply: "I've updated your professional bio.",
      patch: { bio: updated },
      suggestedPrompts: ["Make tagline punchier", "Change layout to modern", "Add my LinkedIn"],
    };
  }

  if (lc.includes("layout") || lc.includes("classic") || lc.includes("modern") ||
      lc.includes("minimal") || lc.includes("bold") || lc.includes("creative") || lc.includes("executive")) {
    const layouts: VCardLayout[] = ["classic", "modern", "minimal", "bold", "creative", "executive"];
    const found = layouts.find((l) => lc.includes(l));
    if (found) {
      return {
        reply: `Switched your card to the ${found} layout!`,
        patch: { layout: found },
        suggestedPrompts: ["Change colors", "Update my tagline", "Make bio shorter"],
      };
    }
  }

  if (lc.includes("dark") || lc.includes("black") || lc.includes("midnight")) {
    return {
      reply: "Applied the Midnight Black color scheme to your card.",
      patch: {
        colorScheme: "midnight-black",
        style: { ...vcard.style, primaryColor: "#1e293b", backgroundColor: "#0f172a", textColor: "#f8fafc", secondaryColor: "#334155", accentColor: "#334155" },
      },
      suggestedPrompts: ["Switch to executive layout", "Update tagline", "Add website URL"],
    };
  }

  return {
    reply: `I'm your AI Visiting Card Copilot for **${vcard.name}**'s card. I can update your bio, tagline, layout, colors, or contact info. Just tell me what to change!`,
    suggestedPrompts: [
      "Make my bio more confident and punchy",
      "Switch to executive layout",
      "Change colors to midnight black",
      "Add my LinkedIn profile",
      "Make tagline shorter",
    ],
  };
}
