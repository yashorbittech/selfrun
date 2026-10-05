import type { TemplateBlock } from "@/lib/lpms/types";

/**
 * LpmsRenderer — the common interface every output format implements.
 * Add new output formats (RTF, HTML, etc.) by implementing this interface.
 */
export interface LpmsRenderer {
  /** Format name e.g. "pdf", "docx" */
  format: string;
  /** MIME type for the response */
  mimeType: string;
  /** File extension without dot */
  extension: string;

  /**
   * Render the document to bytes.
   * Receives the resolved block content (variables already substituted).
   */
  render(opts: {
    title: string;
    documentNumber: string;
    blocks: TemplateBlock[];
    headerBlocks: TemplateBlock[];
    footerBlocks: TemplateBlock[];
    resolvedVariables: Record<string, string>;
    branding?: {
      logoUrl?: string;
      companyName?: string;
      primaryColor?: string;
    };
  }): Promise<Buffer>;
}

/**
 * Registry of available renderers.
 * New renderers self-register by calling registerRenderer().
 */
const renderers = new Map<string, LpmsRenderer>();

export function registerRenderer(renderer: LpmsRenderer): void {
  renderers.set(renderer.format, renderer);
}

export function getRenderer(format: string): LpmsRenderer | null {
  return renderers.get(format) ?? null;
}

export function getAvailableFormats(): string[] {
  return Array.from(renderers.keys());
}

/**
 * Render blocks to plain text — used as a fallback and by the AI.
 */
export function blocksToPlainText(blocks: TemplateBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return block.content;
        case "heading":
          return `${"#".repeat(block.level)} ${block.content}`;
        case "bullets":
          return block.items.map((i) => `• ${i}`).join("\n");
        case "numbered":
          return block.items.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
        case "table":
          return [
            block.header.join(" | "),
            block.header.map(() => "---").join(" | "),
            ...block.rows.map((r) => r.join(" | ")),
          ].join("\n");
        case "note":
          return `[${block.variant.toUpperCase()}] ${block.content}`;
        case "divider":
          return "---";
        case "spacer":
          return "";
        case "pagebreak":
          return "\n---PAGE BREAK---\n";
        case "variable":
          return block.fallback || `{{${block.key}}}`;
        case "signature":
          return `[SIGNATURE: ${block.label}]`;
        case "conditional":
          return blocksToPlainText(block.blocks);
        case "repeating":
          return blocksToPlainText(block.blocks);
        case "image":
          return block.caption ? `[IMAGE: ${block.caption}]` : "[IMAGE]";
        case "logo":
          return "[LOGO]";
        case "attachment":
          return `[ATTACHMENT: ${block.label}]`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Substitute {{variable}} placeholders in a string.
 */
export function substituteVariables(
  text: string,
  resolved: Record<string, string>
): string {
  return text.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => resolved[key] ?? `{{${key}}}`);
}
