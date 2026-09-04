import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { DefaultLayoutEngine } from '@yumiamd/layout';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { YumiaCompiler } from '@yumiamd/core';
import { runCli } from '../packages/cli/src/cli.js';

describe('Edge Cases & Fuzz Hardening Suite', () => {
  it('handles empty input, whitespace, and nullish strings gracefully without throwing', () => {
    const emptyResult = parseYumia('');
    expect(emptyResult.slides).toEqual([]);

    const whitespaceResult = parseYumia('   \n\n\t  \n  ');
    expect(whitespaceResult.slides).toEqual([]);
  });

  it('handles massive 1,000-slide presentation deterministically within sub-second time', () => {
    const slideChunk = `---
# Slide Title
Paragraph body text detailing deterministic compiler architecture.
:::notes
Speaker note.
:::
`;
    const hugeDoc = `---\ntitle: Benchmark\n---\n` + slideChunk.repeat(1000);
    const start = performance.now();
    const presentation = parseYumia(hugeDoc);
    const duration = performance.now() - start;

    expect(presentation.slides.length).toBeGreaterThanOrEqual(1000);
    expect(duration).toBeLessThan(1000); // must parse 1,000 slides in < 1s
  });

  it('handles full Unicode, Emojis, Chinese, and Arabic RTL correctly', () => {
    const unicodeMarkdown = `---
title: "🌐 Global Multilingual Presentation 🚀"
---

# 🚀 高性能状态机 — HomuraJS
Deterministic reactive workflows with 100% type safety.

---

# العمارة والقدرات (Architecture in Arabic)
:::card 💡 ميزات النظام
- 100% تنفيذ حتمي
- دعم كامل لـ Unicode ו-Emoji 🎉
:::
`;

    const presentation = parseYumia(unicodeMarkdown);
    expect(presentation.slides).toHaveLength(2);

    const engine = new DefaultLayoutEngine();
    const layout = engine.computePresentation(presentation);
    expect(layout.slides).toHaveLength(2);
    expect(layout.slides[0]?.nodes.length).toBeGreaterThan(0);
  });

  it('correctly handles deeply nested blocks without premature column closure (Fix for P0 Bug)', () => {
    const nestedMarkdown = `
# Nested Column & Card Test

:::columns ratios="50:50"

:::column
:::card Core Engine
- Line 1
- Line 2
:::
:::

:::column
:::card Compiler Targets
- Line 3
- Line 4
:::
:::

:::
`;

    const presentation = parseYumia(nestedMarkdown);
    expect(presentation.slides).toHaveLength(1);
    const slide = presentation.slides[0]!;
    expect(slide.elements).toHaveLength(2); // Heading + Columns
    const columnsEl = slide.elements[1];
    expect(columnsEl?.type).toBe('columns');
    if (columnsEl?.type === 'columns') {
      expect(columnsEl.columns).toHaveLength(2);
      expect(columnsEl.columns[0]?.elements).toHaveLength(1);
      expect(columnsEl.columns[0]?.elements[0]?.type).toBe('card');
      expect(columnsEl.columns[1]?.elements).toHaveLength(1);
      expect(columnsEl.columns[1]?.elements[0]?.type).toBe('card');
    }
  });

  it('recovers gracefully from unclosed code blocks and unclosed directives', () => {
    const brokenMarkdown = `
# Slide with unclosed blocks

\`\`\`typescript
const broken = 1;
// no closing code fence

---

:::card Broken Card
- item 1
// no closing directive
`;

    const presentation = parseYumia(brokenMarkdown);
    expect(presentation.slides.length).toBeGreaterThanOrEqual(1);
    expect(presentation.diagnostics).toBeDefined();
    expect(presentation.diagnostics?.length).toBeGreaterThan(0);
  });

  it('runs compiler validation and schema export', () => {
    const compiler = new YumiaCompiler();
    const validation = compiler.validate('# Valid Slide\nHello world');
    expect(validation.valid).toBe(true);
    expect(validation.slideCount).toBe(1);

    const schema = compiler.getSchema();
    expect(schema).toBeDefined();
    expect(schema['$schema']).toBe('http://json-schema.org/draft-07/schema#');
  });

  it('executes CLI schema and help commands successfully', async () => {
    const helpResult = await runCli(['node', 'yumia', '--help']);
    expect(helpResult.exitCode).toBe(0);
    expect(helpResult.output).toContain('YumiaMD — Markdown-based presentation compiler');

    const schemaResult = await runCli(['node', 'yumia', 'schema']);
    expect(schemaResult.exitCode).toBe(0);
    const parsedSchema = JSON.parse(schemaResult.output);
    expect(parsedSchema.title).toBe('YumiaMDPresentation');
  });

  it('compiles presentation with tables to PPTX buffer successfully', async () => {
    const markdown = `---
title: Table Test
---

# Benchmark Results

| Compiler | Build Time | Memory |
| --- | --- | --- |
| YumiaMD | 12ms | 24MB |
| Legacy | 120ms | 180MB |
`;

    const compiler = new YumiaCompiler();
    const renderer = new PptxRenderer();
    const result = await compiler.compile(markdown, renderer);

    expect(result.slideCount).toBe(1);
    expect(result.data.byteLength).toBeGreaterThan(1000);
  });
});
