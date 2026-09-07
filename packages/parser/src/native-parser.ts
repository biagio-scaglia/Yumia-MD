import {
  BadgeElement,
  CalloutElement,
  CardElement,
  ChartDataSeries,
  ColumnElement,
  ComponentDefinition,
  DiagramEdge,
  DiagramNode,
  MetricElement,
  Presentation,
  PresentationMetadata,
  Slide,
  SlideElement,
  TimelineItem,
  createBadge,
  createCallout,
  createCard,
  createChart,
  createCode,
  createColumn,
  createColumns,
  createCompare,
  createDiagram,
  createGrid,
  createHeading,
  createHero,
  createIcon,
  createImage,
  createList,
  createMath,
  createMermaid,
  createMetric,
  createParagraph,
  createPresentation,
  createQuote,
  createSection,
  createSequence,
  createClassDiagram,
  createSlide,
  createStack,
  createTable,
  createTimeline,
  createToc,
  SequenceParticipant,
  SequenceMessage,
  SequenceNote,
  ClassItem,
  ClassMember,
  ClassRelationship,
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
    const components: Record<string, ComponentDefinition> = {};
    const slides: Slide[] = [];
    let currentSlideElements: SlideElement[] = [];
    let currentSlide: Slide | null = null;

    const flushSlide = () => {
      if (currentSlide) {
        let elements = [...currentSlideElements];
        const hasHero = elements.some((el) => el.type === 'hero');
        if (hasHero && elements.length > 1 && elements[0]?.type === 'heading') {
          elements = elements.slice(1);
        }
        currentSlide.elements = elements;
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

      // Component definition: component Name param1, param2...
      if (cmdLower === 'component') {
        const parts = tok.args.split(/[,\s]+/).filter(Boolean);
        const name = parts[0] || 'MyComponent';
        const params = parts.slice(1);
        const templateElements: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > tok.indent) {
          const childRes = this.parseElement(tokens, nextIdx, components);
          if (childRes) {
            templateElements.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        components[name.toLowerCase()] = { name, params, template: templateElements };
        idx = nextIdx;
        continue;
      }

      // Slide start
      if (tok.command === 'slide' || tok.command === '---') {
        flushSlide();
        const eachMatch = tok.args.match(/\b(?:each|for)=["']([^"']+)["']/);
        const cleanArgs = tok.args.replace(/\b(?:each|for)=["'][^"']+["']/g, '').trim();
        const slideTitle =
          tok.command === 'slide' && cleanArgs ? this.stripQuotes(cleanArgs) : undefined;
        currentSlide = createSlide([], {
          loc: {
            start: { line: tok.lineNum, column: 1 },
            end: { line: tok.lineNum, column: tok.text.length },
          },
          each: eachMatch ? eachMatch[1] : undefined,
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
        if (tok.args) {
          noteLines.push(this.stripQuotes(tok.args));
        }
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
      const parsedEl = this.parseElement(tokens, idx, components);
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

    const presentation = createPresentation(metadata, slides);
    presentation.components = components;
    return presentation;
  }

  private parseElement(
    tokens: LineToken[],
    idx: number,
    components: Record<string, ComponentDefinition> = {}
  ): { element: SlideElement; nextIdx: number } | null {
    const tok = tokens[idx]!;
    const baseIndent = tok.indent;

    switch (tok.command) {
      case 'hero': {
        const titleVal = this.extractAttr(tok.args, 'title') ?? this.extractAttr(tok.args);
        const subVal = this.extractAttr(tok.args, 'subtitle');
        const tagVal = this.extractAttr(tok.args, 'tagline');
        const badgeVal = this.extractAttr(tok.args, 'badge');
        const alignVal = this.extractAttr(tok.args, 'align');
        const emphVal = this.extractAttr(tok.args, 'emphasis');
        const densVal = this.extractAttr(tok.args, 'density');

        const title = (titleVal ?? this.stripQuotes(tok.args)) || 'Hero';
        const children: SlideElement[] = [];
        let nextIdx = idx + 1;

        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx, components);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }

        const heroEl = createHero(title, subVal, children.length > 0 ? children : undefined, {
          tagline: tagVal,
          badge: badgeVal,
          align: alignVal as 'left' | 'center' | 'right' | undefined,
          emphasis: emphVal,
          density: densVal,
        });
        heroEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: heroEl, nextIdx };
      }

      case 'callout': {
        const titleVal = this.extractAttr(tok.args, 'title');
        const sevVal =
          this.extractAttr(tok.args, 'severity') ?? this.extractAttr(tok.args, 'variant');
        const iconVal = this.extractAttr(tok.args, 'icon');
        let text = this.stripQuotes(
          tok.args
            .replace(/\btitle=(?:"[^"]*"|'[^']*'|\S+)/g, '')
            .replace(/\b(?:severity|variant|icon)=(?:"[^"]*"|'[^']*'|\S+)/g, '')
        );

        let nextIdx = idx + 1;
        if (!text) {
          const cLines: string[] = [];
          while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
            cLines.push(tokens[nextIdx]!.text);
            nextIdx++;
          }
          text = cLines.join(' ');
        }

        const calloutEl = createCallout(
          text || 'Note',
          (sevVal ? sevVal : 'info') as CalloutElement['severity'],
          titleVal,
          iconVal
        );
        calloutEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: calloutEl, nextIdx };
      }

      case 'heading':
      case 'h1':
      case 'h2':
      case 'h3': {
        const lvlMatch = tok.args.match(/^(?:level=)?([1-4])\b/);
        let level = 2;
        let text = tok.args;
        if (tok.command === 'h1') {
          level = 1;
        } else if (tok.command === 'h2') {
          level = 2;
        } else if (tok.command === 'h3') {
          level = 3;
        } else if (lvlMatch && lvlMatch[1]) {
          level = parseInt(lvlMatch[1], 10);
          text = tok.args.replace(/^(?:level=)?[1-4]\s*/, '');
        }
        text = this.stripQuotes(text);
        const el = createHeading(text, Math.min(6, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5 | 6);
        el.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: el, nextIdx: idx + 1 };
      }

      case 'paragraph':
      case 'text':
      case 'p': {
        const alignMatch = tok.args.match(/\balign=["']?([^"'\s]+)["']?/);
        const raw = tok.args.replace(/\balign=["']?[^"'\s]+["']?/g, '').trim();
        let text = this.stripQuotes(raw);
        let nextIdx = idx + 1;
        if (!text) {
          const pLines: string[] = [];
          while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
            pLines.push(tokens[nextIdx]!.text);
            nextIdx++;
          }
          text = pLines.join(' ');
        }
        const align = alignMatch ? (alignMatch[1] as 'left' | 'center' | 'right') : undefined;
        return { element: createParagraph(text, align), nextIdx };
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
        const titleVal = this.extractAttr(tok.args, 'title');
        const variantVal = this.extractAttr(tok.args, 'variant');
        const iconVal = this.extractAttr(tok.args, 'icon');
        const title = titleVal ?? (this.stripQuotes(tok.args) || undefined);
        const variant = (variantVal ? variantVal : 'default') as CardElement['variant'];

        const children: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx, components);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        return { element: createCard(children, title, variant, iconVal), nextIdx };
      }

      case 'column': {
        const children: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx, components);
          if (childRes) {
            children.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }
        return { element: createColumn(children), nextIdx };
      }

      case 'columns': {
        const ratios = tok.args || '50:50';
        const cols: SlideElement[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const childRes = this.parseElement(tokens, nextIdx, components);
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
          const childRes = this.parseElement(tokens, nextIdx, components);
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
          const childRes = this.parseElement(tokens, nextIdx, components);
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
        const valVal = this.extractAttr(tok.args, 'value') ?? this.extractAttr(tok.args);
        const labelVal = this.extractAttr(tok.args, 'label');
        const diffVal = this.extractAttr(tok.args, 'diff') ?? this.extractAttr(tok.args, 'change');
        const variantVal = this.extractAttr(tok.args, 'variant');

        const value = valVal || '0';
        const label = labelVal || 'Metric';
        return {
          element: createMetric(
            value,
            label,
            (variantVal as MetricElement['variant']) || 'primary',
            undefined,
            undefined,
            diffVal
          ),
          nextIdx: idx + 1,
        };
      }

      case 'code': {
        const langMatch = tok.args.match(/\blang(?:uage)?=["']?([^"'\s]+)["']?/);
        const hlMatch = tok.args.match(/\bhighlight=["']([^"']+)["']/);
        const language = langMatch ? langMatch[1] : tok.args.trim().split(' ')[0] || 'typescript';
        const highlightLines = hlMatch ? parseHighlightLines(hlMatch[1]!) : undefined;

        const codeLines: string[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          codeLines.push(tokens[nextIdx]!.text);
          nextIdx++;
        }
        const codeText = codeLines.join('\n');
        return {
          element: createCode(codeText, language, highlightLines),
          nextIdx,
        };
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
        return {
          element: createBadge(
            textMatch ? textMatch[1]! : this.stripQuotes(tok.args),
            variantMatch ? (variantMatch[1] as BadgeElement['variant']) : 'primary'
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

      case 'image':
      case 'img': {
        const srcMatch = tok.args.match(/^(?:src=)?["']?([^"'\s]+)["']?/);
        const altMatch = tok.args.match(/\balt=["']([^"']+)["']/);
        const fitMatch = tok.args.match(/\bfit=["']?([^"'\s]+)["']?/);
        const radiusMatch = tok.args.match(/\bradius=["']?([^"'\s]+)["']?/);
        const shadowMatch = tok.args.match(/\bshadow(?:=["']?([^"'\s]+)["']?)?/);

        return {
          element: createImage(
            srcMatch ? srcMatch[1]! : '',
            altMatch ? altMatch[1] : undefined,
            undefined,
            {
              fit: fitMatch ? fitMatch[1] : undefined,
              radius: radiusMatch ? radiusMatch[1] : undefined,
              shadow: shadowMatch ? (shadowMatch[1] ? shadowMatch[1] : true) : undefined,
            }
          ),
          nextIdx: idx + 1,
        };
      }

      case 'chart': {
        const typeMatch = tok.args.match(/type=["']?([^"'\s]+)["']?/);
        const titleMatch = tok.args.match(/title=["']([^"']+)["']/);
        const labelsMatch = tok.args.match(/labels=["']([^"']+)["']/);
        const dataMatch = tok.args.match(/data=["']([^"']+)["']/);

        const chartType = typeMatch ? typeMatch[1]! : 'bar';
        const title = titleMatch ? titleMatch[1] : undefined;
        const labels = labelsMatch ? labelsMatch[1]!.split(',').map((s) => s.trim()) : [];
        const series: ChartDataSeries[] = [];

        if (dataMatch) {
          const vals = dataMatch[1]!.split(',').map((v) => parseFloat(v.trim()) || 0);
          series.push({ name: title || 'Data', values: vals });
        }

        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const sub = tokens[nextIdx]!;
          if (sub.command === 'series') {
            const sNameMatch = sub.args.match(/name=["']([^"']+)["']/);
            const sDataMatch = sub.args.match(/data=["']([^"']+)["']/);
            const colonMatch = sub.text.match(/^series\s+([^:]+):\s*(.+)$/i);
            const bracketMatch = sub.text.match(/^series:?\s*(.*?)\s*\[(.*?)\]$/i);
            if (sDataMatch) {
              const vals = sDataMatch[1]!.split(',').map((v) => parseFloat(v.trim()) || 0);
              series.push({
                name: sNameMatch ? sNameMatch[1] : 'Series',
                values: vals,
              });
            } else if (colonMatch && colonMatch[1] && colonMatch[2]) {
              const vals = colonMatch[2]!.split(',').map((v) => parseFloat(v.trim()) || 0);
              series.push({
                name: colonMatch[1]!.trim(),
                values: vals,
              });
            } else if (bracketMatch && bracketMatch[1] && bracketMatch[2]) {
              const vals = bracketMatch[2]!.split(',').map((v) => parseFloat(v.trim()) || 0);
              series.push({
                name: bracketMatch[1]!.trim(),
                values: vals,
              });
            }
          }
          nextIdx++;
        }

        return {
          element: createChart(chartType, labels, series, title),
          nextIdx,
        };
      }

      case 'diagram': {
        const typeMatch = tok.args.match(/\btype=["']?([^"'\s]+)["']?/);
        const dirMatch = tok.args.match(/\b(?:direction|dir)=["']?([^"'\s]+)["']?/);
        const titleMatch = tok.args.match(/\btitle=["']([^"']+)["']/);
        const diagType = typeMatch ? typeMatch[1] : 'flow';
        const direction = (dirMatch ? dirMatch[1]!.toUpperCase() : 'LR') as
          'LR' | 'TB' | 'RL' | 'BT';
        const title = titleMatch ? titleMatch[1] : undefined;

        const nodes: DiagramNode[] = [];
        const edges: DiagramEdge[] = [];
        const nodeMap = new Map<string, DiagramNode>();

        const ensureNode = (
          rawInput: string,
          shape?: string,
          variant?: string,
          explicitLabel?: string
        ): DiagramNode => {
          let id = '';
          let label = '';
          let detectedShape: DiagramNode['shape'] = (shape as DiagramNode['shape']) || 'round';

          // Check if format is id[(label)], id((label)), id{label}, id[label]
          const inlineMatch = rawInput.match(
            /^([a-zA-Z0-9_-]+)(\[\([^)]+\)\]|\(\([^)]+\)\)|\{[^}]+\}|\[[^\]]+\])$/
          );
          if (inlineMatch) {
            id = inlineMatch[1]!.toLowerCase();
            const body = inlineMatch[2]!;
            if (body.startsWith('[(')) detectedShape = 'database';
            else if (body.startsWith('((')) detectedShape = 'circle';
            else if (body.startsWith('{')) detectedShape = 'diamond';
            label = body.replace(/^[[({]+|[\])}]+$/g, '').trim();
          } else {
            const clean = rawInput.replace(/^[[({]+|[\])}]+$/g, '').trim();
            if (rawInput.startsWith('[(') || shape === 'database') detectedShape = 'database';
            else if (rawInput.startsWith('((') || shape === 'circle') detectedShape = 'circle';
            else if (rawInput.startsWith('{') || shape === 'diamond') detectedShape = 'diamond';
            label = explicitLabel || clean;
            id = clean.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
          }

          // Check if already mapped under id, label, or slug
          let existing =
            nodeMap.get(id) ||
            nodeMap.get(label.toLowerCase()) ||
            nodeMap.get(label.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase());

          if (!existing && explicitLabel) {
            const labelSlug = explicitLabel.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            existing = nodeMap.get(labelSlug) || nodeMap.get(explicitLabel.toLowerCase());
          }

          if (!existing) {
            existing = {
              id,
              label,
              shape: detectedShape,
              variant:
                (variant as DiagramNode['variant']) || (nodes.length === 0 ? 'primary' : 'accent'),
            };
            nodes.push(existing);
          } else {
            if (shape) existing.shape = detectedShape;
            if (variant) existing.variant = variant as DiagramNode['variant'];
            if (explicitLabel) existing.label = explicitLabel;
          }

          // Register all aliases so subsequent edge or node references find the exact same node
          nodeMap.set(id, existing);
          nodeMap.set(existing.id, existing);
          nodeMap.set(existing.label.toLowerCase(), existing);
          nodeMap.set(existing.label.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase(), existing);

          return existing;
        };

        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const dLine = tokens[nextIdx]!.text;
          if (dLine.includes('->') || dLine.includes('-->') || dLine.includes('-[')) {
            const segRegex =
              /([a-zA-Z0-9_-]+\[\([^)]+\)\]|[a-zA-Z0-9_-]+\(\([^)]+\)\)|[a-zA-Z0-9_-]+\{[^}]+\}|[a-zA-Z0-9_-]+\[[^\]]+\]|\[\([^)]+\)\]|\(\([^)]+\)\)|\{[^}]+\}|\[[^\]]+\]|\S+)(?:\s*(?:-\[([^\]]+)\]->|-->|->)\s*)?/g;
            let m: RegExpExecArray | null;
            let prevNode: DiagramNode | null = null;
            let pendingEdgeLabel: string | undefined = undefined;

            while ((m = segRegex.exec(dLine)) !== null) {
              const rawNodeText = m[1]!;
              const edgeLabel = m[2];
              if (rawNodeText) {
                const currNode = ensureNode(rawNodeText);
                if (prevNode) {
                  edges.push({
                    from: prevNode.id,
                    to: currNode.id,
                    label: pendingEdgeLabel,
                    arrow: true,
                    style: 'solid',
                  });
                }
                prevNode = currNode;
                pendingEdgeLabel = edgeLabel;
              }
            }
          } else if (dLine.startsWith('node ')) {
            const nParts = dLine.slice(5).trim();
            // Match full bracket labels: [Sorgente Yumia], not just "[Sorgente"
            const nIdMatch = nParts.match(
              /^(\[[^\]]+\]|\([^)]+\)|\{[^}]+\}|[a-zA-Z0-9_-]+(?:\[\([^)]+\)\]|\(\([^)]+\)\)|\[[^\]]+\]|\{[^}]+\})?)/
            );
            const nLabelMatch = nParts.match(/\blabel=["']([^"']+)["']/);
            const nShapeMatch = nParts.match(/\bshape=["']?([^"'\s]+)["']?/);
            const nVarMatch = nParts.match(/\bvariant=["']?([^"'\s]+)["']?/);
            if (nIdMatch) {
              const nId = nIdMatch[1]!;
              const explicitLabel = nLabelMatch ? nLabelMatch[1] : undefined;
              const node = ensureNode(
                nId,
                nShapeMatch ? nShapeMatch[1] : undefined,
                nVarMatch ? nVarMatch[1] : undefined,
                explicitLabel
              );
              nodeMap.set(nId.toLowerCase(), node);
              nodeMap.set(node.id, node);
            }
          }
          nextIdx++;
        }

        const diagEl = createDiagram(nodes, edges, {
          diagramType: diagType,
          direction,
          title,
        });
        diagEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: diagEl, nextIdx };
      }

      case 'sequence': {
        const titleMatch = tok.args.match(/\btitle=["']([^"']+)["']/);
        const title = titleMatch ? titleMatch[1] : undefined;

        const participants: SequenceParticipant[] = [];
        const participantMap = new Map<string, SequenceParticipant>();
        const messages: SequenceMessage[] = [];
        const notes: SequenceNote[] = [];

        const ensureParticipant = (
          rawId: string,
          type: SequenceParticipant['type'] = 'participant',
          explicitName?: string
        ): SequenceParticipant => {
          const cleanId = rawId
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .toLowerCase();
          let p = participantMap.get(cleanId);
          if (!p) {
            p = {
              id: cleanId,
              name: explicitName || rawId.trim(),
              type,
            };
            participantMap.set(cleanId, p);
            participants.push(p);
          } else if (explicitName && p.name === p.id) {
            p.name = explicitName;
          }
          return p;
        };

        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const line = tokens[nextIdx]!.text;
          const declMatch = line.match(
            /^(actor|participant|database|boundary|control|entity)\s+(?:["']([^"']+)["']|(\S+))(?:\s+as\s+(?:["']([^"']+)["']|(\S+)))?/i
          );
          if (declMatch) {
            const type = declMatch[1]!.toLowerCase() as SequenceParticipant['type'];
            const first = declMatch[2] || declMatch[3]!;
            const second = declMatch[4] || declMatch[5];

            let id = first;
            let displayName = first;

            if (second) {
              if (declMatch[2]) {
                displayName = first;
                id = second;
              } else {
                id = first;
                displayName = second;
              }
            }

            const p = ensureParticipant(id, type, displayName);
            participantMap.set(id.toLowerCase(), p);
            participantMap.set(displayName.toLowerCase(), p);
            if (second) {
              participantMap.set(second.toLowerCase(), p);
            }
            nextIdx++;
            continue;
          }

          const noteMatch = line.match(/^note\s+(over|right\s+of|left\s+of)\s+(\S+)\s*:\s*(.+)$/i);
          if (noteMatch) {
            const pos = noteMatch[1]!.toLowerCase().includes('right')
              ? 'right'
              : noteMatch[1]!.toLowerCase().includes('left')
                ? 'left'
                : 'over';
            const target = noteMatch[2]!;
            const noteText = noteMatch[3]!.trim();
            const p = ensureParticipant(target);
            notes.push({
              participant: p.id,
              text: noteText,
              position: pos as SequenceNote['position'],
            });
            nextIdx++;
            continue;
          }

          const msgMatch = line.match(/^(\S+)\s*(->>|-->|->|<-|<--)\s*(\S+)\s*:\s*(.+)$/);
          if (msgMatch) {
            const fromRaw = msgMatch[1]!;
            const arrowOp = msgMatch[2]!;
            const toRaw = msgMatch[3]!;
            const label = msgMatch[4]!.trim();

            let pFrom = ensureParticipant(fromRaw);
            let pTo = ensureParticipant(toRaw);

            let style: 'solid' | 'dashed' = 'solid';
            let arrowType: 'sync' | 'async' | 'return' = 'sync';

            if (arrowOp === '<--' || arrowOp === '<-') {
              const temp = pFrom;
              pFrom = pTo;
              pTo = temp;
              if (arrowOp === '<--') {
                style = 'dashed';
                arrowType = 'return';
              }
            } else if (arrowOp === '-->') {
              style = 'dashed';
              arrowType = 'return';
            } else if (arrowOp === '->>') {
              arrowType = 'async';
            }

            messages.push({
              from: pFrom.id,
              to: pTo.id,
              label,
              style,
              arrowType,
            });
            nextIdx++;
            continue;
          }
          nextIdx++;
        }

        const seqEl = createSequence(participants, messages, { title, notes });
        seqEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: seqEl, nextIdx };
      }

      case 'class':
      case 'class-diagram': {
        const titleMatch = tok.args.match(/\btitle=["']([^"']+)["']/);
        const title = titleMatch ? titleMatch[1] : undefined;

        const classes: ClassItem[] = [];
        const classMap = new Map<string, ClassItem>();
        const relationships: ClassRelationship[] = [];

        const ensureClass = (name: string): ClassItem => {
          const cleanId = name
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .toLowerCase();
          let c = classMap.get(cleanId);
          if (!c) {
            c = {
              id: cleanId,
              name: name.trim(),
              members: [],
            };
            classMap.set(cleanId, c);
            classes.push(c);
          }
          return c;
        };

        let currentClass: ClassItem | null = null;
        let nextIdx = idx + 1;

        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const line = tokens[nextIdx]!.text;
          const classStartMatch = line.match(
            /^(?:(abstract\s+class|class|interface)\s+)(\w+)(?:\s*\{)?/i
          );
          if (classStartMatch) {
            const modifier = classStartMatch[1]!.toLowerCase();
            const className = classStartMatch[2]!;
            currentClass = ensureClass(className);
            if (modifier.startsWith('abstract')) currentClass.isAbstract = true;
            if (modifier === 'interface') currentClass.isInterface = true;
            if (line.endsWith('}') && line.includes('{')) {
              currentClass = null;
            }
            nextIdx++;
            continue;
          }

          if (currentClass) {
            if (line === '}') {
              currentClass = null;
              nextIdx++;
              continue;
            }
            const memberMatch = line.match(
              /^([+\-#~])?\s*([\w]+)(?:\((.*?)\))?\s*(?::\s*([\w<>[\], ]+))?/
            );
            if (memberMatch) {
              const vis = (memberMatch[1] as ClassMember['visibility']) || '+';
              const mName = memberMatch[2]!;
              const isMethod = memberMatch[3] !== undefined;
              const params = memberMatch[3];
              const mType = memberMatch[4];
              currentClass.members.push({
                visibility: vis,
                name: mName,
                isMethod,
                params: params ? params.trim() : undefined,
                type: mType ? mType.trim() : undefined,
              });
            }
            nextIdx++;
            continue;
          }

          const relMatch = line.match(
            /^(\w+)(?:\s*["']([^"']*)["'])?\s*(--\|>|\.\.\|>|<\|--|<\|\.\.|-->|<--|--|\*--|--\*|o--|--o)\s*(?:["']([^"']*)["']\s*)?(\w+)(?:\s*:\s*(.+))?/
          );
          if (relMatch) {
            const leftClass = ensureClass(relMatch[1]!);
            const leftMult = relMatch[2];
            const relOp = relMatch[3]!;
            const rightMult = relMatch[4];
            const rightClass = ensureClass(relMatch[5]!);
            const label = relMatch[6] ? relMatch[6].trim() : undefined;

            let fromClass = leftClass;
            let toClass = rightClass;
            let fromMultiplicity = leftMult;
            let toMultiplicity = rightMult;

            let relationshipType = 'association';
            if (relOp === '<|--' || relOp === '<|..') {
              fromClass = rightClass;
              toClass = leftClass;
              fromMultiplicity = rightMult;
              toMultiplicity = leftMult;
              relationshipType = relOp === '<|..' ? 'implements' : 'inheritance';
            } else if (relOp === '--|>' || relOp === '..|>') {
              relationshipType = relOp === '..|>' ? 'implements' : 'inheritance';
            } else if (relOp === '<--') {
              fromClass = rightClass;
              toClass = leftClass;
              fromMultiplicity = rightMult;
              toMultiplicity = leftMult;
              relationshipType = 'association';
            } else if (relOp === '*--' || relOp === '--*') {
              relationshipType = 'composition';
              if (relOp === '--*') {
                fromClass = rightClass;
                toClass = leftClass;
              }
            } else if (relOp === 'o--' || relOp === '--o') {
              relationshipType = 'aggregation';
              if (relOp === '--o') {
                fromClass = rightClass;
                toClass = leftClass;
              }
            }

            relationships.push({
              from: fromClass.id,
              to: toClass.id,
              relationshipType,
              fromMultiplicity,
              toMultiplicity,
              label,
            });
            nextIdx++;
            continue;
          }
          nextIdx++;
        }

        const classEl = createClassDiagram(classes, relationships, { title });
        classEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: classEl, nextIdx };
      }

      case 'compare': {
        const leftTitle =
          this.extractAttr(tok.args, 'left') ?? this.extractAttr(tok.args, 'leftTitle');
        const rightTitle =
          this.extractAttr(tok.args, 'right') ?? this.extractAttr(tok.args, 'rightTitle');

        const leftEls: SlideElement[] = [];
        const rightEls: SlideElement[] = [];
        let currentSide: 'left' | 'right' = 'left';

        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const sub = tokens[nextIdx]!;
          if (sub.command === 'left') {
            currentSide = 'left';
            nextIdx++;
            continue;
          } else if (sub.command === 'right') {
            currentSide = 'right';
            nextIdx++;
            continue;
          }

          const childRes = this.parseElement(tokens, nextIdx, components);
          if (childRes) {
            if (currentSide === 'left') leftEls.push(childRes.element);
            else rightEls.push(childRes.element);
            nextIdx = childRes.nextIdx;
          } else {
            nextIdx++;
          }
        }

        return { element: createCompare(leftEls, rightEls, leftTitle, rightTitle), nextIdx };
      }

      case 'timeline': {
        const layoutMatch = tok.args.match(/layout=["']?(horizontal|vertical)["']?/);
        const layout = (layoutMatch ? layoutMatch[1] : 'horizontal') as 'horizontal' | 'vertical';
        const items: TimelineItem[] = [];
        let nextIdx = idx + 1;

        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const sub = tokens[nextIdx]!;
          if (sub.command === 'item') {
            const dateVal = this.extractAttr(sub.args, 'date');
            const titleVal = this.extractAttr(sub.args, 'title');
            const descVal =
              this.extractAttr(sub.args, 'desc') ?? this.extractAttr(sub.args, 'description');
            items.push({
              date: dateVal || '2026',
              title: titleVal || 'Milestone',
              description: descVal,
            });
          }
          nextIdx++;
        }

        return { element: createTimeline(items, layout), nextIdx };
      }

      case 'mermaid': {
        const mLines: string[] = [];
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          mLines.push(tokens[nextIdx]!.text);
          nextIdx++;
        }
        return { element: createMermaid(mLines.join('\n')), nextIdx };
      }

      case 'math': {
        let expr = this.stripQuotes(tok.args);
        let nextIdx = idx + 1;
        if (!expr) {
          const mathLines: string[] = [];
          while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
            mathLines.push(tokens[nextIdx]!.text);
            nextIdx++;
          }
          expr = mathLines.join('\n');
        }
        return { element: createMath(expr), nextIdx };
      }

      case 'table': {
        let headers: string[] | undefined = undefined;
        const rows: string[][] = [];
        let nextIdx = idx + 1;

        while (nextIdx < tokens.length && tokens[nextIdx]!.indent > baseIndent) {
          const sub = tokens[nextIdx]!;
          if (sub.command === 'headers' || sub.command === 'header') {
            headers = sub.args.split(',').map((h) => this.stripQuotes(h.trim()));
          } else if (sub.command === 'row') {
            rows.push(sub.args.split(',').map((c) => this.stripQuotes(c.trim())));
          }
          nextIdx++;
        }

        return { element: createTable(rows, headers), nextIdx };
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

      default: {
        // Check if command is a registered component macro
        const comp =
          components[tok.command.toLowerCase()] ||
          Object.values(components).find((c) => c.name.toLowerCase() === tok.command.toLowerCase());

        if (comp) {
          const rawArgs = this.parseArgumentsList(tok.args);
          const argMap: Record<string, string> = {};
          comp.params.forEach((param, pIdx) => {
            argMap[param] = rawArgs[pIdx] ?? '';
          });
          const expanded = this.expandComponentTemplate(comp.template, argMap);
          const element = expanded.length === 1 ? expanded[0]! : createStack(expanded, 'vertical');
          return { element, nextIdx: idx + 1 };
        }

        // Default treat as paragraph
        return { element: createParagraph(tok.text), nextIdx: idx + 1 };
      }
    }
  }

  private parseArgumentsList(argsStr: string): string[] {
    const results: string[] = [];
    if (!argsStr) return results;
    const regex = /"([^"]*)"|'([^']*)'|([^,\s]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(argsStr)) !== null) {
      const val = match[1] ?? match[2] ?? match[3] ?? '';
      const cleanVal = val.trim();
      if (cleanVal !== '' && cleanVal !== ',') {
        results.push(cleanVal);
      }
    }
    return results;
  }

  private expandComponentTemplate(
    template: SlideElement[],
    args: Record<string, string>
  ): SlideElement[] {
    const jsonStr = JSON.stringify(template);
    let substituted = jsonStr;
    for (const [key, val] of Object.entries(args)) {
      const safeVal = JSON.stringify(val).slice(1, -1);
      substituted = substituted.split(`{{${key}}}`).join(safeVal);
    }
    try {
      return JSON.parse(substituted);
    } catch {
      return template;
    }
  }

  private extractAttr(argsStr: string, key?: string): string | undefined {
    if (!argsStr) return undefined;
    const pattern = key
      ? new RegExp(`\\b${key}=(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`)
      : /^(?:"([^"]*)"|'([^']*)')/;
    const m = argsStr.match(pattern);
    if (!m) return undefined;
    return m[1] ?? m[2] ?? m[3];
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
