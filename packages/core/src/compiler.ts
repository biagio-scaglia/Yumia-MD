import { Diagnostic, Presentation } from '@yumiamd/ast';
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
    contextOverrides: Partial<RenderContext> = {}
  ): Promise<TOutput> {
    const layout = contextOverrides.layout ?? this.layout(presentation);
    const presentationTheme = presentation.metadata.theme
      ? resolveTheme(presentation.metadata.theme)
      : this.defaultTheme;
    const theme = contextOverrides.theme ?? presentationTheme;

    const context: RenderContext = {
      theme,
      layout,
      options: contextOverrides.options ?? {},
    };

    return renderer.render(presentation, context);
  }

  async compile<TOutput>(
    source: string,
    renderer: YumiaRenderer<TOutput>,
    options?: {
      parserOptions?: ParserOptions;
      renderContext?: Partial<RenderContext>;
    }
  ): Promise<TOutput> {
    const presentation = this.parse(source, options?.parserOptions);
    return this.render(presentation, renderer, options?.renderContext);
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
