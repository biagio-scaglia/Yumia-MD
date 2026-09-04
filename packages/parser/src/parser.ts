import {
  ChartDataSeries,
  ChartElement,
  ColumnElement,
  CompareElement,
  Diagnostic,
  Presentation,
  PresentationMetadata,
  Slide,
  SlideElement,
  SlideTransition,
  SlideTransitionType,
  TimelineElement,
  TimelineItem,
  createBadge,
  createCard,
  createChart,
  createCode,
  createColumn,
  createColumns,
  createCompare,
  createHeading,
  createImage,
  createLayoutDirective,
  createList,
  createMath,
  createMermaid,
  createMetric,
  createParagraph,
  createPresentation,
  createQuote,
  createSlide,
  createTable,
  createTimeline,
} from '@yumiamd/ast';
import { ParserOptions, YumiaParser } from './types.js';

export class DefaultYumiaParser implements YumiaParser {
  private diagnostics: Diagnostic[] = [];

  parse(source: string, options?: ParserOptions): Presentation {
    this.diagnostics = [];
    if (!source || typeof source !== 'string') {
      return createPresentation({}, []);
    }

    const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const { metadata, content, lineOffset } = this.extractFrontmatter(normalized);
    if (!content.trim()) {
      return createPresentation(metadata, []);
    }
    const slideChunks = this.splitSlides(content, lineOffset);

    const slides: Slide[] = [];
    for (const chunk of slideChunks) {
      const slide = this.parseSlide(chunk.content, chunk.startLine);
      slides.push(slide);
    }

    const presentation = createPresentation(metadata, slides);
    if (this.diagnostics.length > 0) {
      presentation.diagnostics = [...this.diagnostics];
    }

    if (options?.strict && this.diagnostics.some((d) => d.severity === 'error')) {
      const firstError = this.diagnostics.find((d) => d.severity === 'error');
      throw new Error(`[Strict Parse Error] ${firstError?.message || 'Syntax error'}`);
    }

    return presentation;
  }

