import "server-only";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { getSettings } from "@/lib/products/viralpulse-ai/settings";
import { resolveForCall } from "@/lib/products/viralpulse-ai/models";
import { getTemplatePreset } from "./templates";
import { defaultSections, defaultTheme, defaultMeta, makeSection } from "./defaults";
import type {
  BrochureCategory,
  BrochureSection,
  BrochureTheme,
  HeroSection,
  OverviewSection,
  AboutSection,
  FeaturesSection,
  ServicesSection,
  PricingSection,
  FaqSection,
  ContactSection,
} from "./types";

export interface BrochureBriefInput {
  title: string;
  category: BrochureCategory;
  customCategory?: string | null;
  brandName?: string;
  aboutBusiness?: string;
  targetAudience?: string;
  coreOfferings?: string;
  keyHighlights?: string[];
  primaryCta?: string;
  tone?: string;
  language?: string;
  templateId?: string;
}

export interface GeneratedBrochureResult {
  title: string;
  sections: BrochureSection[];
  theme: BrochureTheme;
  meta: {
    description: string;
    keywords: string;
    brandName: string;
  };
}

export async function generateBrochureContent(input: BrochureBriefInput): Promise<GeneratedBrochureResult> {
  const brand = input.brandName?.trim() || input.title.trim();
  const audience = input.targetAudience?.trim() || "Prospective clients and partners";
  const offerings = input.coreOfferings?.trim() || "Professional solutions and specialized services";
  const highlights = (input.keyHighlights && input.keyHighlights.length > 0)
    ? input.keyHighlights.filter((h) => h.trim().length > 0)
    : ["High Reliability & Proven Track Record", "Industry-Certified Standards", "Customized Client-Centric Execution"];
  const cta = input.primaryCta?.trim() || "Get Started / Inquire";
  const tone = input.tone?.trim() || "Professional, Authoritative & Engaging";
  const language = input.language?.trim() || "English";

  // Check if a starting template was picked
  const preset = input.templateId ? getTemplatePreset(input.templateId) : undefined;
  const initialTheme = preset ? { ...preset.theme } : defaultTheme();
  let baseSections = preset ? preset.createSections() : defaultSections(input.category);

  // Check if OpenAI is available to generate customized copy
  let openAiSuccess = false;
  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const prompt = `You are a world-class digital brochure designer and commercial copywriter.
Generate professional, structured content for a digital brochure with the following brief:
- Brochure Title: "${input.title}"
- Category: ${input.category}${input.customCategory ? ` (${input.customCategory})` : ""}
- Brand / Business Name: "${brand}"
- Business Description / Objective: "${input.aboutBusiness || input.title}"
- Target Audience: "${audience}"
- Core Products / Offerings: "${offerings}"
- Key Advantages / USPs: ${highlights.join(", ")}
- Primary Call to Action: "${cta}"
- Tone of Voice: ${tone}
- Language: ${language}

Return a valid JSON object matching this exact structure:
{
  "heroHeadline": "compelling punchy headline (max 8-10 words)",
  "heroSubheadline": "clear positioning tagline (max 6-8 words)",
  "heroDescription": "2-3 sentences explaining value proposition and benefit to the reader",
  "overviewTitle": "section heading",
  "overviewBody": "3-4 sentences summarizing organization, domain expertise, and capabilities",
  "featuresTitle": "section heading",
  "featuresSubtitle": "subheading",
  "features": [
    { "icon": "Star|Shield|Award|Zap|CheckCircle|Clock|Users|Cpu|Heart", "title": "feature title", "description": "concise description" },
    { "icon": "Star|Shield|Award|Zap|CheckCircle|Clock|Users|Cpu|Heart", "title": "feature title", "description": "concise description" },
    { "icon": "Star|Shield|Award|Zap|CheckCircle|Clock|Users|Cpu|Heart", "title": "feature title", "description": "concise description" }
  ],
  "servicesTitle": "section heading",
  "services": [
    { "title": "service 1", "description": "service 1 description", "icon": "Briefcase|Settings|Globe|Wrench", "price": "e.g. Inquire for pricing" },
    { "title": "service 2", "description": "service 2 description", "icon": "Briefcase|Settings|Globe|Wrench", "price": "e.g. Custom quote" },
    { "title": "service 3", "description": "service 3 description", "icon": "Briefcase|Settings|Globe|Wrench", "price": "e.g. Contact sales" }
  ],
  "faq": [
    { "question": "relevant client question", "answer": "clear professional answer" },
    { "question": "relevant client question", "answer": "clear professional answer" },
    { "question": "relevant client question", "answer": "clear professional answer" }
  ],
  "seoDescription": "1-2 sentence meta description for search engines",
  "keywords": "comma separated keywords"
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You are an expert commercial brochure content generator. You always return strictly valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = res.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        // Apply AI generated content to baseSections
        baseSections = baseSections.map((sec) => {
          if (sec.data.type === "hero") {
            const h = sec.data as HeroSection;
            return {
              ...sec,
              data: {
                ...h,
                headline: parsed.heroHeadline || h.headline,
                subheadline: parsed.heroSubheadline || h.subheadline,
                description: parsed.heroDescription || h.description,
                ctaLabel: cta || h.ctaLabel,
              },
            };
          }
          if (sec.data.type === "overview") {
            const ov = sec.data as OverviewSection;
            return {
              ...sec,
              data: {
                ...ov,
                title: parsed.overviewTitle || ov.title,
                body: parsed.overviewBody || ov.body,
              },
            };
          }
          if (sec.data.type === "features" && Array.isArray(parsed.features)) {
            const feat = sec.data as FeaturesSection;
            return {
              ...sec,
              data: {
                ...feat,
                title: parsed.featuresTitle || feat.title,
                subtitle: parsed.featuresSubtitle || feat.subtitle,
                items: parsed.features.map((f: { icon?: string; title?: string; description?: string }) => ({
                  icon: f.icon || "Star",
                  title: f.title || "Feature",
                  description: f.description || "",
                })),
              },
            };
          }
          if (sec.data.type === "services" && Array.isArray(parsed.services)) {
            const serv = sec.data as ServicesSection;
            return {
              ...sec,
              data: {
                ...serv,
                title: parsed.servicesTitle || serv.title,
                items: parsed.services.map((s: { title?: string; description?: string; icon?: string; price?: string }) => ({
                  title: s.title || "Service",
                  description: s.description || "",
                  icon: s.icon || "Briefcase",
                  price: s.price || "Custom Quote",
                })),
              },
            };
          }
          if (sec.data.type === "faq" && Array.isArray(parsed.faq)) {
            const fq = sec.data as FaqSection;
            return {
              ...sec,
              data: {
                ...fq,
                items: parsed.faq.map((q: { question?: string; answer?: string }) => ({
                  question: q.question || "Question",
                  answer: q.answer || "Answer",
                })),
              },
            };
          }
          if (sec.data.type === "contact") {
            const con = sec.data as ContactSection;
            return {
              ...sec,
              data: {
                ...con,
                subtitle: `Connect with our ${brand} team regarding inquiries and proposals.`,
              },
            };
          }
          return sec;
        });

        openAiSuccess = true;
        return {
          title: input.title,
          sections: baseSections,
          theme: initialTheme,
          meta: {
            description: parsed.seoDescription || `${input.title} - Official digital brochure for ${brand}.`,
            keywords: parsed.keywords || `${input.title}, ${brand}, ${input.category}`,
            brandName: brand,
          },
        };
      }
    }
  } catch (err) {
    console.warn("[brochure-ai] OpenAI call failed or skipped, synthesizing contextual copy:", err);
  }

  // Fallback high-fidelity synthesizer when OpenAI is not configured
  baseSections = baseSections.map((sec) => {
    if (sec.data.type === "hero") {
      const h = sec.data as HeroSection;
      return {
        ...sec,
        data: {
          ...h,
          headline: input.title,
          subheadline: brand ? `${brand} · ${input.category.toUpperCase()}` : h.subheadline,
          description: input.aboutBusiness
            ? `${input.aboutBusiness} Tailored specifically for ${audience}.`
            : `Comprehensive solutions in ${offerings}. Engineered for ${audience} with verified standards and seamless delivery.`,
          ctaLabel: cta,
        },
      };
    }
    if (sec.data.type === "overview") {
      const ov = sec.data as OverviewSection;
      return {
        ...sec,
        data: {
          ...ov,
          body: input.aboutBusiness
            ? `${input.aboutBusiness}\n\nOur operations prioritize precision, client satisfaction, and rapid execution across all deliverables.`
            : `${brand} provides end-to-end ${offerings}. Built on continuous quality assurance, streamlined workflows, and dedicated client service.`,
        },
      };
    }
    if (sec.data.type === "features" && highlights.length > 0) {
      const feat = sec.data as FeaturesSection;
      return {
        ...sec,
        data: {
          ...feat,
          title: `Why Partner with ${brand}`,
          items: highlights.slice(0, 4).map((h, i) => ({
            icon: i === 0 ? "ShieldCheck" : i === 1 ? "Award" : i === 2 ? "Zap" : "Users",
            title: h,
            description: `Ensuring top-tier execution and measurable value for ${audience}.`,
          })),
        },
      };
    }
    if (sec.data.type === "contact") {
      const con = sec.data as ContactSection;
      return {
        ...sec,
        data: {
          ...con,
          subtitle: `Connect with the ${brand} team to discuss your project specifications.`,
        },
      };
    }
    return sec;
  });

  return {
    title: input.title,
    sections: baseSections,
    theme: initialTheme,
    meta: {
      description: `${input.title} - Official brochure for ${brand}. Featuring ${offerings}.`,
      keywords: `${input.title}, ${brand}, ${input.category}, brochure`,
      brandName: brand,
    },
  };
}

/**
 * Prompt-based AI update for an individual section.
 * Takes the current section, the user prompt (e.g. "make headline punchier and focus on safety"),
 * and returns the updated section.
 */
export async function aiUpdateSection(
  section: BrochureSection,
  prompt: string,
  brochureContext: { title: string; brandName?: string; category: string }
): Promise<BrochureSection> {
  const brand = brochureContext.brandName?.trim() || brochureContext.title;

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are an expert digital brochure copywriter and layout designer.
You are updating a "${section.data.type}" section of a brochure for "${brand}" (Category: ${brochureContext.category}).
Current section data:
${JSON.stringify(section.data, null, 2)}

User instruction:
"${prompt}"

Return ONLY a valid JSON object matching the exact schema of this section type (${section.data.type}).
Preserve the "type": "${section.data.type}" field. Improve or rewrite the fields according to the user instruction while maintaining professionalism and industry realism.`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You update brochure sections. You always return strictly valid JSON." },
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.type === section.data.type || !parsed.type) {
          return {
            ...section,
            data: { ...section.data, ...parsed, type: section.data.type },
          };
        }
      }
    }
  } catch (err) {
    console.warn("[aiUpdateSection] OpenAI call failed, applying contextual transform:", err);
  }

  // Graceful fallback: apply contextual modification
  const data = { ...section.data } as unknown as Record<string, unknown>;
  if (typeof data.headline === "string") {
    data.headline = `${data.headline} — ${prompt.slice(0, 30)}`;
  } else if (typeof data.title === "string") {
    data.title = `${data.title} (${prompt.slice(0, 25)})`;
  }
  if (typeof data.description === "string") {
    data.description = `${data.description} ${prompt}`;
  } else if (typeof data.body === "string") {
    data.body = `${data.body}\n\n${prompt}`;
  }

  return {
    ...section,
    data: data as unknown as BrochureSection["data"],
  };
}

