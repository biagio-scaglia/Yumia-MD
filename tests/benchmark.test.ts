import { describe, expect, it } from 'vitest';
import { YumiaCompiler, parse } from '../packages/core/src/index';
import { HtmlRenderer } from '../packages/renderer-html/src/index';
import { PdfRenderer } from '../packages/renderer-pdf/src/index';
import { PptxRenderer } from '../packages/renderer-pptx/src/index';

function generateBenchmarkMarkdown(slideCount: number): string {
  const slides: string[] = [
    `---
title: Large Benchmark Presentation (${slideCount} Slides)
theme: cyberpunk
author: Yumia Benchmark Suite
---

# Benchmark Root Slide

Deterministic stress test for large compilation workloads.
`,
  ];

  for (let i = 1; i < slideCount; i++) {
    const slideType = i % 5;
    if (slideType === 0) {
      // Columns + Card
      slides.push(`---

# Architecture Module ${i}

:::columns ratios="50:50"

:::column
:::card Engine Core ${i}
- 100% Deterministic execution
- Memory isolation
- High-throughput parser
:::
:::

:::column
:::card Metrics ${i}
- Benchmark run: ${i}
- Performance target: < 10ms
- Zero memory leakage
:::
:::

:::
`);
    } else if (slideType === 1) {
      // Table
      slides.push(`---

# Data Summary ${i}

| Metric | Target | Actual | Delta |
| :--- | :--- | :--- | :--- |
| Parsing Speed | 1000 ops/s | 1450 ops/s | +45% |
| Memory Peak | < 50MB | 18MB | -64% |
| Throughput | 500 slides/s | 820 slides/s | +64% |
`);
    } else if (slideType === 2) {
      // Chart
      slides.push(`---

# Throughput Benchmark ${i}

:::chart type="bar" title="Performance Analysis ${i}" labels="AST, Layout, PDF, PPTX" data="120, 85, 43, 68"

:::notes
Speaker note for slide ${i} with deterministic metadata.
:::
`);
    } else if (slideType === 3) {
      // Timeline & Badges
      slides.push(`---

# Timeline Phase ${i}

:::badge text="MILESTONE ${i}" variant="primary" :::
:::badge text="ACTIVE" variant="success" :::

:::timeline layout="horizontal"
- [Phase A] Initialization of Slide ${i}
- [Phase B] Geometric Layout Computation
- [Phase C] Output Serialization
:::
`);
    } else {
      // Comparison & Steps
      slides.push(`---

# Comparison Grid ${i}

:::compare left="Standard Engine" right="YumiaMD Compiler"
- Slower compilation
- Fragmented outputs
:::vs
- Unified AST pipeline
- Multi-format generation
:::

:::step
- Progressive reveal step element for slide ${i}
:::
`);
    }
  }

  return slides.join('\n');
}

describe('Full-System Stress & Performance Benchmarks', () => {
  const compiler = new YumiaCompiler();
  const htmlRenderer = new HtmlRenderer();
  const pdfRenderer = new PdfRenderer();
  const pptxRenderer = new PptxRenderer();

  const scenarios = [1, 10, 50, 100, 250];

  for (const count of scenarios) {
    it(`should compile ${count} slides across HTML, PDF, and PPTX with high throughput`, async () => {
      const markdown = generateBenchmarkMarkdown(count);

      // Measure Parse
      const tParseStart = performance.now();
      const ast = parse(markdown);
      const parseDurationMs = performance.now() - tParseStart;

      expect(ast.slides.length).toBe(count);
      expect(parseDurationMs).toBeLessThan(1500);

      // Measure HTML Compilation
      const tHtmlStart = performance.now();
      const htmlRes = await compiler.compile(markdown, htmlRenderer);
      const htmlDurationMs = performance.now() - tHtmlStart;

      expect(htmlRes.html).toBeDefined();
      expect(htmlRes.html.length).toBeGreaterThan(100);

      // Measure PDF Compilation
      const tPdfStart = performance.now();
      const pdfRes = await compiler.compile(markdown, pdfRenderer);
      const pdfDurationMs = performance.now() - tPdfStart;

      expect(pdfRes.data).toBeDefined();
      expect(pdfRes.data.length).toBeGreaterThan(100);

      // Measure PPTX Compilation
      const tPptxStart = performance.now();
      const pptxRes = await compiler.compile(markdown, pptxRenderer);
      const pptxDurationMs = performance.now() - tPptxStart;

      expect(pptxRes.data).toBeDefined();

      const totalDurationMs = parseDurationMs + htmlDurationMs + pdfDurationMs + pptxDurationMs;

      // Output benchmark stats
      console.log(
        `[BENCHMARK ${count} SLIDES] Parse: ${parseDurationMs.toFixed(1)}ms | HTML: ${htmlDurationMs.toFixed(1)}ms | PDF: ${pdfDurationMs.toFixed(1)}ms | PPTX: ${pptxDurationMs.toFixed(1)}ms | Total: ${totalDurationMs.toFixed(1)}ms`
      );
    }, 30000);
  }
});
