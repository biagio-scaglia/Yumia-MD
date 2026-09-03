import { describe, expect, it } from 'vitest';
import {
  createCard,
  createCode,
  createGroup,
  createHeading,
  createImage,
  createList,
  createParagraph,
  createPresentation,
  createQuote,
  createSlide,
  createTable,
} from '../src/index.js';

describe('@biagioscaglia/yumia-ast', () => {
  it('should construct a presentation AST with metadata and slides', () => {
    const slide1 = createSlide([
      createHeading('Welcome to Yumia', 1),
      createParagraph('A next-gen presentation compiler.'),
    ]);

    const slide2 = createSlide([
      createHeading('Agenda', 2),
      createList(['Separation of concerns', 'Native PPTX export']),
    ]);

    const presentation = createPresentation(
      { title: 'Welcome Deck', theme: 'default', aspectRatio: '16:9' },
      [slide1, slide2]
    );

    expect(presentation.metadata.title).toBe('Welcome Deck');
    expect(presentation.metadata.aspectRatio).toBe('16:9');
    expect(presentation.slides).toHaveLength(2);
    expect(presentation.slides[0]?.elements[0]?.type).toBe('heading');
    expect(presentation.slides[0]?.elements[1]?.type).toBe('paragraph');
    expect(presentation.slides[1]?.elements[1]?.type).toBe('list');
  });

  it('should create all slide element types correctly', () => {
    const card = createCard([createParagraph('Card content')], 'Feature Card', 'outlined');
    const code = createCode('console.log("hello");', 'typescript', [1]);
    const image = createImage('https://example.com/logo.png', 'Logo', 'Official Logo');
    const quote = createQuote('Stay hungry, stay foolish.', 'Steve Jobs');
    const table = createTable([['Row 1 Col 1', 'Row 1 Col 2']], ['Col 1', 'Col 2']);
    const group = createGroup([card, code], 'row', 16);

    expect(card.type).toBe('card');
    expect(card.title).toBe('Feature Card');
    expect(code.type).toBe('code');
    expect(code.language).toBe('typescript');
    expect(image.type).toBe('image');
    expect(quote.type).toBe('quote');
    expect(table.type).toBe('table');
    expect(table.headers).toEqual(['Col 1', 'Col 2']);
    expect(group.type).toBe('group');
    expect(group.direction).toBe('row');
  });
});
