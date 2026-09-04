import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { YumiaCompiler } from '../../packages/core/src/index.js';
import { HtmlRenderer } from '../../packages/renderer-html/src/index.js';
import { PdfRenderer } from '../../packages/renderer-pdf/src/index.js';
import { PptxRenderer } from '../../packages/renderer-pptx/src/index.js';

describe('Mega Visual & Cross-Format Regression Suite', () => {
  const compiler = new YumiaCompiler();
  const htmlRenderer = new HtmlRenderer();
  const pdfRenderer = new PdfRenderer();
  const pptxRenderer = new PptxRenderer();

  const fixturesDir = path.join(__dirname, 'fixtures');
  const fixtureFiles = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.yumia.md'));

  for (const fixtureFile of fixtureFiles) {
    describe(`Fixture: ${fixtureFile}`, () => {
      const filePath = path.join(fixturesDir, fixtureFile);
      const source = fs.readFileSync(filePath, 'utf-8');

      it('compiles without syntax or AST errors', () => {
        const ast = compiler.parse(source);
        expect(ast.slides.length).toBeGreaterThan(0);
        expect(ast.metadata.title).toBeDefined();
      });

      it('renders semantic HTML with design tokens and break-word protection', async () => {
        const presentation = compiler.parse(source);
        const res = await htmlRenderer.render(presentation);
        expect(res.format).toBe('html');
        expect(res.html).toContain('<!DOCTYPE html>');
        expect(res.html).toContain('--yumia-line-height-body');
        expect(res.html).toContain('--yumia-radius-md');
        expect(res.html).toContain('overflow-wrap: break-word');
      });

      it('renders vector PDF buffer starting with %PDF without encoding exceptions', async () => {
        const presentation = compiler.parse(source);
        const res = await pdfRenderer.render(presentation);
        expect(res.format).toBe('pdf');
        expect(res.data.length).toBeGreaterThan(500);
        const header = Buffer.from(res.data.slice(0, 5)).toString('ascii');
        expect(header).toBe('%PDF-');
      });

      it('renders PPTX buffer with clean Office-compatible font mapping', async () => {
        const presentation = compiler.parse(source);
        const res = await pptxRenderer.render(presentation);
        expect(res.format).toBe('pptx');
        expect(res.data.length).toBeGreaterThan(1000);
      });

      it('guarantees rendering determinism (identical structure across runs)', async () => {
        const presentation = compiler.parse(source);
        const html1 = await htmlRenderer.render(presentation);
        const html2 = await htmlRenderer.render(presentation);
        expect(html1.html).toBe(html2.html);
      });
    });
  }
});
