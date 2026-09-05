import pptxgen from 'pptxgenjs';
import {
  BadgeElement,
  CalloutElement,
  CardElement,
  ChartElement,
  CodeElement,
  CompareElement,
  HeadingElement,
  HeroElement,
  IconElement,
  ImageElement,
  ListElement,
  MathElement,
  MermaidElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  SectionElement,
  TableElement,
  TimelineElement,
  TocElement,
} from '@yumiamd/ast';
import { DefaultLayoutEngine, LayoutNode, Rect, Size, SlideLayoutResult } from '@yumiamd/layout';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { resolveTheme, YumiaTheme } from '@yumiamd/theme';

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
type PptxInstance = typeof pptxgen extends new (...args: any[]) => infer R ? R : any;
type PptxSlide = ReturnType<PptxInstance['addSlide']>;

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

export function cleanFontFace(fontString?: string): string {
  if (!fontString) return 'Segoe UI';
  const fonts = fontString.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, ''));
  const safeList = [
    'Segoe UI',
    'Arial',
    'Calibri',
    'Helvetica',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Consolas',
    'Courier New',
    'Courier',
    'Georgia',
    'Times New Roman',
  ];

  for (const font of fonts) {
    if (safeList.includes(font)) {
      return font;
    }
  }

  if (fontString.toLowerCase().includes('mono') || fontString.toLowerCase().includes('code')) {
    return 'Consolas';
  }
  if (fontString.toLowerCase().includes('serif') && !fontString.toLowerCase().includes('sans')) {
    return 'Georgia';
  }
  return 'Segoe UI';
}