  private extractFrontmatter(source: string): {
    metadata: PresentationMetadata;
    content: string;
    lineOffset: number;
  } {
    const trimmed = source.trimStart();
    if (!trimmed.startsWith('---')) {
      return { metadata: {}, content: source, lineOffset: 1 };
    }

    const firstLineEnd = trimmed.indexOf('\n');
    if (firstLineEnd === -1) {
      return { metadata: {}, content: source, lineOffset: 1 };
    }

    // Check header line is just '---'
    const headerLine = trimmed.slice(0, firstLineEnd).trim();
    if (headerLine !== '---') {
      return { metadata: {}, content: source, lineOffset: 1 };
    }

    const afterHeader = trimmed.slice(firstLineEnd + 1);
    const lines = afterHeader.split('\n');
    let closingIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        closingIndex = i;
        break;
      }
    }

    if (closingIndex === -1) {
      this.diagnostics.push({
        code: 'UNCLOSED_FRONTMATTER',
        message: 'Frontmatter block was opened with "---" but never closed.',
        severity: 'warning',
        loc: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 4 },
        },
      });
      return { metadata: {}, content: source, lineOffset: 1 };
    }

    const frontmatterLines = lines.slice(0, closingIndex);
    const bodyLines = lines.slice(closingIndex + 1);
    const metadata = this.parseYamlMetadata(frontmatterLines.join('\n'));
    const lineOffset = closingIndex + 2; // +1 for 1-based, +1 for closing ---

    return {
      metadata,
      content: bodyLines.join('\n'),
      lineOffset,
    };
  }

  private parseYamlMetadata(block: string): PresentationMetadata {
    const metadata: Record<string, unknown> = {};
    const lines = block.split('\n');
    let currentKey: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('- ') && currentKey) {
        const itemVal = trimmed
          .slice(2)
          .trim()
          .replace(/^['"](.*)['"]$/, '$1');
        if (Array.isArray(metadata[currentKey])) {
          (metadata[currentKey] as string[]).push(itemVal);
        } else {
          metadata[currentKey] = [itemVal];
        }
        continue;
      }

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const rawVal = trimmed.slice(colonIndex + 1).trim();
        currentKey = key;

        if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const listItems = rawVal
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim().replace(/^['"](.*)['"]$/, '$1'))
            .filter(Boolean);
          metadata[key] = listItems;
        } else if (rawVal) {
          const unquoted = rawVal.replace(/^['"](.*)['"]$/, '$1');
          metadata[key] = unquoted;
        } else {
          metadata[key] = [];
        }
      }
    }

    const result: PresentationMetadata = {};
    if (typeof metadata['title'] === 'string') result.title = metadata['title'];
    if (typeof metadata['subtitle'] === 'string') result.subtitle = metadata['subtitle'];
    if (typeof metadata['author'] === 'string') result.author = metadata['author'];
    if (typeof metadata['date'] === 'string') result.date = metadata['date'];
    if (typeof metadata['theme'] === 'string') result.theme = metadata['theme'];
    if (typeof metadata['aspectRatio'] === 'string') result.aspectRatio = metadata['aspectRatio'];
    if (typeof metadata['transition'] === 'string') result.transition = metadata['transition'];
    if (typeof metadata['template'] === 'string') result.template = metadata['template'];
    if (typeof metadata['embedFonts'] === 'string') {
      result.embedFonts = metadata['embedFonts'] === 'true' || metadata['embedFonts'] === 'yes';
    } else if (typeof metadata['embedFonts'] === 'boolean') {
      result.embedFonts = metadata['embedFonts'];
    }
    if (typeof metadata['watermark'] === 'string') {
      if (
        metadata['watermark'] === 'false' ||
        metadata['watermark'] === 'none' ||
        metadata['watermark'] === 'off'
      ) {
        result.watermark = false;
      } else if (
        metadata['watermark'] === 'true' ||
        metadata['watermark'] === 'yes' ||
        metadata['watermark'] === 'on'
      ) {
        result.watermark = true;
      } else {
        result.watermark = metadata['watermark'];
      }
    } else if (typeof metadata['watermark'] === 'boolean') {
      result.watermark = metadata['watermark'];
    }

    if (metadata['styles'] || metadata['stylesheets'] || metadata['css']) {
      result.styles = (metadata['styles'] || metadata['stylesheets'] || metadata['css']) as
        string | string[];
    }
    if (metadata['scripts'] || metadata['js']) {
      result.scripts = (metadata['scripts'] || metadata['js']) as string | string[];
    }

    const colors: Record<string, string> = {};
    if (typeof metadata['background'] === 'string') colors.background = metadata['background'];
    if (typeof metadata['bg'] === 'string') colors.background = metadata['bg'];
    if (typeof metadata['primary'] === 'string') colors.primary = metadata['primary'];
    if (typeof metadata['secondary'] === 'string') colors.secondary = metadata['secondary'];
    if (typeof metadata['surface'] === 'string') colors.surface = metadata['surface'];
    if (typeof metadata['text'] === 'string') colors.text = metadata['text'];
    if (typeof metadata['muted'] === 'string') colors.muted = metadata['muted'];
    if (typeof metadata['accent'] === 'string') colors.accent = metadata['accent'];
    if (typeof metadata['border'] === 'string') colors.border = metadata['border'];

    if (Object.keys(colors).length > 0) {
      result.colors = colors;
    }

    return result;
  }

  private splitSlides(
    content: string,
    startLineOffset: number
  ): Array<{ content: string; startLine: number }> {
    const lines = content.split('\n');
    const slides: Array<{ content: string; startLine: number }> = [];
    let currentSlideLines: string[] = [];
    let currentStartLine = startLineOffset;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (line.trim() === '---') {
        slides.push({
          content: currentSlideLines.join('\n'),
          startLine: currentStartLine,
        });
        currentSlideLines = [];
        currentStartLine = startLineOffset + i + 1;
      } else {
        currentSlideLines.push(line);
      }
    }

    if (currentSlideLines.length > 0) {
      slides.push({
        content: currentSlideLines.join('\n'),
        startLine: currentStartLine,
      });
    }

    return slides;
  }

  private parseSlide(slideContent: string, startLine: number): Slide {
    const lines = slideContent.split('\n');
    const { elements, notes, layout, transition } = this.parseLines(lines, startLine);

    const slideOptions: Partial<Slide> = {};
    if (notes) slideOptions.notes = notes;
    if (layout) slideOptions.layout = layout;
    if (transition) slideOptions.transition = transition;
    slideOptions.loc = {
      start: { line: startLine, column: 1 },
      end: {
        line: startLine + lines.length - 1,
        column: (lines[lines.length - 1]?.length || 0) + 1,
      },
    };

    return createSlide(elements, slideOptions);
  }

  private parseLines(
    lines: string[],
    baseLine: number
  ): {
    elements: SlideElement[];
    notes?: string;
    layout?: string;
    transition?: SlideTransitionType | SlideTransition;
  } {
    const elements: SlideElement[] = [];
    let notes: string | undefined;
    let layout: string | undefined;
    let transition: SlideTransitionType | SlideTransition | undefined;

    let i = 0;
    let currentParagraph: string[] = [];
    let paragraphStartLine = baseLine;
    let currentList: { ordered: boolean; items: string[]; startLine: number } | null = null;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          const el = createParagraph(text);
          el.loc = {
            start: { line: paragraphStartLine, column: 1 },
            end: { line: paragraphStartLine + currentParagraph.length - 1, column: 1 },
          };
          elements.push(el);
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList && currentList.items.length > 0) {
        const el = createList(currentList.items, currentList.ordered);
        el.loc = {
          start: { line: currentList.startLine, column: 1 },
          end: { line: currentList.startLine + currentList.items.length - 1, column: 1 },
        };
        elements.push(el);
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
      const currentLineNum = baseLine + i;

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
        const codeStartLine = currentLineNum;
        i++;
        let closed = false;

        while (i < lines.length) {
          const checkLine = lines[i]?.trim() ?? '';
          if (checkLine.startsWith('```')) {
            closed = true;
            i++; // skip closing ```
            break;
          }
          codeLines.push(lines[i] ?? '');
          i++;
        }

        if (!closed) {
          this.diagnostics.push({
            code: 'UNCLOSED_CODE_BLOCK',
            message: `Unclosed code block opened at line ${codeStartLine}`,
            severity: 'warning',
            loc: {
              start: { line: codeStartLine, column: 1 },
              end: { line: baseLine + i - 1, column: 1 },
            },
          });
        }

        const el = createCode(codeLines.join('\n'), language);
        el.loc = {
          start: { line: codeStartLine, column: 1 },
          end: { line: baseLine + i - 1, column: 1 },
        };
        elements.push(el);
        continue;
      }

      // Block Directive (:::directive [args])
      if (line.startsWith(':::')) {
        flushAll();
        const directiveHeader = line.slice(3).trim();
        const directiveStartLine = currentLineNum;

        // Check if transition directive e.g. :::transition push or :::transition type="fade" duration="1s"
        if (directiveHeader.startsWith('transition')) {
          const transArg = directiveHeader.slice(10).trim();
          const typeMatch = transArg.match(/type=['"](.*?)['"]/);
          const durationMatch = transArg.match(/duration=['"](.*?)['"]/);
          const dirMatch = transArg.match(/direction=['"](.*?)['"]/);
          const rawType = typeMatch
            ? typeMatch[1]
            : transArg.replace(/duration=['"].*?['"]|direction=['"].*?['"]/, '').trim() || 'fade';
          const cleanType = (rawType || 'fade').replace(/^['"](.*)['"]$/, '$1');
          const transObj: SlideTransition = {
            type: cleanType,
          };
          if (durationMatch && durationMatch[1]) transObj.duration = durationMatch[1];
          if (dirMatch && dirMatch[1])
            transObj.direction = dirMatch[1] as 'left' | 'right' | 'up' | 'down';
          transition = transObj;
          i++;
          continue;
        }

        // Check if single line directive e.g. :::layout hero
        if (directiveHeader.startsWith('layout')) {
          const layoutMatch = directiveHeader.match(/^layout\s*(.*)$/);
          const rawArg = layoutMatch && layoutMatch[1] ? layoutMatch[1].trim() : 'default';
          const mode = rawArg.replace(/^['"](.*)['"]$/, '$1');
          layout = mode;
          const el = createLayoutDirective(mode);
          el.loc = {
            start: { line: currentLineNum, column: 1 },
            end: { line: currentLineNum, column: rawLine.length + 1 },
          };
          elements.push(el);
          i++;
          continue;
        }

        // Check if metric directive e.g. :::metric value="99.9%" label="Uptime" change="+0.4%" variant="success"
        if (directiveHeader.startsWith('metric')) {
          const valueMatch = directiveHeader.match(/value=['"](.*?)['"]/);
          const labelMatch = directiveHeader.match(/label=['"](.*?)['"]/);
          const variantMatch = directiveHeader.match(/variant=['"](.*?)['"]/);
          const descMatch = directiveHeader.match(/description=['"](.*?)['"]/);
          const unitMatch = directiveHeader.match(/unit=['"](.*?)['"]/);
          const changeMatch = directiveHeader.match(/change=['"](.*?)['"]/);
          const value = valueMatch ? valueMatch[1]! : '0';
          const label = labelMatch ? labelMatch[1]! : '';
          const variant = variantMatch ? variantMatch[1]! : undefined;
          const desc = descMatch ? descMatch[1]! : undefined;
          const unit = unitMatch ? unitMatch[1]! : undefined;
          const change = changeMatch ? changeMatch[1]! : undefined;
          const el = createMetric(value, label, variant, desc, unit, change);
          el.loc = {
            start: { line: currentLineNum, column: 1 },
            end: { line: currentLineNum, column: rawLine.length + 1 },
          };
          elements.push(el);
          i++;
          continue;
        }

        // Check if single line badge e.g. :::badge text="v1.2" variant="success" or :::badge [variant="info"] New Release
        if (directiveHeader.startsWith('badge')) {
          const badgeArg = directiveHeader.slice(5).trim();
          const variantMatch = badgeArg.match(/variant=['"](.*?)['"]/);
          const textMatch = badgeArg.match(/text=['"](.*?)['"]/);
          const variant = variantMatch ? variantMatch[1] : undefined;
          let text = textMatch ? textMatch[1]! : badgeArg.replace(/variant=['"].*?['"]/, '').trim();
          text = text.replace(/^['"](.*)['"]$/, '$1');
          const el = createBadge(text, variant);
          el.loc = {
            start: { line: currentLineNum, column: 1 },
            end: { line: currentLineNum, column: rawLine.length + 1 },
          };
          elements.push(el);
          i++;
          continue;
        }

        // Check if single-line chart e.g. :::chart type="bar" data="Q1:100, Q2:200"
        if (
          directiveHeader.startsWith('chart') &&
          (directiveHeader.includes('data=') || directiveHeader.includes('labels='))
        ) {
          const el = this.parseChartDirective(directiveHeader, []);
          el.loc = {
            start: { line: currentLineNum, column: 1 },
            end: { line: currentLineNum, column: rawLine.length + 1 },
          };
          elements.push(el);
          i++;
          continue;
        }

        // Block with closing :::
        const [directiveName, ...args] = directiveHeader.split(' ');
        const directiveArg = args.join(' ').trim();

        const blockLines: string[] = [];
        i++;
        let nestedCount = 1;
        let closed = false;

        while (i < lines.length) {
          const innerLine = lines[i]?.trim() ?? '';
          const isInlineClosed =
            innerLine.startsWith(':::') && innerLine.endsWith(':::') && innerLine.length > 5;
          const isSeparator = innerLine === ':::vs' || innerLine.startsWith(':::vs ');
          const isSingleLine =
            isInlineClosed ||
            isSeparator ||
            innerLine.startsWith(':::transition') ||
            innerLine.startsWith(':::metric') ||
            innerLine.startsWith(':::layout') ||
            (innerLine.startsWith(':::badge') &&
              (innerLine.includes('text=') || innerLine.includes('variant='))) ||
            (innerLine.startsWith(':::chart') && innerLine.includes('data='));
          if (innerLine.startsWith(':::') && innerLine.length > 3 && !isSingleLine) {
            nestedCount++;
          } else if (innerLine === ':::') {
            nestedCount--;
            if (nestedCount === 0) {
              closed = true;
              i++; // consume closing :::
              break;
            }
          }
          blockLines.push(lines[i] ?? '');
          i++;
        }

        if (!closed) {
          this.diagnostics.push({
            code: 'UNCLOSED_DIRECTIVE',
            message: `Directive ':::${directiveName}' at line ${directiveStartLine} was never closed with ':::'`,
            severity: 'warning',
            loc: {
              start: { line: directiveStartLine, column: 1 },
              end: { line: baseLine + i - 1, column: 1 },
            },
          });
        }

        const blockBaseLine = directiveStartLine + 1;

        if (directiveName === 'notes') {
          notes = blockLines
            .map((l) => l.trim())
            .filter(Boolean)
            .join('\n');
        } else if (directiveName === 'card') {
          let cardTitle: string | undefined;
          let cardVariant: string | undefined;
          const variantMatch = directiveArg.match(/variant=['"](.*?)['"]/);
          if (variantMatch) {
            cardVariant = variantMatch[1];
            cardTitle =
              directiveArg
                .replace(/variant=['"].*?['"]/, '')
                .trim()
                .replace(/^['"](.*)['"]$/, '$1') || undefined;
          } else {
            cardTitle = directiveArg.replace(/^['"](.*)['"]$/, '$1') || undefined;
          }
          const { elements: cardElements } = this.parseLines(blockLines, blockBaseLine);
          const el = createCard(cardElements, cardTitle, cardVariant);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'columns') {
          const ratios = directiveArg
            ? directiveArg.replace(/^ratios=['"]?(.*?)['"]?$/, '$1')
            : undefined;
          const columns = this.parseColumnsBlock(blockLines, blockBaseLine);
          const el = createColumns(columns, ratios);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'quote') {
          const author = directiveArg.replace(/^['"](.*)['"]$/, '$1') || undefined;
          const quoteText = blockLines
            .map((l) => l.trim())
            .join(' ')
            .trim();
          const el = createQuote(quoteText, author);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'mermaid') {
          const code = blockLines.join('\n').trim();
          const el = createMermaid(code);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'chart') {
          const el = this.parseChartDirective(directiveArg, blockLines);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'timeline') {
          const el = this.parseTimelineBlock(directiveArg, blockLines);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'compare') {
          const el = this.parseCompareBlock(directiveArg, blockLines, blockBaseLine);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        } else if (directiveName === 'step') {
          const { elements: stepElements } = this.parseLines(blockLines, blockBaseLine);
          for (const sEl of stepElements) {
            sEl.step = 1;
            elements.push(sEl);
          }
        } else if (directiveName === 'math') {
          const expr = blockLines.join('\n').trim();
          const el = createMath(expr, true);
          el.loc = {
            start: { line: directiveStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(el);
        }
        continue;
      }

      // Math Block ($$ ... $$)
      if (line.startsWith('$$')) {
        flushAll();
        const mathStartLine = currentLineNum;
        if (line.length > 2 && line.endsWith('$$') && line.length > 4) {
          const expr = line.slice(2, -2).trim();
          const el = createMath(expr, true);
          el.loc = {
            start: { line: currentLineNum, column: 1 },
            end: { line: currentLineNum, column: rawLine.length + 1 },
          };
          elements.push(el);
          i++;
          continue;
        }

        const mathLines: string[] = [];
        i++;
        while (i < lines.length) {
          const mLine = lines[i] ?? '';
          if (mLine.trim() === '$$') {
            i++;
            break;
          }
          mathLines.push(mLine);
          i++;
        }

        const el = createMath(mathLines.join('\n').trim(), true);
        el.loc = {
          start: { line: mathStartLine, column: 1 },
          end: { line: baseLine + i - 1, column: 1 },
        };
        elements.push(el);
        continue;
      }

      // Markdown Table (| Header 1 | Header 2 |)
      if (line.startsWith('|') && line.endsWith('|')) {
        const nextLine = lines[i + 1]?.trim() ?? '';
        if (nextLine.startsWith('|') && nextLine.includes('---')) {
          flushAll();
          const tableStartLine = currentLineNum;
          const headerCells = line
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          const rows: string[][] = [];
          i += 2; // skip header and separator row

          while (i < lines.length) {
            const rowLine = lines[i]?.trim() ?? '';
            if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
              break;
            }
            const rowCells = rowLine
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());
            rows.push(rowCells);
            i++;
          }

          const tableEl = createTable(rows, headerCells);
          tableEl.loc = {
            start: { line: tableStartLine, column: 1 },
            end: { line: baseLine + i - 1, column: 1 },
          };
          elements.push(tableEl);
          continue;
        }
      }

      // Heading (# to ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        flushAll();
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = headingMatch[2].trim();
        const el = createHeading(text, level);
        el.loc = {
          start: { line: currentLineNum, column: 1 },
          end: { line: currentLineNum, column: rawLine.length + 1 },
        };
        elements.push(el);
        i++;
        continue;
      }

      // Blockquote (> text)
      if (line.startsWith('>')) {
        flushAll();
        const quoteText = line.replace(/^>\s*/, '').trim();
        const el = createQuote(quoteText);
        el.loc = {
          start: { line: currentLineNum, column: 1 },
          end: { line: currentLineNum, column: rawLine.length + 1 },
        };
        elements.push(el);
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
        const el = createImage(src, alt, caption);
        el.loc = {
          start: { line: currentLineNum, column: 1 },
          end: { line: currentLineNum, column: rawLine.length + 1 },
        };
        elements.push(el);
        i++;
        continue;
      }

      // Unordered list item (- item, * item)
      const unorderMatch = line.match(/^[-*]\s+(.*)$/);
      if (unorderMatch && unorderMatch[1]) {
        flushParagraph();
        if (!currentList || currentList.ordered) {
          flushList();
          currentList = { ordered: false, items: [], startLine: currentLineNum };
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
          currentList = { ordered: true, items: [], startLine: currentLineNum };
        }
        currentList.items.push(orderMatch[1].trim());
        i++;
        continue;
      }

      // Standard text line -> accumulate in current paragraph
      flushList();
      if (currentParagraph.length === 0) {
        paragraphStartLine = currentLineNum;
      }
      currentParagraph.push(line);
      i++;
    }

    flushAll();

    return {
      elements,
      ...(notes ? { notes } : {}),
      ...(layout ? { layout } : {}),
      ...(transition ? { transition } : {}),
    };
  }

  private parseColumnsBlock(lines: string[], baseLine: number): ColumnElement[] {
    const columns: ColumnElement[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i]?.trim() ?? '';
      const currentLineNum = baseLine + i;

      if (line.startsWith(':::column')) {
        const arg = line.slice(9).trim();
        const widthMatch = arg.match(/width=['"]?(.*?)['"]?$/);
        const width = widthMatch && widthMatch[1] ? widthMatch[1] : undefined;

        const colLines: string[] = [];
        const colStartLine = currentLineNum;
        i++;
        let nestedCount = 1;

        while (i < lines.length) {
          const innerLine = lines[i]?.trim() ?? '';
          const isInlineClosed =
            innerLine.startsWith(':::') && innerLine.endsWith(':::') && innerLine.length > 5;
          const isSeparator = innerLine === ':::vs' || innerLine.startsWith(':::vs ');
          const isSingleLine =
            isInlineClosed ||
            isSeparator ||
            innerLine.startsWith(':::transition') ||
            innerLine.startsWith(':::metric') ||
            innerLine.startsWith(':::layout') ||
            (innerLine.startsWith(':::badge') &&
              (innerLine.includes('text=') || innerLine.includes('variant='))) ||
            (innerLine.startsWith(':::chart') && innerLine.includes('data='));
          if (innerLine.startsWith(':::') && innerLine.length > 3 && !isSingleLine) {
            nestedCount++;
          } else if (innerLine === ':::') {
            nestedCount--;
            if (nestedCount === 0) {
              i++; // consume closing :::
              break;
            }
          }
          colLines.push(lines[i] ?? '');
          i++;
        }

        const { elements } = this.parseLines(colLines, colStartLine + 1);
        const col = createColumn(elements, width);
        col.loc = {
          start: { line: colStartLine, column: 1 },
          end: { line: baseLine + i - 1, column: 1 },
        };
        columns.push(col);
      } else {
        i++;
      }
    }

    return columns;
  }

  private parseChartDirective(headerArg: string, blockLines: string[]): ChartElement {
    const typeMatch = headerArg.match(/type=['"](.*?)['"]/);
    const titleMatch = headerArg.match(/title=['"](.*?)['"]/);
    const labelsMatch = headerArg.match(/labels=['"](.*?)['"]/);
    const dataMatch = headerArg.match(/data=['"](.*?)['"]/);

    const chartType = (typeMatch ? typeMatch[1] : 'bar') as 'bar' | 'line' | 'pie' | 'doughnut';
    const title = titleMatch ? titleMatch[1] : undefined;

    let labels: string[] = [];
    const series: ChartDataSeries[] = [];

    if (labelsMatch && labelsMatch[1]) {
      labels = labelsMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (dataMatch && dataMatch[1]) {
      const rawData = dataMatch[1].trim();
      if (rawData.includes(':')) {
        const parts = rawData.split(',').map((p) => p.trim());
        const values: number[] = [];
        const extractedLabels: string[] = [];
        for (const part of parts) {
          const [k, v] = part.split(':').map((s) => s.trim());
          if (k && v !== undefined) {
            extractedLabels.push(k);
            values.push(parseFloat(v) || 0);
          }
        }
        if (labels.length === 0) labels = extractedLabels;
        series.push({ name: title || 'Data', values });
      } else {
        const values = rawData.split(',').map((v) => parseFloat(v.trim()) || 0);
        series.push({ name: title || 'Data', values });
      }
    }

    for (const line of blockLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.toLowerCase().startsWith('labels:')) {
        labels = trimmed
          .slice(7)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (trimmed.toLowerCase().startsWith('series:')) {
        const seriesContent = trimmed.slice(7).trim();
        const sMatch = seriesContent.match(/^(.*?)\s*\[(.*?)\]$/);
        if (sMatch && sMatch[1] && sMatch[2]) {
          const sName = sMatch[1].trim();
          const sValues = sMatch[2].split(',').map((v) => parseFloat(v.trim()) || 0);
          series.push({ name: sName, values: sValues });
        }
      } else if (trimmed.includes('|')) {
        const parts = trimmed.split('|').map((s) => s.trim());
        if (parts.length >= 2) {
          const [l, valStr] = parts;
          if (l && valStr) {
            labels.push(l);
            const val = parseFloat(valStr) || 0;
            if (series.length === 0) series.push({ name: 'Data', values: [] });
            series[0]?.values.push(val);
          }
        }
      }
    }

    if (labels.length === 0) {
      const maxLen = Math.max(0, ...series.map((s) => s.values.length));
      labels = Array.from({ length: maxLen }, (_, i) => `Item ${i + 1}`);
    }

    return createChart(chartType, labels, series, title);
  }

  private parseTimelineBlock(headerArg: string, blockLines: string[]): TimelineElement {
    const layoutMatch = headerArg.match(/layout=['"](.*?)['"]/);
    const layout = layoutMatch && layoutMatch[1] === 'vertical' ? 'vertical' : 'horizontal';
    const items: TimelineItem[] = [];

    for (const line of blockLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const bracketMatch = trimmed.match(/^[-*]?\s*\[(.*?)\]\s*(.*?)(?::\s*(.*))?$/);
      if (bracketMatch && bracketMatch[1] && bracketMatch[2]) {
        items.push({
          date: bracketMatch[1].trim(),
          title: bracketMatch[2].trim(),
          description: bracketMatch[3] ? bracketMatch[3].trim() : undefined,
        });
        continue;
      }

      if (trimmed.includes('|')) {
        const parts = trimmed.split('|').map((s) => s.trim());
        if (parts.length >= 2) {
          items.push({
            date: parts[0],
            title: parts[1] || '',
            description: parts[2] || undefined,
          });
          continue;
        }
      }

      items.push({
        title: trimmed.replace(/^[-*]\s*/, ''),
      });
    }

    return createTimeline(items, layout);
  }

  private parseCompareBlock(
    headerArg: string,
    blockLines: string[],
    baseLine: number
  ): CompareElement {
    const leftMatch = headerArg.match(/left=['"](.*?)['"]/);
    const rightMatch = headerArg.match(/right=['"](.*?)['"]/);
    const leftTitle = leftMatch ? leftMatch[1] : undefined;
    const rightTitle = rightMatch ? rightMatch[1] : undefined;

    let leftLines: string[] = [];
    let rightLines: string[] = [];
    let currentSide: 'left' | 'right' = 'left';

    for (const line of blockLines) {
      const trimmed = line.trim();
      if (trimmed === ':::vs' || trimmed === ':::right' || trimmed === '---') {
        currentSide = 'right';
        continue;
      }
      if (trimmed === ':::left') {
        currentSide = 'left';
        continue;
      }
      if (currentSide === 'left') {
        leftLines.push(line);
      } else {
        rightLines.push(line);
      }
    }

    if (rightLines.length === 0 && leftLines.length > 1) {
      const half = Math.ceil(leftLines.length / 2);
      rightLines = leftLines.slice(half);
      leftLines = leftLines.slice(0, half);
    }

    const { elements: leftElements } = this.parseLines(leftLines, baseLine);
    const { elements: rightElements } = this.parseLines(rightLines, baseLine + leftLines.length);

    return createCompare(leftElements, rightElements, leftTitle, rightTitle);
  }
}

export function parseYumia(source: string, options?: ParserOptions): Presentation {
  const parser = new DefaultYumiaParser();
  return parser.parse(source, options);
}
