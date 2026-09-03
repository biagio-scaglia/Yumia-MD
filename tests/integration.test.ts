import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CardElement,
  ColumnsElement,
  HeadingElement,
  ListElement,
  ParagraphElement,
} from '@yumia/ast';
import { parseYumia } from '@yumia/parser';
import { YumiaCompiler } from '@yumia/core';
import { PptxRenderer } from '@yumia/renderer-pptx';

describe('Integration: Example Presentation', () => {
  it('should parse examples/basic/presentation.yumia.md accurately into AST', () => {
    const examplePath = path.resolve(__dirname, '../examples/basic/presentation.yumia.md');
    const source = readFileSync(examplePath, 'utf-8');

    const presentation = parseYumia(source);

    // Frontmatter check
    expect(presentation.metadata.title).toBe('HomuraJS');
    expect(presentation.metadata.theme).toBe('default');

    // Slides count: 3 slides
    expect(presentation.slides).toHaveLength(3);

    // Slide 1: HomuraJS
    const slide1 = presentation.slides[0];
    expect(slide1?.elements).toHaveLength(2);
    expect((slide1?.elements[0] as HeadingElement).text).toBe('HomuraJS');
    expect((slide1?.elements[1] as ParagraphElement).text).toBe(
      'Version Control for Application State.'
    );
    expect(slide1?.notes).toContain('Introduce HomuraJS');

    // Slide 2: The Problem
    const slide2 = presentation.slides[1];
    expect(slide2?.elements).toHaveLength(3);
    expect((slide2?.elements[0] as HeadingElement).text).toBe('The Problem');
    expect((slide2?.elements[1] as ParagraphElement).text).toBe(
      'Application state can become difficult to understand and debug.'
    );
    const list = slide2?.elements[2] as ListElement;
    expect(list.type).toBe('list');
    expect(list.items).toHaveLength(3);
    expect(list.items[0]?.text).toBe('Complex state transitions');
    expect(list.items[1]?.text).toBe('Difficult debugging');
    expect(list.items[2]?.text).toBe('Lost state history');

    // Slide 3: The Solution with Columns and Cards
    const slide3 = presentation.slides[2];
    expect(slide3?.elements).toHaveLength(2);
    expect((slide3?.elements[0] as HeadingElement).text).toBe('The Solution');

    const columns = slide3?.elements[1] as ColumnsElement;
    expect(columns.type).toBe('columns');
    expect(columns.ratios).toBe('50:50');
    expect(columns.columns).toHaveLength(2);

    const col1 = columns.columns[0];
    const card1 = col1?.elements[0] as CardElement;
    expect(card1.type).toBe('card');
    expect(card1.title).toBe('Before');

    const col2 = columns.columns[1];
    const card2 = col2?.elements[0] as CardElement;
    expect(card2.type).toBe('card');
    expect(card2.title).toBe('After');

    expect(slide3?.notes).toContain('deterministic timeline replay');
  });

  it('should compile the example presentation via core compiler', async () => {
    const examplePath = path.resolve(__dirname, '../examples/basic/presentation.yumia.md');
    const source = readFileSync(examplePath, 'utf-8');

    const compiler = new YumiaCompiler();
    const pptxRenderer = new PptxRenderer();
    const result = await compiler.compile(source, pptxRenderer);

    expect(result.slideCount).toBe(3);
  });
});
