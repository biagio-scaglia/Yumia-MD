import { describe, expect, it } from 'vitest';
import { parseNativeYumia, parseYumia } from '@yumiamd/parser';
import { YumiaCompiler } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { DiagramElement } from '@yumiamd/ast';

describe('Feature 3: Vector Diagrams Primitive (Native & Markdown -> SVG, OpenXML, PDF)', () => {
  const nativeDiagramDoc = `
document "Distributed System Architecture"
  theme "cyberpunk"

slide "Architecture Pipeline"
  heading "Microservices Topology"
  diagram type="flow" direction="LR" title="Data Ingestion & Processing"
    [Client App] -> [API Gateway] -[gRPC]-> [Auth Service]
    [API Gateway] -[JSON/REST]-> [Worker Pool] -> [(Distributed DB)]
    node cache label="Redis Cache" shape="database" variant="accent"
`;

  const markdownDiagramDoc = `
---
title: System Overview
theme: corporate
---

# Service Flow

:::diagram direction="LR" title="Service Pipeline"
[Browser] -> [Edge CDN] -> [Load Balancer] -[mTLS]-> [App Server]
node db label="Primary Database" shape="database" variant="success"
:::
`;

  it('should parse Native Yumia diagram syntax with node chains and shapes', () => {
    const ast = parseNativeYumia(nativeDiagramDoc);
    expect(ast.slides).toHaveLength(1);
    const diagram = ast.slides[0]!.elements.find((el) => el.type === 'diagram') as DiagramElement;
    expect(diagram).toBeDefined();
    expect(diagram.type).toBe('diagram');
    expect(diagram.direction).toBe('LR');
    expect(diagram.title).toBe('Data Ingestion & Processing');
    expect(diagram.nodes.length).toBeGreaterThanOrEqual(4);

    const clientNode = diagram.nodes.find((n) => n.label === 'Client App');
    expect(clientNode).toBeDefined();

    const dbNode = diagram.nodes.find((n) => n.label === 'Distributed DB');
    expect(dbNode).toBeDefined();
    expect(dbNode?.shape).toBe('database');

    const edge = diagram.edges.find((e) => e.label === 'gRPC');
    expect(edge).toBeDefined();
    expect(edge?.from).toBe('api_gateway');
    expect(edge?.to).toBe('auth_service');
  });

  it('should parse Markdown :::diagram directive syntax', () => {
    const ast = parseYumia(markdownDiagramDoc);
    expect(ast.slides).toHaveLength(1);
    const diagram = ast.slides[0]!.elements.find((el) => el.type === 'diagram') as DiagramElement;
    expect(diagram).toBeDefined();
    expect(diagram.title).toBe('Service Pipeline');
    expect(diagram.direction).toBe('LR');
    expect(diagram.nodes.some((n) => n.label === 'Browser')).toBe(true);
    expect(diagram.edges.some((e) => e.label === 'mTLS')).toBe(true);
  });

  it('should render Vector Diagram to HTML with responsive SVG and markers', async () => {
    const compiler = new YumiaCompiler();
    const htmlRenderer = new HtmlRenderer();
    const output = await compiler.compile(nativeDiagramDoc, htmlRenderer);

    expect(output.format).toBe('html');
    expect(output.html).toContain('class="yumia-diagram"');
    expect(output.html).toContain('<marker id="arrow-');
    expect(output.html).toContain('Client App');
    expect(output.html).toContain('API Gateway');
    expect(output.html).toContain('Data Ingestion &amp; Processing');
  });

  it('should render Vector Diagram to PPTX with native shapes and connector lines', async () => {
    const compiler = new YumiaCompiler();
    const pptxRenderer = new PptxRenderer();
    const output = await compiler.compile(nativeDiagramDoc, pptxRenderer);

    expect(output.format).toBe('pptx');
    expect(output.data.byteLength).toBeGreaterThan(1000);
    expect(output.slideCount).toBe(1);
  });

  it('should render Vector Diagram to PDF with vector paths and rounded rects', async () => {
    const compiler = new YumiaCompiler();
    const pdfRenderer = new PdfRenderer();
    const output = await compiler.compile(nativeDiagramDoc, pdfRenderer);

    expect(output.format).toBe('pdf');
    expect(output.data.byteLength).toBeGreaterThan(1000);
    expect(output.slideCount).toBe(1);
  });
});
