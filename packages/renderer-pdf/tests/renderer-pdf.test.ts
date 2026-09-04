import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { cyberpunkTheme } from '@yumiamd/theme';
import { PdfRenderer } from '../src/index.js';

describe('PdfRenderer', () => {
  it('compiles a presentation to a valid vector PDF document', async () => {
    const source = `---
title: Vector PDF Presentation
theme: cyberpunk
aspectRatio: "16:9"
---

# Vector Performance
High-resolution vector slide rendering for print & digital distribution.

:::columns ratios="50:50"

:::column
:::metric value="60 FPS" label="Smoothness" change="+12%" variant="success"
:::
:::

:::column
:::card Vector Engine variant="info"
- Crisp typography at any zoom level
- Vector shapes and native lines
- Zero rasterization artifacts
:::
:::

:::

---

# Data & Statistics

| Metric | Target | Actual |
| --- | --- | --- |
| Latency | < 50ms | 12ms |
| Memory | < 100MB | 45MB |
| PDF Size | < 200KB | 48KB |

:::quote author="Compiler Team"
Native vectors guarantee pixel-perfect presentation exports.
:::
`;

    const presentation = parseYumia(source);
    const renderer = new PdfRenderer();
    const result = await renderer.render(presentation, {
      theme: cyberpunkTheme,
    });

    expect(result.format).toBe('pdf');
    expect(result.pageCount).toBe(2);
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes "%PDF-"
    const header = Buffer.from(result.data.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
