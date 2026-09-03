/**
 * Semantic AST definitions for YumiaMD presentations.
 * This package is strictly decoupled from any rendering or parser implementation.
 */

export type SlideLayout = 'stack' | 'columns' | 'split' | 'hero' | 'grid' | string;

export interface ThemeReference {
  name: string;
  path?: string;
  overrides?: Record<string, unknown>;
}

export interface PresentationMetadata {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  theme?: string | ThemeReference;
  aspectRatio?: '16:9' | '4:3' | '16:10' | string;
  custom?: Record<string, unknown>;
}

export interface SlideBackground {
  type: 'color' | 'image' | 'gradient';
  value: string;
  opacity?: number;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface HeadingElement {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  align?: TextAlignment;
}

export interface ParagraphElement {
  type: 'paragraph';
  text: string;
  align?: TextAlignment;
}

export interface ListItem {
  text: string;
  depth?: number;
  children?: SlideElement[];
}

export interface ListElement {
  type: 'list';
  ordered: boolean;
  items: ListItem[];
}

export interface ImageElement {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  width?: number | string;
  height?: number | string;
}

export interface CardElement {
  type: 'card';
  title?: string;
  elements: SlideElement[];
  variant?: 'default' | 'outlined' | 'filled';
}

export interface CodeElement {
  type: 'code';
  code: string;
  language?: string;
  highlightLines?: number[];
}

export interface QuoteElement {
  type: 'quote';
  text: string;
  author?: string;
  citation?: string;
}

export interface TableElement {
  type: 'table';
  headers?: string[];
  rows: string[][];
  alignments?: TextAlignment[];
}

export interface GroupElement {
  type: 'group';
  direction: 'row' | 'column';
  elements: SlideElement[];
  gap?: number | string;
}

export interface ColumnElement {
  type: 'column';
  elements: SlideElement[];
  width?: string | number;
}

export interface ColumnsElement {
  type: 'columns';
  columns: ColumnElement[];
  ratios?: string;
  gap?: number | string;
}

export interface LayoutDirectiveElement {
  type: 'layout-directive';
  mode: string;
  attributes?: Record<string, string>;
}

export type SlideElement =
  | HeadingElement
  | ParagraphElement
  | ListElement
  | ImageElement
  | CardElement
  | CodeElement
  | QuoteElement
  | TableElement
  | GroupElement
  | ColumnElement
  | ColumnsElement
  | LayoutDirectiveElement;

export interface Slide {
  id?: string;
  layout?: SlideLayout;
  background?: SlideBackground;
  elements: SlideElement[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface Presentation {
  metadata: PresentationMetadata;
  slides: Slide[];
}
