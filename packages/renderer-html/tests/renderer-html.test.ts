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

  it('supports custom stylesheets and scripts in frontmatter', async () => {
    const source = `---
title: Custom Styles Deck
styles:
  - https://cdn.example.com/custom-theme.css
scripts:
  - https://cdn.example.com/custom-analytics.js
---

# Custom Scripts Deck
Testing custom stylesheets and scripts injection.
`;

    const presentation = parseYumia(source);
    const renderer = new HtmlRenderer();
    const result = await renderer.render(presentation);

    expect(result.html).toContain('https://cdn.example.com/custom-theme.css');
    expect(result.html).toContain('https://cdn.example.com/custom-analytics.js');
  });

  it('renders section dividers, table of contents, code line highlights and print button', async () => {
    const source = `---
title: Features Deck
---

:::section "Part 1: Engine Architecture" subtitle="Deep dive" number="01"
:::

---

:::toc "Agenda"
1. Architecture - Core AST
2. Code Highlighting - Line Steps
:::

---

# Code Highlight Demo

\`\`\`typescript {2}
const a = 1;
const b = 2; // highlighted
const c = 3;
\`\`\`
`;

    const presentation = parseYumia(source);
    const renderer = new HtmlRenderer();
    const result = await renderer.render(presentation);

    expect(result.slideCount).toBe(3);
    // Section check
    expect(result.html).toContain('yumia-section-card');
    expect(result.html).toContain('Part 1: Engine Architecture');
    expect(result.html).toContain('SECTION 01');

    // TOC check
    expect(result.html).toContain('yumia-toc-grid');
    expect(result.html).toContain('Architecture');

    // Code line highlight check
    expect(result.html).toContain('yumia-code-line highlighted');
    expect(result.html).toContain('yumia-code-line dimmed');

    // Print button & print media check
    expect(result.html).toContain('btn-print');
    expect(result.html).toContain('@media print');
  });
});
