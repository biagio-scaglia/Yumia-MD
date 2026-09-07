import {
  CalloutElement,
  CardElement,
  ChartElement,
  ClassDiagramElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  CompareElement,
  DiagramElement,
  GridElement,
  HeadingElement,
  HeroElement,
  IconElement,
  ImageElement,
  ListElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  SequenceElement,
  Slide,
  SlideElement,
  StackElement,
  TableElement,
} from '@yumiamd/ast';
import { estimateDiagramHeight } from './diagram.js';
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

export const VIEWPORT_PRESETS: Record<string, Size> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '16:10': { width: 1920, height: 1200 },
};

export class DefaultLayoutEngine implements LayoutEngine {
  computeSlide(
    slide: Slide,
    viewport: Size = DEFAULT_VIEWPORT,
    options: LayoutOptions = {}
  ): SlideLayoutResult {
    const padding = options.padding ?? 64;
    const gap = options.gap ?? 28;
    const availableWidth = Math.max(100, viewport.width - padding * 2);
    const availableHeight = Math.max(100, viewport.height - padding * 2);

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
    viewport?: Size,
    options: LayoutOptions = {}
  ): PresentationLayoutResult {
    const effectiveViewport =
      viewport ||
      (presentation.metadata.aspectRatio && VIEWPORT_PRESETS[presentation.metadata.aspectRatio]) ||
      DEFAULT_VIEWPORT;

    return {
      viewport: effectiveViewport,
      slides: presentation.slides.map((slide: Slide) =>
        this.computeSlide(slide, effectiveViewport, options)
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
    // Heroes sharing a slide with other roots must stay compact or they collide.
    const compactHero = elements.length > 1 && elements.some((el) => el.type === 'hero');

    for (const element of elements) {
      const node = this.layoutSingleElement(
        element,
        startX,
        currentY,
        availableWidth,
        gap,
        compactHero
      );
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
    gap: number,
    compactHero: boolean = false
  ): LayoutNode {
    switch (element.type) {
      case 'hero': {
        return this.layoutHero(element as HeroElement, x, y, width, gap, compactHero);
      }
      case 'heading': {
        const height = this.estimateHeadingHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'paragraph': {
        const height = this.estimateParagraphHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'list': {
        const height = this.estimateListHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'code': {
        const height = this.estimateCodeHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'quote': {
        const height = this.estimateQuoteHeight(element, width);
        return { element, bounds: { x, y, width, height } };
      }
      case 'table': {
        const height = this.estimateTableHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'image': {
        const height = this.estimateImageHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'metric': {
        const height = this.estimateMetricHeight(element);
        return { element, bounds: { x, y, width, height } };
      }
      case 'callout': {
        const c = element as CalloutElement;
        const lines = Math.ceil(c.text.length / Math.max(15, Math.floor(width / 14))) || 1;
        const height = Math.max(100, lines * 30 + (c.title ? 52 : 0) + 40);
        return { element, bounds: { x, y, width, height } };
      }
      case 'badge': {
        return { element, bounds: { x, y, width, height: 52 } };
      }
      case 'math': {
        const height = 90;
        return { element, bounds: { x, y, width, height } };
      }
      case 'chart': {
        const ch = element as ChartElement;
        let height = 280;
        if (ch.chartType === 'radar') height = 320;
        else if (ch.chartType === 'gauge') height = 220;
        else if (ch.chartType === 'area') height = 280;
        if (ch.title) height += 30;
        return { element, bounds: { x, y, width, height } };
      }
      case 'diagram': {
        const d = element as DiagramElement;
        const height = Math.max(200, Math.min(520, estimateDiagramHeight(d, width)));
        return { element, bounds: { x, y, width, height } };
      }
      case 'icon': {
        const ic = element as IconElement;
        const rawSize = typeof ic.size === 'number' ? ic.size : parseInt(String(ic.size || 48), 10);
        const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 48;
        return { element, bounds: { x, y, width: Math.max(size, 64), height: size + 8 } };
      }
      case 'sequence': {
        const seq = element as SequenceElement;
        const msgCount = Math.max(1, seq.messages.length);
        const height = Math.max(240, Math.min(500, 90 + msgCount * 44 + (seq.title ? 35 : 0)));
        return { element, bounds: { x, y, width, height } };
      }
      case 'class-diagram': {
        const cd = element as ClassDiagramElement;
        const maxMembers = Math.max(1, ...cd.classes.map((c) => c.members.length));
        const height = Math.max(240, Math.min(480, 100 + maxMembers * 26 + (cd.title ? 35 : 0)));
        return { element, bounds: { x, y, width, height } };
      }
      case 'timeline': {
        const height = 160;
        return { element, bounds: { x, y, width, height } };
      }
      case 'section': {
        const height = 280;
        return { element, bounds: { x, y, width, height } };
      }
      case 'toc': {
        const height = 340;
        return { element, bounds: { x, y, width, height } };
      }
      case 'card': {
        return this.layoutCard(element, x, y, width, gap);
      }
      case 'columns': {
        return this.layoutColumns(element, x, y, width, gap);
      }
      case 'grid': {
        return this.layoutGrid(element as GridElement, x, y, width, gap);
      }
      case 'compare': {
        return this.layoutCompare(element as CompareElement, x, y, width, gap);
      }
      case 'stack': {
        return this.layoutStack(element as StackElement, x, y, width, gap);
      }
      default: {
        const height = 60;
        return { element, bounds: { x, y, width, height } };
      }
    }
  }

  private layoutHero(
    element: HeroElement,
    x: number,
    y: number,
    width: number,
    gap: number,
    compact: boolean = false
  ): LayoutNode {
    let curY = y;
    if (element.badge || element.tagline) {
      curY += compact ? 44 : 56;
    }
    const charsPerLineTitle = Math.max(10, Math.floor(width / (compact ? 36 : 30)));
    const titleLines = Math.max(1, Math.ceil(element.title.length / charsPerLineTitle));
    const titleHeight = compact
      ? Math.max(72, titleLines * 52 + 16)
      : Math.max(110, titleLines * 76 + 28);
    curY += titleHeight;

    if (element.subtitle) {
      const charsPerLineSub = Math.max(18, Math.floor(width / (compact ? 22 : 18)));
      const subLines = Math.max(1, Math.ceil(element.subtitle.length / charsPerLineSub));
      const subHeight = compact
        ? Math.max(44, subLines * 34 + 12)
        : Math.max(64, subLines * 40 + 18);
      curY += subHeight;
    }

    curY += compact ? 14 : 20;

    const children: LayoutNode[] = [];
    if (element.elements) {
      for (const child of element.elements) {
        const node = this.layoutSingleElement(child, x, curY, width, gap, false);
        children.push(node);
        curY += node.bounds.height + gap;
      }
    }
    return {
      element,
      bounds: { x, y, width, height: Math.max(curY - y, compact ? 120 : 160) },
      children,
    };
  }

  private layoutGrid(
    element: GridElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    const colCount =
      typeof element.columns === 'number'
        ? element.columns
        : parseInt(String(element.columns), 10) || 2;
    // Prefer author-specified grid gap when present (e.g. gap=16).
    const rawGap = element.gap !== undefined ? Number(element.gap) : gap;
    const gridGap = Number.isFinite(rawGap) && rawGap >= 0 ? rawGap : gap;
    const totalGap = gridGap * (colCount - 1);
    const colWidth = Math.max(10, (width - totalGap) / colCount);

    const children: LayoutNode[] = [];
    const colYs = Array(colCount).fill(y);

    for (let i = 0; i < element.elements.length; i++) {
      const colIdx = i % colCount;
      const colX = x + colIdx * (colWidth + gridGap);
      const childEl = element.elements[i]!;
      const childNode = this.layoutSingleElement(childEl, colX, colYs[colIdx]!, colWidth, gap);
      children.push(childNode);
      colYs[colIdx] += childNode.bounds.height + gridGap;
    }

    // Equalize heights within each row so sibling cards share one closed bottom edge.
    const rowCount = Math.ceil(children.length / colCount);
    for (let row = 0; row < rowCount; row++) {
      const rowNodes = children.slice(row * colCount, row * colCount + colCount);
      const rowMax = Math.max(...rowNodes.map((n) => n.bounds.height), 0);
      for (const node of rowNodes) {
        node.bounds.height = rowMax;
      }
    }

    const maxGridHeight = Math.max(
      ...children.map((n) => n.bounds.y + n.bounds.height - y),
      100
    );
    return {
      element,
      bounds: { x, y, width, height: maxGridHeight },
      children,
    };
  }

  private layoutCompare(
    element: CompareElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    // Keep a dedicated gutter for the VS badge between columns.
    const vsGap = Math.max(gap, 56);
    const colW = (width - vsGap) / 2;
    const titleH = 56;
    const pad = 28;

    const leftStartY = y + pad + (element.leftTitle ? titleH : 0);
    const { nodes: leftChildren, totalHeight: leftInnerH } = this.layoutElementList(
      element.left,
      x + pad,
      leftStartY,
      colW - pad * 2,
      gap / 2
    );

    const rightX = x + colW + vsGap;
    const rightStartY = y + pad + (element.rightTitle ? titleH : 0);
    const { nodes: rightChildren, totalHeight: rightInnerH } = this.layoutElementList(
      element.right,
      rightX + pad,
      rightStartY,
      colW - pad * 2,
      gap / 2
    );

    const totalHeight =
      Math.max(leftInnerH, rightInnerH, 120) +
      (element.leftTitle || element.rightTitle ? titleH : 0) +
      pad * 2;
    return {
      element,
      bounds: { x, y, width, height: totalHeight },
      children: [...leftChildren, ...rightChildren],
    };
  }

  private layoutStack(
    element: StackElement,
    x: number,
    y: number,
    width: number,
    gap: number
  ): LayoutNode {
    if (element.direction === 'horizontal') {
      const count = element.elements.length;
      const itemW = (width - gap * (count - 1)) / Math.max(1, count);
      let curX = x;
      const children: LayoutNode[] = [];
      let maxH = 0;
      for (const child of element.elements) {
        const node = this.layoutSingleElement(child, curX, y, itemW, gap);
        children.push(node);
        maxH = Math.max(maxH, node.bounds.height);
        curX += itemW + gap;
      }
      return { element, bounds: { x, y, width, height: maxH }, children };
    } else {
      const { nodes: children, totalHeight } = this.layoutElementList(
        element.elements,
        x,
        y,
        width,
        gap
      );
      return { element, bounds: { x, y, width, height: totalHeight }, children };
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
    const innerWidth = Math.max(10, width - cardPadding * 2);
    const titleHeight = element.title ? 56 : 0;
    const innerStartY = y + cardPadding + titleHeight;
    // Dense packing inside cards — outer slide gap is too large between bullets.
    const innerGap = Math.min(12, Math.max(6, Math.round(gap * 0.4)));

    const { nodes: children, totalHeight: innerHeight } = this.layoutElementList(
      element.elements,
      x + cardPadding,
      innerStartY,
      innerWidth,
      innerGap
    );

    const cardHeight = titleHeight + innerHeight + cardPadding * 2 + 12;
    const bounds: Rect = { x, y, width, height: Math.max(120, cardHeight) };

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
    const usableWidth = Math.max(10, width - totalGap);

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

  private estimateHeadingHeight(heading: HeadingElement, width: number = 1600): number {
    // Calibrated to PPTX/PDF paint sizes (theme h1≈46 CSS → ~32pt with leading).
    const fontSize = heading.level === 1 ? 46 : heading.level === 2 ? 36 : 28;
    const charWidth = fontSize * 0.62;
    const charsPerLine = Math.max(12, Math.floor(width / charWidth));
    const lines = Math.ceil(heading.text.length / charsPerLine) || 1;
    const lineHeight = fontSize * 1.4;
    const minH = heading.level === 1 ? 110 : heading.level === 2 ? 88 : 72;
    return Math.max(minH, Math.round(lines * lineHeight + 28));
  }

  private estimateParagraphHeight(paragraph: ParagraphElement, width: number): number {
    // Proportional body (~13–14pt): ~0.5em average advance ≈ width/9.5 chars/line.
    // Previous width/17 over-wrapped short bullets and blew up card heights in grids.
    const charsPerLine = Math.max(18, Math.floor(width / 9.5));
    const lines = Math.ceil(paragraph.text.length / charsPerLine) || 1;
    return Math.max(36, lines * 34 + 8);
  }

  private estimateListHeight(list: ListElement, width: number = 800): number {
    const charsPerLine = Math.max(18, Math.floor(width / 9.5));
    let totalHeight = 0;
    for (const item of list.items) {
      const cleanLen = item.text.replace(/\*\*/g, '').replace(/\*/g, '').length;
      const lines = Math.ceil(cleanLen / charsPerLine) || 1;
      totalHeight += lines * 32 + 10;
    }
    return Math.max(40, totalHeight);
  }

  private estimateCodeHeight(code: CodeElement, width: number = 800): number {
    const lines = code.code.split('\n');
    // Consolas ~0.6em wide; leave room for terminal padding.
    const charsPerLine = Math.max(18, Math.floor((width - 48) / 9.5));
    let visualLines = 0;
    for (const line of lines) {
      visualLines += Math.max(1, Math.ceil((line.length || 1) / charsPerLine));
    }
    // Chrome for mac dots row + padding around the text block.
    return Math.max(120, visualLines * 34 + 84);
  }

  private estimateQuoteHeight(quote: QuoteElement, width: number): number {
    const charsPerLine = Math.max(20, Math.floor(width / 14));
    const lines = Math.ceil(quote.text.length / charsPerLine) || 1;
    return lines * 34 + 32;
  }

  private estimateTableHeight(table: TableElement): number {
    const headerHeight = table.headers && table.headers.length > 0 ? 50 : 0;
    const rowsCount = table.rows ? table.rows.length : 0;
    const rowsHeight = rowsCount * 46;
    return Math.max(80, headerHeight + rowsHeight + 20);
  }

  private estimateImageHeight(image: ImageElement): number {
    if (typeof image.height === 'number') {
      return image.height;
    }
    return 320;
  }

  private estimateMetricHeight(metric: MetricElement): number {
    return metric.change ? 160 : 130;
  }
}
