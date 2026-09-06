import * as fs from 'node:fs';
import { Diagnostic, Presentation, Slide } from '@yumiamd/ast';
import { DefaultLayoutEngine, LayoutEngine, PresentationLayoutResult, Size } from '@yumiamd/layout';
import { DefaultYumiaParser, ParserOptions, YumiaParser } from '@yumiamd/parser';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { defaultTheme, resolveTheme, YumiaTheme } from '@yumiamd/theme';
import { DocumentExplanation, LintOptions, LintReport, YumiaLinter } from './linter.js';

export interface CompilerConfig {
  parser?: YumiaParser;
  layoutEngine?: LayoutEngine;
  defaultTheme?: YumiaTheme;
  viewport?: Size;
}

export interface ValidationResult {
  valid: boolean;
  slideCount: number;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

export interface CompileOptions {
  parserOptions?: ParserOptions | undefined;
  renderContext?: Partial<RenderContext> | undefined;
  data?: Record<string, unknown> | unknown[] | string | undefined;
}

export class YumiaCompiler {
  private parser: YumiaParser;
  private layoutEngine: LayoutEngine;
  private defaultTheme: YumiaTheme;
  private linter: YumiaLinter;
  private viewport?: Size;

  constructor(config: CompilerConfig = {}) {
    this.parser = config.parser ?? new DefaultYumiaParser();
    this.layoutEngine = config.layoutEngine ?? new DefaultLayoutEngine();
    this.defaultTheme = config.defaultTheme ?? defaultTheme;
    this.linter = new YumiaLinter(this.layoutEngine);
    if (config.viewport) {
      this.viewport = config.viewport;
    }
  }

  parse(source: string, options?: ParserOptions): Presentation {
    return this.parser.parse(source, options);
  }

  validate(source: string): ValidationResult {
    const presentation = this.parse(source);
    const diagnostics = presentation.diagnostics || [];
    const errors = diagnostics.filter((d) => d.severity === 'error');
    const warnings = diagnostics.filter((d) => d.severity === 'warning');

    return {
      valid: errors.length === 0,
      slideCount: presentation.slides.length,
      errors,
      warnings,
    };
  }

  lint(sourceOrPresentation: string | Presentation, options?: LintOptions): LintReport {
    const presentation =
      typeof sourceOrPresentation === 'string'
        ? this.parse(sourceOrPresentation)
        : sourceOrPresentation;
    return this.linter.lint(presentation, {
      ...(this.viewport ? { viewport: this.viewport } : {}),
      ...options,
    });
  }

  explain(sourceOrPresentation: string | Presentation, options?: LintOptions): DocumentExplanation {
    const presentation =
      typeof sourceOrPresentation === 'string'
        ? this.parse(sourceOrPresentation)
        : sourceOrPresentation;
    return this.linter.explain(presentation, {
      ...(this.viewport ? { viewport: this.viewport } : {}),
      ...options,
    });
  }

  layout(presentation: Presentation, viewport?: Size): PresentationLayoutResult {
    return this.layoutEngine.computePresentation(presentation, viewport ?? this.viewport);
  }

  async render<TOutput>(
    presentation: Presentation,
    renderer: YumiaRenderer<TOutput>,
    contextOverrides: Partial<RenderContext> = {},
    data?: Record<string, unknown> | unknown[] | string
  ): Promise<TOutput> {
    const boundPresentation = data ? expandDataBindings(presentation, data) : presentation;
    const layout = contextOverrides.layout ?? this.layout(boundPresentation);
    const presentationTheme = boundPresentation.metadata.theme
      ? resolveTheme(boundPresentation.metadata.theme)
      : this.defaultTheme;
    const theme = contextOverrides.theme ?? presentationTheme;

    const context: RenderContext = {
      theme,
      layout,
      options: contextOverrides.options ?? {},
    };

    return renderer.render(boundPresentation, context);
  }