/**
 * Prompt-based AI generation of a brand new section.
 * Takes a natural language prompt like "Add 3 client testimonials from automotive directors"
 * or "Add a pricing section with 3 tiers in USD", selects or generates the appropriate section.
 */
export async function aiGenerateSection(
  prompt: string,
  brochureContext: { title: string; brandName?: string; category: string },
  preferredType?: import("./types").BrochureSectionType
): Promise<BrochureSection> {
  const brand = brochureContext.brandName?.trim() || brochureContext.title;

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are a digital brochure architect.
A user wants to add a new section to their brochure for "${brand}" (Category: ${brochureContext.category}).
User prompt: "${prompt}"
Preferred type if specified: "${preferredType || "any suitable brochure section"}"

Available section types:
hero, overview, about, features, services, gallery, team, testimonials, pricing, stats, curriculum, process, projects, agenda, speakers, venue, floorplan, location, highlights, itinerary, offer, faq, cta, contact, custom.

Determine the best section type (or use preferredType), and return a strictly valid JSON object matching the data schema for that section:
{
  "sectionType": "one of the available types above",
  "sectionData": {
    "type": "same as sectionType",
    ... (all required fields for this section with realistic, professional content based on the prompt)
  }
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You generate digital brochure sections. Return strictly valid JSON." },
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        const sType = (parsed.sectionType || preferredType || "features") as import("./types").BrochureSectionType;
        const newSec = makeSection(sType);
        if (parsed.sectionData && typeof parsed.sectionData === "object") {
          return {
            ...newSec,
            data: { ...newSec.data, ...parsed.sectionData, type: sType },
          };
        }
        return newSec;
      }
    }
  } catch (err) {
    console.warn("[aiGenerateSection] OpenAI call failed, creating template section:", err);
  }

  // Fallback section creation
  const type = preferredType || "features";
  const sec = makeSection(type);
  const data = sec.data as unknown as Record<string, unknown>;
  if ("title" in data) data.title = prompt.slice(0, 50);
  return sec;
}

