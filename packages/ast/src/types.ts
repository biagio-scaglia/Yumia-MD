/**
 * Semantic AST definitions for YumiaMD presentations.
 * This package is strictly decoupled from any rendering or parser implementation.
 */

export interface SourcePosition {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  code: string;
  message: string;
  severity: DiagnosticSeverity;
  loc?: SourceLocation;
  suggestion?: string;
}

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
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    surface?: string;
    text?: string;
    muted?: string;
    accent?: string;
    border?: string;
  };
  custom?: Record<string, unknown>;
}

export interface SlideBackground {
  type: 'color' | 'image' | 'gradient';
  value: string;
  opacity?: number;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface BaseElement {
  loc?: SourceLocation;
}

export interface HeadingElement extends BaseElement {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  align?: TextAlignment;
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  text: string;
  align?: TextAlignment;
}

export interface ListItem extends BaseElement {
  text: string;
  depth?: number;
  children?: SlideElement[];
}

export interface ListElement extends BaseElement {
  type: 'list';
  ordered: boolean;
  items: ListItem[];
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  width?: number | string;
  height?: number | string;
}

export interface CardElement extends BaseElement {
  type: 'card';
  title?: string;
  elements: SlideElement[];
  variant?: 'default' | 'outlined' | 'filled' | 'warning' | 'success' | 'info' | 'accent' | string;
}

export interface MetricElement extends BaseElement {
  type: 'metric';
  value: string;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'primary' | 'info' | string;
  unit?: string;
  change?: string;
  description?: string;
}

export interface CodeElement extends BaseElement {
  type: 'code';
  code: string;
  language?: string;
  highlightLines?: number[];
}

export interface QuoteElement extends BaseElement {
  type: 'quote';
  text: string;
  author?: string;
  citation?: string;
}

export interface TableElement extends BaseElement {
  type: 'table';
  headers?: string[];
  rows: string[][];
  alignments?: TextAlignment[];
}

export interface GroupElement extends BaseElement {
  type: 'group';
  direction: 'row' | 'column';
  elements: SlideElement[];
  gap?: number | string;
}

export interface ColumnElement extends BaseElement {
  type: 'column';
  elements: SlideElement[];
  width?: string | number;
}

export interface ColumnsElement extends BaseElement {
  type: 'columns';
  columns: ColumnElement[];
  ratios?: string;
  gap?: number | string;
}

export interface LayoutDirectiveElement extends BaseElement {
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
  | MetricElement
  | CodeElement
  | QuoteElement
  | TableElement
  | GroupElement
  | ColumnElement
  | ColumnsElement
  | LayoutDirectiveElement;

export interface Slide extends BaseElement {
  id?: string;
  layout?: SlideLayout;
  background?: SlideBackground;
  elements: SlideElement[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface Presentation extends BaseElement {
  metadata: PresentationMetadata;
  slides: Slide[];
  diagnostics?: Diagnostic[];
}