  async compile<TOutput>(
    source: string,
    renderer: YumiaRenderer<TOutput>,
    options?: CompileOptions
  ): Promise<TOutput> {
    let presentation = this.parse(source, options?.parserOptions);
    if (options?.data) {
      presentation = expandDataBindings(presentation, options.data);
    }
    return this.render(presentation, renderer, options?.renderContext, options?.data);
  }

  getSchema(): Record<string, unknown> {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'YumiaMDPresentation',
      type: 'object',
      description: 'YumiaMD semantic presentation structure and directive definitions',
      properties: {
        frontmatter: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            author: { type: 'string' },
            date: { type: 'string' },
            theme: {
              type: 'string',
              enum: ['default', 'cyberpunk', 'minimal', 'corporate', 'terminal', 'academic'],
            },
            aspectRatio: { enum: ['16:9', '4:3', '16:10'] },
          },
        },
        directives: {
          type: 'object',
          properties: {
            chart: {
              syntax: ':::chart type="bar|line|pie|doughnut" title="..." labels="..." data="..."',
              description:
                'Native editable chart for PowerPoint, PDF vector paths, and interactive SVG',
            },
            diagram: {
              syntax: ':::diagram [direction="LR|TB"]\\n[NodeA] -> [NodeB]\\n:::',
              description: 'Architecture and vector flow diagram blocks with native rendering',
            },
            mermaid: {
              syntax: ':::mermaid\\ngraph LR\\n  A --> B\\n:::',
              description: 'Flowcharts, sequence diagrams, and architecture maps via Mermaid',
            },
            timeline: {
              syntax:
                ':::timeline [layout="horizontal|vertical"]\\n- [Date] Title: Description\\n:::',
              description: 'Roadmap and milestone timeline nodes with connector lines',
            },
            compare: {
              syntax:
                ':::compare left="Left Title" right="Right Title"\\n- Left Item\\n:::vs\\n- Right Item\\n:::',
              description: 'Side-by-side comparison boxes with versus badge',
            },
            badge: {
              syntax:
                ':::badge text="..." [variant="primary|success|warning|danger|info|accent"] :::',
              description: 'Compact inline status pill element',
            },
            step: {
              syntax: ':::step\\nProgressive reveal content\\n:::',
              description: 'Click-to-reveal fragment step animation',
            },
            columns: {
              syntax: ':::columns [ratios="50:50"]\\n:::column\\n...\\n:::\\n:::',
              description: 'Multi-column grid layout',
            },
            card: {
              syntax: ':::card [Title] [variant="primary|success|warning|danger|info"]\\n...\\n:::',
              description: 'Visual container card with theme border and background',
            },
            metric: {
              syntax: ':::metric value="99.9%" label="Uptime" change="+0.4%" variant="success"',
              description: 'Stat callout box with prominent value, label, and trend',
            },
            notes: {
              syntax: ':::notes\\nSpeaker notes text\\n:::',
              description: 'Speaker notes attached to slide metadata',
            },
            quote: {
              syntax: ':::quote [Author]\\nQuote text\\n:::',
              description: 'Highlighted quotation with accent bar',
            },
            layout: {
              syntax: ':::layout [mode]',
              description: 'Slide layout mode directive',
            },
          },
        },
      },
    };
  }
}

// ---------------------------------------------------------
// Data-Binding & Templating Engine
// ---------------------------------------------------------

export function loadData(
  source: string | Record<string, unknown> | unknown[]
): Record<string, unknown> | unknown[] {
  if (typeof source !== 'string') return source;
  const trimmed = source.trim();

  // Try checking if it is a filepath on disk
  if (
    typeof process !== 'undefined' &&
    (trimmed.endsWith('.json') || trimmed.endsWith('.csv') || !trimmed.includes('\n'))
  ) {
    try {
      if (fs.existsSync(trimmed)) {
        const fileContent = fs.readFileSync(trimmed, 'utf8');
        return parseDataString(fileContent, trimmed.endsWith('.csv'));
      }
    } catch {
      // Fallback to direct parse
    }
  }

  return parseDataString(
    trimmed,
    trimmed.includes(',') && !trimmed.startsWith('{') && !trimmed.startsWith('[')
  );
}

