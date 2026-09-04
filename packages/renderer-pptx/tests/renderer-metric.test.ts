import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { cyberpunkTheme } from '@yumiamd/theme';
import { PptxRenderer } from '../src/index.js';

describe('PptxRenderer Metric & Theming', () => {
  it('renders a presentation with metrics, cards, and theme into valid PPTX buffer', async () => {
    const source = `---
title: Cyberpunk Metrics Deck
theme: cyberpunk
aspectRatio: "16:9"
---

# Performance Indicators

:::columns ratios="50:50"

:::column
:::metric value="1.2ms" label="Latency" change="-18%" variant="success"
:::

:::column
:::card System Status variant="warning"
- CPU load within normal limits
- All nodes synchronized
:::
:::

:::
`;

    const presentation = parseYumia(source);
    const renderer = new PptxRenderer();
    const result = await renderer.render(presentation, { theme: cyberpunkTheme });

    expect(result.format).toBe('pptx');
    expect(result.slideCount).toBe(1);
    expect(result.data.length).toBeGreaterThan(1000);
  });
});
