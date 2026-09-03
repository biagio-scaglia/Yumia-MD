import { Presentation, Slide, SlideElement } from '@yumia/ast';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export type LayoutType = 'stack' | 'columns' | 'split' | 'hero' | 'grid';

export interface LayoutOptions {
  padding?: number;
  gap?: number;
}

export interface LayoutNode {
  element: SlideElement;
  bounds: Rect;
  children?: LayoutNode[];
}

export interface SlideLayoutResult {
  slideId?: string;
  viewport: Size;
  nodes: LayoutNode[];
  overflow?: boolean;
  overflowAmount?: number;
}

export interface PresentationLayoutResult {
  viewport: Size;
  slides: SlideLayoutResult[];
}

export interface LayoutEngine {
  computeSlide(slide: Slide, viewport: Size, options?: LayoutOptions): SlideLayoutResult;
  computePresentation(
    presentation: Presentation,
    viewport?: Size,
    options?: LayoutOptions
  ): PresentationLayoutResult;
}
