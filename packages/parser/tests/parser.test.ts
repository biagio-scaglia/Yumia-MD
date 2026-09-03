import { describe, expect, it } from 'vitest';
import { DefaultYumiaParser, parseYumia } from '../src/index.js';
import { HeadingElement, ListElement, ParagraphElement } from '@biagioscaglia/yumia-ast';

describe('@biagioscaglia/yumia-parser', () => {
  it('should parse frontmatter metadata and slide separation', () => {
    const source = `---
title: Test Deck
author: Biagio
theme: default
---

# Slide 1
First slide content.

---

# Slide 2
Second slide content.
`;

    const parser = new DefaultYumiaParser();
    const presentation = parser.parse(source);

    expect(presentation.metadata.title).toBe('Test Deck');
    expect(presentation.metadata.author).toBe('Biagio');
    expect(presentation.metadata.theme).toBe('default');
    expect(presentation.slides).toHaveLength(2);

    const slide1Heading = presentation.slides[0]?.elements[0] as HeadingElement;
    expect(slide1Heading.type).toBe('heading');
    expect(slide1Heading.text).toBe('Slide 1');
    expect(slide1Heading.level).toBe(1);

    const slide1Paragraph = presentation.slides[0]?.elements[1] as ParagraphElement;
    expect(slide1Paragraph.type).toBe('paragraph');
    expect(slide1Paragraph.text).toBe('First slide content.');
  });

  it('should parse bullet lists correctly', () => {
    const source = `
# Features
- Modular AST
- Pluggable layout
- Native PPTX
`;

    const presentation = parseYumia(source);
    expect(presentation.slides).toHaveLength(1);

    const slide = presentation.slides[0];
    expect(slide?.elements).toHaveLength(2);

    const list = slide?.elements[1] as ListElement;
    expect(list.type).toBe('list');
    expect(list.ordered).toBe(false);
    expect(list.items).toHaveLength(3);
    expect(list.items[0]?.text).toBe('Modular AST');
    expect(list.items[1]?.text).toBe('Pluggable layout');
    expect(list.items[2]?.text).toBe('Native PPTX');
  });

  it('should parse multiple heading levels', () => {
    const source = `
# Title
## Subtitle
### Section
`;

    const presentation = parseYumia(source);
    const elements = presentation.slides[0]?.elements as HeadingElement[];

    expect(elements).toHaveLength(3);
    expect(elements[0]?.level).toBe(1);
    expect(elements[1]?.level).toBe(2);
    expect(elements[2]?.level).toBe(3);
  });
});
