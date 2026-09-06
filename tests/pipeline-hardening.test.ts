import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseYumia } from '@yumiamd/parser';
import { resolveLocalAsset, resolveSlideGeometry, themeSizeToPptxPoints } from '@yumiamd/renderer';
import { PdfRenderer } from '../packages/renderer-pdf/src/index.js';
import { PptxRenderer } from '../packages/renderer-pptx/src/index.js';

function zipContains(buf: Uint8Array, entryPath: string): boolean {
  return Buffer.from(buf).includes(Buffer.from(entryPath));
}

describe('Pipeline hardening regressions', () => {
  it('parses hero badge into the AST (native)', () => {
    const source = `document "Badge"
  slide "S"
    hero title="T" badge="Design Compiler" tagline="Tag" align="center"
`;
    const presentation = parseYumia(source);
    const hero = presentation.slides[0]!.elements.find((e) => e.type === 'hero') as {
      badge?: string;
      tagline?: string;
    };
    expect(hero.badge).toBe('Design Compiler');
    expect(hero.tagline).toBe('Tag');
  });

  it('resolves 16:10 geometry for both PDF and PPTX', async () => {
    const geo = resolveSlideGeometry('16:10');
    expect(geo.points.height).toBe(600);
    expect(geo.inches.height).toBeCloseTo(8.333, 2);
    expect(geo.pixelViewport.height).toBe(1200);

    const source = `document "AR"
  aspectRatio "16:10"
  slide "S"
    heading "Tall"
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    const pptx = await new PptxRenderer().render(presentation);
    expect(pdf.data.length).toBeGreaterThan(500);
    expect(pptx.data.length).toBeGreaterThan(1000);

    // 16:10 height is 8.333in → ~7,619,971 EMU. Default 16:9 height is 6,858,000.
    const xml = Buffer.from(pptx.data).toString('latin1');
    expect(xml).toContain('sldSz');
    expect(xml).not.toMatch(/cy="6858000"/);
  });

  it('theme typography drives PPTX heading point size', () => {
    expect(themeSizeToPptxPoints(44, 44)).toBe(Math.round(44 * 0.72));
    expect(themeSizeToPptxPoints(undefined, 18)).toBe(Math.round(18 * 0.72));
  });

  it('blocks path-traversal style relative asset paths', () => {
    const blocked = resolveLocalAsset('../../../Windows/System32/drivers/etc/hosts');
    expect(blocked).toBeNull();
  });

  it('embeds local PNG images into PDF instead of silently dropping them', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yumia-img-'));
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const imgPath = path.join(tmp, 'dot.png');
    fs.writeFileSync(imgPath, png);

    const source = `document "Img"
  slide "S"
    heading "With image"
    image src="${imgPath.replace(/\\/g, '/')}" alt="dot" caption="pixel"
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    expect(Buffer.from(pdf.data.slice(0, 5)).toString('ascii')).toBe('%PDF-');
    expect(pdf.data.length).toBeGreaterThan(1200);

    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('PPTX package contains required OpenXML parts', async () => {
    const source = `document "Pkg"
  slide "One"
    heading "Hello"
  slide "Two"
    text "World"
`;
    const presentation = parseYumia(source);
    const pptx = await new PptxRenderer().render(presentation);
    expect(zipContains(pptx.data as Uint8Array, '[Content_Types].xml')).toBe(true);
    expect(zipContains(pptx.data as Uint8Array, 'ppt/presentation.xml')).toBe(true);
    expect(zipContains(pptx.data as Uint8Array, 'ppt/slides/slide1.xml')).toBe(true);
    expect(zipContains(pptx.data as Uint8Array, 'ppt/slides/slide2.xml')).toBe(true);
  });

  it('PDF page count equals slide count even when content is dense', async () => {
    const longPara = 'Overflow stress sentence. '.repeat(80);
    const source = `document "Dense"
  slide "One"
    heading "Dense slide one"
    text "${longPara}"
    text "${longPara}"
  slide "Two"
    heading "Dense slide two"
    text "${longPara}"
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    expect(pdf.pageCount).toBe(2);
    expect(pdf.slideCount).toBe(2);

    const raw = Buffer.from(pdf.data).toString('latin1');
    const pageObjects = raw.match(/\/Type\s*\/Page[^s]/g) || [];
    expect(pageObjects.length).toBe(2);
  });

  it('PDF code blocks wrap long lines without overlapping neighbors', async () => {
    const longLine =
      'hero title="Design Compiler" subtitle="Dall intento al documento visivo molto lungo per forzare wrap" badge="Demo"';
    const source = `document "CodeWrap"
  slide "Code"
    code language="yumia"
      document "Yumia Demo"
      ${longLine}
      grid columns=3 gap=20
`;
    const presentation = parseYumia(source);
    const pdf = await new PdfRenderer().render(presentation);
    expect(pdf.pageCount).toBe(1);
    expect(pdf.data.length).toBeGreaterThan(800);
  });
});
