import {
  CardElement,
  CodeElement,
  GroupElement,
  HeadingElement,
  ImageElement,
  ListElement,
  ListItem,
  ParagraphElement,
  Presentation,
  PresentationMetadata,
  QuoteElement,
  Slide,
  SlideElement,
  TableElement,
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
