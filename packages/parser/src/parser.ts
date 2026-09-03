import {
  Presentation,
  PresentationMetadata,
  Slide,
  SlideElement,
  createHeading,
  createList,
  createParagraph,
  createPresentation,
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
      .filter((slide) => slide.elements.length > 0);

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
    const elements: SlideElement[] = [];

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

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        flushAll();
        continue;
      }

      // Heading match (# to ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        flushAll();
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = headingMatch[2].trim();
        elements.push(createHeading(text, level));
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
        continue;
      }

      // Standard text line -> accumulate in current paragraph
      flushList();
      currentParagraph.push(line);
    }

    flushAll();

    return createSlide(elements);
  }
}

export function parseYumia(source: string, options?: ParserOptions): Presentation {
  const parser = new DefaultYumiaParser();
  return parser.parse(source, options);
}
