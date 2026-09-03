import {
  CardElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  HeadingElement,
  ListElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  Slide,
  SlideElement,
} from '@yumia/ast';
import {
  LayoutEngine,
  LayoutNode,
  LayoutOptions,
  PresentationLayoutResult,
  Rect,
  Size,
  SlideLayoutResult,
} from './types.js';

export const DEFAULT_VIEWPORT: Size = {
  width: 1920,
  height: 1080,
};

export class DefaultLayoutEngine implements LayoutEngine {
  computeSlide(
    slide: Slide,
    viewport: Size = DEFAULT_VIEWPORT,
    options: LayoutOptions = {}
  ): SlideLayoutResult {
    const padding = options.padding ?? 64;
    const gap = options.gap ?? 24;
    const availableWidth = viewport.width - padding * 2;
    const availableHeight = viewport.height - padding * 2;

    if (slide.elements.length === 0) {
      return {
        ...(slide.id ? { slideId: slide.id } : {}),
        viewport,
        nodes: [],
        overflow: false,
        overflowAmount: 0,
      };
    }

    const { nodes, totalHeight } = this.layoutElementList(
      slide.elements,
      padding,
      padding,
      availableWidth,
      gap
    );

    const overflow = totalHeight > availableHeight;
    const overflowAmount = overflow ? totalHeight - availableHeight : 0;

    return {
      ...(slide.id ? { slideId: slide.id } : {}),
      viewport,
      nodes,
      overflow,
      overflowAmount,
    };
  }

  computePresentation(
    presentation: Presentation,
    viewport: Size = DEFAULT_VIEWPORT,
    options: LayoutOptions = {}
  ): PresentationLayoutResult {
    return {
      viewport,
      slides: presentation.slides.map((slide: Slide) =>
        this.computeSlide(slide, viewport, options)
      ),
    };
  }

  private layoutElementList(
    elements: SlideElement[],
    startX: number,
    startY: number,
    availableWidth: number,
    gap: number
  ): { nodes: LayoutNode[]; totalHeight: number } {
    let currentY = startY;
    const nodes: LayoutNode[] = [];

    for (const element of elements) {
      const node = this.layoutSingleElement(element, startX, currentY, availableWidth, gap);
      nodes.push(node);
      currentY += node.bounds.height + gap;
    }

    const totalHeight = elements.length > 0 ? currentY - startY - gap : 0;
    return { nodes, totalHeight };
  }

  private layoutSingleElement(
    element: SlideElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    switch (element.type) {
      case 'heading': {
        const height = this.estimateHeadingHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'paragraph': {
        const height = this.estimateParagraphHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'list': {
        const height = this.estimateListHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'code': {
        const height = this.estimateCodeHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'quote': {
        const height = this.estimateQuoteHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'card': {
        return this.layoutCard(element, x, y, width, gap);
      }
      case 'columns': {
        return this.layoutColumns(element, x, y, width, gap);
      }
      default: {
        const height = 60;
        return { element, bounds: { x, y, width, height } };
      }
    }
  }

  private layoutCard(
    element: CardElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    const cardPadding = 28;
    const innerWidth = width - cardPadding * 2;
    const innerStartY = y + cardPadding;

    const { nodes: children, totalHeight: innerHeight } = this.layoutElementList(
      element.elements,
      x + cardPadding,
      innerStartY,
      innerWidth,
      gap / 1.5
    );

    const cardHeight = innerHeight + cardPadding * 2;
    const bounds: Rect = { x, y, width, height: cardHeight };

    return {
      element,
      bounds,
      children,
    };
  }

  private layoutColumns(
    element: ColumnsElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    const columnCount = element.columns.length;
    if (columnCount === 0) {
      return { element, bounds: { x, y, width, height: 0 }, children: [] };
    }

    const ratios = this.parseRatios(element.ratios, columnCount);
    const totalGap = gap * (columnCount - 1);
    const usableWidth = width - totalGap;

    let currentX = x;
    const columnNodes: LayoutNode[] = [];
    let maxColumnHeight = 0;

    for (let i = 0; i < columnCount; i++) {
      const col = element.columns[i] as ColumnElement;
      const ratio = ratios[i] ?? 1 / columnCount;
      const colWidth = usableWidth * ratio;

      const { nodes: colChildren, totalHeight: colHeight } = this.layoutElementList(
        col.elements,
        currentX,
        y,
        colWidth,
        gap
      );

      columnNodes.push({
        element: col,
        bounds: { x: currentX, y, width: colWidth, height: colHeight },
        children: colChildren,
      });

      maxColumnHeight = Math.max(maxColumnHeight, colHeight);
      currentX += colWidth + gap;
    }

    return {
      element,
      bounds: { x, y, width, height: maxColumnHeight },
      children: columnNodes,
    };
  }

  private parseRatios(ratiosStr: string | undefined, count: number): number[] {
    if (!ratiosStr) {
      return Array(count).fill(1 / count);
    }

    const parts = ratiosStr
      .split(/[:/]/)
      .map((p) => parseFloat(p.trim()))
      .filter((n) => !isNaN(n));
    if (parts.length !== count || parts.some((p) => p <= 0)) {
      return Array(count).fill(1 / count);
    }

    const sum = parts.reduce((acc, val) => acc + val, 0);
    return parts.map((p) => p / sum);
  }

  private estimateHeadingHeight(heading: HeadingElement): number {
    switch (heading.level) {
      case 1:
        return 90;
      case 2:
        return 70;
      case 3:
        return 55;
      default:
        return 45;
    }
  }

  private estimateParagraphHeight(paragraph: ParagraphElement, width: number): number {
    const charsPerLine = Math.max(20, Math.floor(width / 14));
    const lines = Math.ceil(paragraph.text.length / charsPerLine) || 1;
    return Math.max(40, lines * 32);
  }

  private estimateListHeight(list: ListElement): number {
    return Math.max(40, list.items.length * 36);
  }

  private estimateCodeHeight(code: CodeElement): number {
    const lines = code.code.split('\n').length || 1;
    return lines * 26 + 32;
  }

  private estimateQuoteHeight(quote: QuoteElement, width: number): number {
    const charsPerLine = Math.max(20, Math.floor(width / 14));
    const lines = Math.ceil(quote.text.length / charsPerLine) || 1;
    return lines * 32 + 24;
  }
}
