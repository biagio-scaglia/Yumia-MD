import { Presentation } from '@yumia/ast';
import { PresentationLayoutResult } from '@yumia/layout';
import { YumiaTheme } from '@yumia/theme';

export interface RenderContext {
  theme?: YumiaTheme;
  layout?: PresentationLayoutResult;
  options?: Record<string, unknown>;
}

export interface YumiaRenderer<TOutput = unknown> {
  readonly name: string;
  readonly targetFormat: string;
  render(presentation: Presentation, context?: RenderContext): Promise<TOutput>;
}
