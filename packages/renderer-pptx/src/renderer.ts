import pptxgen from 'pptxgenjs';
import {
  BadgeElement,
  CalloutElement,
  CardElement,
  ChartElement,
  ClassDiagramElement,
  CodeElement,
  CompareElement,
  DiagramElement,
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
  SequenceElement,
  TableElement,
  TimelineElement,
  TocElement,
} from '@yumiamd/ast';
import {
  DefaultLayoutEngine,
  LayoutNode,
  Rect,
  Size,
  SlideLayoutResult,
  computeDiagramLayout,
  fitDiagramLabel,
  orthogonalEdgePoints,
} from '@yumiamd/layout';
import {
  RenderContext,
  YumiaRenderer,
  resolveSlideGeometry,
  themeSizeToPptxPoints,
  resolveLocalAsset,
  rasterizeIcon,
} from '@yumiamd/renderer';
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
    'Cambria',
    'Garamond',
  ];

  for (const font of fonts) {
    if (safeList.includes(font)) {
      return font;
    }
  }

  const lower = fontString.toLowerCase();
  if (
    lower.includes('mono') ||
    lower.includes('code') ||
    lower.includes('jetbrains') ||
    lower.includes('fira')
  ) {
    return 'Consolas';
  }
  if (
    (lower.includes('serif') ||
      lower.includes('times') ||
      lower.includes('georgia') ||
      lower.includes('cinzel') ||
      lower.includes('playfair')) &&
    !lower.includes('sans')
  ) {
    return 'Georgia';
  }
  if (
    lower.includes('outfit') ||
    lower.includes('grotesk') ||
    lower.includes('orbitron') ||
    lower.includes('trebuchet')
  ) {
    return 'Trebuchet MS';
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

    // Define slide canvas from shared aspect-ratio geometry (16:9 / 4:3 / 16:10)
    const geometry = resolveSlideGeometry(presentation.metadata.aspectRatio);
    const slideWidthInches = geometry.inches.width;
    const slideHeightInches = geometry.inches.height;
    const layoutName = geometry.layoutName;

    pptx.defineLayout({ name: layoutName, width: slideWidthInches, height: slideHeightInches });
    pptx.layout = layoutName;

    const pixelViewport: Size = geometry.pixelViewport;
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

      if (presentation.metadata.watermark) {
        const watermarkText =
          typeof presentation.metadata.watermark === 'string'
            ? presentation.metadata.watermark
            : 'CONFIDENTIAL';
        pptxSlide.addText(watermarkText.toUpperCase(), {
          x: 0.5,
          y: slideHeightInches - 0.4,
          w: slideWidthInches - 1.0,
          h: 0.25,
          fontSize: 9,
          bold: true,
          color: this.cleanHexColor(theme.colors.muted || '#888888'),
          fontFace: cleanFontFace(theme.typography.headingFont),
        });
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
      case 'diagram':
        this.renderDiagram(pptxSlide, pptx, element as DiagramElement, rect, theme);
        break;
      case 'sequence':
        this.renderSequence(pptxSlide, pptx, element as SequenceElement, rect, theme);
        break;
      case 'class-diagram':
        this.renderClassDiagram(pptxSlide, pptx, element as ClassDiagramElement, rect, theme);
        break;
      case 'icon': {
        const ic = element as IconElement;
        const rawSize = typeof ic.size === 'number' ? ic.size : parseInt(String(ic.size || 32), 10);
        const px = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(128, rawSize) : 32;
        const color = '#' + this.cleanHexColor(ic.color || theme.colors.primary);
        try {
          const raster = rasterizeIcon(ic.name, px, color);
          const inches = Math.max(0.25, Math.min(rect.w, rect.h, px / 96));
          pptxSlide.addImage({
            data: `image/png;base64,${raster.png.toString('base64')}`,
            x: rect.x,
            y: rect.y,
            w: inches,
            h: inches,
          });
        } catch {
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
        }
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
      valign: 'top',
      margin: 0,
    });
  }

  private renderParagraph(
    pptxSlide: PptxSlide,
    paragraph: ParagraphElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const fontSize = themeSizeToPptxPoints(theme.typography.sizes?.body, 18);
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
      // Keep glyphs inside the layout box; wrapping is fine, overflow into neighbors is not.
      shrinkText: rect.h < 0.32,
    });
  }

  private renderList(
    pptxSlide: PptxSlide,
    list: ListElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const fontSize = themeSizeToPptxPoints(theme.typography.sizes?.body, 18) - 0.5;
    const color = this.cleanHexColor(theme.colors.text);
    const allChunks: InlineChunk[] = [];

    list.items.forEach((item, itemIdx) => {
      const itemChunks = parseInlineMarkdown(item.text, {
        fontSize,
        color,
        fontFace: cleanFontFace(theme.typography.bodyFont),
        indentLevel: item.depth || 0,
        paraSpaceAfter: 4,
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
    const resolved = resolveLocalAsset(image.src);
    const drawPlaceholder = () => {
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
    };

    if (!resolved || !resolved.exists) {
      drawPlaceholder();
      return;
    }

    try {
      pptxSlide.addImage({
        path: resolved.absolutePath,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        sizing: { type: 'contain', w: rect.w, h: rect.h },
      });
    } catch {
      drawPlaceholder();
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
        y: rect.y + 0.12,
        w: rect.w - 0.5,
        h: 0.3,
        fontSize: themeSizeToPptxPoints(theme.typography.sizes?.h4, 22),
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
    const bgColor = this.cleanHexColor(codeTheme?.background || '#0f172a');
    const textColor = this.cleanHexColor(codeTheme?.textColor || '#f8fafc');
    const primaryColor = this.cleanHexColor(theme.colors.primary || '#00F0FF');
    const mutedColor = this.cleanHexColor(theme.colors.muted || '#64748b');

    // Terminal Container
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fill: { color: bgColor },
      line: { color: this.cleanHexColor(theme.colors.border || '#334155'), width: 1.5 },
      rectRadius: 0.08,
    });

    // 3 mac-style terminal dots
    pptxSlide.addShape(pptx.ShapeType.ellipse || 'ellipse', {
      x: rect.x + 0.15,
      y: rect.y + 0.12,
      w: 0.1,
      h: 0.1,
      fill: { color: 'ef4444' },
      line: { color: 'ef4444', width: 0 },
    });
    pptxSlide.addShape(pptx.ShapeType.ellipse || 'ellipse', {
      x: rect.x + 0.3,
      y: rect.y + 0.12,
      w: 0.1,
      h: 0.1,
      fill: { color: 'f59e0b' },
      line: { color: 'f59e0b', width: 0 },
    });
    pptxSlide.addShape(pptx.ShapeType.ellipse || 'ellipse', {
      x: rect.x + 0.45,
      y: rect.y + 0.12,
      w: 0.1,
      h: 0.1,
      fill: { color: '10b981' },
      line: { color: '10b981', width: 0 },
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
        const contentColor = isHl ? primaryColor : textColor;

        chunks.push({
          text: `${lineNumPad}  `,
          options: {
            fontSize: 11,
            fontFace: 'Consolas',
            color: numColor,
            bold: isHl,
          },
        });

        chunks.push({
          text: line || ' ',
          options: {
            fontSize: 11,
            fontFace: 'Consolas',
            color: contentColor,
            bold: isHl,
            breakLine: idx < lines.length - 1,
          },
        });
      });

      pptxSlide.addText(chunks, {
        x: rect.x + 0.2,
        y: rect.y + 0.32,
        w: rect.w - 0.4,
        h: rect.h - 0.4,
        valign: 'top',
        margin: 0,
      });
    } else {
      pptxSlide.addText(code.code, {
        x: rect.x + 0.22,
        y: rect.y + 0.36,
        w: Math.max(0.2, rect.w - 0.44),
        h: Math.max(0.2, rect.h - 0.48),
        fontSize: rect.h < 2.2 ? 10 : 11.5,
        fontFace: 'Consolas',
        color: textColor,
        valign: 'top',
        margin: 0,
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
    const badgeW = Math.min(3.5, Math.max(1.2, badgeText.length * 0.11 + 0.6));
    const badgeH = Math.min(0.38, Math.max(0.3, rect.h));
    const badgeX = rect.w > 4.0 ? rect.x + (rect.w - badgeW) / 2 : rect.x;

    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: badgeX,
      y: rect.y,
      w: badgeW,
      h: badgeH,
      fill: { color: this.cleanHexColor(theme.colors.surface) },
      line: { color: badgeColor, width: 1.5 },
      rectRadius: 0.15,
    });

    pptxSlide.addText(badgeText.toUpperCase(), {
      x: badgeX,
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

    const titleH = callout.title ? 0.38 : 0;
    if (callout.title) {
      pptxSlide.addText(callout.title, {
        x: rect.x + 0.2,
        y: rect.y + 0.16,
        w: rect.w - 0.4,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: sevColor,
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    }

    pptxSlide.addText(callout.text, {
      x: rect.x + 0.2,
      y: rect.y + titleH + 0.14,
      w: rect.w - 0.4,
      h: Math.max(0.2, rect.h - titleH - 0.28),
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

    const align = (hero.align as 'left' | 'center' | 'right') || 'center';
    const compact = rect.h < 2.4;
    const maxY = rect.y + rect.h - 0.04;
    let curY = rect.y + (compact ? 0.08 : 0.24);

    if (hero.badge && curY < maxY) {
      const badgeW = Math.min(3.2, Math.max(1.4, hero.badge.length * 0.11 + 0.6));
      const badgeX =
        align === 'left'
          ? rect.x
          : align === 'right'
            ? rect.x + rect.w - badgeW
            : rect.x + (rect.w - badgeW) / 2;
      const badgeH = Math.min(compact ? 0.26 : 0.32, maxY - curY);
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: badgeX,
        y: curY,
        w: badgeW,
        h: badgeH,
        fill: { color: this.cleanHexColor(theme.colors.surface) },
        line: { color: this.cleanHexColor(theme.colors.primary), width: 1.5 },
        rectRadius: 0.16,
      });
      pptxSlide.addText(hero.badge.toUpperCase(), {
        x: badgeX,
        y: curY,
        w: badgeW,
        h: badgeH,
        fontSize: compact ? 9 : 10,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: 'center',
        valign: 'middle',
      });
      curY += compact ? 0.36 : 0.48;
    } else if (hero.tagline && curY < maxY) {
      const tagH = Math.min(0.32, maxY - curY);
      pptxSlide.addText(hero.tagline.toUpperCase(), {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: tagH,
        fontSize: compact ? 10 : 11,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align,
      });
      curY += compact ? 0.34 : 0.42;
    }

    const titleLines = Math.max(1, Math.ceil(hero.title.length / (compact ? 48 : 38)));
    const titleBudget = Math.max(0.24, maxY - curY - (hero.subtitle ? 0.3 : 0.02));
    const titleH = Math.min(
      Math.max(compact ? 0.42 : 0.7, titleLines * (compact ? 0.36 : 0.55) + 0.08),
      titleBudget
    );
    const displaySize = themeSizeToPptxPoints(theme.typography.sizes?.display, 56);
    const titleFontSize = compact
      ? titleLines > 1
        ? Math.min(20, displaySize - 16)
        : Math.min(24, displaySize - 12)
      : titleLines > 2
        ? displaySize - 10
        : titleLines > 1
          ? displaySize - 6
          : displaySize;

    if (titleH >= 0.24) {
      pptxSlide.addText(hero.title, {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: titleH,
        fontSize: titleFontSize,
        bold: true,
        color: this.cleanHexColor(theme.colors.text),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align,
        valign: 'top',
      });
    }
    curY += titleH + (compact ? 0.04 : 0.08);

    if (hero.subtitle && curY < maxY - 0.14) {
      const subLines = Math.max(1, Math.ceil(hero.subtitle.length / (compact ? 64 : 56)));
      const subH = Math.min(Math.max(compact ? 0.28 : 0.38, subLines * 0.28 + 0.06), maxY - curY);
      const bodySize = themeSizeToPptxPoints(theme.typography.sizes?.body, 18);
      const subFontSize = compact ? bodySize - 1 : subLines > 2 ? bodySize - 1 : bodySize + 1;
      pptxSlide.addText(hero.subtitle, {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: subH,
        fontSize: subFontSize,
        color: this.cleanHexColor(theme.colors.muted || theme.colors.text),
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align,
        valign: 'top',
      });
      curY += subH + (compact ? 0.06 : 0.12);
    }

    // Keep badge+tagline secondary line inside hero bounds only.
    if (hero.tagline && hero.badge && curY + 0.28 <= maxY) {
      pptxSlide.addText(hero.tagline, {
        x: rect.x,
        y: curY,
        w: rect.w,
        h: 0.28,
        fontSize: 12,
        color: this.cleanHexColor(theme.colors.muted || theme.colors.text),
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align,
      });
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

    if (chartData.length === 0) {
      chartData.push({
        name: chart.title || 'Data',
        labels: labels.length > 0 ? labels : ['Point 1'],
        values: [0],
      });
    }

    if (chart.chartType === 'gauge') {
      const val = series[0]?.values[0] || 0;
      const surfaceColor = this.cleanHexColor(theme.colors.surface || '1e293b');
      const borderColor = this.cleanHexColor(theme.colors.border || '475569');
      const primaryColor = this.cleanHexColor(theme.colors.primary);

      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        fill: { color: surfaceColor },
        line: { color: borderColor, width: 1 },
        rectRadius: 0.1,
      });

      if (chart.title) {
        pptxSlide.addText(chart.title, {
          x: rect.x,
          y: rect.y + 0.15,
          w: rect.w,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: primaryColor,
          fontFace: cleanFontFace(theme.typography.headingFont),
          align: 'center',
        });
      }

      pptxSlide.addText(`${val}%`, {
        x: rect.x,
        y: rect.y + (chart.title ? 0.5 : 0.25),
        w: rect.w,
        h: 0.8,
        fontSize: 36,
        bold: true,
        color: this.cleanHexColor(theme.colors.text || 'ffffff'),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: 'center',
        valign: 'middle',
      });

      if (labels[0]) {
        pptxSlide.addText(labels[0], {
          x: rect.x,
          y: rect.y + (chart.title ? 1.3 : 1.05),
          w: rect.w,
          h: 0.3,
          fontSize: 12,
          color: this.cleanHexColor(theme.colors.muted || '94a3b8'),
          fontFace: cleanFontFace(theme.typography.bodyFont),
          align: 'center',
        });
      }
      return;
    }

    if (chart.chartType === 'radar') {
      const surfaceColor = this.cleanHexColor(theme.colors.surface || '1e293b');
      const borderColor = this.cleanHexColor(theme.colors.border || '475569');
      const primaryColor = this.cleanHexColor(theme.colors.primary);
      const textHex = this.cleanHexColor(theme.colors.text || 'ffffff');

      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        fill: { color: surfaceColor },
        line: { color: borderColor, width: 1 },
        rectRadius: 0.1,
      });

      if (chart.title) {
        pptxSlide.addText(chart.title, {
          x: rect.x,
          y: rect.y + 0.12,
          w: rect.w,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: primaryColor,
          fontFace: cleanFontFace(theme.typography.headingFont),
          align: 'center',
        });
      }

      const values = series[0]?.values || [];
      const radarItems = labels.map((lbl, idx) => `${lbl}: ${values[idx] || 0}`).join('   •   ');
      pptxSlide.addText(`[RADAR ASSESSMENT]\n\n${radarItems}`, {
        x: rect.x + 0.2,
        y: rect.y + (chart.title ? 0.5 : 0.25),
        w: rect.w - 0.4,
        h: rect.h - (chart.title ? 0.6 : 0.35),
        fontSize: 12,
        bold: true,
        color: textHex,
        fontFace: cleanFontFace(theme.typography.bodyFont),
        align: 'center',
        valign: 'middle',
      });
      return;
    }

    let pptxChartType = pptx.ChartType.bar;
    if (chart.chartType === 'line') pptxChartType = pptx.ChartType.line;
    if (chart.chartType === 'area') pptxChartType = pptx.ChartType.area;
    if (chart.chartType === 'pie') pptxChartType = pptx.ChartType.pie;
    if (chart.chartType === 'doughnut') pptxChartType = pptx.ChartType.doughnut;
    if (chart.chartType === 'scatter') pptxChartType = pptx.ChartType.scatter;

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
    const colW = (rect.w - 0.5) / 2;

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
    const rightX = rect.x + colW + 0.5;
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

    // Center VS Badge — keep wide enough so "VS" stays on one line
    const vsW = 0.42;
    const vsH = 0.42;
    const vsX = rect.x + colW + (0.5 - vsW) / 2;
    const vsY = rect.y + rect.h / 2 - vsH / 2;
    pptxSlide.addShape(pptx.ShapeType.ellipse, {
      x: vsX,
      y: vsY,
      w: vsW,
      h: vsH,
      fill: { color: this.cleanHexColor(theme.colors.surface || theme.colors.background) },
      line: { color: this.cleanHexColor(theme.colors.primary), width: 1.5 },
    });
    pptxSlide.addText('VS', {
      x: vsX,
      y: vsY,
      w: vsW,
      h: vsH,
      fontSize: 11,
      bold: true,
      color: this.cleanHexColor(theme.colors.text),
      fontFace: cleanFontFace(theme.typography.headingFont),
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    // Render left & right child elements
    if (node.children) {
      for (const childNode of node.children) {
        this.renderNode(pptxSlide, pptx, childNode, scaleX, scaleY, theme);
      }
    }
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

  private getHeadingFontSize(level: number, theme?: YumiaTheme): number {
    const sizes = theme?.typography?.sizes;
    switch (level) {
      case 1:
        return themeSizeToPptxPoints(sizes?.h1, 44);
      case 2:
        return themeSizeToPptxPoints(sizes?.h2, 36);
      case 3:
        return themeSizeToPptxPoints(sizes?.h3, 28);
      case 4:
        return themeSizeToPptxPoints(sizes?.h4, 22);
      default:
        return themeSizeToPptxPoints(sizes?.body, 18);
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

  private renderDiagram(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    diagram: DiagramElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    const isLR = (diagram.direction || 'LR').toUpperCase() === 'LR';
    if (diagram.nodes.length === 0) return;

    if (diagram.title) {
      pptxSlide.addText(diagram.title, {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: 0.28,
        fontSize: 12,
        bold: true,
        color: this.cleanHexColor(theme.colors.primary),
        fontFace: cleanFontFace(theme.typography.headingFont),
        align: 'center',
      });
    }

    const layout = computeDiagramLayout(diagram, 1000, isLR, {
      originX: 0,
      originY: diagram.title ? 30 : 0,
      titleHeight: diagram.title ? 30 : 0,
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;
    for (const p of Object.values(layout.positions)) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + layout.nodeWidth);
      maxY = Math.max(maxY, p.y + layout.nodeHeight);
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const drawY = diagram.title ? rect.y + 0.32 : rect.y;
    const drawH = diagram.title ? Math.max(0.4, rect.h - 0.32) : rect.h;
    const s = Math.min(rect.w / contentW, drawH / contentH);
    const nodeW = layout.nodeWidth * s;
    const nodeH = layout.nodeHeight * s;
    const offsetX = rect.x + (rect.w - contentW * s) / 2;
    const offsetY = drawY + (drawH - contentH * s) / 2;

    const positions: Record<string, { x: number; y: number }> = {};
    for (const [id, p] of Object.entries(layout.positions)) {
      positions[id] = {
        x: offsetX + (p.x - minX) * s,
        y: offsetY + (p.y - minY) * s,
      };
    }

    const arrowColor = this.cleanHexColor(theme.colors.accent || theme.colors.primary);
    const surfaceColor = this.cleanHexColor(theme.colors.surface || theme.colors.background);

    // Draw connecting edges (orthogonal elbows to reduce crossings)
    diagram.edges.forEach((e) => {
      const p1 = positions[e.from];
      const p2 = positions[e.to];
      if (!p1 || !p2) return;

      const pts = orthogonalEdgePoints(isLR, p1, p2, nodeW, nodeH);
      if (pts.length < 2) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const segMinX = Math.min(a.x, b.x);
        const segMinY = Math.min(a.y, b.y);
        const lineW = Math.max(0.01, Math.abs(b.x - a.x));
        const lineH = Math.max(0.01, Math.abs(b.y - a.y));
        const isLast = i === pts.length - 2;
        pptxSlide.addShape(pptx.ShapeType.line, {
          x: segMinX,
          y: segMinY,
          w: lineW,
          h: lineH,
          flipH: b.x < a.x,
          flipV: b.y < a.y,
          line: {
            color: arrowColor,
            width: 2,
            endArrowType: isLast ? 'triangle' : undefined,
            dashType: e.style === 'dashed' ? 'dash' : 'solid',
          },
        });
      }

      if (e.label) {
        const mid = pts[Math.floor(pts.length / 2)]!;
        const midX = mid.x;
        const midY = mid.y;
        const pillW = Math.min(1.4, Math.max(0.7, e.label.length * 0.08 + 0.25));
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: midX - pillW / 2,
          y: midY - 0.13,
          w: pillW,
          h: 0.26,
          fill: { color: surfaceColor },
          line: { color: this.cleanHexColor(theme.colors.border || 'cbd5e1'), width: 1 },
          rectRadius: 0.06,
        });
        pptxSlide.addText(e.label, {
          x: midX - pillW / 2,
          y: midY - 0.13,
          w: pillW,
          h: 0.26,
          fontSize: 9,
          bold: true,
          color: this.cleanHexColor(theme.colors.muted || '64748b'),
          fontFace: cleanFontFace(theme.typography.headingFont),
          align: 'center',
          valign: 'middle',
        });
      }
    });

    // Draw nodes
    diagram.nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;

      const variant = n.variant || 'primary';
      let nodeBorderColor = this.cleanHexColor(theme.colors.primary);
      if (variant === 'accent')
        nodeBorderColor = this.cleanHexColor(
          theme.colors.accent || theme.colors.secondary || theme.colors.primary
        );
      else if (variant === 'success')
        nodeBorderColor = this.cleanHexColor(theme.colors.success || '10b981');
      else if (variant === 'warning')
        nodeBorderColor = this.cleanHexColor(theme.colors.warning || 'f59e0b');
      else if (variant === 'danger')
        nodeBorderColor = this.cleanHexColor(theme.colors.danger || 'ef4444');

      let shapeType = pptx.ShapeType.roundRect;
      if (n.shape === 'diamond') shapeType = pptx.ShapeType.diamond;
      else if (n.shape === 'database') shapeType = pptx.ShapeType.can;
      else if (n.shape === 'circle') shapeType = pptx.ShapeType.ellipse || 'ellipse';

      pptxSlide.addShape(shapeType, {
        x: p.x,
        y: p.y,
        w: nodeW,
        h: nodeH,
        fill: { color: surfaceColor },
        line: { color: nodeBorderColor, width: 2 },
        rectRadius: 0.08,
      });

      if (n.shape === 'database') {
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: p.x + 0.15,
          y: p.y + 0.1,
          w: Math.max(0.1, nodeW - 0.3),
          h: 0.02,
          fill: { color: nodeBorderColor },
          line: { color: nodeBorderColor, width: 1 },
        });
      }

      pptxSlide.addText(fitDiagramLabel(n.label, Math.max(10, Math.floor((nodeW * 72) / 6.8))), {
        x: p.x + 0.08,
        y: p.y + 0.06,
        w: Math.max(0.1, nodeW - 0.16),
        h: Math.max(0.1, nodeH - 0.12),
        align: 'center',
        valign: 'middle',
        fontSize: nodeW < 1.1 ? 10 : n.label.length > 22 ? 11 : 12,
        bold: true,
        color: this.cleanHexColor(theme.colors.text || 'ffffff'),
        fontFace: cleanFontFace(theme.typography.headingFont),
        margin: 0,
      });
    });
  }

  private renderSequence(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    seq: SequenceElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    if (!seq.participants || seq.participants.length === 0) return;

    const N = seq.participants.length;
    const availW = Math.max(0.5, rect.w - 0.4);
    const pWidth = Math.min(1.4, availW / (N * 1.15));
    const pGap = N > 1 ? (availW - N * pWidth) / (N - 1) : 0;

    const primaryColor = this.cleanHexColor(theme.colors.primary);
    const surfaceColor = this.cleanHexColor(theme.colors.surface || '1e293b');
    const borderColor = this.cleanHexColor(theme.colors.border || '334155');
    const textColor = this.cleanHexColor(theme.colors.text || 'f8fafc');
    const accentColor = this.cleanHexColor(theme.colors.accent || theme.colors.primary);

    const participantPositions: Record<string, number> = {};

    // Draw participant lifelines and header boxes
    seq.participants.forEach((p, idx) => {
      const px = rect.x + 0.2 + idx * (pWidth + pGap);
      const centerX = px + pWidth / 2;
      participantPositions[p.id] = centerX;

      const headerH = 0.45;
      const headerY = rect.y + 0.1;
      const bottomY = rect.y + rect.h - 0.15;
      const isActor = p.type === 'actor';

      // Lifeline (dashed line from header bottom to slide bottom)
      pptxSlide.addShape(pptx.ShapeType.line, {
        x: centerX,
        y: headerY + headerH,
        w: 0.01,
        h: Math.max(0.1, bottomY - (headerY + headerH)),
        line: {
          color: borderColor,
          width: 1.5,
          dashType: 'dash',
        },
      });

      // Participant Box
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: px,
        y: headerY,
        w: pWidth,
        h: headerH,
        fill: { color: isActor ? accentColor : surfaceColor },
        line: { color: primaryColor, width: 1.5 },
        rectRadius: 0.06,
      });

      pptxSlide.addText(p.name, {
        x: px + 0.05,
        y: headerY + 0.04,
        w: Math.max(0.1, pWidth - 0.1),
        h: Math.max(0.1, headerH - 0.08),
        align: 'center',
        valign: 'middle',
        fontSize: p.name.length > 14 ? 9 : 10,
        bold: true,
        color: isActor ? 'ffffff' : textColor,
        fontFace: cleanFontFace(theme.typography.headingFont),
      });
    });

    // Draw messages
    if (seq.messages && seq.messages.length > 0) {
      const msgCount = seq.messages.length;
      const startY = rect.y + 0.75;
      const availH = Math.max(0.5, rect.h - 1.0);
      const stepY = availH / Math.max(1, msgCount);

      seq.messages.forEach((msg, mIdx) => {
        const x1 = participantPositions[msg.from] ?? rect.x;
        const x2 = participantPositions[msg.to] ?? rect.x + rect.w;
        const currentY = startY + mIdx * stepY;

        const minX = Math.min(x1, x2);
        const lineW = Math.max(0.05, Math.abs(x2 - x1));
        const flipH = x2 < x1;
        const isReturn = msg.style === 'dashed' || msg.arrowType === 'return';

        pptxSlide.addShape(pptx.ShapeType.line, {
          x: minX,
          y: currentY,
          w: lineW,
          h: 0.01,
          flipH,
          line: {
            color: isReturn ? accentColor : primaryColor,
            width: 2,
            endArrowType: 'triangle',
            dashType: isReturn ? 'dash' : 'solid',
          },
        });

        // Message text pill / label
        const labelText = msg.label || '';
        const pillW = Math.min(lineW, Math.max(0.8, labelText.length * 0.08 + 0.2));
        const pillX = minX + (lineW - pillW) / 2;

        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: pillX,
          y: currentY - 0.24,
          w: pillW,
          h: 0.22,
          fill: { color: surfaceColor },
          line: { color: borderColor, width: 1 },
          rectRadius: 0.04,
        });

        pptxSlide.addText(labelText, {
          x: pillX,
          y: currentY - 0.24,
          w: pillW,
          h: 0.22,
          align: 'center',
          valign: 'middle',
          fontSize: 8.5,
          bold: true,
          color: textColor,
          fontFace: cleanFontFace(theme.typography.bodyFont),
        });
      });
    }

    // Draw notes if any
    if (seq.notes && seq.notes.length > 0) {
      seq.notes.forEach((note, nIdx) => {
        const targetX = participantPositions[note.participant];
        const noteX =
          targetX !== undefined
            ? note.position === 'right'
              ? targetX + 0.3
              : note.position === 'left'
                ? targetX - 1.3
                : targetX - 0.6
            : rect.x + 0.2 + nIdx * 1.5;
        const noteY = rect.y + rect.h - 0.45;

        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: noteX,
          y: noteY,
          w: 1.2,
          h: 0.35,
          fill: { color: this.cleanHexColor(theme.colors.warning || 'eab308') },
          line: { color: this.cleanHexColor(theme.colors.border || 'ca8a04'), width: 1 },
          rectRadius: 0.04,
        });

        pptxSlide.addText(note.text, {
          x: noteX + 0.05,
          y: noteY + 0.04,
          w: 1.1,
          h: 0.27,
          fontSize: 8,
          bold: true,
          color: '000000',
          fontFace: cleanFontFace(theme.typography.bodyFont),
          align: 'center',
          valign: 'middle',
        });
      });
    }
  }

  private renderClassDiagram(
    pptxSlide: PptxSlide,
    pptx: PptxInstance,
    diagram: ClassDiagramElement,
    rect: { x: number; y: number; w: number; h: number },
    theme: YumiaTheme
  ): void {
    if (!diagram.classes || diagram.classes.length === 0) return;

    const K = diagram.classes.length;
    const cols = Math.min(K, K <= 3 ? K : Math.ceil(Math.sqrt(K * 1.4)));
    const rows = Math.ceil(K / cols);

    const gapX = cols > 1 ? 0.25 : 0;
    const gapY = rows > 1 ? 0.25 : 0;
    const cardW = Math.max(1.2, (rect.w - (cols - 1) * gapX) / cols);
    const cardH = Math.max(1.0, (rect.h - (rows - 1) * gapY) / rows);

    const primaryColor = this.cleanHexColor(theme.colors.primary);
    const surfaceColor = this.cleanHexColor(theme.colors.surface || '1e293b');
    const borderColor = this.cleanHexColor(theme.colors.border || '334155');
    const textColor = this.cleanHexColor(theme.colors.text || 'f8fafc');
    const accentColor = this.cleanHexColor(theme.colors.accent || theme.colors.primary);
    const mutedColor = this.cleanHexColor(theme.colors.muted || '94a3b8');

    const classPositions: Record<string, { x: number; y: number; w: number; h: number }> = {};

    diagram.classes.forEach((cls, idx) => {
      const cCol = idx % cols;
      const cRow = Math.floor(idx / cols);
      const cx = rect.x + cCol * (cardW + gapX);
      const cy = rect.y + cRow * (cardH + gapY);

      classPositions[cls.name] = { x: cx, y: cy, w: cardW, h: cardH };
      classPositions[cls.id] = { x: cx, y: cy, w: cardW, h: cardH };

      // Outer container card
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: cy,
        w: cardW,
        h: cardH,
        fill: { color: surfaceColor },
        line: { color: borderColor, width: 1.5 },
        rectRadius: 0.06,
      });

      // Header band
      const headerH = cls.isInterface || cls.isAbstract ? 0.44 : 0.34;
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: cy,
        w: cardW,
        h: headerH,
        fill: { color: cls.isInterface ? accentColor : primaryColor },
        line: { color: cls.isInterface ? accentColor : primaryColor, width: 0 },
        rectRadius: 0.06,
      });

      let headerLabel = cls.name;
      if (cls.isInterface) headerLabel = `<<interface>>\n${cls.name}`;
      else if (cls.isAbstract) headerLabel = `<<abstract>>\n${cls.name}`;

      pptxSlide.addText(headerLabel, {
        x: cx + 0.05,
        y: cy + 0.02,
        w: cardW - 0.1,
        h: headerH - 0.04,
        align: 'center',
        valign: 'middle',
        fontSize: 9.5,
        bold: true,
        color: 'ffffff',
        fontFace: cleanFontFace(theme.typography.headingFont),
      });

      const attributes = cls.members.filter((m) => !m.isMethod);
      const methods = cls.members.filter((m) => m.isMethod);

      // Attributes section
      let currentContentY = cy + headerH + 0.06;
      if (attributes.length > 0) {
        const attrLines = attributes
          .slice(0, 4)
          .map((a) => `${a.visibility || '+'} ${a.name}${a.type ? `: ${a.type}` : ''}`)
          .join('\n');
        const attrH = Math.min(0.55, attributes.length * 0.16 + 0.05);
        pptxSlide.addText(attrLines, {
          x: cx + 0.1,
          y: currentContentY,
          w: cardW - 0.2,
          h: attrH,
          align: 'left',
          valign: 'top',
          fontSize: 8,
          color: textColor,
          fontFace: 'Consolas',
        });
        currentContentY += attrH;

        // Divider
        pptxSlide.addShape(pptx.ShapeType.line, {
          x: cx,
          y: currentContentY,
          w: cardW,
          h: 0.01,
          line: { color: borderColor, width: 1 },
        });
        currentContentY += 0.05;
      }

      // Methods section
      if (methods.length > 0) {
        const methodLines = methods
          .slice(0, 4)
          .map(
            (m) =>
              `${m.visibility || '+'} ${m.name}(${m.params || ''})${m.type ? `: ${m.type}` : ''}`
          )
          .join('\n');
        const methodH = Math.min(
          cardH - (currentContentY - cy) - 0.05,
          methods.length * 0.16 + 0.05
        );
        if (methodH > 0.1) {
          pptxSlide.addText(methodLines, {
            x: cx + 0.1,
            y: currentContentY,
            w: cardW - 0.2,
            h: methodH,
            align: 'left',
            valign: 'top',
            fontSize: 8,
            color: mutedColor,
            fontFace: 'Consolas',
          });
        }
      }
    });

    // Draw relationships
    if (diagram.relationships && diagram.relationships.length > 0) {
      diagram.relationships.forEach((rel) => {
        const p1 = classPositions[rel.from];
        const p2 = classPositions[rel.to];
        if (!p1 || !p2) return;

        const x1 = p1.x + p1.w / 2;
        const y1 = p1.y + p1.h;
        const x2 = p2.x + p2.w / 2;
        const y2 = p2.y;

        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const lineW = Math.max(0.02, Math.abs(x2 - x1));
        const lineH = Math.max(0.02, Math.abs(y2 - y1));
        const flipH = x2 < x1;
        const flipV = y2 < y1;
        const isImplements =
          rel.relationshipType === 'implements' || rel.relationshipType === 'dependency';

        pptxSlide.addShape(pptx.ShapeType.line, {
          x: minX,
          y: minY,
          w: lineW,
          h: lineH,
          flipH,
          flipV,
          line: {
            color: accentColor,
            width: 1.5,
            endArrowType: 'triangle',
            dashType: isImplements ? 'dash' : 'solid',
          },
        });

        if (rel.label) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          pptxSlide.addText(rel.label, {
            x: midX - 0.5,
            y: midY - 0.12,
            w: 1.0,
            h: 0.24,
            align: 'center',
            valign: 'middle',
            fontSize: 8,
            color: mutedColor,
            fontFace: cleanFontFace(theme.typography.bodyFont),
          });
        }
      });
    }
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

    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
      const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)))
        .toString(16)
        .padStart(2, '0');
      const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)))
        .toString(16)
        .padStart(2, '0');
      const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)))
        .toString(16)
        .padStart(2, '0');
      return `${r}${g}${b}`;
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
