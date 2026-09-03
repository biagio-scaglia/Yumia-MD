import { Presentation } from '@yumia/ast';
import { DefaultLayoutEngine, LayoutEngine, PresentationLayoutResult, Size } from '@yumia/layout';
import { DefaultYumiaParser, ParserOptions, YumiaParser } from '@yumia/parser';
import { RenderContext, YumiaRenderer } from '@yumia/renderer';
import { defaultTheme, YumiaTheme } from '@yumia/theme';

export interface CompilerConfig {
  parser?: YumiaParser;
  layoutEngine?: LayoutEngine;
  defaultTheme?: YumiaTheme;
  viewport?: Size;
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
}
