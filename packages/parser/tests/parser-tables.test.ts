import { describe, expect, it } from 'vitest';
import { parseYumia } from '../src/parser.js';
import { TableElement } from '@yumiamd/ast';

describe('Parser - Markdown Tables', () => {
  it('parses standard markdown table with headers', () => {
    const markdown = `
# Feature Matrix

| Feature | YumiaMD | Legacy Tools |
| --- | --- | --- |
| Native PPTX | Yes | No |
| Clean Markdown | Yes | No |
| Deterministic Layout | Yes | No |
`;

    const presentation = parseYumia(markdown);
    expect(presentation.slides).toHaveLength(1);

    const slide = presentation.slides[0]!;
    expect(slide.elements).toHaveLength(2);

    const table = slide.elements[1] as TableElement;
    expect(table.type).toBe('table');
    expect(table.headers).toEqual(['Feature', 'YumiaMD', 'Legacy Tools']);
    expect(table.rows).toHaveLength(3);
    expect(table.rows[0]).toEqual(['Native PPTX', 'Yes', 'No']);
    expect(table.rows[1]).toEqual(['Clean Markdown', 'Yes', 'No']);
    expect(table.rows[2]).toEqual(['Deterministic Layout', 'Yes', 'No']);
  });

  it('handles tables within columns and cards', () => {
    const markdown = `
# Comparison

:::columns
:::column
:::card Comparison Data
| Metric | Value |
| --- | --- |
| Speed | 10ms |
:::
:::
:::
`;

    const presentation = parseYumia(markdown);
    expect(presentation.slides).toHaveLength(1);
    const slide = presentation.slides[0]!;
    expect(slide.elements).toHaveLength(2);
  });
});