/**
 * Prompt-based AI Theme & Design Styler.
 * Takes a visual aesthetic prompt like "luxury dark navy with gold accents and serif typography"
 * and returns a generated BrochureTheme.
 */
export async function aiStyleTheme(
  prompt: string,
  currentTheme: BrochureTheme
): Promise<BrochureTheme> {
  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are a world-class graphic designer and brand stylist.
Generate a digital brochure theme palette and typography configuration based on the user's design prompt.
User aesthetic prompt: "${prompt}"

Current theme:
${JSON.stringify(currentTheme, null, 2)}

Allowed headingFont options: "Inter", "Plus Jakarta Sans", "Montserrat", "Cinzel", "Playfair Display"
Allowed bodyFont options: "Inter"
Allowed borderRadius options: "none", "sm", "md", "lg", "xl"
Allowed density options: "compact", "comfortable", "spacious"

Return strictly a valid JSON object matching this schema:
{
  "primaryColor": "#hex (main brand accent)",
  "accentColor": "#hex (secondary accent)",
  "backgroundColor": "#hex (canvas background, e.g. #ffffff or dark #0f172a)",
  "textColor": "#hex (high contrast text color)",
  "headingFont": "Inter|Plus Jakarta Sans|Montserrat|Cinzel|Playfair Display",
  "bodyFont": "Inter",
  "borderRadius": "none|sm|md|lg|xl",
  "density": "compact|comfortable|spacious"
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You generate brochure design themes. Return strictly valid JSON." },
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          primaryColor: parsed.primaryColor || currentTheme.primaryColor,
          accentColor: parsed.accentColor || currentTheme.accentColor,
          backgroundColor: parsed.backgroundColor || currentTheme.backgroundColor,
          textColor: parsed.textColor || currentTheme.textColor,
          headingFont: parsed.headingFont || currentTheme.headingFont,
          bodyFont: "Inter",
          borderRadius: parsed.borderRadius || currentTheme.borderRadius,
          density: parsed.density || currentTheme.density,
        };
      }
    }
  } catch (err) {
    console.warn("[aiStyleTheme] OpenAI call failed, applying preset matching:", err);
  }

  // Fallback heuristic palette based on keywords
  const p = prompt.toLowerCase();
  if (p.includes("dark") || p.includes("black") || p.includes("cyber")) {
    return {
      primaryColor: "#38bdf8",
      accentColor: "#f43f5e",
      backgroundColor: "#09090b",
      textColor: "#f4f4f5",
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      borderRadius: "xl",
      density: "comfortable",
    };
  }
  if (p.includes("gold") || p.includes("luxury") || p.includes("royal") || p.includes("elegant")) {
    return {
      primaryColor: "#ca8a04",
      accentColor: "#d97706",
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      headingFont: "Cinzel",
      bodyFont: "Inter",
      borderRadius: "md",
      density: "spacious",
    };
  }
  if (p.includes("green") || p.includes("eco") || p.includes("nature") || p.includes("organic")) {
    return {
      primaryColor: "#15803d",
      accentColor: "#d97706",
      backgroundColor: "#ffffff",
      textColor: "#14532d",
      headingFont: "Montserrat",
      bodyFont: "Inter",
      borderRadius: "lg",
      density: "comfortable",
    };
  }
  if (p.includes("tech") || p.includes("modern") || p.includes("blue")) {
    return {
      primaryColor: "#2563eb",
      accentColor: "#06b6d4",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      borderRadius: "lg",
      density: "comfortable",
    };
  }

  return currentTheme;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionTaken?: "update_section" | "add_section" | "restyle_theme" | "none";
  targetSectionTitle?: string;
  createdAt: string;
}

