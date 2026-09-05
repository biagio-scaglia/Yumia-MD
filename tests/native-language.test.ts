import { describe, expect, it } from 'vitest';
import { parseNativeYumia, migrateMarkdownToNative } from '@yumiamd/parser';
import { defaultIconResolver } from '@yumiamd/renderer';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { YumiaCompiler } from '@yumiamd/core';

describe('Yumia Native Proprietary Language & Style Architecture', () => {
  const nativeSample = `
document "Proprietary Yumia Presentation"
  theme "cyberpunk"
  author "Compiler Team"
  aspectRatio "16:9"
  transition "zoom"

slide "Welcome to Native Yumia"
  heading "Next-Gen Document Language"
  text "A clean, deterministic, AI-first declarative language for documents and decks."
  badge "v2.0" variant="accent"
  
slide "Architecture & Components"
  grid columns=3 gap=20
    card title="Unified AST" variant="primary"
      icon "lucide:layers" size=32
      text "Decoupled representation"
    card title="Icon Resolver" variant="success"
      icon "material:rocket" size=32
      text "Multi-provider abstraction"
    card title="Multi-Renderer" variant="accent"
      icon "fa:shield" size=32
      text "HTML5, PPTX, Vector PDF"

slide "Key Metrics"
  stack direction="horizontal" gap=16
    metric "100%" label="Backward Compatible" diff="+15%"
    metric "0.5ms" label="Parse Latency" diff="-40%"
`;

  it('should parse Native Yumia language syntax into unified AST', () => {
    const ast = parseNativeYumia(nativeSample);
    expect(ast.metadata.title).toBe('Proprietary Yumia Presentation');
    expect(ast.metadata.theme).toBe('cyberpunk');
    expect(ast.metadata.aspectRatio).toBe('16:9');
    expect(ast.slides).toHaveLength(3);

    const slide2 = ast.slides[1]!;
    expect(slide2.elements.some((el) => el.type === 'grid')).toBe(true);

    const slide3 = ast.slides[2]!;
    expect(slide3.elements.some((el) => el.type === 'stack')).toBe(true);
  });

  it('should resolve icons across Lucide, Material, FontAwesome, Tabler, and Custom', () => {
    const lucideRocket = defaultIconResolver.resolve('lucide:rocket');
    expect(lucideRocket.provider).toBe('lucide');
    expect(lucideRocket.path).toContain('<path');

    const materialShield = defaultIconResolver.resolve('material:shield');
    expect(materialShield.provider).toBe('material');

    const customIcon = defaultIconResolver.resolve('custom-unknown-glyph');
    expect(customIcon.viewBox).toBe('0 0 24 24');

    const svgOutput = defaultIconResolver.toSvg('lucide:rocket', 28, '#00f0ff');
    expect(svgOutput).toContain('<svg class="yumia-icon"');
    expect(svgOutput).toContain('width="28"');
    expect(svgOutput).toContain('#00f0ff');
  });

  it('should migrate legacy Yumia Markdown (.yumia.md) into Native Yumia (.yumia)', () => {
    const mdSource = `---
title: "Legacy Presentation"
theme: "corporate"
---

# Introduction

Welcome to the deck.

:::card Title="Card Title" variant="primary"
Card body text.
:::

:::metric value="99.9%" label="Uptime" diff="+0.2%"
:::
`;
    const nativeCode = migrateMarkdownToNative(mdSource);
    expect(nativeCode).toContain('document "Legacy Presentation"');
    expect(nativeCode).toContain('theme "corporate"');
    expect(nativeCode).toContain('slide "Introduction"');
    expect(nativeCode).toContain('card title="Card Title" variant="primary"');
    expect(nativeCode).toContain('metric "99.9%" label="Uptime" diff="+0.2%"');

    // Verify roundtrip parsing of migrated native code
    const reloadedAst = parseNativeYumia(nativeCode);
    expect(reloadedAst.metadata.title).toBe('Legacy Presentation');
    expect(reloadedAst.slides.length).toBeGreaterThan(0);
  });

  it('should compile Native Yumia AST across HTML, PPTX, and Vector PDF targets', async () => {
    const compiler = new YumiaCompiler();
    const ast = parseNativeYumia(nativeSample);

    const htmlRenderer = new HtmlRenderer();
    const htmlResult = await compiler.render(ast, htmlRenderer);
    expect(htmlResult.format).toBe('html');
    expect(htmlResult.html).toContain('yumia-grid');
    expect(htmlResult.html).toContain('yumia-stack');
    expect(htmlResult.html).toContain('yumia-icon');

    const pptxRenderer = new PptxRenderer();
    const pptxResult = await compiler.render(ast, pptxRenderer);
    expect(pptxResult.format).toBe('pptx');
    expect(pptxResult.data).toBeDefined();

    const pdfRenderer = new PdfRenderer();
    const pdfResult = await compiler.render(ast, pdfRenderer);
    expect(pdfResult.format).toBe('pdf');
    expect(pdfResult.data.length).toBeGreaterThan(100);
  });
});
