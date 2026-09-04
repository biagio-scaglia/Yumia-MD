import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { cyberpunkTheme } from '@yumiamd/theme';
import { HtmlRenderer } from '../src/index.js';

describe('HtmlRenderer', () => {
  it('compiles a presentation to standalone interactive HTML deck', async () => {
    const source = `---
title: HTML Test Deck
theme: cyberpunk
aspectRatio: "16:9"
---

# Live Web Deck
Interactive presentation compiled from Markdown.

:::columns ratios="50:50"

:::column
:::metric value="99.9%" label="Availability" change="+0.4%" variant="success"
:::

:::column
:::card Status variant="info"
- Fast compilation
- Instant Hot-Reload
:::
:::

:::

:::notes
Speaker notes for slide 1.
:::
`;

    const presentation = parseYumia(source);
    const renderer = new HtmlRenderer();
    const result = await renderer.render(presentation, {
      theme: cyberpunkTheme,
      options: { liveReload: true, liveReloadPort: 3000 },
    });

    expect(result.format).toBe('html');
    expect(result.slideCount).toBe(1);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('HTML Test Deck');
    expect(result.html).toContain('--yumia-primary: #FF2E88');
    expect(result.html).toContain('yumia-metric');
    expect(result.html).toContain('99.9%');
    expect(result.html).toContain('Speaker notes for slide 1.');
    expect(result.html).toContain('__yumia_live_reload');
    expect(result.html).toContain('btn-speaker');
    expect(result.html).toContain('btn-overview');
    expect(result.html).toContain('speaker-layout');
    expect(result.html).toContain('yumia_presentation_sync');
  });

  it('supports custom icon libraries, styles, and multi-library shortcodes', async () => {
    const source = `---
title: Custom Icons Deck
icons:
  - lucide
  - remixicon
  - https://cdn.example.com/custom-icons.css
styles:
  - https://cdn.example.com/custom-theme.css
scripts:
  - https://cdn.example.com/custom-analytics.js
---

# :lucide-zap: Lucide Spark :ri-rocket-line:
With :fa-shield: Font Awesome and custom <i class="bi bi-star"></i> and <span class="material-symbols-outlined">settings</span>
`;

    const presentation = parseYumia(source);
    const renderer = new HtmlRenderer();
    const result = await renderer.render(presentation);

    expect(result.html).toContain('https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.css');
    expect(result.html).toContain('https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css');
    expect(result.html).toContain('https://cdn.example.com/custom-icons.css');
    expect(result.html).toContain('https://cdn.example.com/custom-theme.css');
    expect(result.html).toContain('https://cdn.example.com/custom-analytics.js');
    expect(result.html).toContain('<i class="lucide lucide-zap"></i>');
    expect(result.html).toContain('<i class="ri-rocket-line"></i>');
    expect(result.html).toContain('<i class="fa-solid fa-shield"></i>');
    expect(result.html).toContain('<i class="bi bi-star"></i>');
    expect(result.html).toContain('<span class="material-symbols-outlined">settings</span>');
  });
});
