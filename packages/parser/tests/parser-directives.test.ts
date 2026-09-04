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

  it('should parse blockquotes (>)', () => {
    const source = `
# Quotes Slide

> YumiaMD is a Markdown-based presentation compiler.
`;

    const presentation = parseYumia(source);
    const quote = presentation.slides[0]?.elements[1] as QuoteElement;
    expect(quote.type).toBe('quote');
    expect(quote.text).toBe('YumiaMD is a Markdown-based presentation compiler.');
  });
});
