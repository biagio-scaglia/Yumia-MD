import { describe, expect, it } from 'vitest';
import { createHeading, createParagraph, createPresentation, createSlide } from '@yumia/ast';
import { DefaultLayoutEngine } from '../src/index.js';

describe('@yumia/layout', () => {
  it('should compute element bounds for slides', () => {
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
  });
});