export function parseInlineMarkdown(
  rawText: string,
  baseOptions: Record<string, unknown>
): InlineChunk[] {
  if (!rawText) return [];
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

    const colorOverrides = presentation.metadata.colors
      ? { colors: presentation.metadata.colors }
      : undefined;
    const resolvedTheme = resolveTheme(presentation.metadata.theme, colorOverrides);
    const theme = context.theme || resolvedTheme;
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
        this.renderNode(pptxSlide, pptx, node, scaleX, scaleY, theme, presentation);
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
    theme: YumiaTheme,
    presentation?: Presentation
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
      case 'hero':
        this.renderHero(pptxSlide, pptx, node, scaleX, scaleY, theme, presentation);
        break;
      case 'callout':
        this.renderCallout(pptxSlide, pptx, element as CalloutElement, rect, theme);
        break;
      case 'image':
        this.renderImage(pptxSlide, element, rect);
        break;
      case 'metric':
        this.renderMetric(pptxSlide, pptx, node, scaleX, scaleY, theme);
        break;
      case 'card':
        this.renderCard(pptxSlide, pptx, node, scaleX, scaleY, theme, presentation);
        break;
      case 'columns':
        this.renderColumns(pptxSlide, pptx, node, scaleX, scaleY, theme, presentation);
        break;
      case 'badge':
        this.renderBadge(pptxSlide, pptx, element as BadgeElement, rect, theme);
        break;
      case 'chart':
        this.renderChart(pptxSlide, pptx, element as ChartElement, rect, theme);
        break;
      case 'timeline':
        this.renderTimeline(pptxSlide, pptx, element as TimelineElement, rect, theme);
        break;
      case 'compare':
        this.renderCompare(pptxSlide, pptx, node, scaleX, scaleY, theme);
        break;
      case 'section':
        this.renderSection(pptxSlide, pptx, element as SectionElement, rect, theme);
        break;
      case 'toc':
        this.renderToc(pptxSlide, pptx, element as TocElement, rect, theme, presentation);
        break;
      case 'mermaid':
        this.renderMermaid(pptxSlide, pptx, element as MermaidElement, rect, theme);
        break;
      case 'math':
        this.renderMath(pptxSlide, pptx, element as MathElement, rect, theme);
        break;
      case 'icon': {
        const ic = element as IconElement;
        const iconName = ic.name.replace(/^[^:]+:/, '').toUpperCase();
        pptxSlide.addText(`★ ${iconName}`, {
          x: rect.x,
          y: rect.y,
          w: Math.max(rect.w, 1.5),
          h: Math.max(rect.h, 0.4),
          fontSize: 14,
          bold: true,
          color: this.cleanHexColor(theme.colors.primary),
          valign: 'middle',
        });
        break;
      }
      case 'grid':
      case 'stack': {
        if (node.children) {
          for (const childNode of node.children) {
            this.renderNode(pptxSlide, pptx, childNode, scaleX, scaleY, theme, presentation);
          }
        }
        break;
      }
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
      fontFace: cleanFontFace(theme.typography.headingFont),
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
      fontFace: cleanFontFace(theme.typography.bodyFont),
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

    list.items.forEach((item, itemIdx) => {
      const itemChunks = parseInlineMarkdown(item.text, {
        fontSize,
        color,
        fontFace: cleanFontFace(theme.typography.bodyFont),
        indentLevel: item.depth || 0,
        paraSpaceAfter: 8,
      });

      if (itemChunks.length > 0) {
        // Set bullet only on the very first chunk of this item
        itemChunks[0]!.options = {
          ...itemChunks[0]!.options,
          bullet: list.ordered ? ({ type: 'number' } as const) : true,
        };

        // Break line on the last chunk of each item to ensure clean OpenXML paragraph separation
        if (itemIdx < list.items.length - 1) {
          itemChunks[itemChunks.length - 1]!.options = {
            ...itemChunks[itemChunks.length - 1]!.options,
            breakLine: true,
          };
        }
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

    const isDark = this.isDarkColor(theme.colors.background);
    const rowBg1 = this.cleanHexColor(
      theme.components?.table?.rowAlternateBackground || (isDark ? theme.colors.surface : 'ffffff')
    );
    const rowBg2 = this.cleanHexColor(isDark ? '#1a1a2e' : 'f8fafc');
    const cellTextColor = this.cleanHexColor(theme.colors.text);

    if (table.headers && table.headers.length > 0) {
      tableRows.push(
        table.headers.map((h) => ({
          text: h.replace(/\*\*/g, ''),
          options: {
            bold: true,
            color: 'ffffff',
            fill: { color: headerBg },
            fontSize: 14,
            fontFace: cleanFontFace(theme.typography.headingFont),
            align: 'center',
          },
        }))
      );
    }

    if (table.rows) {
      table.rows.forEach((row, rowIndex) => {
        const rowBg = rowIndex % 2 === 1 ? rowBg2 : rowBg1;
        tableRows.push(
          row.map((cell) => ({
            text: cell.replace(/\*\*/g, ''),
            options: {
              color: cellTextColor,
              fill: { color: rowBg },
              fontSize: 13,
              fontFace: cleanFontFace(theme.typography.bodyFont),
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
        margin: [6, 10, 6, 10],
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

  private renderMetric(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme
  ): void {
    const metric = node.element as MetricElement;
    const rect = this.toInches(node.bounds, scaleX, scaleY);
    const cardTheme = theme.components?.card;

    // Pick variant color or primary color
    let accentColor = theme.colors.primary;
    if (metric.variant && theme.colors[metric.variant as keyof typeof theme.colors]) {
      accentColor = theme.colors[metric.variant as keyof typeof theme.colors] as string;
    }

    const fillColor = this.cleanHexColor(cardTheme?.background || theme.colors.surface);
    const borderColor = this.cleanHexColor(
      metric.variant && theme.colors[metric.variant as keyof typeof theme.colors]
        ? (theme.colors[metric.variant as keyof typeof theme.colors] as string)
        : cardTheme?.borderColor || theme.colors.border || '#cbd5e1'
    );

    // Render container card
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: fillColor },
      line: { color: borderColor, width: 1.5 },
      rectRadius: 0.08,
    });

    const hasChange = Boolean(metric.change);

    // Top Label
    pptxSlide.addText(metric.label.toUpperCase(), {
      x: rect.x + 0.1,
      y: rect.y + 0.1,
      w: rect.w - 0.2,
      h: 0.22,
      fontSize: 10,
      bold: true,
      color: this.cleanHexColor(theme.colors.muted || '#64748b'),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
    });

    // Large Metric Value
    const displayValue = metric.unit ? `${metric.value} ${metric.unit}` : metric.value;
    pptxSlide.addText(displayValue, {
      x: rect.x + 0.1,
      y: rect.y + 0.34,
      w: rect.w - 0.2,
      h: 0.44,
      fontSize: 26,
      bold: true,
      color: this.cleanHexColor(accentColor),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
    });

    // Optional Change indicator / subtext below value
    if (hasChange && metric.change) {
      const isPositive = metric.change.startsWith('+');
      const changeColor = isPositive
        ? this.cleanHexColor(theme.colors.success || '#10b981')
        : this.cleanHexColor(theme.colors.danger || '#ef4444');

      pptxSlide.addText(metric.change, {
        x: rect.x + 0.1,
        y: rect.y + 0.8,
        w: rect.w - 0.2,
        h: 0.22,
        fontSize: 11,
        bold: true,
        color: changeColor,
        fontFace: cleanFontFace(theme.typography.bodyFont),
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
    theme: YumiaTheme,
    presentation?: Presentation
  ): void {
    const card = node.element as CardElement;
    const rect = this.toInches(node.bounds, scaleX, scaleY);
    const cardTheme = theme.components?.card;

    const fillColor = this.cleanHexColor(cardTheme?.background || theme.colors.surface);
    let borderColor = this.cleanHexColor(
      cardTheme?.borderColor || theme.colors.border || '#cbd5e1'
    );
    let titleColor = this.cleanHexColor(theme.colors.primary);

    if (card.variant && theme.colors[card.variant as keyof typeof theme.colors]) {
      const variantHex = this.cleanHexColor(
        theme.colors[card.variant as keyof typeof theme.colors] as string
      );
      borderColor = variantHex;
      titleColor = variantHex;
    }

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: fillColor },
      line: { color: borderColor, width: 1.5 },
      rectRadius: 0.08,
    });

    // Left Accent Bar
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x + 0.02,
      y: rect.y + 0.04,
      w: 0.06,
      h: rect.h - 0.08,
      fill: { color: borderColor },
      rectRadius: 0.03,
    });

    if (card.title) {
      pptxSlide.addText(card.title, {
        x: rect.x + 0.25,
        y: rect.y + 0.18,
        w: rect.w - 0.5,
        h: 0.35,
        fontSize: 20,
        bold: true,
        color: titleColor,
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    }

    if (node.children) {
      for (const childNode of node.children) {
        this.renderNode(pptxSlide, pptx, childNode, scaleX, scaleY, theme, presentation);
      }
    }
  }

  private renderColumns(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme,
    presentation?: Presentation
  ): void {
    if (node.children) {
      for (const colNode of node.children) {
        if (colNode.children) {
          for (const itemNode of colNode.children) {
            this.renderNode(pptxSlide, pptx, itemNode, scaleX, scaleY, theme, presentation);
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
    const bgColor = this.cleanHexColor(codeTheme?.background || '#0a0f1d');
    const textColor = this.cleanHexColor(codeTheme?.textColor || '#f8fafc');
    const primaryColor = this.cleanHexColor(theme.colors.primary || '#00F0FF');
    const mutedColor = this.cleanHexColor(theme.colors.muted || '#64748b');

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: bgColor },
      line: { color: this.cleanHexColor(theme.colors.border || '#1e293b'), width: 1 },
      rectRadius: 0.05,
    });

    const lines = code.code.split('\n');
    if (code.highlight) {
      const highlightSet = new Set<number>();
      const parts = code.highlight.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr || '0', 10);
          const end = parseInt(endStr || '0', 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let n = start; n <= end; n++) highlightSet.add(n);
          }
        } else {
          const num = parseInt(trimmed, 10);
          if (!isNaN(num)) highlightSet.add(num);
        }
      }

      const chunks: InlineChunk[] = [];
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const isHl = highlightSet.has(lineNum);
        const lineNumPad = String(lineNum).padStart(2, '0');
        const numColor = isHl ? primaryColor : mutedColor;
        const contentColor = isHl ? primaryColor : mutedColor;

        chunks.push({
          text: `${lineNumPad}  `,
          options: {
            fontSize: 12,
            fontFace: 'Consolas',
            color: numColor,
            bold: isHl,
          },
        });

        chunks.push({
          text: line || ' ',
          options: {
            fontSize: 12,
            fontFace: 'Consolas',
            color: contentColor,
            bold: isHl,
            breakLine: idx < lines.length - 1,
          },
        });
      });

      pptxSlide.addText(chunks, {
        x: rect.x + 0.2,
        y: rect.y + 0.15,
        w: rect.w - 0.4,
        h: rect.h - 0.3,
        valign: 'top',
        margin: 0,
      });
    } else {
      pptxSlide.addText(code.code, {
        x: rect.x + 0.2,
        y: rect.y + 0.15,
        w: rect.w - 0.4,
        h: rect.h - 0.3,
        fontSize: 13,
        fontFace: 'Consolas',
        color: textColor,
        valign: 'top',
      });
    }
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

    // Strip leading/trailing quote characters
    const cleanText = quote.text.replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();

    pptxSlide.addText(`“${cleanText}”`, {
      x: rect.x + 0.2,
      y: rect.y,
      w: rect.w - 0.2,
      h: rect.h,
      fontSize: 18,
      italic: true,
      color: this.cleanHexColor(theme.colors.muted || theme.colors.text),
      fontFace: cleanFontFace(theme.typography.bodyFont),
      valign: 'middle',
    });
  }

  private renderBadge(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    badge: BadgeElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const colorKey = (badge.variant || 'primary') as keyof typeof theme.colors;
    const badgeColor = this.cleanHexColor(theme.colors[colorKey] || theme.colors.primary);
    const badgeText = badge.text;
    const badgeW = Math.min(2.5, Math.max(1.0, badgeText.length * 0.12 + 0.4));
    const badgeH = Math.min(0.38, rect.h);

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: badgeW,
      h: badgeH,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: badgeColor, width: 1.5 },
      rectRadius: 0.15,
    });

    pptxSlide.addText(badgeText.toUpperCase(), {
      x: rect.x,
      y: rect.y,
      w: badgeW,
      h: badgeH,
      fontSize: 10,
      bold: true,
      color: badgeColor,
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
    });
  }

  private renderCallout(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    callout: CalloutElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const sevColor = this.cleanHexColor(
      callout.severity === 'warning'
        ? theme.colors.warning || '#f59e0b'
        : callout.severity === 'danger'
          ? theme.colors.danger || '#ef4444'
          : callout.severity === 'success'
            ? theme.colors.success || '#10b981'
            : theme.colors.info || theme.colors.primary
    );

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: sevColor, width: 2 },
      rectRadius: 0.08,
    });

    const titleH = callout.title ? 0.35 : 0;
    if (callout.title) {
      pptxSlide.addText(callout.title, {
        x: rect.x + 0.15,
        y: rect.y + 0.08,
        w: rect.w - 0.3,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: sevColor,
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    }

    pptxSlide.addText(callout.text, {
      x: rect.x + 0.15,
      y: rect.y + titleH + 0.08,
      w: rect.w - 0.3,
      h: rect.h - titleH - 0.16,
      fontSize: 12,
      color: this.cleanHexColor(theme.colors.text),
      fontFace: cleanFontFace(theme.typography.bodyFont),
      valign: 'top',
    });
  }

  private renderHero(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme,
    presentation?: Presentation
  ): void {
    const hero = node.element as HeroElement;
    const rect = {
      x: node.bounds.x * scaleX,
      y: node.bounds.y * scaleY,
      w: node.bounds.width * scaleX,
      h: node.bounds.height * scaleY,
    };

    let curY = rect.y;
    if (hero.tagline) {
      pptxSlide.addText(hero.tagline.toUpperCase(), {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: (hero.align as 'left' | 'center' | 'right') || 'center',
      });
      curY += 0.4;
    }

    pptxSlide.addText(hero.title, {
      x: rect.x,
      y: curY,
      w: rect.w,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: this.cleanHexColor(theme.colors.text),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: (hero.align as 'left' | 'center' | 'right') || 'center',
    });
    curY += 0.95;

    if (hero.subtitle) {
      pptxSlide.addText(hero.subtitle, {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: 0.6,
        fontSize: 16,
        color: this.cleanHexColor(theme.colors.muted || theme.colors.text),
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align: (hero.align as 'left' | 'center' | 'right') || 'center',
      });
      curY += 0.65;
    }

    if (node.children) {
      for (const childNode of node.children) {
        this.renderNode(pptxSlide, pptx, childNode, scaleX, scaleY, theme, presentation);
      }
    }
  }

  private renderChart(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    chart: ChartElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const series = chart.series || [];
    const labels = chart.labels || [];

    const chartData = series.map((s) => ({
      name: s.name || 'Data',
      labels,
      values: s.values,
    }));

    let pptxChartType = pptx.ChartType.bar;
    if (chart.chartType === 'line') pptxChartType = pptx.ChartType.line;
    if (chart.chartType === 'pie') pptxChartType = pptx.ChartType.pie;
    if (chart.chartType === 'doughnut') pptxChartType = pptx.ChartType.doughnut;

    const chartColors = [
      this.cleanHexColor(theme.colors.primary),
      this.cleanHexColor(theme.colors.accent),
      this.cleanHexColor(theme.colors.secondary),
      this.cleanHexColor(theme.colors.success),
      this.cleanHexColor(theme.colors.warning),
    ];

    try {
      pptxSlide.addChart(pptxChartType, chartData, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        showTitle: Boolean(chart.title),
        title: chart.title || '',
        titleColor: this.cleanHexColor(theme.colors.text),
        titleFontFace: cleanFontFace(theme.typography.headingFont),
        showLegend: true,
        legendPos: 'b',
        legendColor: this.cleanHexColor(theme.colors.muted || theme.colors.text),
        chartColors,
      });
    } catch {
      // Fallback container if chart generation fails
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        fill: { color: this.cleanHexColor(theme.colors.surface) },
        line: { color: this.cleanHexColor(theme.colors.border), width: 1 },
      });
      pptxSlide.addText(`[Chart: ${chart.title || chart.chartType}]`, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        color: this.cleanHexColor(theme.colors.primary),
        align: 'center',
        valign: 'middle',
      });
    }
  }

  private renderTimeline(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    timeline: TimelineElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const items = timeline.items || [];
    if (items.length === 0) return;

    const itemW = rect.w / items.length;
    const lineY = rect.y + 0.25;

    // Connecting line
    pptxSlide.addShape(pptx.ShapeType.rect, {
      x: rect.x + 0.2,
      y: lineY,
      w: rect.w - 0.4,
      h: 0.03,
      fill: { color: this.cleanHexColor(theme.colors.border) },
    });

    items.forEach((item, idx) => {
      const itemX = rect.x + idx * itemW;
      const dotX = itemX + itemW / 2 - 0.1;

      // Outer Milestone dot
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: dotX,
        y: lineY - 0.08,
        w: 0.2,
        h: 0.2,
        fill: { color: this.cleanHexColor(theme.colors.primary) },
        line: { color: this.cleanHexColor(theme.colors.background), width: 2 },
        rectRadius: 0.1,
      });

      // Date
      if (item.date) {
        pptxSlide.addText(item.date, {
          x: itemX,
          y: lineY + 0.18,
          w: itemW,
          h: 0.25,
          fontSize: 11,
          bold: true,
          color: this.cleanHexColor(theme.colors.accent || theme.colors.primary),
          fontFace: cleanFontFace(theme.typography.codeFont),
          align: 'center',
        });
      }

      // Title & Description
      const cleanTitle = item.title;
      const descText = item.description ? `\n${item.description}` : '';
      pptxSlide.addText(`${cleanTitle}${descText}`, {
        x: itemX + 0.05,
        y: lineY + 0.45,
        w: itemW - 0.1,
        h: rect.h - 0.55,
        fontSize: 12,
        color: this.cleanHexColor(theme.colors.text),
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align: 'center',
        valign: 'top',
      });
    });
  }

  private renderCompare(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme
  ): void {
    const { element, bounds } = node;
    const compare = element as CompareElement;
    const rect = this.toInches(bounds, scaleX, scaleY);
    const colW = (rect.w - 0.4) / 2;

    // Left container
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: colW,
      h: rect.h,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: this.cleanHexColor(theme.colors.border), width: 1.5 },
      rectRadius: 0.1,
    });

    if (compare.leftTitle) {
      pptxSlide.addText(compare.leftTitle, {
        x: rect.x + 0.15,
        y: rect.y + 0.15,
        w: colW - 0.3,
        h: 0.4,
        fontSize: 15,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    }

    // Right container
    const rightX = rect.x + colW + 0.4;
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rightX,
      y: rect.y,
      w: colW,
      h: rect.h,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: this.cleanHexColor(theme.colors.border), width: 1.5 },
      rectRadius: 0.1,
    });

    if (compare.rightTitle) {
      pptxSlide.addText(compare.rightTitle, {
        x: rightX + 0.15,
        y: rect.y + 0.15,
        w: colW - 0.3,
        h: 0.4,
        fontSize: 15,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    }

    // Center VS Badge
    const vsX = rect.x + colW + 0.05;
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: vsX,
      y: rect.y + rect.h / 2 - 0.18,
      w: 0.3,
      h: 0.3,
      fill: { color: this.cleanHexColor(theme.colors.border || '#334155') },
      rectRadius: 0.15,
    });
    pptxSlide.addText('VS', {
      x: vsX,
      y: rect.y + rect.h / 2 - 0.18,
      w: 0.3,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: this.cleanHexColor(theme.colors.muted || '#94a3b8'),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
    });
  }

  private renderSection(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    section: SectionElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const cardBg = this.cleanHexColor(theme.colors.surface || '#0f172a');
    const primaryHex = this.cleanHexColor(theme.colors.primary || '#00F0FF');

    // Container box
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: cardBg },
      line: { color: primaryHex, width: 2 },
      rectRadius: 0.1,
    });

    if (section.number !== undefined) {
      const numStr = String(section.number);
      const pillW = Math.min(2.4, Math.max(1.4, numStr.length * 0.15 + 0.8));
      const pillX = rect.x + (rect.w - pillW) / 2;
      const pillY = rect.y + 0.35;

      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: pillX,
        y: pillY,
        w: pillW,
        h: 0.36,
        fill: { color: primaryHex },
        rectRadius: 0.18,
      });

      pptxSlide.addText(`SECTION ${numStr}`.toUpperCase(), {
        x: pillX,
        y: pillY,
        w: pillW,
        h: 0.36,
        fontSize: 11,
        bold: true,
        color: '000000',
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: 'center',
        valign: 'middle',
      });
    }

    const titleY = section.number !== undefined ? rect.y + 0.85 : rect.y + 0.45;
    pptxSlide.addText(section.title, {
      x: rect.x + 0.3,
      y: titleY,
      w: rect.w - 0.6,
      h: 0.85,
      fontSize: 28,
      bold: true,
      color: this.cleanHexColor(theme.colors.text || '#ffffff'),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
    });

    if (section.subtitle) {
      pptxSlide.addText(section.subtitle, {
        x: rect.x + 0.4,
        y: titleY + 0.85,
        w: rect.w - 0.8,
        h: 0.55,
        fontSize: 15,
        color: this.cleanHexColor(theme.colors.muted || '#94a3b8'),
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align: 'center',
        valign: 'top',
      });
    }
  }

  private renderToc(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    toc: TocElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme,
    presentation?: Presentation
  ): void {
    const items = toc.items ? [...toc.items] : [];
    if (items.length === 0 && presentation) {
      let autoIdx = 1;
      for (const s of presentation.slides) {
        for (const el of s.elements) {
          if (el.type === 'section') {
            const sec = el as SectionElement;
            items.push({
              number: sec.number !== undefined ? String(sec.number) : String(autoIdx++),
              title: sec.title,
              description: sec.subtitle,
            });
          }
        }
      }
      if (items.length === 0) {
        presentation.slides.forEach((s, idx) => {
          const heading = s.elements.find((el) => el.type === 'heading') as
            HeadingElement | undefined;
          if (heading) {
            items.push({
              number: String(idx + 1),
              title: heading.text,
            });
          }
        });
      }
    }

    if (items.length === 0) return;

    const primaryHex = this.cleanHexColor(theme.colors.primary || '#00F0FF');
    const surfaceHex = this.cleanHexColor(theme.colors.surface || '#0f172a');
    const borderHex = this.cleanHexColor(theme.colors.border || '#334155');
    const textHex = this.cleanHexColor(theme.colors.text || '#ffffff');
    const mutedHex = this.cleanHexColor(theme.colors.muted || '#94a3b8');

    let currentY = rect.y;
    if (toc.title) {
      pptxSlide.addText(toc.title, {
        x: rect.x,
        y: currentY,
        w: rect.w,
        h: 0.5,
        fontSize: 22,
        bold: true,
        color: primaryHex,
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
      currentY += 0.65;
    }

    const availableH = rect.h - (currentY - rect.y);
    const cols = items.length > 4 ? 2 : 1;
    const rows = Math.ceil(items.length / cols);
    const colW = (rect.w - (cols - 1) * 0.3) / cols;
    const itemH = Math.min(0.85, (availableH - (rows - 1) * 0.12) / rows);

    items.forEach((item, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const itemX = rect.x + c * (colW + 0.3);
      const itemY = currentY + r * (itemH + 0.12);
      const num = item.number !== undefined ? String(item.number) : String(idx + 1);
      const descText = item.description || item.subtitle;

      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: itemX,
        y: itemY,
        w: colW,
        h: itemH,
        fill: { color: surfaceHex },
        line: { color: borderHex, width: 1 },
        rectRadius: 0.08,
      });

      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: itemX + 0.12,
        y: itemY + (itemH - 0.36) / 2,
        w: 0.36,
        h: 0.36,
        fill: { color: primaryHex },
        rectRadius: 0.08,
      });

      pptxSlide.addText(num, {
        x: itemX + 0.12,
        y: itemY + (itemH - 0.36) / 2,
        w: 0.36,
        h: 0.36,
        fontSize: 11,
        bold: true,
        color: '000000',
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: 'center',
        valign: 'middle',
      });

      const textX = itemX + 0.55;
      const textW = colW - 0.65;
      const titleChunks: InlineChunk[] = [
        {
          text: item.title,
          options: {
            fontSize: 13,
            bold: true,
            color: textHex,
            fontFace: cleanFontFace(theme.typography.headingFont),
            breakLine: Boolean(descText),
          },
        },
      ];
      if (descText) {
        titleChunks.push({
          text: descText,
          options: {
            fontSize: 10,
            color: mutedHex,
            fontFace: cleanFontFace(theme.typography.bodyFont),
          },
        });
      }

      pptxSlide.addText(titleChunks, {
        x: textX,
        y: itemY + 0.06,
        w: textW,
        h: itemH - 0.12,
        valign: 'middle',
        margin: 0,
      });
    });
  }

  private renderMermaid(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    mermaid: MermaidElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: this.cleanHexColor(theme.colors.primary), width: 1 },
      rectRadius: 0.1,
    });

    pptxSlide.addText(`[Diagram: Mermaid]\n\n${mermaid.code}`, {
      x: rect.x + 0.2,
      y: rect.y + 0.2,
      w: rect.w - 0.4,
      h: rect.h - 0.4,
      fontSize: 12,
      color: this.cleanHexColor(theme.colors.text),
      fontFace: cleanFontFace(theme.typography.codeFont),
      align: 'center',
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

  private renderMath(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    math: MathElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const surfaceColor = this.cleanHexColor(theme.colors.surface || '11111b');
    const borderColor = this.cleanHexColor(theme.colors.border || theme.colors.primary);
    const accentColor = this.cleanHexColor(theme.colors.primary);
    const textColor = this.cleanHexColor(theme.colors.text || 'ffffff');

    // Equation Container Box
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      rectRadius: 0.08,
      fill: { color: surfaceColor },
      line: { color: borderColor, width: 1.2 },
    });

    // Left accent bar
    pptxSlide.addShape(pptx.ShapeType.rect, {
      x: rect.x,
      y: rect.y,
      w: 0.06,
      h: rect.h,
      fill: { color: accentColor },
      line: { color: accentColor, width: 0 },
    });

    // Equation text
    pptxSlide.addText(
      [
        {
          text: math.expression,
          options: {
            fontFace: 'Cambria Math',
            fontSize: 20,
            color: textColor,
            italic: true,
            align: 'center',
            valign: 'middle',
          },
        },
      ],
      {
        x: rect.x + 0.15,
        y: rect.y,
        w: Math.max(0.1, rect.w - 0.3),
        h: rect.h,
        margin: 0.08,
      }
    );
  }

  private isDarkColor(rawHex?: string): boolean {
    const hex = this.cleanHexColor(rawHex);
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
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
        return hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
      }
      return hex;
    }

    return '000000';
  }
}
