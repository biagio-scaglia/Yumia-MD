import { Presentation } from '@yumia/ast';
import { RenderContext, YumiaRenderer } from '@yumia/renderer';

export interface HtmlOutput {
  format: 'html';
  html: string;
  slideCount: number;
}

/**
 * HtmlRenderer (Placeholder / Architecture Foundation)
 * Future implementation will compile presentations into responsive HTML5 presentation decks.
 */
export class HtmlRenderer implements YumiaRenderer<HtmlOutput> {
  readonly name = 'HtmlRenderer';
  readonly targetFormat = 'html';

  async render(presentation: Presentation, _context?: RenderContext): Promise<HtmlOutput> {
    const slideCount = presentation.slides.length;
    return {
      format: 'html',
      html: `<!DOCTYPE html><html><head><title>${presentation.metadata.title ?? 'Presentation'}</title></head><body><div id="yumia-deck"></div></body></html>`,
      slideCount,
    };
  }
}
