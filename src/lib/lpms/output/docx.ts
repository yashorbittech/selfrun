import "server-only";
import type { LpmsRenderer } from "@/lib/lpms/output/renderer";
import { blocksToPlainText, substituteVariables, registerRenderer } from "@/lib/lpms/output/renderer";
import type { TemplateBlock } from "@/lib/lpms/types";

/**
 * DOCX renderer for LPMS documents.
 *
 * Uses docx (npm install docx) if available.
 * Falls back to a plain-text stub if the library is not installed.
 */

const DocxRenderer: LpmsRenderer = {
  format: "docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  extension: "docx",

  async render({ title, documentNumber, blocks, headerBlocks, footerBlocks, resolvedVariables, branding }) {
    const resolveText = (text: string) => substituteVariables(text, resolvedVariables);

    let docxLib: any;
    try {
      // @ts-ignore
      docxLib = await import("docx");
    } catch {
      // docx not installed — return plain text wrapped as a DOCX-like stub
      const content = [title, documentNumber, "", blocksToPlainText(blocks)].join("\n");
      return Buffer.from(content, "utf-8");
    }

    const {
      Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
      BorderStyle, Table, TableRow, TableCell, WidthType, Packer,
      PageBreak, HorizontalPositionRelativeFrom,
    } = docxLib;

    const docChildren: any[] = [];

    // Title
    docChildren.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: documentNumber, color: "666666", size: 18 })],
        alignment: AlignmentType.CENTER,
      })
    );
    docChildren.push(new Paragraph({ text: "" }));

    // Blocks
    for (const block of blocks) {
      const paragraphs = blockToDocx(block, resolveText, resolvedVariables, docxLib);
      docChildren.push(...paragraphs);
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  },
};

function blockToDocx(
  block: TemplateBlock,
  resolveText: (t: string) => string,
  vars: Record<string, string>,
  lib: any
): any[] {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = lib;

  switch (block.type) {
    case "heading":
      const levels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
      ];
      return [new Paragraph({ text: resolveText(block.content), heading: levels[block.level - 1] })];

    case "paragraph":
      return [new Paragraph({ text: resolveText(block.content) })];

    case "bullets":
      return block.items.map(
        (item) => new Paragraph({ text: `• ${resolveText(item)}`, indent: { left: 360 } })
      );

    case "numbered":
      return block.items.map(
        (item, i) => new Paragraph({ text: `${i + 1}. ${resolveText(item)}`, indent: { left: 360 } })
      );

    case "divider":
      return [
        new Paragraph({
          border: { bottom: { color: "CCCCCC", style: BorderStyle.SINGLE, size: 6, space: 1 } },
          text: "",
        }),
      ];

    case "note":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `[${block.variant.toUpperCase()}] ${resolveText(block.content)}`,
              italics: true,
              color: "555555",
            }),
          ],
        }),
      ];

    case "variable":
      return [new Paragraph({ text: vars[block.key] ?? block.fallback ?? `{{${block.key}}}` })];

    case "signature":
      return [
        new Paragraph({ text: "" }),
        new Paragraph({ text: "________________________" }),
        new Paragraph({ text: resolveText(block.label), children: [new TextRun({ text: block.label, size: 18 })] }),
        new Paragraph({ text: "" }),
      ];

    case "pagebreak":
      return [new Paragraph({ pageBreakBefore: true, text: "" })];

    case "spacer":
      return Array.from({ length: Math.ceil(block.height / 20) }, () => new Paragraph({ text: "" }));

    case "conditional":
      return block.blocks.flatMap((b) => blockToDocx(b, resolveText, vars, lib));

    case "repeating":
      return block.blocks.flatMap((b) => blockToDocx(b, resolveText, vars, lib));

    default:
      return [];
  }
}

// Auto-register
registerRenderer(DocxRenderer);

export default DocxRenderer;
