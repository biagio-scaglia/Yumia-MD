import { describe, expect, it } from 'vitest';
import {
  createCard,
  createColumn,
  createColumns,
  createGrid,
  createHeading,
  createList,
  createParagraph,
  createPresentation,
  createSlide,
} from '@yumiamd/ast';
import { DefaultLayoutEngine } from '../src/index.js';

describe('@yumiamd/layout', () => {
  it('should compute element bounds for stacked slides', () => {
    const slide = createSlide([
      createHeading('Main Title', 1),
      createParagraph('Subtitle and description'),
    ]);

    const presentation = createPresentation({}, [slide]);
    const engine = new DefaultLayoutEngine();
    const result = engine.computePresentation(presentation, { width: 1920, height: 1080 });

    expect(result.slides).toHaveLength(1);
    const slideResult = result.slides[0];
    expect(slideResult?.nodes).toHaveLength(2);

    const firstNode = slideResult?.nodes[0];
    const secondNode = slideResult?.nodes[1];

    expect(firstNode?.bounds.x).toBe(64);
    expect(firstNode?.bounds.y).toBe(64);
    expect(firstNode?.bounds.width).toBe(1920 - 128);
    expect(secondNode?.bounds.y).toBeGreaterThan(firstNode!.bounds.y);
    expect(slideResult?.overflow).toBe(false);
  });

  it('should compute geometric bounds for multi-column layouts with ratios', () => {
    const leftCol = createColumn([createHeading('Col 1', 2), createParagraph('Content')]);
    const rightCol = createColumn([createList(['Item A', 'Item B'])]);
    const columns = createColumns([leftCol, rightCol], '40:60');

    const slide = createSlide([createHeading('Title', 1), columns]);
    const engine = new DefaultLayoutEngine();
    const result = engine.computeSlide(slide, { width: 1920, height: 1080 });

    expect(result.nodes).toHaveLength(2);
    const columnsNode = result.nodes[1];
    expect(columnsNode?.children).toHaveLength(2);

    const leftNode = columnsNode?.children?.[0];
    const rightNode = columnsNode?.children?.[1];

    expect(leftNode?.bounds.x).toBe(64);
    expect(rightNode?.bounds.x).toBeGreaterThan(leftNode!.bounds.x + leftNode!.bounds.width);
    expect(rightNode?.bounds.width).toBeGreaterThan(leftNode!.bounds.width);
  });

  it('should compute nested bounds inside cards with title clearance', () => {
    const card = createCard(
      [createHeading('Card Header', 3), createParagraph('Card details')],
      'Feature'
    );
    const slide = createSlide([card]);

    const engine = new DefaultLayoutEngine();
    const result = engine.computeSlide(slide, { width: 1920, height: 1080 });

    const cardNode = result.nodes[0];
    expect(cardNode?.children).toHaveLength(2);

    const cardPadding = 28;
    const titleClearance = 56;
    const innerHeading = cardNode?.children?.[0];
    expect(innerHeading?.bounds.x).toBe(cardNode!.bounds.x + cardPadding);
    expect(innerHeading?.bounds.y).toBe(cardNode!.bounds.y + cardPadding + titleClearance);
  });

  it('equalizes sibling card heights in a grid row without overflowing the slide', () => {
    const tall = createCard(
      [
        createList([
          'Sorgente 100% versionabile con Git',
          'Tre output compilati da un unico file',
          'Layout e gerarchia visiva garantiti',
          'Linter automatico per design e WCAG',
          'Integrazione nativa con workflow AI',
        ]),
      ],
      'Vantaggi Attuali'
    );
    const mid = createCard(
      [
        createList([
          'Parità totale di rendering su edge case',
          'Estensione della copertura dei test',
          'Supporto a font e asset esterni complessi',
          'Documentazione di scenari avanzati',
        ]),
      ],
      'Aspetti da Consolidare'
    );
    const right = createCard(
      [
        createList([
          'Editor visuale WYSIWYG bidirezionale',
          'Collaborazione in tempo reale su browser',
          'Integrazione con modelli LLM in locale',
          'Plugin per VS Code ed estensioni IDE',
        ]),
      ],
      'Sviluppi Futuri'
    );

    const slide = createSlide([
      createHeading('Vantaggi, Limiti e Sviluppi Futuri', 1),
      createHeading('Valutazione dello stato attuale e roadmap del progetto', 2),
      createGrid([tall, mid, right], 3, 16),
    ]);

    const engine = new DefaultLayoutEngine();
    const result = engine.computeSlide(slide, { width: 1920, height: 1080 });
    const grid = result.nodes.find((n) => n.element.type === 'grid');
    expect(grid?.children).toHaveLength(3);

    const [a, b, c] = grid!.children!;
    expect(a!.bounds.height).toBe(b!.bounds.height);
    expect(b!.bounds.height).toBe(c!.bounds.height);
    expect(a!.bounds.y + a!.bounds.height).toBeLessThanOrEqual(1080);
    expect(result.overflow).toBe(false);
  });
});
