import { describe, expect, it } from 'vitest';
import { parseYumia } from '../src/index.js';
import {
  BadgeElement,
  CardElement,
  ChartElement,
  CodeElement,
  ColumnsElement,
  CompareElement,
  HeadingElement,
  ImageElement,
  ListElement,
  MathElement,
  MermaidElement,
  SectionElement,
  TimelineElement,
  TocElement,
} from '@yumiamd/ast';

describe('Parser Directives & Semantic Elements', () => {
  it('should parse :::card blocks with title and children', () => {
    const source = `
# Slide with Card

:::card Architecture Overview
Here is the core compiler design.
- Separation of concerns
- Native output
:::
`;

    const presentation = parseYumia(source);
    expect(presentation.slides).toHaveLength(1);

    const slide = presentation.slides[0];
    expect(slide?.elements).toHaveLength(2);

    const card = slide?.elements[1] as CardElement;
    expect(card.type).toBe('card');
    expect(card.title).toBe('Architecture Overview');
    expect(card.elements).toHaveLength(2);
    expect(card.elements[0]?.type).toBe('paragraph');
    expect(card.elements[1]?.type).toBe('list');
  });

  it('should parse :::columns and :::column blocks', () => {
    const source = `
# Two Columns Slide

:::columns ratios="40:60"

:::column
## Left Side
- Fast
- Type-safe
:::

:::column
## Right Side
Detailed explanation paragraph.
:::

:::
`;

    const presentation = parseYumia(source);
    const slide = presentation.slides[0];
    const columnsElement = slide?.elements[1] as ColumnsElement;

    expect(columnsElement.type).toBe('columns');
    expect(columnsElement.ratios).toBe('40:60');
    expect(columnsElement.columns).toHaveLength(2);

    const leftCol = columnsElement.columns[0];
    expect(leftCol?.elements[0]?.type).toBe('heading');
    expect((leftCol?.elements[0] as HeadingElement).text).toBe('Left Side');
    expect(leftCol?.elements[1]?.type).toBe('list');

    const rightCol = columnsElement.columns[1];
    expect(rightCol?.elements[0]?.type).toBe('heading');
    expect(rightCol?.elements[1]?.type).toBe('paragraph');
  });

  it('should parse :::notes as slide speaker notes', () => {
    const source = `
# Slide Title
Slide content here.

:::notes
Remember to emphasize the native OpenXML generation advantages.
:::
`;

    const presentation = parseYumia(source);
    const slide = presentation.slides[0];

    expect(slide?.elements).toHaveLength(2);
    expect(slide?.notes).toBe('Remember to emphasize the native OpenXML generation advantages.');
  });

  it('should parse code blocks and images correctly', () => {
    const source = `
# Code Sample

\`\`\`typescript
const compiler = new YumiaCompiler();
\`\`\`

![Preview](https://example.com/demo.png "Sample Image")
`;

    const presentation = parseYumia(source);
    const elements = presentation.slides[0]?.elements;

    const code = elements?.[1] as CodeElement;
    expect(code.type).toBe('code');
    expect(code.language).toBe('typescript');
    expect(code.code).toBe('const compiler = new YumiaCompiler();');

    const img = elements?.[2] as ImageElement;
    expect(img.type).toBe('image');
    expect(img.src).toBe('https://example.com/demo.png');
    expect(img.caption).toBe('Sample Image');
  });

  it('should parse :::chart directive with bar, line, or pie type', () => {
    const source = `
# Analytics Slide

:::chart type="bar" title="Quarterly Growth" labels="Q1, Q2, Q3, Q4" data="120, 240, 380, 520"
:::
`;
    const presentation = parseYumia(source);
    const chart = presentation.slides[0]?.elements[1] as ChartElement;
    expect(chart.type).toBe('chart');
    expect(chart.chartType).toBe('bar');
    expect(chart.title).toBe('Quarterly Growth');
    expect(chart.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(chart.series[0]?.values).toEqual([120, 240, 380, 520]);
  });

  it('should parse :::mermaid diagram block', () => {
    const source = `
# Architecture Diagram

:::mermaid
graph LR
  A[Parser] --> B[AST] --> C[Renderer]
:::
`;
    const presentation = parseYumia(source);
    const mermaid = presentation.slides[0]?.elements[1] as MermaidElement;
    expect(mermaid.type).toBe('mermaid');
    expect(mermaid.code).toContain('A[Parser] --> B[AST]');
  });

  it('should parse :::timeline directive with milestone items', () => {
    const source = `
# Project Roadmap

:::timeline layout="horizontal"
- [2024-Q1] Architecture Design: Initial parser & AST specification
- [2024-Q2] Multi-Format Renderers: Native PPTX, PDF, and HTML
- [2024-Q3] Cloud Ecosystem: Zero-config deployment & templates
:::
`;
    const presentation = parseYumia(source);
    const timeline = presentation.slides[0]?.elements[1] as TimelineElement;
    expect(timeline.type).toBe('timeline');
    expect(timeline.layout).toBe('horizontal');
    expect(timeline.items).toHaveLength(3);
    expect(timeline.items[0]?.date).toBe('2024-Q1');
    expect(timeline.items[0]?.title).toBe('Architecture Design');
    expect(timeline.items[0]?.description).toBe('Initial parser & AST specification');
  });

  it('should parse :::compare directive with left and right columns', () => {
    const source = `
# Solution Comparison

:::compare left="Traditional Tools" right="YumiaMD"
- Manual GUI formatting
- Binary opaque files
:::vs
- Human & AI Markdown authoring
- Native editable PPTX output
:::
`;
    const presentation = parseYumia(source);
    const compare = presentation.slides[0]?.elements[1] as CompareElement;
    expect(compare.type).toBe('compare');
    expect(compare.leftTitle).toBe('Traditional Tools');
    expect(compare.rightTitle).toBe('YumiaMD');
    expect(compare.left).toHaveLength(1);
    expect(compare.right).toHaveLength(1);
  });

  it('should parse :::compare directive with nested :::column blocks', () => {
    const source = `
# Solution Comparison

:::compare
:::column
### ❌ Old Way
- Manual GUI
- Slow
:::
:::column
### 🚀 New Way
- Markdown code
- Instant
:::
:::
`;
    const presentation = parseYumia(source);
    const compare = presentation.slides[0]?.elements[1] as CompareElement;
    expect(compare.type).toBe('compare');
    expect(compare.left).toHaveLength(2);
    expect(compare.right).toHaveLength(2);
    expect(compare.left[0]?.type).toBe('heading');
    expect(compare.right[0]?.type).toBe('heading');
  });

  it('should parse :::badge element', () => {
    const source = `
# Version Info
:::badge text="v0.1.15" variant="success"
`;
    const presentation = parseYumia(source);
    const badge = presentation.slides[0]?.elements[1] as BadgeElement;
    expect(badge.type).toBe('badge');
    expect(badge.text).toBe('v0.1.15');
    expect(badge.variant).toBe('success');
  });

  it('should parse :::step blocks and assign step metadata', () => {
    const source = `
# Progressive Slide
Introduction text

:::step
- First point revealed
- Second point revealed
:::
`;
    const presentation = parseYumia(source);
    const stepList = presentation.slides[0]?.elements[2] as ListElement;
    expect(stepList.type).toBe('list');
    expect(stepList.step).toBe(1);
  });

  it('should parse :::math and $$ equation blocks', () => {
    const source = `
# Mathematics Slide

:::math
E = mc^2
:::

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;
    const presentation = parseYumia(source);
    expect(presentation.slides[0]?.elements).toHaveLength(3);
    expect(presentation.slides[0]?.elements[1]?.type).toBe('math');
    expect((presentation.slides[0]?.elements[1] as MathElement).expression).toBe('E = mc^2');
    expect(presentation.slides[0]?.elements[2]?.type).toBe('math');
    expect((presentation.slides[0]?.elements[2] as MathElement).expression).toContain('\\int');
  });

  it('should parse slide transitions, template, and embedFonts frontmatter', () => {
    const source = `---
title: Scientific Presentation
transition: push
template: corporate.potx
embedFonts: true
---

# Slide 1
:::transition type="fade" duration="1s"
Slide content

---

# Slide 2
Default transition from frontmatter
`;
    const presentation = parseYumia(source);
    expect(presentation.metadata.transition).toBe('push');
    expect(presentation.metadata.template).toBe('corporate.potx');
    expect(presentation.metadata.embedFonts).toBe(true);

    expect(presentation.slides[0]?.transition).toEqual({
      type: 'fade',
      duration: '1s',
    });
  });

  it('should parse :::section divider slides', () => {
    const source = `
:::section "Part 2: Compiler Architecture" subtitle="Deep dive into coordinates and layout geometry" number="02"
:::
`;
    const presentation = parseYumia(source);
    expect(presentation.slides).toHaveLength(1);
    const sec = presentation.slides[0]?.elements[0] as SectionElement;
    expect(sec.type).toBe('section');
    expect(sec.title).toBe('Part 2: Compiler Architecture');
    expect(sec.subtitle).toBe('Deep dive into coordinates and layout geometry');
    expect(sec.number).toBe('02');
  });

  it('should parse :::toc table of contents', () => {
    const source = `
:::toc "Table of Contents"
1. Introduction - Project goals
2. Architecture - AST and Renderers
3. Output - PPTX & PDF
:::
`;
    const presentation = parseYumia(source);
    expect(presentation.slides).toHaveLength(1);
    const toc = presentation.slides[0]?.elements[0] as TocElement;
    expect(toc.type).toBe('toc');
    expect(toc.title).toBe('Table of Contents');
    expect(toc.items).toHaveLength(3);
    expect(toc.items?.[0]?.number).toBe('1');
    expect(toc.items?.[0]?.title).toBe('Introduction');
    expect(toc.items?.[0]?.description).toBe('Project goals');
  });

  it('should parse code blocks with highlight range in markdown and directive', () => {
    const source = `
\`\`\`typescript {2,5-7}
import { compile } from 'yumiamd';
const source = '# Hello';
const result = await compile(source, { format: 'pptx' });
\`\`\`

:::code lang="typescript" highlight="2,5-7"
const x = 1;
const y = 2;
:::
`;
    const presentation = parseYumia(source);
    expect(presentation.slides[0]?.elements).toHaveLength(2);

    const code1 = presentation.slides[0]?.elements[0] as CodeElement;
    expect(code1.type).toBe('code');
    expect(code1.language).toBe('typescript');
    expect(code1.highlight).toBe('2,5-7');
    expect(code1.highlightLines).toEqual([2, 5, 6, 7]);

    const code2 = presentation.slides[0]?.elements[1] as CodeElement;
    expect(code2.type).toBe('code');
    expect(code2.language).toBe('typescript');
    expect(code2.highlight).toBe('2,5-7');
    expect(code2.highlightLines).toEqual([2, 5, 6, 7]);
  });
});
