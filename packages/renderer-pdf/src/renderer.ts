import { Presentation } from '@yumiamd/ast';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';

export interface PdfOutput {
  format: 'pdf';
  data: Uint8Array | ArrayBuffer;
  pageCount: number;
}

/**
 * PdfRenderer (Placeholder / Architecture Foundation)
 * Future implementation will compile presentation layouts into vector PDF documents.
 */
export class PdfRenderer implements YumiaRenderer<PdfOutput> {
  readonly name = 'PdfRenderer';
  readonly targetFormat = 'pdf';

  async render(presentation: Presentation, _context?: RenderContext): Promise<PdfOutput> {
    const pageCount = presentation.slides.length;
    return {
      format: 'pdf',
      data: new Uint8Array(),
      pageCount,
    };
  }
}
