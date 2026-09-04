import {
  BadgeElement,
  CardElement,
  ChartDataSeries,
  ChartElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  CompareElement,
  GroupElement,
  HeadingElement,
  ImageElement,
  LayoutDirectiveElement,
  ListElement,
  ListItem,
  MermaidElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  PresentationMetadata,
  QuoteElement,
  Slide,
  SlideElement,
  TableElement,
  TimelineElement,
  TimelineItem,
} from './types.js';

export function createPresentation(
  metadata: PresentationMetadata = {},
  slides: Slide[] = []
): Presentation {
  return { metadata, slides };
}

export function createSlide(elements: SlideElement[] = [], options: Partial<Slide> = {}): Slide {
  return {
    elements,
    ...options,
  };
}

export function createHeading(
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
  align?: HeadingElement['align']
): HeadingElement {
  return {
    type: 'heading',
    level,
    text,
    ...(align ? { align } : {}),
  };
}

export function createParagraph(text: string, align?: ParagraphElement['align']): ParagraphElement {
  return {
    type: 'paragraph',
    text,
    ...(align ? { align } : {}),
  };
}

export function createList(items: (string | ListItem)[], ordered: boolean = false): ListElement {
  const normalizedItems: ListItem[] = items.map((item) =>
    typeof item === 'string' ? { text: item } : item
  );
  return {
    type: 'list',
    ordered,
    items: normalizedItems,
  };
}

export function createImage(src: string, alt?: string, caption?: string): ImageElement {
  return {
    type: 'image',
    src,
    ...(alt ? { alt } : {}),
    ...(caption ? { caption } : {}),
  };
}

export function createCard(
  elements: SlideElement[],
  title?: string,
  variant?: CardElement['variant']
): CardElement {
  return {
    type: 'card',
    elements,
    ...(title ? { title } : {}),
    ...(variant ? { variant } : {}),
  };
}

export function createMetric(
  value: string,
  label: string,
  variant?: MetricElement['variant'],
  description?: string,
  unit?: string,
  change?: string
): MetricElement {
  return {
    type: 'metric',
    value,
    label,
    ...(variant ? { variant } : {}),
    ...(description ? { description } : {}),
    ...(unit ? { unit } : {}),
    ...(change ? { change } : {}),
  };
}

export function createCode(
  code: string,
  language?: string,
  highlightLines?: number[]
): CodeElement {
  return {
    type: 'code',
    code,
    ...(language ? { language } : {}),
    ...(highlightLines ? { highlightLines } : {}),
  };
}

export function createQuote(text: string, author?: string, citation?: string): QuoteElement {
  return {
    type: 'quote',
    text,
    ...(author ? { author } : {}),
    ...(citation ? { citation } : {}),
  };
}

export function createTable(rows: string[][], headers?: string[]): TableElement {
  return {
    type: 'table',
    rows,
    ...(headers ? { headers } : {}),
  };
}

export function createChart(
  chartType: ChartElement['chartType'],
  labels: string[],
  series: ChartDataSeries[],
  title?: string
): ChartElement {
  return {
    type: 'chart',
    chartType,
    labels,
    series,
    ...(title ? { title } : {}),
  };
}

export function createMermaid(code: string, chartType?: string): MermaidElement {
  return {
    type: 'mermaid',
    code,
    ...(chartType ? { chartType } : {}),
  };
}

export function createTimeline(
  items: TimelineItem[],
  layout: 'horizontal' | 'vertical' = 'horizontal'
): TimelineElement {
  return {
    type: 'timeline',
    items,
    layout,
  };
}

export function createCompare(
  left: SlideElement[],
  right: SlideElement[],
  leftTitle?: string,
  rightTitle?: string
): CompareElement {
  return {
    type: 'compare',
    left,
    right,
    ...(leftTitle ? { leftTitle } : {}),
    ...(rightTitle ? { rightTitle } : {}),
  };
}

export function createBadge(text: string, variant?: BadgeElement['variant']): BadgeElement {
  return {
    type: 'badge',
    text,
    ...(variant ? { variant } : {}),
  };
}

export function createGroup(
  elements: SlideElement[],
  direction: 'row' | 'column' = 'row',
  gap?: number | string
): GroupElement {
  return {
    type: 'group',
    direction,
    elements,
    ...(gap !== undefined ? { gap } : {}),
  };
}

export function createColumn(elements: SlideElement[], width?: string | number): ColumnElement {
  return {
    type: 'column',
    elements,
    ...(width !== undefined ? { width } : {}),
  };
}

export function createColumns(
  columns: ColumnElement[],
  ratios?: string,
  gap?: number | string
): ColumnsElement {
  return {
    type: 'columns',
    columns,
    ...(ratios ? { ratios } : {}),
    ...(gap !== undefined ? { gap } : {}),
  };
}

export function createLayoutDirective(
  mode: string,
  attributes?: Record<string, string>
): LayoutDirectiveElement {
  return {
    type: 'layout-directive',
    mode,
    ...(attributes ? { attributes } : {}),
  };
}
