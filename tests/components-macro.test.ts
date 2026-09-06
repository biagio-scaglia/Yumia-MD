import { describe, expect, it } from 'vitest';
import { parseNativeYumia } from '@yumiamd/parser';
import { YumiaCompiler } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { PdfRenderer } from '@yumiamd/renderer-pdf';

describe('Feature 5: Reusable Custom Components & Macros (component)', () => {
  const componentDoc = `
document "Component Demo"
  theme "cyberpunk"

component FeatureCard title, description, badgeText, badgeVariant
  card title="{{title}}" variant="{{badgeVariant}}"
    badge "{{badgeText}}" variant="{{badgeVariant}}"
    text "{{description}}"

slide "Feature Highlights"
  heading "Yumia Custom Components"
  grid columns=2 gap=20
    FeatureCard "Zero Config", "Works out of the box with zero boilerplate", "Instant", "success"
    FeatureCard "Vector Graphics", "Compiles to pure SVG and OpenXML drawing shapes", "Multi-Target", "accent"
`;

  it('should register component definitions and expand them cleanly in AST', () => {
    const ast = parseNativeYumia(componentDoc);
    expect(ast.components).toBeDefined();
    expect(ast.components!['featurecard']).toBeDefined();
    expect(ast.components!['featurecard']!.params).toEqual([
      'title',
      'description',
      'badgeText',
      'badgeVariant',
    ]);

    expect(ast.slides).toHaveLength(1);
    const slide = ast.slides[0]!;
    const grid = slide.elements.find((el) => el.type === 'grid') as { elements: unknown[] };
    expect(grid).toBeDefined();
    expect(grid.elements).toHaveLength(2);

    const card1 = grid.elements[0] as { title?: string; variant?: string };
    expect(card1.title).toBe('Zero Config');
    expect(card1.variant).toBe('success');

    const card2 = grid.elements[1] as { title?: string; variant?: string };
    expect(card2.title).toBe('Vector Graphics');
    expect(card2.variant).toBe('accent');
  });

  it('should compile expanded custom components across HTML, PPTX, and PDF', async () => {
    const compiler = new YumiaCompiler();
    const htmlRenderer = new HtmlRenderer();
    const pptxRenderer = new PptxRenderer();
    const pdfRenderer = new PdfRenderer();

    const htmlRes = await compiler.compile(componentDoc, htmlRenderer);
    expect(htmlRes.format).toBe('html');
    expect(htmlRes.html).toContain('Zero Config');
    expect(htmlRes.html).toContain('Works out of the box with zero boilerplate');
    expect(htmlRes.html).toContain('Vector Graphics');
    expect(htmlRes.html).toContain('Compiles to pure SVG and OpenXML drawing shapes');

    const pptxRes = await compiler.compile(componentDoc, pptxRenderer);
    expect(pptxRes.format).toBe('pptx');
    expect(pptxRes.data.byteLength).toBeGreaterThan(1000);

    const pdfRes = await compiler.compile(componentDoc, pdfRenderer);
    expect(pdfRes.format).toBe('pdf');
    expect(pdfRes.data.byteLength).toBeGreaterThan(1000);
  });
});
