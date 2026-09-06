import { describe, expect, it } from 'vitest';
import { parseYumia } from '@yumiamd/parser';
import { YumiaCompiler } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { resolveTheme } from '@yumiamd/theme';
import { SequenceElement, ClassDiagramElement, ChartElement } from '@yumiamd/ast';

describe('PlantUML/Plantext-style Diagrams & Advanced Charts', () => {
  const markdownSequenceDoc = `
---
title: Authentication Lifecycle
theme: nebula
---

# User Authentication Flow

:::sequence title="OAuth 2.0 PKCE Handshake"
actor User as "Mobile User"
participant App as "Native Client"
participant Auth as "Identity Provider"
database DB as "Token Vault"

User -> App: Tap Login with SSO
App -> Auth: /oauth/authorize (code_challenge)
Auth -> User: Render Consent UI
User -> Auth: Grant Permission
Auth --> App: Authorization Code
App -> Auth: /oauth/token (code_verifier)
Auth -> DB: Verify & Save Session
Auth --> App: Access Token + JWT
note over Auth: Token expiration 3600s
:::
`;

  const markdownClassDoc = `
---
title: Domain Model Architecture
theme: neo-brutalist
---

# Domain Entities & Contracts

:::class title="Core Presentation Architecture"
class YumiaCompiler {
  + compile(doc: string): Output
  + setRenderer(r: Renderer): void
  - layoutEngine: Engine
}

interface YumiaRenderer {
  + render(pres: Presentation): Promise<Output>
}

class PdfRenderer {
  + render(pres: Presentation): Promise<PdfOutput>
  - doc: PDFKitDocument
}

YumiaRenderer <|.. PdfRenderer : implements
YumiaCompiler --> YumiaRenderer : utilizes
:::
`;

  const chartsDoc = `
---
title: Multi-Dimensional Metrics
theme: luxury
---

# Performance & SLA Analysis

:::chart type="radar" title="System Capabilities Radar"
labels: Speed, Reliability, Security, Scalability, DX
series Benchmark: 95, 90, 98, 88, 92
series Baseline: 70, 75, 80, 65, 70
:::

---

# SLA Reliability Gauge

:::chart type="gauge" title="Service Uptime Target"
labels: Realtime Availability
series Uptime: 99.95
:::

---

# Data Ingestion Area

:::chart type="area" title="Bandwidth Usage (GB/s)"
labels: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
series Ingress: 12, 18, 45, 80, 65, 30
series Egress: 8, 10, 25, 50, 40, 20
:::
`;

  it('should verify all 5 new themes in theme registry', () => {
    const neo = resolveTheme('neo-brutalist');
    expect(neo.name).toBe('neo-brutalist');
    expect(neo.colors.primary).toBe('#FFE600');

    const luxury = resolveTheme('luxury');
    expect(luxury.name).toBe('luxury');
    expect(luxury.colors.primary).toBe('#D4AF37');

    const monokai = resolveTheme('monokai');
    expect(monokai.name).toBe('monokai');
    expect(monokai.colors.background).toBe('#272822');

    const solarized = resolveTheme('solarized-dark');
    expect(solarized.name).toBe('solarized-dark');
    expect(solarized.colors.background).toBe('#002B36');

    const nebula = resolveTheme('nebula');
    expect(nebula.name).toBe('nebula');
    expect(nebula.colors.accent).toBe('#38BDF8');
  });

  it('should parse Markdown :::sequence diagram directive with participants, messages, and notes', () => {
    const ast = parseYumia(markdownSequenceDoc);
    expect(ast.slides).toHaveLength(1);
    const seq = ast.slides[0]!.elements.find((el) => el.type === 'sequence') as SequenceElement;
    expect(seq).toBeDefined();
    expect(seq.title).toBe('OAuth 2.0 PKCE Handshake');
    expect(seq.participants.length).toBe(4);
    expect(seq.participants[0]!.id).toBe('user');
    expect(seq.participants[0]!.name).toBe('Mobile User');
    expect(seq.participants[0]!.type).toBe('actor');
    expect(seq.participants[3]!.id).toBe('db');
    expect(seq.participants[3]!.name).toBe('Token Vault');
    expect(seq.participants[3]!.type).toBe('database');
    expect(seq.messages.length).toBe(8);
    expect(seq.messages[0]!.label).toBe('Tap Login with SSO');
    expect(seq.messages[4]!.style).toBe('dashed');
    expect(seq.notes?.length).toBeGreaterThanOrEqual(1);
  });

  it('should parse Markdown :::class diagram directive with classes, members, and relationships', () => {
    const ast = parseYumia(markdownClassDoc);
    expect(ast.slides).toHaveLength(1);
    const cd = ast.slides[0]!.elements.find(
      (el) => el.type === 'class-diagram'
    ) as ClassDiagramElement;
    expect(cd).toBeDefined();
    expect(cd.title).toBe('Core Presentation Architecture');
    expect(cd.classes.length).toBe(3);

    const compilerCls = cd.classes.find((c) => c.name === 'YumiaCompiler');
    expect(compilerCls).toBeDefined();
    expect(compilerCls?.members.length).toBe(3);

    const ifaceCls = cd.classes.find((c) => c.name === 'YumiaRenderer');
    expect(ifaceCls).toBeDefined();
    expect(ifaceCls?.isInterface).toBe(true);

    expect(cd.relationships.length).toBe(2);
  });

  it('should parse radar, gauge, and area charts into AST', () => {
    const ast = parseYumia(chartsDoc);
    expect(ast.slides).toHaveLength(3);

    const radar = ast.slides[0]!.elements.find((el) => el.type === 'chart') as ChartElement;
    expect(radar).toBeDefined();
    expect(radar.chartType).toBe('radar');
    expect(radar.series.length).toBe(2);

    const gauge = ast.slides[1]!.elements.find((el) => el.type === 'chart') as ChartElement;
    expect(gauge).toBeDefined();
    expect(gauge.chartType).toBe('gauge');
    expect(gauge.series[0]?.values[0]).toBe(99.95);

    const area = ast.slides[2]!.elements.find((el) => el.type === 'chart') as ChartElement;
    expect(area).toBeDefined();
    expect(area.chartType).toBe('area');
    expect(area.series.length).toBe(2);
  });

  it('should render sequence diagrams across HTML, PDF, and PPTX', async () => {
    const compiler = new YumiaCompiler();

    // HTML
    const htmlOutput = await compiler.compile(markdownSequenceDoc, new HtmlRenderer());
    expect(htmlOutput.format).toBe('html');
    expect(htmlOutput.html).toContain('class="yumia-sequence-container"');
    expect(htmlOutput.html).toContain('Mobile User');
    expect(htmlOutput.html).toContain('OAuth 2.0 PKCE Handshake');
    expect(htmlOutput.html).toContain('Tap Login with SSO');

    // PDF
    const pdfOutput = await compiler.compile(markdownSequenceDoc, new PdfRenderer());
    expect(pdfOutput.format).toBe('pdf');
    expect(pdfOutput.data.byteLength).toBeGreaterThan(1000);

    // PPTX
    const pptxOutput = await compiler.compile(markdownSequenceDoc, new PptxRenderer());
    expect(pptxOutput.format).toBe('pptx');
    expect(pptxOutput.data.byteLength).toBeGreaterThan(1000);
  });

  it('should render class diagrams across HTML, PDF, and PPTX', async () => {
    const compiler = new YumiaCompiler();

    // HTML
    const htmlOutput = await compiler.compile(markdownClassDoc, new HtmlRenderer());
    expect(htmlOutput.format).toBe('html');
    expect(htmlOutput.html).toContain('class="yumia-class-diagram"');
    expect(htmlOutput.html).toContain('YumiaCompiler');
    expect(htmlOutput.html).toContain('&lt;&lt;interface&gt;&gt;');

    // PDF
    const pdfOutput = await compiler.compile(markdownClassDoc, new PdfRenderer());
    expect(pdfOutput.format).toBe('pdf');
    expect(pdfOutput.data.byteLength).toBeGreaterThan(1000);

    // PPTX
    const pptxOutput = await compiler.compile(markdownClassDoc, new PptxRenderer());
    expect(pptxOutput.format).toBe('pptx');
    expect(pptxOutput.data.byteLength).toBeGreaterThan(1000);
  });

  it('should render radar, gauge, and area charts across HTML, PDF, and PPTX', async () => {
    const compiler = new YumiaCompiler();

    // HTML
    const htmlOutput = await compiler.compile(chartsDoc, new HtmlRenderer());
    expect(htmlOutput.format).toBe('html');
    expect(htmlOutput.html).toContain('System Capabilities Radar');
    expect(htmlOutput.html).toContain('Service Uptime Target');
    expect(htmlOutput.html).toContain('Bandwidth Usage');

    // PDF
    const pdfOutput = await compiler.compile(chartsDoc, new PdfRenderer());
    expect(pdfOutput.format).toBe('pdf');
    expect(pdfOutput.data.byteLength).toBeGreaterThan(1000);

    // PPTX
    const pptxOutput = await compiler.compile(chartsDoc, new PptxRenderer());
    expect(pptxOutput.format).toBe('pptx');
    expect(pptxOutput.data.byteLength).toBeGreaterThan(1000);
  });
});
