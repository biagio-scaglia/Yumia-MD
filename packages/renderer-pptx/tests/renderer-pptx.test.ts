import { describe, expect, it } from 'vitest';
import {
  createCard,
  createCode,
  createColumn,
  createColumns,
  createHeading,
  createList,
  createParagraph,
  createPresentation,
  createQuote,
  createSlide,
} from '@yumiamd/ast';
import { PptxRenderer } from '../src/index.js';

describe('@yumiamd/renderer-pptx', () => {
  it('should compile presentation AST with headings, cards, and columns to native PPTX buffer', async () => {
    const slide1 = createSlide(
      [createHeading('Title Slide', 1), createParagraph('Subtitle description here.')],
      { notes: 'Speaker notes for slide 1' }
    );

    const leftCol = createColumn([createHeading('Feature A', 2), createParagraph('Fast compiler')]);
    const rightCol = createColumn([createList(['Point 1', 'Point 2'])]);
    const columns = createColumns([leftCol, rightCol], '50:50');

    const card = createCard([createParagraph('Inner card text')], 'Card Title');
    const code = createCode('const a = 10;\nconsole.log(a);', 'typescript');
    const quote = createQuote('Knowledge is power.');

    const slide2 = createSlide([columns, card, code, quote]);

    const presentation = createPresentation({ title: 'Test Presentation', author: 'Biagio' }, [
      slide1,
      slide2,
    ]);

    const renderer = new PptxRenderer();
    const result = await renderer.render(presentation);

    expect(result.format).toBe('pptx');
    expect(result.slideCount).toBe(2);
    expect(result.data.byteLength).toBeGreaterThan(1000); // Valid zip / pptx file size
  });

  it('should compile mathematical formulas and slide transitions to native PPTX buffer', async () => {
    const slide1 = createSlide(
      [
        createHeading('Quantum Physics', 1),
        {
          type: 'math',
          expression: 'i \\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi',
          displayMode: true,
        },
      ],
      { transition: 'push' }
    );

    const presentation = createPresentation(
      { title: 'Physics Talk', author: 'Biagio', transition: 'fade', embedFonts: true },
      [slide1]
    );

    const renderer = new PptxRenderer();
    const result = await renderer.render(presentation);
    expect(result.format).toBe('pptx');
    expect(result.slideCount).toBe(1);
    expect(result.data.byteLength).toBeGreaterThan(1000);
  });
});
