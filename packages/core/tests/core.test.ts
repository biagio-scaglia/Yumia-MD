import { describe, expect, it } from 'vitest';
import { YumiaCompiler } from '../src/index.js';
import { PptxRenderer } from '@biagioscaglia/yumia-renderer-pptx';
import { HtmlRenderer } from '@biagioscaglia/yumia-renderer-html';

describe('@biagioscaglia/yumia-core', () => {
  it('should orchestrate the compile pipeline end-to-end', async () => {
    const source = `---
title: Test Presentation
---

# Slide 1
Intro content.
`;

    const compiler = new YumiaCompiler();
    const pptxRenderer = new PptxRenderer();
    const htmlRenderer = new HtmlRenderer();

    const pptxOutput = await compiler.compile(source, pptxRenderer);
    expect(pptxOutput.format).toBe('pptx');
    expect(pptxOutput.slideCount).toBe(1);

    const htmlOutput = await compiler.compile(source, htmlRenderer);
    expect(htmlOutput.format).toBe('html');
    expect(htmlOutput.html).toContain('Test Presentation');
  });
});
