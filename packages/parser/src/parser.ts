import {
  ColumnElement,
  Presentation,
  PresentationMetadata,
  Slide,
  SlideElement,
  createCard,
  createCode,
  createColumn,
  createColumns,
  createHeading,
  createImage,
  createLayoutDirective,
  createList,
  createParagraph,
  createPresentation,
  createQuote,
  createSlide,
} from '@yumia/ast';
import { ParserOptions, YumiaParser } from './types.js';

export class DefaultYumiaParser implements YumiaParser {
  parse(source: string, _options?: ParserOptions): Presentation {
    const normalized = source.replace(/\r\n/g, '\n');
    const { metadata, content } = this.extractFrontmatter(normalized);
    const slideChunks = this.splitSlides(content);
    const slides: Slide[] = slideChunks
      .map((chunk) => this.parseSlide(chunk))
      .filter((slide) => slide.elements.length > 0 || slide.notes !== undefined);

    return createPresentation(metadata, slides);
  }

  private extractFrontmatter(source: string): {
    metadata: PresentationMetadata;
    content: string;
  } {
    const trimmed = source.trimStart();
    if (!trimmed.startsWith('---')) {
      return { metadata: {}, content: source };
    }

    const endIndex = trimmed.indexOf('\n---', 3);
    if (endIndex === -1) {
      return { metadata: {}, content: source };
    }

    const frontmatterBlock = trimmed.slice(3, endIndex).trim();
    const afterFrontmatter = trimmed.slice(endIndex + 4);

    const metadata = this.parseYamlMetadata(frontmatterBlock);
    return { metadata, content: afterFrontmatter };
  }

  private parseYamlMetadata(block: string): PresentationMetadata {
    const metadata: Record<string, unknown> = {};
    const lines = block.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        const unquoted = value.replace(/^['"](.*)['"]$/, '$1');
        metadata[key] = unquoted;
      }
    }

    const result: PresentationMetadata = {};
    if (typeof metadata['title'] === 'string') result.title = metadata['title'];
    if (typeof metadata['subtitle'] === 'string') result.subtitle = metadata['subtitle'];
    if (typeof metadata['author'] === 'string') result.author = metadata['author'];
    if (typeof metadata['date'] === 'string') result.date = metadata['date'];
    if (typeof metadata['theme'] === 'string') result.theme = metadata['theme'];
    if (typeof metadata['aspectRatio'] === 'string') result.aspectRatio = metadata['aspectRatio'];

    return result;
  }

  private splitSlides(content: string): string[] {
    const lines = content.split('\n');
    const slides: string[] = [];
    let currentSlideLines: string[] = [];

    for (const line of lines) {
      if (line.trim() === '---') {
        slides.push(currentSlideLines.join('\n'));
        currentSlideLines = [];
      } else {
        currentSlideLines.push(line);
      }
    }

    if (currentSlideLines.length > 0) {
      slides.push(currentSlideLines.join('\n'));
    }

    return slides;
  }

  private parseSlide(slideContent: string): Slide {
    const lines = slideContent.split('\n');
    const { elements, notes, layout } = this.parseLines(lines);

    const slideOptions: Partial<Slide> = {};
    if (notes) slideOptions.notes = notes;
    if (layout) slideOptions.layout = layout;

    return createSlide(elements, slideOptions);
  }

