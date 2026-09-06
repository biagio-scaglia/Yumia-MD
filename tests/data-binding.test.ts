import { describe, expect, it } from 'vitest';
import { YumiaCompiler, loadData, evaluateInterpolation, expandDataBindings } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { parseNativeYumia } from '@yumiamd/parser';

describe('Feature 4: Data-Binding & Dynamic Templating (JSON / CSV & slide each)', () => {
  const sampleJson = JSON.stringify({
    company: 'Acme Corp',
    quarter: 'Q4 2026',
    regions: [
      { name: 'North America', revenue: '$4.2M', growth: '+28%', status: 'success' },
      { name: 'Europe', revenue: '$3.1M', growth: '+19%', status: 'primary' },
      { name: 'Asia Pacific', revenue: '$5.6M', growth: '+42%', status: 'accent' },
    ],
  });

  const sampleCsv = `
region,revenue,growth,status
North America,$4.2M,+28%,success
Europe,$3.1M,+19%,primary
Asia Pacific,$5.6M,+42%,accent
`.trim();

  it('should parse and load JSON and CSV datasets accurately', () => {
    const fromJson = loadData(sampleJson) as { company: string; regions: unknown[] };
    expect(fromJson.company).toBe('Acme Corp');
    expect(fromJson.regions).toHaveLength(3);

    const fromCsv = loadData(sampleCsv) as Array<Record<string, unknown>>;
    expect(Array.isArray(fromCsv)).toBe(true);
    expect(fromCsv).toHaveLength(3);
    expect(fromCsv[0]!['region']).toBe('North America');
    expect(fromCsv[0]!['revenue']).toBe('$4.2M');
  });

  it('should interpolate variable expressions with dot-notation', () => {
    const context = {
      user: { name: 'Biagio', role: 'Architect' },
      metrics: { latency: 12 },
    };
    const interpolated = evaluateInterpolation(
      'Hello {{user.name}}! Your role is {{user.role}} with {{metrics.latency}}ms latency.',
      context
    );
    expect(interpolated).toBe('Hello Biagio! Your role is Architect with 12ms latency.');
  });

  it('should expand template slides using slide each="item in items"', () => {
    const templateDoc = `
document "Quarterly Report - {{company}}"
  theme "corporate"

slide "Executive Summary"
  heading "Performance Report {{quarter}}"
  text "Prepared for {{company}} board."

slide each="reg in regions"
  heading "Region: {{reg.name}}"
  card title="{{reg.name}} Breakdown" variant="{{reg.status}}"
    metric "{{reg.revenue}}" label="Gross Revenue" diff="{{reg.growth}}"
`;

    const ast = parseNativeYumia(templateDoc);
    expect(ast.slides).toHaveLength(2);
    expect(ast.slides[1]!.each).toBe('reg in regions');

    const expanded = expandDataBindings(ast, sampleJson);
    expect(expanded.metadata.title).toBe('Quarterly Report - Acme Corp');
    // 1 executive slide + 3 expanded region slides = 4 slides
    expect(expanded.slides).toHaveLength(4);

    expect(expanded.slides[0]!.elements[0]!.type).toBe('heading');
    // Check expanded slide 1
    const slideNA = expanded.slides[1]!;
    expect(JSON.stringify(slideNA)).toContain('Region: North America');
    expect(JSON.stringify(slideNA)).toContain('$4.2M');

    // Check expanded slide 2
    const slideEU = expanded.slides[2]!;
    expect(JSON.stringify(slideEU)).toContain('Region: Europe');
    expect(JSON.stringify(slideEU)).toContain('$3.1M');

    // Check expanded slide 3
    const slideAPAC = expanded.slides[3]!;
    expect(JSON.stringify(slideAPAC)).toContain('Region: Asia Pacific');
    expect(JSON.stringify(slideAPAC)).toContain('$5.6M');
  });

  it('should compile data-bound presentations across HTML, PPTX, and PDF', async () => {
    const templateDoc = `
document "Automated Report"
  theme "minimal"

slide each="r in rows"
  heading "Sales in {{r.region}}"
  badge "{{r.growth}}" variant="{{r.status}}"
  text "Total Revenue Generated: {{r.revenue}}"
`;

    const compiler = new YumiaCompiler();
    const htmlRenderer = new HtmlRenderer();
    const pptxRenderer = new PptxRenderer();
    const pdfRenderer = new PdfRenderer();

    const htmlRes = await compiler.compile(templateDoc, htmlRenderer, { data: sampleCsv });
    expect(htmlRes.format).toBe('html');
    expect(htmlRes.slideCount).toBe(3);
    expect(htmlRes.html).toContain('Sales in North America');
    expect(htmlRes.html).toContain('Sales in Europe');
    expect(htmlRes.html).toContain('Sales in Asia Pacific');

    const pptxRes = await compiler.compile(templateDoc, pptxRenderer, { data: sampleCsv });
    expect(pptxRes.format).toBe('pptx');
    expect(pptxRes.slideCount).toBe(3);

    const pdfRes = await compiler.compile(templateDoc, pdfRenderer, { data: sampleCsv });
    expect(pdfRes.format).toBe('pdf');
    expect(pdfRes.slideCount).toBe(3);
  });
});
