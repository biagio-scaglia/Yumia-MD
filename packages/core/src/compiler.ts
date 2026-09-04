import { Diagnostic, Presentation } from '@yumiamd/ast';
import { DefaultLayoutEngine, LayoutEngine, PresentationLayoutResult, Size } from '@yumiamd/layout';
import { DefaultYumiaParser, ParserOptions, YumiaParser } from '@yumiamd/parser';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { defaultTheme, YumiaTheme } from '@yumiamd/theme';

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
  private viewport?: Size;

  constructor(config: CompilerConfig = {}) {
    this.parser = config.parser ?? new DefaultYumiaParser();
    this.layoutEngine = config.layoutEngine ?? new DefaultLayoutEngine();
    this.defaultTheme = config.defaultTheme ?? defaultTheme;
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

  layout(presentation: Presentation, viewport?: Size): PresentationLayoutResult {
    return this.layoutEngine.computePresentation(presentation, viewport ?? this.viewport);
  }

  async render<TOutput>(
    presentation: Presentation,
    renderer: YumiaRenderer<TOutput>,
    contextOverrides: Partial<RenderContext> = {}
  ): Promise<TOutput> {
    const layout = contextOverrides.layout ?? this.layout(presentation);
    const theme = contextOverrides.theme ?? this.defaultTheme;

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
            theme: { type: 'string' },
            aspectRatio: { enum: ['16:9', '4:3', '16:10'] },
          },
        },
        directives: {
          type: 'object',
          properties: {
            columns: {
              syntax: ':::columns [ratios="50:50"]\\n:::column\\n...\\n:::\\n:::',
              description: 'Multi-column grid layout',
            },
            card: {
              syntax: ':::card [Title]\\n...\\n:::',
              description: 'Visual container card with theme border and background',
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
