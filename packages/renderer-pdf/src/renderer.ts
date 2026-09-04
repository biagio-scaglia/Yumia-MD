import PDFDocument from 'pdfkit';
import {
  CardElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  HeadingElement,
  ListElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  Slide,
  SlideElement,
  TableElement,
} from '@yumiamd/ast';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { defaultTheme, resolveTheme, ThemeOverrides, YumiaTheme } from '@yumiamd/theme';

export interface PdfOutput {
  format: 'pdf';
  data: Uint8Array;
  pageCount: number;
  slideCount: number;
}

export class PdfRenderer implements YumiaRenderer<PdfOutput> {
  readonly name = 'PdfRenderer';
  readonly targetFormat = 'pdf';

  async render(presentation: Presentation, context: RenderContext = {}): Promise<PdfOutput> {
    const colorOverrides = presentation.metadata.colors
      ? ({ colors: presentation.metadata.colors } as ThemeOverrides)
      : undefined;
    const resolvedTheme = resolveTheme(presentation.metadata.theme, colorOverrides);
    const theme = context.theme || resolvedTheme || defaultTheme;

    const is43 = presentation.metadata.aspectRatio === '4:3';
    const pageWidth = is43 ? 720 : 960;
    const pageHeight = 540;

    return new Promise((resolvePromise, rejectPromise) => {
      try {
        const doc = new PDFDocument({
          autoFirstPage: false,
          margin: 0,
          info: {
            Title: presentation.metadata.title || 'YumiaMD Presentation',
            Author: presentation.metadata.author || 'YumiaMD',
            Creator: 'YumiaMD Vector PDF Compiler',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolvePromise({
            format: 'pdf',
            data: new Uint8Array(buffer),
            pageCount: presentation.slides.length,
            slideCount: presentation.slides.length,
          });
        });
        doc.on('error', (err) => rejectPromise(err));

        const totalSlides = presentation.slides.length;
        for (let i = 0; i < totalSlides; i++) {
          const slide = presentation.slides[i]!;
          this.renderSlide(doc, slide, i + 1, totalSlides, pageWidth, pageHeight, theme);
        }

        doc.end();
      } catch (err) {
        rejectPromise(err);
      }
    });
  }

  private renderSlide(
    doc: PDFKit.PDFDocument,
    slide: Slide,
    slideNum: number,
    totalSlides: number,
    pageWidth: number,
    pageHeight: number,
    theme: YumiaTheme
  ): void {
    doc.addPage({
      size: [pageWidth, pageHeight],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // 1. Fill Slide Background
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.colors.background);

    // 2. Padding and usable content boundaries
    const padX = pageWidth * 0.06;
    const padY = pageHeight * 0.08;
    const contentWidth = pageWidth - padX * 2;
    let cursorY = padY;

    // 3. Render slide elements sequentially
    for (const element of slide.elements) {
      cursorY = this.renderElement(doc, element, padX, cursorY, contentWidth, theme);
      cursorY += 12; // Gap between root blocks
    }

    // 4. Slide Footer & Progress bar
    const progressWidth = (slideNum / totalSlides) * pageWidth;
    doc.rect(0, pageHeight - 4, progressWidth, 4).fill(theme.colors.primary);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(theme.colors.muted || '#888888')
      .text(`${slideNum} / ${totalSlides}`, pageWidth - padX - 60, pageHeight - 24, {
        width: 60,
        align: 'right',
      });
  }

  private renderElement(
    doc: PDFKit.PDFDocument,
    element: SlideElement,
    x: number,
    y: number,
    width: number,
    theme: YumiaTheme
  ): number {
    switch (element.type) {
      case 'heading': {
        const h = element as HeadingElement;
        const fontSize = h.level === 1 ? 28 : h.level === 2 ? 22 : 18;
        const color = h.level === 1 ? theme.colors.primary : theme.colors.text;

        doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(color);
        doc.text(this.stripFormatting(h.text), x, y, { width, lineGap: 4 });
        const height = doc.heightOfString(this.stripFormatting(h.text), { width });
        return y + height;
      }

      case 'paragraph': {
        const p = element as ParagraphElement;
        doc.font('Helvetica').fontSize(14).fillColor(theme.colors.text);
        doc.text(this.stripFormatting(p.text), x, y, { width, lineGap: 4 });
        const height = doc.heightOfString(this.stripFormatting(p.text), { width });
        return y + height;
      }

      case 'list': {
        const l = element as ListElement;
        let currentY = y;
        const itemGap = 6;

        l.items.forEach((item, idx) => {
          const bullet = l.ordered ? `${idx + 1}.` : '•';
          doc
            .font('Helvetica-Bold')
            .fontSize(13)
            .fillColor(theme.colors.primary)
            .text(bullet, x, currentY, { width: 18 });

          doc
            .font('Helvetica')
            .fontSize(13)
            .fillColor(theme.colors.text)
            .text(this.stripFormatting(item.text), x + 20, currentY, {
              width: width - 20,
              lineGap: 3,
            });

          const itemHeight = Math.max(
            18,
            doc.heightOfString(this.stripFormatting(item.text), { width: width - 20 })
          );
          currentY += itemHeight + itemGap;
        });

        return currentY;
      }

      case 'quote': {
        const q = element as QuoteElement;
        const quoteText = `“${this.stripFormatting(q.text)}”`;
        const authorText = q.author ? `— ${this.stripFormatting(q.author)}` : '';

        doc
          .font('Helvetica-Oblique')
          .fontSize(13)
          .fillColor(theme.colors.muted || '#aaaaaa');
        const textHeight = doc.heightOfString(quoteText, { width: width - 24 });
        const authorHeight = authorText ? 18 : 0;
        const totalHeight = textHeight + authorHeight + 16;

        // Background box
        doc
          .roundedRect(x, y, width, totalHeight, 6)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.05)');

        // Accent border bar
        doc.rect(x, y, 4, totalHeight).fill(theme.colors.accent || theme.colors.primary);

        doc
          .font('Helvetica-Oblique')
          .fontSize(13)
          .fillColor(theme.colors.text)
          .text(quoteText, x + 16, y + 8, { width: width - 28 });

        if (authorText) {
          doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor(theme.colors.muted || '#888888')
            .text(authorText, x + 16, y + 8 + textHeight + 4, { width: width - 28 });
        }

        return y + totalHeight;
      }

      case 'code': {
        const c = element as CodeElement;
        const codeText = c.code;
        doc.font('Courier').fontSize(11);
        const textHeight = doc.heightOfString(codeText, { width: width - 24 });
        const boxHeight = textHeight + 20;

        doc
          .roundedRect(x, y, width, boxHeight, 6)
          .fill('#0a0a10')
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
          .stroke();

        doc
          .font('Courier')
          .fontSize(11)
          .fillColor(theme.colors.accent || '#38bdf8')
          .text(codeText, x + 12, y + 10, { width: width - 24 });

        return y + boxHeight;
      }

      case 'card': {
        const card = element as CardElement;
        const variantColor = this.getVariantColor(card.variant, theme);
        const cardPad = 14;
        let cardCursorY = y + cardPad;

        if (card.title) {
          doc
            .font('Helvetica-Bold')
            .fontSize(15)
            .fillColor(variantColor)
            .text(this.stripFormatting(card.title), x + cardPad, cardCursorY, {
              width: width - cardPad * 2,
            });
          cardCursorY += 22;
        }

        if (card.elements) {
          for (const child of card.elements) {
            cardCursorY = this.renderElement(
              doc,
              child,
              x + cardPad,
              cardCursorY,
              width - cardPad * 2,
              theme
            );
            cardCursorY += 8;
          }
        }

        const totalCardHeight = Math.max(70, cardCursorY - y + cardPad);

        // Draw card background & border
        doc.save();
        doc
          .roundedRect(x, y, width, totalCardHeight, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, width, totalCardHeight, 8)
          .lineWidth(1.5)
          .strokeColor(variantColor)
          .stroke();
        doc.restore();

        // Re-render text on top of filled rectangle
        let renderTop = y + cardPad;
        if (card.title) {
          doc
            .font('Helvetica-Bold')
            .fontSize(15)
            .fillColor(variantColor)
            .text(this.stripFormatting(card.title), x + cardPad, renderTop, {
              width: width - cardPad * 2,
            });
          renderTop += 22;
        }

        if (card.elements) {
          for (const child of card.elements) {
            renderTop = this.renderElement(
              doc,
              child,
              x + cardPad,
              renderTop,
              width - cardPad * 2,
              theme
            );
            renderTop += 8;
          }
        }

        return y + totalCardHeight;
      }

      case 'metric': {
        const m = element as MetricElement;
        const variantColor = this.getVariantColor(m.variant, theme);
        const boxHeight = 90;

        doc
          .roundedRect(x, y, width, boxHeight, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, width, boxHeight, 8)
          .lineWidth(1.5)
          .strokeColor(variantColor)
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(theme.colors.muted || '#888888')
          .text(m.label.toUpperCase(), x + 16, y + 14, { width: width - 32 });

        const displayVal = m.unit ? `${m.value} ${m.unit}` : m.value;
        doc
          .font('Helvetica-Bold')
          .fontSize(28)
          .fillColor(theme.colors.primary)
          .text(displayVal, x + 16, y + 32, { width: width - 32 });

        if (m.change) {
          const changeColor = m.change.startsWith('+') ? '#10b981' : '#ef4444';
          doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor(changeColor)
            .text(m.change, x + width - 90, y + 38, { width: 74, align: 'right' });
        }

        return y + boxHeight;
      }

      case 'columns': {
        const cols = element as ColumnsElement;
        const colCount = cols.columns.length;
        const gap = 16;
        const availableWidth = width - gap * (colCount - 1);

        let ratios = Array(colCount).fill(1);
        if (cols.ratios) {
          const parsed = cols.ratios.split(':').map((r) => parseFloat(r) || 1);
          if (parsed.length === colCount) ratios = parsed;
        }
        const totalRatio = ratios.reduce((a, b) => a + b, 0);

        let curX = x;
        let maxY = y;

        for (let i = 0; i < colCount; i++) {
          const col = cols.columns[i] as ColumnElement;
          const colWidth = (ratios[i]! / totalRatio) * availableWidth;
          let colCursorY = y;

          for (const child of col.elements) {
            colCursorY = this.renderElement(doc, child, curX, colCursorY, colWidth, theme);
            colCursorY += 8;
          }

          if (colCursorY > maxY) maxY = colCursorY;
          curX += colWidth + gap;
        }

        return maxY;
      }

      case 'table': {
        const t = element as TableElement;
        const headers = t.headers || [];
        const rows = t.rows || [];
        const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);
        const colWidth = width / colCount;
        const rowHeight = 26;

        let curY = y;

        // Header
        if (headers.length > 0) {
          doc.rect(x, curY, width, rowHeight).fill(theme.colors.primary);
          headers.forEach((h, idx) => {
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .fillColor('#ffffff')
              .text(this.stripFormatting(h), x + idx * colWidth + 6, curY + 6, {
                width: colWidth - 12,
              });
          });
          curY += rowHeight;
        }

        // Rows
        rows.forEach((row, rowIdx) => {
          const isEven = rowIdx % 2 === 0;
          const rowBg = isEven
            ? theme.colors.surface || 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.01)';
          doc.rect(x, curY, width, rowHeight).fill(rowBg);

          row.forEach((cell, idx) => {
            doc
              .font('Helvetica')
              .fontSize(11)
              .fillColor(theme.colors.text)
              .text(this.stripFormatting(cell), x + idx * colWidth + 6, curY + 6, {
                width: colWidth - 12,
              });
          });
          curY += rowHeight;
        });

        // Table outer border
        doc
          .rect(x, y, width, curY - y)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
          .stroke();

        return curY;
      }

      default:
        return y;
    }
  }

  private getVariantColor(variant: string | undefined, theme: YumiaTheme): string {
    switch (variant) {
      case 'warning':
        return theme.colors.warning || '#f59e0b';
      case 'info':
        return theme.colors.info || '#3b82f6';
      case 'success':
        return theme.colors.success || '#10b981';
      case 'danger':
        return theme.colors.danger || '#ef4444';
      case 'primary':
      default:
        return theme.colors.primary;
    }
  }

  private stripFormatting(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1');
  }
}