export interface AiChatInput {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  brochure: {
    title: string;
    category: string;
    brandName?: string;
    theme: BrochureTheme;
    sections: Array<{ id: string; type: string; title?: string; headline?: string }>;
  };
  selectedSectionId?: string | null;
  selectedSectionData?: BrochureSection | null;
}

export interface AiChatResult {
  reply: string;
  actionTaken: "update_section" | "add_section" | "restyle_theme" | "none";
  updatedSection?: BrochureSection;
  addedSection?: BrochureSection;
  updatedTheme?: BrochureTheme;
  suggestedPrompts?: string[];
}

/**
 * Conversational AI Chat Assistant for Digital Brochures.
 * Allows users to talk to the AI in a sidebar chat messaging style to:
 * - Rewrite or adjust any section
 * - Generate and insert brand-new sections
 * - Restyle the theme, color palette, and typography
 * - Receive professional design advice
 */
export async function aiChatAssistant(input: AiChatInput): Promise<AiChatResult> {
  const brand = input.brochure.brandName?.trim() || input.brochure.title;
  const msg = input.message.trim();
  const lowerMsg = msg.toLowerCase();

  try {
    const isConfigured = await isOpenAIConfigured();
    if (isConfigured) {
      const openai = await getOpenAI();
      const { ai } = await getSettings();
      const choice = await resolveForCall("text", ai.textModel);

      const systemPrompt = `You are the AI Brochure Copilot in ViralPulse AI. You assist users via chat to edit, rewrite, add sections, and restyle digital brochures in real-time.

Brochure Context:
- Title: "${input.brochure.title}"
- Brand Name: "${brand}"
- Category: "${input.brochure.category}"
- Current Sections: ${JSON.stringify(
        input.brochure.sections.map((s) => ({
          id: s.id,
          type: s.type,
          label: s.headline || s.title || s.type,
        }))
      )}
- Currently Selected Section ID: "${input.selectedSectionId || "none"}"
${
  input.selectedSectionData
    ? `- Currently Selected Section Details: ${JSON.stringify({
        id: input.selectedSectionData.id,
        type: input.selectedSectionData.data.type,
        data: input.selectedSectionData.data,
      })}`
    : ""
}
- Current Theme: ${JSON.stringify(input.brochure.theme)}

User Request: "${msg}"

Classify user intent into ONE of:
1. "update_section": User wants to edit, rewrite, improve copy, change tone, or update a section.
   - Set "targetSectionId" to the section ID (use selectedSectionId if applicable, or find the section matching user intent).
   - Provide "updatedData": valid JSON object with updated fields for that section schema.
2. "add_section": User wants to add/insert a new section (e.g. pricing, testimonials, FAQ, team, process, roadmap, stats).
   - Set "sectionType" to one of: hero, overview, about, features, services, gallery, team, testimonials, pricing, stats, curriculum, process, projects, agenda, speakers, venue, floorplan, location, highlights, itinerary, offer, faq, cta, contact, custom.
   - Provide "sectionData": complete JSON object matching schema with realistic copy tailored to this brand.
3. "restyle_theme": User wants to change colors, dark/light mode, typography, or palette style.
   - Provide "updatedTheme": complete BrochureTheme object with primaryColor, accentColor, backgroundColor, textColor, headingFont, bodyFont, borderRadius, density.
4. "none": General conversation, greeting, advice, or clarification.

Return strictly valid JSON:
{
  "reply": "Concise, friendly message explaining what was updated or answering the question.",
  "actionTaken": "update_section" | "add_section" | "restyle_theme" | "none",
  "targetSectionId"?: string,
  "updatedData"?: object,
  "sectionType"?: string,
  "sectionData"?: object,
  "updatedTheme"?: object,
  "suggestedPrompts": ["Next prompt 1", "Next prompt 2", "Next prompt 3"]
}`;

      const res = await openai.chat.completions.create({
        model: choice.model,
        messages: [
          { role: "system", content: "You are the ViralPulse AI Brochure Chat Assistant. Return strictly valid JSON." },
          { role: "user", content: systemPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = res.choices[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);

        if (parsed.actionTaken === "update_section" && parsed.updatedData) {
          const targetId = parsed.targetSectionId || input.selectedSectionId;
          const targetSec =
            input.selectedSectionData?.id === targetId
              ? input.selectedSectionData
              : input.brochure.sections.find((s) => s.id === targetId);

          if (targetSec) {
            const secType =
              "data" in targetSec && targetSec.data?.type
                ? targetSec.data.type
                : "type" in targetSec
                ? targetSec.type
                : "custom";
            const initialData =
              input.selectedSectionData && input.selectedSectionData.id === targetId
                ? input.selectedSectionData.data
                : {};

            const updatedSection: BrochureSection = {
              id: targetSec.id,
              hidden: "hidden" in targetSec ? Boolean(targetSec.hidden) : false,
              data: {
                ...initialData,
                ...parsed.updatedData,
                type: secType,
              } as unknown as BrochureSection["data"],
            };

            return {
              reply: parsed.reply || `Updated ${secType} section with AI.`,
              actionTaken: "update_section",
              updatedSection,
              suggestedPrompts: parsed.suggestedPrompts || [
                "Make the CTA more urgent",
                "Add client testimonials",
                "Restyle theme to dark mode",
              ],
            };
          }
        }

        if (parsed.actionTaken === "add_section" && parsed.sectionData && parsed.sectionType) {
          const newSec: BrochureSection = {
            id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            hidden: false,
            data: {
              ...parsed.sectionData,
              type: parsed.sectionType,
            } as unknown as BrochureSection["data"],
          };

          return {
            reply: parsed.reply || `Added new ${parsed.sectionType} section to your brochure.`,
            actionTaken: "add_section",
            addedSection: newSec,
            suggestedPrompts: parsed.suggestedPrompts || [
              "Rewrite this section",
              "Restyle colors",
              "Add FAQ section",
            ],
          };
        }

        if (parsed.actionTaken === "restyle_theme" && parsed.updatedTheme) {
          return {
            reply: parsed.reply || "Theme restyled based on your visual prompt.",
            actionTaken: "restyle_theme",
            updatedTheme: parsed.updatedTheme as BrochureTheme,
            suggestedPrompts: parsed.suggestedPrompts || [
              "Make background pure white",
              "Switch to serif fonts",
              "Add pricing table",
            ],
          };
        }

        if (parsed.reply) {
          return {
            reply: parsed.reply,
            actionTaken: "none",
            suggestedPrompts: parsed.suggestedPrompts || [
              "Add pricing table",
              "Restyle theme",
              "Rewrite hero section",
            ],
          };
        }
      }
    }
  } catch (err) {
    console.warn("[aiChatAssistant] OpenAI error, falling back to local heuristic dispatcher:", err);
  }

  // Graceful fallback dispatcher
  // 1. Theme restyling detection
  if (
    lowerMsg.includes("theme") ||
    lowerMsg.includes("color") ||
    lowerMsg.includes("palette") ||
    lowerMsg.includes("dark") ||
    lowerMsg.includes("gold") ||
    lowerMsg.includes("teal") ||
    lowerMsg.includes("style")
  ) {
    const styledTheme = await aiStyleTheme(msg, input.brochure.theme);
    return {
      reply: `I've updated the brochure theme and color palette to match "${msg}".`,
      actionTaken: "restyle_theme",
      updatedTheme: styledTheme,
      suggestedPrompts: [
        "Add a 3-tier pricing section",
        "Make hero headline punchier",
        "Add client reviews",
      ],
    };
  }

  // 2. Add section detection
  if (
    lowerMsg.includes("add") ||
    lowerMsg.includes("create") ||
    lowerMsg.includes("insert") ||
    lowerMsg.includes("new section") ||
    lowerMsg.includes("pricing") ||
    lowerMsg.includes("testimonial") ||
    lowerMsg.includes("faq") ||
    lowerMsg.includes("team") ||
    lowerMsg.includes("process") ||
    lowerMsg.includes("stats")
  ) {
    const generated = await aiGenerateSection(
      msg,
      {
        title: input.brochure.title,
        brandName: input.brochure.brandName,
        category: input.brochure.category as BrochureCategory,
      }
    );
    return {
      reply: `I've created and added a new ${generated.data.type} section based on your prompt.`,
      actionTaken: "add_section",
      addedSection: generated,
      suggestedPrompts: [
        "Rewrite this section",
        "Add client testimonials",
        "Change theme to dark mode",
      ],
    };
  }

  // 3. Section update detection
  if (
    input.selectedSectionData &&
    (lowerMsg.includes("rewrite") ||
      lowerMsg.includes("update") ||
      lowerMsg.includes("headline") ||
      lowerMsg.includes("make") ||
      lowerMsg.includes("punchy") ||
      lowerMsg.includes("shorter") ||
      lowerMsg.includes("tone") ||
      lowerMsg.includes("expand"))
  ) {
    const updated = await aiUpdateSection(
      input.selectedSectionData,
      msg,
      {
        title: input.brochure.title,
        brandName: input.brochure.brandName,
        category: input.brochure.category as BrochureCategory,
      }
    );
    return {
      reply: `I've updated the ${input.selectedSectionData.data.type} section according to your instruction.`,
      actionTaken: "update_section",
      updatedSection: updated,
      suggestedPrompts: [
        "Add quantifiable metrics",
        "Add pricing table",
        "Make background pure dark",
      ],
    };
  }

  // 4. Default conversational response
  return {
    reply: `I'm ready to help you craft an impressive brochure for "${brand}". You can ask me to rewrite any section, add new sections (like pricing, testimonials, FAQ, or roadmap), or restyle the color palette and typography!`,
    actionTaken: "none",
    suggestedPrompts: [
      "Add a 3-tier enterprise pricing table",
      "Switch to luxury gold and charcoal theme",
      "Make hero headline bolder with metrics",
      "Add 4 client testimonials",
    ],
  };
}

