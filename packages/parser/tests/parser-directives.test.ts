import { describe, expect, it } from 'vitest';
import { parseYumia } from '../src/index.js';
import {
  CardElement,
  CodeElement,
  ColumnsElement,
  HeadingElement,
  ImageElement,
  QuoteElement,
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
    const chart = presentation.slides[0]?.elements[1] as any;
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
    const mermaid = presentation.slides[0]?.elements[1] as any;
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
    const timeline = presentation.slides[0]?.elements[1] as any;
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
    const compare = presentation.slides[0]?.elements[1] as any;
    expect(compare.type).toBe('compare');
    expect(compare.leftTitle).toBe('Traditional Tools');
    expect(compare.rightTitle).toBe('YumiaMD');
    expect(compare.left).toHaveLength(1);
    expect(compare.right).toHaveLength(1);
  });

  it('should parse :::badge element', () => {
    const source = `
# Version Info
:::badge text="v0.1.15" variant="success"
`;
    const presentation = parseYumia(source);
    const badge = presentation.slides[0]?.elements[1] as any;
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
    const stepList = presentation.slides[0]?.elements[2] as any;
    expect(stepList.type).toBe('list');
    expect(stepList.step).toBe(1);
  });
});

