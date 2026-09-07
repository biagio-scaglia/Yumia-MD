import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { PdfRenderer } from '../packages/renderer-pdf/src/index.js';
import { PptxRenderer } from '../packages/renderer-pptx/src/index.js';
import { DefaultLayoutEngine } from '../packages/layout/src/engine.js';
import { computeDiagramLayout, orthogonalEdgePoints } from '../packages/layout/src/diagram.js';
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

  it('keeps compact hero + badge clear of following grid (closing-slide regression)', () => {
    const source = `document "Close"
  aspectRatio "16:9"
  slide "Conclusioni"
    hero title="Descrivere cio che si vuole comunicare," subtitle="lasciare al compilatore il compito di comporlo." badge="Design as Code" align="center"
    grid columns=3 gap=16
      card title="1. Separazione" variant="primary"
        text "Il contenuto e disaccoppiato."
      card title="2. Flessibilita" variant="accent"
        text "Un singolo sorgente."
      card title="3. Futuro" variant="success"
        text "Un ponte naturale."
`;
    const presentation = parseYumia(source);
    const engine = new DefaultLayoutEngine();
    const slideLayout = engine.computeSlide(presentation.slides[0]!);
    expect(slideLayout.nodes.length).toBeGreaterThanOrEqual(2);
    const hero = slideLayout.nodes[0]!;
    const grid = slideLayout.nodes[1]!;
    expect(hero.element.type).toBe('hero');
    expect(grid.element.type).toBe('grid');
    expect(grid.bounds.y).toBeGreaterThanOrEqual(hero.bounds.y + hero.bounds.height);
    // Compact hero sharing the slide must not consume a full-bleed title band.
    expect(hero.bounds.height).toBeLessThan(360);
  });

  it('orthogonal diagram edges use elbow waypoints', () => {
    const ptsLR = orthogonalEdgePoints(true, { x: 0, y: 0 }, { x: 200, y: 80 }, 100, 40);
    expect(ptsLR.length).toBe(4);
    expect(ptsLR[0]!.x).toBe(100);
    expect(ptsLR[0]!.y).toBe(20);
    expect(ptsLR[3]!.x).toBe(200);
    expect(
      ptsLR.every((p, i, arr) => i === 0 || p.x === arr[i - 1]!.x || p.y === arr[i - 1]!.y)
    ).toBe(true);

    const ptsTB = orthogonalEdgePoints(false, { x: 10, y: 10 }, { x: 50, y: 120 }, 80, 36);
    expect(ptsTB.length).toBe(4);
    expect(ptsTB[0]!.y).toBe(46);
    expect(
      ptsTB.every((p, i, arr) => i === 0 || p.x === arr[i - 1]!.x || p.y === arr[i - 1]!.y)
    ).toBe(true);
  });

  it('does not spawn ghost diagram nodes from node [Label] variant lines', () => {
    const source = `document "Diag"
  slide "S"
    diagram type="flow" direction="LR" title="Flow"
      [Sorgente Yumia] -> [AST Semantico] -> [Design System]
      [Design System] -> [HTML Interattivo]
      [Design System] -> [PowerPoint PPTX]
      node [Sorgente Yumia] variant="primary"
      node [AST Semantico] variant="accent"
      node [Design System] variant="warning"
      node [HTML Interattivo] variant="success"
      node [PowerPoint PPTX] variant="info"
`;
    const presentation = parseYumia(source);
    const diagram = presentation.slides[0]!.elements.find((e) => e.type === 'diagram') as {
      nodes: Array<{ id: string; variant?: string }>;
      edges: Array<{ from: string; to: string }>;
    };
    expect(diagram.nodes.map((n) => n.id).sort()).toEqual([
      'ast_semantico',
      'design_system',
      'html_interattivo',
      'powerpoint_pptx',
      'sorgente_yumia',
    ]);
    expect(diagram.nodes.find((n) => n.id === 'sorgente_yumia')?.variant).toBe('primary');
    expect(diagram.nodes.find((n) => n.id === 'design_system')?.variant).toBe('warning');

    const layout = computeDiagramLayout(diagram as never, 1600, true);
    expect(Object.keys(layout.positions)).toHaveLength(5);
    expect(layout.maxLane).toBe(2);
    expect(layout.nodeWidth).toBeGreaterThanOrEqual(160);
  });

  it('sizes code blocks tall enough for wrapped long lines', () => {
    const source = `document "Code"
  aspectRatio "16:9"
  slide "S"
    columns 55:45
      column
        code lang="yumia"
          document "Yumia Demo"
            theme "cyberpunk"
            aspectRatio "16:9"
            slide "Yumia in azione"
              hero title="Design Compiler" subtitle="Dall intento al documento visivo" badge="Demo"
              grid columns=3 gap=20
                metric "1" label="Sorgente"
                metric "3" label="Formati"
                metric "0" label="Layout manuale"
      column
        card title="Side"
          text "ok"
`;
    const presentation = parseYumia(source);
    const engine = new DefaultLayoutEngine();
    const slideLayout = engine.computeSlide(presentation.slides[0]!);
    const columns = slideLayout.nodes.find((n) => n.element.type === 'columns');
    const code = columns?.children?.[0]?.children?.find((c) => c.element.type === 'code');
    expect(code).toBeTruthy();
    expect(code!.bounds.height).toBeGreaterThanOrEqual(360);
  });

  it('keeps stacked compare paragraphs from colliding after wrap estimates', () => {
    const source = `document "CompareGap"
  aspectRatio "16:9"
  slide "Problema"
    heading "Perche creare slide tecniche e complesso e inefficiente"
    compare left="Left" right="Right"
      left
        text "• Gli LLM faticano a generare layout geometrici stabili"
        text "• Nessun test automatico di qualita visiva"
      right
        text "• Frammentazione tra Markdown, HTML e PPTX"
        text "• Zero riutilizzabilita tra documentazione e slide"
`;
    const presentation = parseYumia(source);
    const engine = new DefaultLayoutEngine();
    const slideLayout = engine.computeSlide(presentation.slides[0]!);
    const compare = slideLayout.nodes.find((n) => n.element.type === 'compare');
    expect(compare?.children?.length).toBeGreaterThanOrEqual(4);
    const paras = (compare?.children || []).filter((c) => c.element.type === 'paragraph');
    for (let i = 1; i < paras.length; i++) {
      // Same-column siblings share x; only compare consecutive pairs with similar x.
      const prev = paras[i - 1]!;
      const cur = paras[i]!;
      if (Math.abs(prev.bounds.x - cur.bounds.x) < 2) {
        expect(cur.bounds.y).toBeGreaterThanOrEqual(prev.bounds.y + prev.bounds.height);
        // Dense paragraph estimate: max(36, lines*34+8) — single-line bullets are 42.
        expect(prev.bounds.height).toBeGreaterThanOrEqual(36);
      }
    }
  });

  it('PDF paints nested columns/cards without dropping children', async () => {
    const source = `document "Nested"
  slide "S"
    columns ratios="1:1"
      column
        card title="Left"
          text "Alpha"
      column
        card title="Right"
          text "Beta"
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    expect(pdf.pageCount).toBe(1);
    expect(pdf.data.length).toBeGreaterThan(1200);
  });
});
