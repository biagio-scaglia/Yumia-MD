import {
  BadgeElement,
  CardElement,
  ColumnElement,
  MetricElement,
  Presentation,
  PresentationMetadata,
  Slide,
  SlideElement,
  createBadge,
  createCard,
  createCode,
  createColumn,
  createColumns,
  createGrid,
  createHeading,
  createIcon,
  createList,
  createMetric,
  createParagraph,
  createPresentation,
  createQuote,
  createSection,
  createSlide,
  createStack,
  createToc,
} from '@yumiamd/ast';
import { parseHighlightLines } from './parser.js';

interface LineToken {
  indent: number;
  lineNum: number;
  text: string;
  command: string;
  args: string;
}

export class NativeYumiaParser {
  public parse(source: string): Presentation {
    const lines = source.split(/\r?\n/);
    const tokens: LineToken[] = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]!;
      const matchIndent = raw.match(/^(\s*)/);
      const indent = matchIndent ? matchIndent[1]!.length : 0;
      const text = raw.trim();
      if (!text || text.startsWith('//') || text.startsWith('#')) continue;

      const spaceIdx = text.indexOf(' ');
      const command = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
      const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

      tokens.push({
        indent,
        lineNum: i + 1,
        text,
        command: command.toLowerCase(),
        args,
      });
    }

    const metadata: PresentationMetadata = {};
    const slides: Slide[] = [];
    let currentSlideElements: SlideElement[] = [];
    let currentSlide: Slide | null = null;

    const flushSlide = () => {
      if (currentSlide) {
        currentSlide.elements = [...currentSlideElements];
        slides.push(currentSlide);
        currentSlideElements = [];
        currentSlide = null;
      }
    };

    let idx = 0;
    while (idx < tokens.length) {
      const tok = tokens[idx]!;
      const cmdLower = tok.command.toLowerCase();

      // Top-level presentation metadata
      if (cmdLower === 'document' || cmdLower === 'title') {
        metadata.title = this.stripQuotes(tok.args);
        idx++;
        continue;
      }
      if (cmdLower === 'theme') {
        metadata.theme = this.stripQuotes(tok.args);
        idx++;
        continue;
      }
      if (cmdLower === 'aspectratio' || cmdLower === 'ratio') {
        metadata.aspectRatio = this.stripQuotes(tok.args);
        idx++;
        continue;
      }
      if (cmdLower === 'transition') {
        metadata.transition = this.stripQuotes(tok.args);
        idx++;
        continue;
      }
      if (cmdLower === 'watermark') {
        metadata.watermark = this.stripQuotes(tok.args);
        idx++;
        continue;
      }
      if (cmdLower === 'author') {
        metadata.author = this.stripQuotes(tok.args);
        idx++;
        continue;
      }

      // Slide start
      if (tok.command === 'slide' || tok.command === '---') {
        flushSlide();
        const slideTitle = tok.command === 'slide' ? this.stripQuotes(tok.args) : undefined;
        currentSlide = createSlide([], {
          loc: {
            start: { line: tok.lineNum, column: 1 },
            end: { line: tok.lineNum, column: tok.text.length },
          },
        });
        if (slideTitle) {
          currentSlideElements.push(createHeading(slideTitle, 1));
        }
        idx++;
        continue;
      }

      // If no slide started yet, create default cover slide
      if (!currentSlide) {
        currentSlide = createSlide([], {
          loc: {
            start: { line: tok.lineNum, column: 1 },
            end: { line: tok.lineNum, column: tok.text.length },
          },
        });
      }

      // Slide-level notes
      if (tok.command === 'notes') {
        const noteLines: string[] = [];
        idx++;
        while (idx < tokens.length && tokens[idx]!.indent > tok.indent) {
          noteLines.push(tokens[idx]!.text);
          idx++;
        }
        currentSlide.notes =
          (currentSlide.notes ? currentSlide.notes + '\n' : '') + noteLines.join('\n');
        continue;
      }

      // Slide elements
      const parsedEl = this.parseElement(tokens, idx);
      if (parsedEl) {
        currentSlideElements.push(parsedEl.element);
        idx = parsedEl.nextIdx;
      } else {
        idx++;
      }
    }

    flushSlide();

    // Fallback if no slides created
    if (slides.length === 0) {
      slides.push(createSlide([createHeading(metadata.title || 'Untitled Presentation', 1)]));
    }

    return createPresentation(metadata, slides);
  }

  private parseElement(
    tokens: LineToken[],
    idx: number
  ): { element: SlideElement; nextIdx: number } | null {
    const tok = tokens[idx]!;
    const baseIndent = tok.indent;

    switch (tok.command) {
      case 'heading':
      case 'h1':
      case 'h2':
      case 'h3': {
        const level =
          tok.command === 'h1' ? 1 : tok.command === 'h2' ? 2 : tok.command === 'h3' ? 3 : 1;
        const text = this.stripQuotes(tok.args);
        return { element: createHeading(text, level), nextIdx: idx + 1 };
      }

      case 'paragraph':
      case 'text':
      case 'p': {
        let text = this.stripQuotes(tok.args);
        let nextIdx = idx + 1;
        if (!text) {
          const pLines: string[] = [];
          while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
            pLines.push(tokens[nextIdx]!.text);
            nextIdx++;
          }
          text = pLines.join(' ');
        }
        return { element: createParagraph(text), nextIdx };
      }

      case 'icon': {
        const nameMatch = tok.args.match(/^(?:name=)?["']?([^"'\s]+)["']?/);
        const name = nameMatch ? nameMatch[1]! : tok.args.trim();
        const sizeMatch = tok.args.match(/\bsize=["']?([^"'\s]+)["']?/);
        const colorMatch = tok.args.match(/\bcolor=["']?([^"'\s]+)["']?/);
        return {
          element: createIcon(
            name,
            undefined,
            sizeMatch ? sizeMatch[1] : undefined,
            colorMatch ? colorMatch[1] : undefined
          ),
          nextIdx: idx + 1,
        };
      }

      case 'card': {
        const titleMatch = tok.args.match(/title=["']([^"']+)["']/);
        const variantMatch = tok.args.match(/variant=["']?([^"'\s]+)["']?/);
        const title = titleMatch ? titleMatch[1] : this.stripQuotes(tok.args) || undefined;
        const variant = (variantMatch ? variantMatch[1] : 'default') as CardElement['variant'];

        const children: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        return { element: createCard(children, title, variant), nextIdx };
      }

      case 'columns': {
        const ratios = tok.args || '50:50';
        const cols: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx);
          if (childRes) {
            cols.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        const colElements: ColumnElement[] = cols.map((c) =>
          c.type === 'column' ? (c as ColumnElement) : createColumn([c])
        );
        return { element: createColumns(colElements, ratios), nextIdx };
      }

      case 'grid': {
        const colsMatch = tok.args.match(/columns=["']?([^"'\s]+)["']?/);
        const gapMatch = tok.args.match(/gap=["']?([^"'\s]+)["']?/);
        const columns = colsMatch ? parseInt(colsMatch[1]!, 10) || colsMatch[1]! : 2;
        const gap = gapMatch ? gapMatch[1] : undefined;

        const children: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        return { element: createGrid(children, columns, gap), nextIdx };
      }

      case 'stack': {
        const dirMatch = tok.args.match(/direction=["']?(horizontal|vertical)["']?/);
        const direction = dirMatch ? (dirMatch[1] as 'horizontal' | 'vertical') : 'vertical';
        const gapMatch = tok.args.match(/gap=["']?([^"'\s]+)["']?/);

        const children: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        return {
          element: createStack(children, direction, gapMatch ? gapMatch[1] : undefined),
          nextIdx,
        };
      }

      case 'metric': {
        const valMatch = tok.args.match(/^(?:value=)?["']([^"']+)["']/);
        const labelMatch = tok.args.match(/\blabel=["']([^"']+)["']/);
        const diffMatch = tok.args.match(/\bdiff=["']([^"']+)["']/);
        const variantMatch = tok.args.match(/\bvariant=["']?([^"'\s]+)["']?/);

        const value = valMatch ? valMatch[1]! : '0';
        const label = labelMatch ? labelMatch[1]! : 'Metric';
        return {
          element: createMetric(
            value,
            label,
            variantMatch ? (variantMatch[1] as MetricElement['variant']) : 'primary',
            undefined,
            undefined,
            diffMatch ? diffMatch[1] : undefined
          ),
          nextIdx: idx + 1,
        };
      }

      case 'code': {
        const langMatch = tok.args.match(/\blang(?:uage)?=["']?([^"'\s]+)["']?/);
        const hlMatch = tok.args.match(/\bhighlight=["']([^"']+)["']/);
        const codeLines: string[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          codeLines.push(tokens[nextIdx]!.text);
          nextIdx++;
        }
        const el = createCode(codeLines.join('\n'), langMatch ? langMatch[1] : undefined);
        if (hlMatch && hlMatch[1]) {
          el.highlight = hlMatch[1];
          el.highlightLines = parseHighlightLines(hlMatch[1]);
        }
        return { element: el, nextIdx };
      }

      case 'section': {
        const titleMatch = tok.args.match(/^(?:title=)?["']([^"']+)["']/);
        const subtitleMatch = tok.args.match(/\bsubtitle=["']([^"']+)["']/);
        const numMatch = tok.args.match(/\bnumber=["']?([^"'\s]+)["']?/);
        const title = titleMatch ? titleMatch[1]! : this.stripQuotes(tok.args) || 'Section';
        return {
          element: createSection(
            title,
            subtitleMatch ? subtitleMatch[1] : undefined,
            numMatch ? numMatch[1] : undefined
          ),
          nextIdx: idx + 1,
        };
      }

      case 'toc': {
        const title = this.stripQuotes(tok.args) || 'Table of Contents';
        return { element: createToc(title), nextIdx: idx + 1 };
      }

      case 'badge': {
        const textMatch = tok.args.match(/^(?:text=)?["']([^"']+)["']/);
        const variantMatch = tok.args.match(/\bvariant=["']?([^"'\s]+)["']?/);
        const text = textMatch ? textMatch[1]! : this.stripQuotes(tok.args);
        return {
          element: createBadge(
            text,
            variantMatch ? (variantMatch[1] as BadgeElement['variant']) : 'default'
          ),
          nextIdx: idx + 1,
        };
      }

      case 'list': {
        const items: { text: string }[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const sub = tokens[nextIdx]!;
          if (sub.command === 'item' || sub.command === '-') {
            items.push({ text: this.stripQuotes(sub.args) });
          } else {
            items.push({ text: sub.text.replace(/^[-*]\s*/, '') });
          }
          nextIdx++;
        }
        return { element: createList(items, false), nextIdx };
      }

      case 'quote': {
        const authorMatch = tok.args.match(/\bauthor=["']([^"']+)["']/);
        const textLines: string[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          textLines.push(tokens[nextIdx]!.text);
          nextIdx++;
        }
        return {
          element: createQuote(textLines.join(' '), authorMatch ? authorMatch[1] : undefined),
          nextIdx,
        };
      }

      default:
        // Default treat as paragraph
        return { element: createParagraph(tok.text), nextIdx: idx + 1 };
    }
  }

  private stripQuotes(str: string): string {
    if (!str) return '';
    const trimmed = str.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }
}

export function parseNativeYumia(source: string): Presentation {
  const parser = new NativeYumiaParser();
  return parser.parse(source);
}
