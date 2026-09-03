import { Presentation, Slide, SlideElement } from '@yumia/ast';
import {
  LayoutEngine,
  LayoutNode,
  LayoutOptions,
  PresentationLayoutResult,
  Size,
  SlideLayoutResult,
} from './types.js';

export const DEFAULT_VIEWPORT: Size = {
  width: 1920,
  height: 1080,
};

export class DefaultLayoutEngine implements LayoutEngine {
  computeSlide(
    slide: Slide,
    viewport: Size = DEFAULT_VIEWPORT,
    options: LayoutOptions = {}
  ): SlideLayoutResult {
    const padding = options.padding ?? 64;
    const gap = options.gap ?? 24;
    const availableWidth = viewport.width - padding * 2;
    const availableHeight = viewport.height - padding * 2;

    const count = slide.elements.length;
    if (count === 0) {
      return {
        ...(slide.id ? { slideId: slide.id } : {}),
        viewport,
        nodes: [],
      };
    }

    const estimatedItemHeight = Math.max(
      40,
      Math.min(120, (availableHeight - (count - 1) * gap) / count)
    );

    let currentY = padding;
    const nodes: LayoutNode[] = slide.elements.map((element: SlideElement) => {
      const node: LayoutNode = {
        element,
        bounds: {
          x: padding,
          y: currentY,
          width: availableWidth,
          height: estimatedItemHeight,
        },
      };
      currentY += estimatedItemHeight + gap;
      return node;
    });

    return {
      ...(slide.id ? { slideId: slide.id } : {}),
      viewport,
      nodes,
    };
  }

  computePresentation(
    presentation: Presentation,
    viewport: Size = DEFAULT_VIEWPORT,
    options: LayoutOptions = {}
  ): PresentationLayoutResult {
    return {
      viewport,
      slides: presentation.slides.map((slide: Slide) =>
        this.computeSlide(slide, viewport, options)
      ),
    };
  }
}
