import pptxgen from 'pptxgenjs';
import {
  CardElement,
  CodeElement,
  HeadingElement,
  ListElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
} from '@biagioscaglia/yumia-ast';
import {
  DefaultLayoutEngine,
  LayoutNode,
  Rect,
  Size,
  SlideLayoutResult,
} from '@biagioscaglia/yumia-layout';
import { RenderContext, YumiaRenderer } from '@biagioscaglia/yumia-renderer';
import { defaultTheme, YumiaTheme } from '@biagioscaglia/yumia-theme';

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

    // Define crisp 16:9 widescreen canvas (13.333 x 7.5 inches)
    const slideWidthInches = 13.333;
    const slideHeightInches = 7.5;
    pptx.defineLayout({ name: 'YUMIA_16_9', width: slideWidthInches, height: slideHeightInches });
    pptx.layout = 'YUMIA_16_9';

    const pixelViewport: Size = { width: 1920, height: 1080 };
    const scaleX = slideWidthInches / pixelViewport.width;
    const scaleY = slideHeightInches / pixelViewport.height;

    for (const slide of presentation.slides) {
      const pptxSlide: PptxSlide = pptx.addSlide();

      const bgColor = this.cleanHexColor(theme.colors.background);
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
      fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.pptx`,
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

    pptxSlide.addText(heading.text, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fontSize,
      bold: true,
      fontFace: theme.typography.headingFont.split(',')[0]?.trim() || 'Arial',
      color,
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

    pptxSlide.addText(paragraph.text, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fontSize,
      fontFace: theme.typography.bodyFont.split(',')[0]?.trim() || 'Arial',
      color,
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

    const textItems = list.items.map((item) => ({
      text: item.text,
      options: {
        bullet: list.ordered ? ({ type: 'number' } as const) : true,
        fontSize,
        color,
        fontFace: theme.typography.bodyFont.split(',')[0]?.trim() || 'Arial',
        indentLevel: item.depth || 0,
        paraSpaceAfter: 8,
      },
    }));

    pptxSlide.addText(textItems, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      valign: 'top',
      margin: 0,
    });
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
      rectRadius: 0.1,
    });

    if (card.title) {
      pptxSlide.addText(card.title, {
        x: rect.x + 28 * scaleX,
        y: rect.y + 20 * scaleY,
        w: rect.w - 56 * scaleX,
        h: 40 * scaleY,
        fontSize: 22,
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

    pptxSlide.addText(`"${quote.text}"`, {
      x: rect.x + 0.2,
      y: rect.y,
      w: rect.w - 0.2,
      h: rect.h,
      fontSize: 20,
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

  private cleanHexColor(hex: string): string {
    return hex.replace('#', '').trim();
  }
}
