import pptxgen from 'pptxgenjs';
import {
  CardElement,
  CodeElement,
  HeadingElement,
  ImageElement,
  ListElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  TableElement,
} from '@yumiamd/ast';
import { DefaultLayoutEngine, LayoutNode, Rect, Size, SlideLayoutResult } from '@yumiamd/layout';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { defaultTheme, YumiaTheme } from '@yumiamd/theme';

export interface PptxRenderOptions {
  author?: string;
  company?: string;
  title?: string;
  revision?: string;
}

export interface PptxOutput {
  format: 'pptx';
  data: Uint8Array | ArrayBuffer;
  slideCount: number;
  fileName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PptxInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PptxSlide = any;

const CSS_NAMED_COLORS: Record<string, string> = {
  white: 'ffffff',
  black: '000000',
  red: 'ef4444',
  blue: '3b82f6',
  green: '22c55e',
  yellow: 'eab308',
  gray: '64748b',
  grey: '64748b',
  slate: '0f172a',
  transparent: 'ffffff',
};

interface InlineChunk {
  text: string;
  options: Record<string, unknown>;
}

export function parseInlineMarkdown(
  rawText: string,
  baseOptions: Record<string, unknown>
): InlineChunk[] {
  const chunks: InlineChunk[] = [];
  // Tokenize bold (**text**), italic (*text* or _text_), code (`text`)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = rawText.split(regex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      chunks.push({
        text: part.slice(2, -2),
        options: { ...baseOptions, bold: true },
      });
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      chunks.push({
        text: part.slice(1, -1),
        options: { ...baseOptions, italic: true },
      });
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      chunks.push({
        text: part.slice(1, -1),
        options: { ...baseOptions, fontFace: 'Courier New' },
      });
    } else {
      chunks.push({
        text: part,
        options: { ...baseOptions },
      });
    }
  }

  return chunks.length > 0 ? chunks : [{ text: rawText, options: baseOptions }];
}

export class PptxRenderer implements YumiaRenderer<PptxOutput> {
  readonly name = 'PptxRenderer';
  readonly targetFormat = 'pptx';

  private layoutEngine: DefaultLayoutEngine;

  constructor() {
    this.layoutEngine = new DefaultLayoutEngine();
  }

