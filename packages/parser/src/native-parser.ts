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
  createSlide,
  createStack,
  createTable,
  createTimeline,
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
    const components: Record<string, ComponentDefinition> = {};
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
        const titleMatch = tok.args.match(/^(?:title=)?["']([^"']+)["']/);
        const subMatch = tok.args.match(/\bsubtitle=["']([^"']+)["']/);
        const tagMatch = tok.args.match(/\btagline=["']([^"']+)["']/);
        const alignMatch = tok.args.match(/\balign=["']?([^"'\s]+)["']?/);
        const emphMatch = tok.args.match(/\bemphasis=["']?([^"'\s]+)["']?/);
        const densMatch = tok.args.match(/\bdensity=["']?([^"'\s]+)["']?/);

        const title = titleMatch ? titleMatch[1]! : this.stripQuotes(tok.args) || 'Hero';
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

        const heroEl = createHero(
          title,
          subMatch ? subMatch[1] : undefined,
          children.length > 0 ? children : undefined,
          {
            tagline: tagMatch ? tagMatch[1] : undefined,
            align: alignMatch ? (alignMatch[1] as 'left' | 'center' | 'right') : undefined,
            emphasis: emphMatch ? emphMatch[1] : undefined,
            density: densMatch ? densMatch[1] : undefined,
          }
        );
        heroEl.loc = {
          start: { line: tok.lineNum, column: 1 },
          end: { line: tok.lineNum, column: tok.text.length },
        };
        return { element: heroEl, nextIdx };
      }

      case 'callout': {
        const titleMatch = tok.args.match(/title=["']([^"']+)["']/);
        const sevMatch = tok.args.match(/\b(?:severity|variant)=["']?([^"'\s]+)["']?/);
        const iconMatch = tok.args.match(/\bicon=["']?([^"'\s]+)["']?/);
        let text = this.stripQuotes(
          tok.args
            .replace(/title=["'][^"']+["']/, '')
            .replace(/(?:severity|variant|icon)=["']?[^"'\s]+["']?/g, '')
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
          (sevMatch ? sevMatch[1] : 'info') as CalloutElement['severity'],
          titleMatch ? titleMatch[1] : undefined,
          iconMatch ? iconMatch[1] : undefined
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
          const childRes = this.parseElement(tokens, nextIdx, components);
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
            if (sDataMatch) {
              const vals = sDataMatch[1]!.split(',').map((v) => parseFloat(v.trim()) || 0);
              series.push({
                name: sNameMatch ? sNameMatch[1] : 'Series',
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
            const nIdMatch = nParts.match(/^(\S+)/);
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

      case 'compare': {
        const leftTitleMatch = tok.args.match(/\bleft(?:Title)?=["']([^"']+)["']/);
        const rightTitleMatch = tok.args.match(/\bright(?:Title)?=["']([^"']+)["']/);
        const leftTitle = leftTitleMatch ? leftTitleMatch[1] : undefined;
        const rightTitle = rightTitleMatch ? rightTitleMatch[1] : undefined;

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
            const dateMatch = sub.args.match(/date=["']([^"']+)["']/);
            const titleMatch = sub.args.match(/title=["']([^"']+)["']/);
            const descMatch = sub.args.match(/desc(?:ription)?=["']([^"']+)["']/);
            items.push({
              date: dateMatch ? dateMatch[1]! : '2026',
              title: titleMatch ? titleMatch[1]! : 'Milestone',
              description: descMatch ? descMatch[1] : undefined,
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