  private parseLines(lines: string[]): {
    elements: SlideElement[];
    notes?: string;
    layout?: string;
  } {
    const elements: SlideElement[] = [];
    let notes: string | undefined;
    let layout: string | undefined;

    let i = 0;
    let currentParagraph: string[] = [];
    let currentList: { ordered: boolean; items: string[] } | null = null;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          elements.push(createParagraph(text));
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList && currentList.items.length > 0) {
        elements.push(createList(currentList.items, currentList.ordered));
        currentList = null;
      }
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
    };

    while (i < lines.length) {
      const rawLine = lines[i] ?? '';
      const line = rawLine.trim();

      if (!line) {
        flushAll();
        i++;
        continue;
      }

      // Code Block (```lang)
      if (line.startsWith('```')) {
        flushAll();
        const language = line.slice(3).trim() || undefined;
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i]?.trim().startsWith('```')) {
          codeLines.push(lines[i] ?? '');
          i++;
        }
        i++; // skip closing ```
        elements.push(createCode(codeLines.join('\n'), language));
        continue;
      }

      // Block Directive (:::directive [args])
      if (line.startsWith(':::')) {
        flushAll();
        const directiveHeader = line.slice(3).trim();

        // Check if single line directive e.g. :::layout hero or :::layout split="40/60"
        if (directiveHeader.startsWith('layout')) {
          const layoutMatch = directiveHeader.match(/^layout\s*(.*)$/);
          const rawArg = layoutMatch && layoutMatch[1] ? layoutMatch[1].trim() : 'default';
          const mode = rawArg.replace(/^['"](.*)['"]$/, '$1');
          layout = mode;
          elements.push(createLayoutDirective(mode));
          i++;
          continue;
        }

        // Block with closing :::
        const [directiveName, ...args] = directiveHeader.split(' ');
        const directiveArg = args.join(' ').trim();

        const blockLines: string[] = [];
        i++;
        let nestedCount = 1;

        while (i < lines.length) {
          const innerLine = lines[i]?.trim() ?? '';
          if (innerLine.startsWith(':::') && innerLine.length > 3) {
            nestedCount++;
          } else if (innerLine === ':::') {
            nestedCount--;
            if (nestedCount === 0) {
              i++; // consume closing :::
              break;
            }
          }
          blockLines.push(lines[i] ?? '');
          i++;
        }

        if (directiveName === 'notes') {
          notes = blockLines
            .map((l) => l.trim())
            .filter(Boolean)
            .join('\n');
        } else if (directiveName === 'card') {
          const title = directiveArg.replace(/^['"](.*)['"]$/, '$1') || undefined;
          const { elements: cardElements } = this.parseLines(blockLines);
          elements.push(createCard(cardElements, title));
        } else if (directiveName === 'columns') {
          const ratios = directiveArg
            ? directiveArg.replace(/^ratios=['"]?(.*?)['"]?$/, '$1')
            : undefined;
          const columns = this.parseColumnsBlock(blockLines);
          elements.push(createColumns(columns, ratios));
        } else if (directiveName === 'quote') {
          const author = directiveArg.replace(/^['"](.*)['"]$/, '$1') || undefined;
          const quoteText = blockLines
            .map((l) => l.trim())
            .join(' ')
            .trim();
          elements.push(createQuote(quoteText, author));
        }
        continue;
      }

      // Heading (# to ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        flushAll();
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = headingMatch[2].trim();
        elements.push(createHeading(text, level));
        i++;
        continue;
      }

      // Blockquote (> text)
      if (line.startsWith('>')) {
        flushAll();
        const quoteText = line.replace(/^>\s*/, '').trim();
        elements.push(createQuote(quoteText));
        i++;
        continue;
      }

      // Image (![alt](url "caption"))
      const imageMatch = line.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
      if (imageMatch && imageMatch[2]) {
        flushAll();
        const alt = imageMatch[1] || undefined;
        const src = imageMatch[2].trim();
        const caption = imageMatch[3] || undefined;
        elements.push(createImage(src, alt, caption));
        i++;
        continue;
      }

      // Unordered list item (- item, * item)
      const unorderMatch = line.match(/^[-*]\s+(.*)$/);
      if (unorderMatch && unorderMatch[1]) {
        flushParagraph();
        if (!currentList || currentList.ordered) {
          flushList();
          currentList = { ordered: false, items: [] };
        }
        currentList.items.push(unorderMatch[1].trim());
        i++;
        continue;
      }

      // Ordered list item (1. item)
      const orderMatch = line.match(/^\d+\.\s+(.*)$/);
      if (orderMatch && orderMatch[1]) {
        flushParagraph();
        if (!currentList || !currentList.ordered) {
          flushList();
          currentList = { ordered: true, items: [] };
        }
        currentList.items.push(orderMatch[1].trim());
        i++;
        continue;
      }

      // Standard text line -> accumulate in current paragraph
      flushList();
      currentParagraph.push(line);
      i++;
    }

    flushAll();

    return {
      elements,
      ...(notes ? { notes } : {}),
      ...(layout ? { layout } : {}),
    };
  }

  private parseColumnsBlock(lines: string[]): ColumnElement[] {
    const columns: ColumnElement[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i]?.trim() ?? '';

      if (line.startsWith(':::column')) {
        const arg = line.slice(9).trim();
        const widthMatch = arg.match(/width=['"]?(.*?)['"]?$/);
        const width = widthMatch && widthMatch[1] ? widthMatch[1] : undefined;

        const colLines: string[] = [];
        i++;
        while (i < lines.length && lines[i]?.trim() !== ':::') {
          colLines.push(lines[i] ?? '');
          i++;
        }
        i++; // skip closing :::

        const { elements } = this.parseLines(colLines);
        columns.push(createColumn(elements, width));
      } else {
        i++;
      }
    }

    return columns;
  }
}

export function parseYumia(source: string, options?: ParserOptions): Presentation {
  const parser = new DefaultYumiaParser();
  return parser.parse(source, options);
}
