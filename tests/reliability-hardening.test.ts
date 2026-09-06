import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { PdfRenderer } from '../packages/renderer-pdf/src/index.js';
import { PptxRenderer } from '../packages/renderer-pptx/src/index.js';
import { computeDiagramLayout } from '../packages/layout/src/diagram.js';
import { rasterizeIcon } from '../packages/renderer/src/icon-raster.js';

describe('Reliability: diagrams, layout, icons', () => {
  it('does not hang on cyclic diagram edges (PDF + PPTX)', async () => {
    const source = `document "Cycle"
  slide "S"
    diagram type="flow" direction="LR"
      [A] -> [B]
      [B] -> [A]
`;
    const presentation = parseYumia(source);
    const started = Date.now();
    const pdf = await Promise.race([
      new PdfRenderer().render(presentation),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF cyclic diagram hung')), 3000)
      ),
    ]);
    const pptx = await Promise.race([
      new PptxRenderer().render(presentation),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PPTX cyclic diagram hung')), 3000)
      ),
    ]);
    expect(Date.now() - started).toBeLessThan(3000);
    expect(pdf.pageCount).toBe(1);
    expect(pptx.slideCount).toBe(1);
  });

  it('computes branching diagram ranks and height without truncating lanes', () => {
    const source = `document "Branch"
  slide "S"
    diagram type="flow" direction="LR" title="Fanout"
      [Root] -> [Left Child With Long Label]
      [Root] -> [Right Child Also Long]
      [Root] -> [Third Branch Node]
      [Root] -> [Fourth Branch Node]
`;
    const presentation = parseYumia(source);
    const diagram = presentation.slides[0]!.elements.find((e) => e.type === 'diagram')!;
    const layout = computeDiagramLayout(diagram as never, 800, true);
    expect(layout.maxLane).toBeGreaterThanOrEqual(4);
    expect(layout.height).toBeGreaterThanOrEqual(280);
    expect(layout.nodeWidth).toBeGreaterThan(40);
  });

  it('rasterizes registry icons to PNG for binary embed', () => {
    const icon = rasterizeIcon('lucide:rocket', 48, '#ff2e88');
    expect(icon.png.length).toBeGreaterThan(100);
    expect(icon.png[0]).toBe(0x89);
    expect(icon.png[1]).toBe(0x50);
  });

  it('embeds icons into PDF and PPTX instead of only text stubs', async () => {
    const source = `document "Icons"
  slide "S"
    icon "lucide:rocket" size=40
    heading "With icon"
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    const pptx = await new PptxRenderer().render(presentation);
    expect(pdf.data.length).toBeGreaterThan(1500);
    expect(pptx.data.length).toBeGreaterThan(2000);
  });

  it('PDF uses shared layout so page count stays equal to slide count', async () => {
    const source = `document "Layout"
  aspectRatio "16:9"
  slide "One"
    heading "A"
    text "Body"
  slide "Two"
    diagram type="flow" direction="LR"
      [A] -> [B]
      [B] -> [C]
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    expect(pdf.pageCount).toBe(2);
    expect(pdf.slideCount).toBe(2);
  });
});