  async render(presentation: Presentation, context: RenderContext = {}): Promise<PptxOutput> {
    const PptxConstructor = (pptxgen as unknown as { default?: typeof pptxgen }).default || pptxgen;
    const pptx: PptxInstance = new (PptxConstructor as unknown as new () => PptxInstance)();

    const theme = context.theme || defaultTheme;
    const title = presentation.metadata.title || 'Yumia Presentation';
    const author = presentation.metadata.author || 'YumiaMD';

    pptx.title = title;
    pptx.author = author;

    // Define 16:9 widescreen canvas (13.333 x 7.5 inches) or 4:3 canvas (10 x 7.5 inches)
    const is43 = presentation.metadata.aspectRatio === '4:3';
    const slideWidthInches = is43 ? 10.0 : 13.333;
    const slideHeightInches = 7.5;
    const layoutName = is43 ? 'YUMIA_4_3' : 'YUMIA_16_9';

    pptx.defineLayout({ name: layoutName, width: slideWidthInches, height: slideHeightInches });
    pptx.layout = layoutName;

    const pixelViewport: Size = is43
      ? { width: 1440, height: 1080 }
      : { width: 1920, height: 1080 };
    const scaleX = slideWidthInches / pixelViewport.width;
    const scaleY = slideHeightInches / pixelViewport.height;

    for (const slide of presentation.slides) {
      const pptxSlide: PptxSlide = pptx.addSlide();

      const bgColor = this.cleanHexColor(slide.background?.value || theme.colors.background);
      pptxSlide.background = { color: bgColor };

      const slideLayout: SlideLayoutResult = this.layoutEngine.computeSlide(slide, pixelViewport);

      for (const node of slideLayout.nodes) {
        this.renderNode(pptxSlide, pptx, node, scaleX, scaleY, theme);
      }

      if (slide.notes) {
        pptxSlide.addNotes(slide.notes);
      }
    }

    const outputBuffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    const uint8Array = new Uint8Array(
      outputBuffer.buffer,
      outputBuffer.byteOffset,
      outputBuffer.byteLength
    );

    return {
      format: 'pptx',
      data: uint8Array,
      slideCount: presentation.slides.length,
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pptx`,
    };
  }

  private renderNode(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme
  ): void {
    const { element, bounds } = node;
    const rect = this.toInches(bounds, scaleX, scaleY);

    switch (element.type) {
      case 'heading':
        this.renderHeading(pptxSlide, element, rect, theme);
        break;
      case 'paragraph':
        this.renderParagraph(pptxSlide, element, rect, theme);
        break;
      case 'list':
        this.renderList(pptxSlide, element, rect, theme);
        break;
      case 'code':
        this.renderCode(pptxSlide, pptx, element, rect, theme);
        break;
      case 'quote':
        this.renderQuote(pptxSlide, pptx, element, rect, theme);
        break;
      case 'table':
        this.renderTable(pptxSlide, element, rect, theme);
        break;
      case 'image':
        this.renderImage(pptxSlide, element, rect);
        break;
      case 'card':
        this.renderCard(pptxSlide, pptx, node, scaleX, scaleY, theme);
        break;
      case 'columns':
        this.renderColumns(pptxSlide, pptx, node, scaleX, scaleY, theme);
        break;
      default:
        break;
    }
  }

  private renderHeading(
    pptxSlide: PptxSlide,
    heading: HeadingElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const fontSize = this.getHeadingFontSize(heading.level, theme);
    const color = this.cleanHexColor(
      heading.level === 1 ? theme.colors.primary : theme.colors.text
    );

    const chunks = parseInlineMarkdown(heading.text, {
      fontSize,
      bold: true,
      fontFace: theme.typography.headingFont.split(',')[0]?.trim() || 'Arial',
      color,
    });

    pptxSlide.addText(chunks, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      align: heading.align || 'left',
      valign: 'middle',
      margin: 0,
    });
  }

  private renderParagraph(
    pptxSlide: PptxSlide,
    paragraph: ParagraphElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const fontSize = theme.typography.sizes?.body || 18;
    const color = this.cleanHexColor(theme.colors.text);

    const chunks = parseInlineMarkdown(paragraph.text, {
      fontSize,
      fontFace: theme.typography.bodyFont.split(',')[0]?.trim() || 'Arial',
      color,
    });

    pptxSlide.addText(chunks, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      align: paragraph.align || 'left',
      valign: 'top',
      margin: 0,
    });
  }

  private renderList(
    pptxSlide: PptxSlide,
    list: ListElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const fontSize = theme.typography.sizes?.body || 18;
    const color = this.cleanHexColor(theme.colors.text);
    const allChunks: InlineChunk[] = [];

    list.items.forEach((item) => {
      const itemChunks = parseInlineMarkdown(item.text, {
        fontSize,
        color,
        fontFace: theme.typography.bodyFont.split(',')[0]?.trim() || 'Arial',
        indentLevel: item.depth || 0,
        paraSpaceAfter: 8,
      });

      if (itemChunks.length > 0) {
        // Set bullet on the very first chunk of this item
        itemChunks[0]!.options = {
          ...itemChunks[0]!.options,
          bullet: list.ordered ? ({ type: 'number' } as const) : true,
        };
      }
      allChunks.push(...itemChunks);
    });

    pptxSlide.addText(allChunks, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      valign: 'top',
      margin: 0,
    });
  }

  private renderTable(
    pptxSlide: PptxSlide,
    table: TableElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const tableRows: Array<Array<{ text: string; options?: Record<string, unknown> }>> = [];
    const headerBg = this.cleanHexColor(theme.colors.primary);
    const borderColor = this.cleanHexColor(theme.colors.border || '#cbd5e1');

    if (table.headers && table.headers.length > 0) {
      tableRows.push(
        table.headers.map((h) => ({
          text: h.replace(/\*\*/g, ''),
          options: {
            bold: true,
            color: 'ffffff',
            fill: { color: headerBg },
            fontSize: 14,
            align: 'center',
          },
        }))
      );
    }

    if (table.rows) {
      table.rows.forEach((row, rowIndex) => {
        const rowBg = rowIndex % 2 === 1 ? 'f8fafc' : 'ffffff';
        tableRows.push(
          row.map((cell) => ({
            text: cell.replace(/\*\*/g, ''),
            options: {
              color: this.cleanHexColor(theme.colors.text),
              fill: { color: rowBg },
              fontSize: 13,
            },
          }))
        );
      });
    }

    if (tableRows.length > 0) {
      pptxSlide.addTable(tableRows, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        border: { type: 'solid', pt: 1, color: borderColor },
        margin: [4, 8, 4, 8],
      });
    }
  }

  private renderImage(
    pptxSlide: PptxSlide,
    image: ImageElement,
    rect: { x: number; y: number; w: number; h: number }
  ): void {
    try {
      pptxSlide.addImage({
        path: image.src,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
      });
    } catch {
      pptxSlide.addShape('rect', {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        fill: { color: 'e2e8f0' },
        line: { color: '94a3b8', width: 1 },
      });
      pptxSlide.addText(`[Image: ${image.alt || image.src}]`, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        fontSize: 12,
        color: '64748b',
        align: 'center',
        valign: 'middle',
      });
    }
  }

  private renderCard(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme
  ): void {
    const card = node.element as CardElement;
    const rect = this.toInches(node.bounds, scaleX, scaleY);
    const cardTheme = theme.components?.card;

    const fillColor = this.cleanHexColor(cardTheme?.background || theme.colors.surface);
    const borderColor = this.cleanHexColor(
      cardTheme?.borderColor || theme.colors.border || '#cbd5e1'
    );

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: fillColor },
      line: { color: borderColor, width: 1.5 },
      rectRadius: 0.08,
    });

    if (card.title) {
      pptxSlide.addText(card.title, {
        x: rect.x + 0.25,
        y: rect.y + 0.18,
        w: rect.w - 0.5,
        h: 0.35,
        fontSize: 20,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: theme.typography.headingFont.split(',')[0]?.trim() || 'Arial',
      });
    }

    if (node.children) {
      for (const childNode of node.children) {
        this.renderNode(pptxSlide, pptx, childNode, scaleX, scaleY, theme);
      }
    }
  }

  private renderColumns(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme
  ): void {
    if (node.children) {
      for (const colNode of node.children) {
        if (colNode.children) {
          for (const itemNode of colNode.children) {
            this.renderNode(pptxSlide, pptx, itemNode, scaleX, scaleY, theme);
          }
        }
      }
    }
  }

  private renderCode(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    code: CodeElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const codeTheme = theme.components?.code;
    const bgColor = this.cleanHexColor(codeTheme?.background || '#0f172a');
    const textColor = this.cleanHexColor(codeTheme?.textColor || '#f8fafc');

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: bgColor },
      rectRadius: 0.05,
    });

    pptxSlide.addText(code.code, {
      x: rect.x + 0.2,
      y: rect.y + 0.15,
      w: rect.w - 0.4,
      h: rect.h - 0.3,
      fontSize: 14,
      fontFace: 'Courier New',
      color: textColor,
      valign: 'top',
    });
  }

  private renderQuote(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    quote: QuoteElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const accentColor = this.cleanHexColor(theme.colors.accent || theme.colors.primary);

    pptxSlide.addShape(pptx.ShapeType.rect, {
      x: rect.x,
      y: rect.y,
      w: 0.06,
      h: rect.h,
      fill: { color: accentColor },
    });

    // Strip leading/trailing quote characters so we never get triple quotes
    const cleanText = quote.text.replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();

    pptxSlide.addText(`“${cleanText}”`, {
      x: rect.x + 0.2,
      y: rect.y,
      w: rect.w - 0.2,
      h: rect.h,
      fontSize: 18,
      italic: true,
      color: this.cleanHexColor(theme.colors.muted || theme.colors.text),
      fontFace: theme.typography.bodyFont.split(',')[0]?.trim() || 'Arial',
      valign: 'middle',
    });
  }

  private toInches(
    bounds: Rect,
    scaleX: number,
    scaleY: number
  ): { x: number; y: number; w: number; h: number } {
    return {
      x: Math.max(0, bounds.x * scaleX),
      y: Math.max(0, bounds.y * scaleY),
      w: Math.max(0.1, bounds.width * scaleX),
      h: Math.max(0.1, bounds.height * scaleY),
    };
  }

  private getHeadingFontSize(level: number, theme: YumiaTheme): number {
    const sizes = theme.typography.sizes;
    switch (level) {
      case 1:
        return sizes?.h1 || 40;
      case 2:
        return sizes?.h2 || 32;
      case 3:
        return sizes?.h3 || 26;
      case 4:
        return sizes?.h4 || 20;
      default:
        return 18;
    }
  }

  private cleanHexColor(raw: string | undefined): string {
    if (!raw) return '000000';
    const trimmed = raw.trim().toLowerCase();

    if (CSS_NAMED_COLORS[trimmed]) {
      return CSS_NAMED_COLORS[trimmed]!;
    }

    const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch && hexMatch[1]) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return (
          hex[0]! + hex[0]! +
          hex[1]! + hex[1]! +
          hex[2]! + hex[2]!
        );
      }
      return hex;
    }

    return '000000';
  }
}
