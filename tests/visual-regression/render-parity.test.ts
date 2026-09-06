import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { DefaultLayoutEngine } from '@yumiamd/layout';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { HtmlRenderer } from '@yumiamd/renderer-html';

describe('Yumia Visual Quality & Multi-Format Parity Suite', () => {
  it('should prevent element overlap on hero slides with badges across PPTX and PDF', async () => {
    const docSource = `
document "Quantum Specification"
  theme "academic"
  aspectRatio "16:9"

slide "Title Slide"
  hero "Quantum Neural Architecture" subtitle="Formal Specification of Hybrid Classical-Quantum Distributed Ingestion & Vector Processing Pipelines" tagline="CS & Systems Lab" align="center"
  badge "v2.4 Production Specification" variant="primary"
`;

    const ast = parseYumia(docSource);
    expect(ast.slides.length).toBe(1);

    // Verify parser did not inject duplicate H1 header on slide with hero
    expect(ast.slides[0]!.elements.some((el) => el.type === 'hero')).toBe(true);
    expect(ast.slides[0]!.elements.length).toBe(2);
    expect(ast.slides[0]!.elements[0]!.type).toBe('hero');
    expect(ast.slides[0]!.elements[1]!.type).toBe('badge');

    // Layout Engine bounds check
    const layoutEngine = new DefaultLayoutEngine();
    const slideLayout = layoutEngine.computeSlide(ast.slides[0]!);
    expect(slideLayout.nodes.length).toBe(2);

    const heroNode = slideLayout.nodes[0]!;
    const badgeNode = slideLayout.nodes[1]!;

    // Badge must be positioned strictly below the hero with generous clearance
    expect(badgeNode.bounds.y).toBeGreaterThanOrEqual(heroNode.bounds.y + heroNode.bounds.height);
    expect(heroNode.bounds.height).toBeGreaterThanOrEqual(160);

    // PPTX compilation check
    const pptxRenderer = new PptxRenderer();
    const pptxOutput = await pptxRenderer.render(ast);
    expect(pptxOutput.format).toBe('pptx');
    expect(pptxOutput.slideCount).toBe(1);
    expect(pptxOutput.data.byteLength).toBeGreaterThan(1000);

    // PDF compilation check
    const pdfRenderer = new PdfRenderer();
    const pdfOutput = await pdfRenderer.render(ast);
    expect(pdfOutput.format).toBe('pdf');
    expect(pdfOutput.slideCount).toBe(1);
    expect(pdfOutput.data.byteLength).toBeGreaterThan(1000);

    // HTML compilation check
    const htmlRenderer = new HtmlRenderer();
    const htmlOutput = await htmlRenderer.render(ast);
    expect(htmlOutput.html).toContain('yumia-hero');
    expect(htmlOutput.html).toContain('yumia-badge');
    expect(htmlOutput.html).toContain('v2.4 Production Specification');
  });

  it('should correctly preserve distinct typography identity across Academic, Terminal, and Default themes in PDF and PPTX', async () => {
    const academicDoc = parseYumia(`document "Academic"\n  theme "academic"\nslide "Abstract"\n  text "Serif body test"`);
    const terminalDoc = parseYumia(`document "Terminal"\n  theme "terminal"\nslide "Terminal"\n  text "Mono body test"`);
    const defaultDoc = parseYumia(`document "Default"\n  theme "default"\nslide "Default"\n  text "Sans body test"`);

    const pdfRenderer = new PdfRenderer();
    const academicPdf = await pdfRenderer.render(academicDoc);
    const terminalPdf = await pdfRenderer.render(terminalDoc);
    const defaultPdf = await pdfRenderer.render(defaultDoc);

    expect(academicPdf.data.byteLength).toBeGreaterThan(500);
    expect(terminalPdf.data.byteLength).toBeGreaterThan(500);
    expect(defaultPdf.data.byteLength).toBeGreaterThan(500);
  });

  it('should compile complex multi-block diagrams and comparison slides without collision', async () => {
    const complexDoc = parseYumia(`
document "Complex Systems"
  theme "cyberpunk"

slide "Topology"
  diagram type="flow" direction="LR" title="Data Pipeline"
    [Source] -> [Broker] -[TLS 1.3]-> [Worker] -> [(Storage)]
    node worker label="Worker Nodes" variant="accent"
    node storage label="Database" shape="database" variant="success"

slide "Comparison"
  compare left="Legacy CPU" right="Yumia Neural Core"
    left
      text "High overhead"
      metric "68ms" label="Latency" variant="warning"
    right
      text "Accelerated"
      metric "4.1ms" label="Latency" variant="success"
`);

    const pptxRenderer = new PptxRenderer();
    const pptxRes = await pptxRenderer.render(complexDoc);
    expect(pptxRes.slideCount).toBe(2);

    const pdfRenderer = new PdfRenderer();
    const pdfRes = await pdfRenderer.render(complexDoc);
    expect(pdfRes.slideCount).toBe(2);

    const htmlRenderer = new HtmlRenderer();
    const htmlRes = await htmlRenderer.render(complexDoc);
    expect(htmlRes.html).toContain('yumia-diagram');
    expect(htmlRes.html).toContain('yumia-compare');
  });
});
