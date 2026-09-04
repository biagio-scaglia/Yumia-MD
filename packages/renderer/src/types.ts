import { Presentation } from '@yumiamd/ast';
import { PresentationLayoutResult } from '@yumiamd/layout';
import { YumiaTheme } from '@yumiamd/theme';

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