export function parseDataString(
  content: string,
  forceCsv: boolean = false
): Record<string, unknown> | unknown[] {
  const trimmed = content.trim();
  if (!forceCsv && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore
    }
  }

  // Parse CSV
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const headerLine = lines[0]!;
  const headers = parseCsvLine(headerLine);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const row: Record<string, unknown> = {};
    headers.forEach((h, hIdx) => {
      const rawVal = cols[hIdx] ?? '';
      const num = Number(rawVal);
      row[h] = !isNaN(num) && rawVal !== '' ? num : rawVal;
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

export function evaluateInterpolation(text: string, context: Record<string, unknown>): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\{\{\s*([a-zA-Z0-9_$.]+)\s*\}\}/g, (match, expr) => {
    const val = resolvePath(context, expr);
    return val !== undefined && val !== null ? String(val) : match;
  });
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function deepInterpolate<T>(item: T, context: Record<string, unknown>): T {
  if (typeof item === 'string') {
    return evaluateInterpolation(item, context) as unknown as T;
  }
  if (Array.isArray(item)) {
    return item.map((el) => deepInterpolate(el, context)) as unknown as T;
  }
  if (item !== null && typeof item === 'object') {
    const res: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      res[key] = deepInterpolate(value, context);
    }
    return res as unknown as T;
  }
  return item;
}

export function expandDataBindings(
  presentation: Presentation,
  rawData?: Record<string, unknown> | unknown[] | string
): Presentation {
  if (!rawData) return presentation;
  const data = loadData(rawData);
  const rootContext: Record<string, unknown> = Array.isArray(data)
    ? { items: data, rows: data, data }
    : { ...(typeof data === 'object' && data !== null ? data : {}), data };

  const expandedSlides: Slide[] = [];

  for (const slide of presentation.slides) {
    if (slide.each) {
      const eachExpr = slide.each.trim();
      let itemName = 'item';
      let arrayExpr = eachExpr;
      const inMatch = eachExpr.match(/^(?:(?:\(([^,]+)(?:,\s*([^)]+))?\))|(\S+))\s+in\s+(.+)$/);
      if (inMatch) {
        itemName = (inMatch[1] || inMatch[3] || 'item').trim();
        arrayExpr = inMatch[4]!.trim();
      }

      const targetArray =
        resolvePath(rootContext, arrayExpr) ?? (Array.isArray(data) ? data : undefined);
      if (Array.isArray(targetArray)) {
        targetArray.forEach((item, index) => {
          const slideContext: Record<string, unknown> = {
            ...rootContext,
            [itemName]: item,
            index: index + 1,
            i: index,
            ...(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}),
          };
          const cloned = JSON.parse(JSON.stringify(slide)) as Slide;
          delete cloned.each;
          const interpolated = deepInterpolate(cloned, slideContext);
          expandedSlides.push(interpolated);
        });
        continue;
      }
    }

    // Default interpolate standard slide
    const cloned = JSON.parse(JSON.stringify(slide)) as Slide;
    const interpolated = deepInterpolate(cloned, rootContext);
    expandedSlides.push(interpolated);
  }

  const interpolatedMetadata = deepInterpolate(presentation.metadata, rootContext);
  return {
    ...presentation,
    metadata: interpolatedMetadata,
    slides: expandedSlides,
  };
}

// Top-level convenience exports
const defaultCompiler = new YumiaCompiler();

export function parse(source: string, options?: ParserOptions): Presentation {
  return defaultCompiler.parse(source, options);
}

export function validate(source: string): ValidationResult {
  return defaultCompiler.validate(source);
}

export function lint(
  sourceOrPresentation: string | Presentation,
  options?: LintOptions
): LintReport {
  return defaultCompiler.lint(sourceOrPresentation, options);
}
