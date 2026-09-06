import PDFDocument from 'pdfkit';
import {
  BadgeElement,
  CalloutElement,
  CardElement,
  ChartElement,
  ClassDiagramElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  CompareElement,
  DiagramElement,
  GridElement,
  HeadingElement,
  HeroElement,
  IconElement,
  ListElement,
  MathElement,
  MermaidElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  SectionElement,
  SequenceElement,
  Slide,
  SlideElement,
  StackElement,
  TableElement,
  TimelineElement,
  TocElement,
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

  private getPdfFont(
    theme: YumiaTheme,
    weight: 'regular' | 'bold' | 'italic' | 'boldItalic' | 'code' = 'regular'
  ): string {
    const headingFont = (theme.typography?.headingFont || '').toLowerCase();
    const isSerif =
      headingFont.includes('serif') ||
      headingFont.includes('times') ||
      headingFont.includes('georgia') ||
      theme.name === 'academic';
    const isMono =
      headingFont.includes('mono') ||
      headingFont.includes('courier') ||
      headingFont.includes('code') ||
      theme.name === 'terminal';

    if (weight === 'code' || isMono) {
      if (weight === 'bold' || weight === 'boldItalic') return 'Courier-Bold';
      if (weight === 'italic') return 'Courier-Oblique';
      return 'Courier';
    }

    if (isSerif) {
      if (weight === 'bold') return 'Times-Bold';
      if (weight === 'italic') return 'Times-Italic';
      if (weight === 'boldItalic') return 'Times-BoldItalic';
      return 'Times-Roman';
    }

    if (weight === 'bold') return 'Helvetica-Bold';
    if (weight === 'italic') return 'Helvetica-Oblique';
    if (weight === 'boldItalic') return 'Helvetica-BoldOblique';
    return 'Helvetica';
  }

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
          this.renderSlide(
            doc,
            slide,
            i + 1,
            totalSlides,
            pageWidth,
            pageHeight,
            theme,
            presentation
          );
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
    theme: YumiaTheme,
    presentation?: Presentation
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
      cursorY = this.renderElement(doc, element, padX, cursorY, contentWidth, theme, presentation);
      cursorY += 12; // Gap between root blocks
    }

    // 4. Slide Footer, Watermark & Progress bar
    const progressWidth = (slideNum / totalSlides) * pageWidth;
    doc.rect(0, pageHeight - 4, progressWidth, 4).fill(theme.colors.primary);

    if (presentation?.metadata.watermark) {
      const watermarkText =
        typeof presentation.metadata.watermark === 'string'
          ? presentation.metadata.watermark
          : 'CONFIDENTIAL';
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(9)
        .fillColor(theme.colors.muted || '#888888')
        .text(watermarkText.toUpperCase(), padX, pageHeight - 22, {
          width: contentWidth - 80,
          align: 'left',
        });
    }

    doc
      .font(this.getPdfFont(theme, 'regular'))
      .fontSize(10)
      .fillColor(theme.colors.muted || '#888888')
      .text(`${slideNum} / ${totalSlides}`, pageWidth - padX - 60, pageHeight - 22, {
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
    theme: YumiaTheme,
    presentation?: Presentation
  ): number {
    switch (element.type) {
      case 'hero': {
        const hero = element as HeroElement;
        const align = (hero.align as 'left' | 'center' | 'right') || 'center';
        let curY = y;
        if (hero.tagline) {
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(11).fillColor(theme.colors.primary);
          doc.text(this.stripFormatting(hero.tagline).toUpperCase(), x, curY, { width, align });
          curY += 22;
        }
        doc.font(this.getPdfFont(theme, 'bold')).fontSize(32).fillColor(theme.colors.text);
        doc.text(this.stripFormatting(hero.title), x, curY, { width, lineGap: 6, align });
        curY += doc.heightOfString(this.stripFormatting(hero.title), { width }) + 10;
        if (hero.subtitle) {
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(15)
            .fillColor(theme.colors.muted || '#888888');
          doc.text(this.stripFormatting(hero.subtitle), x, curY, { width, lineGap: 4, align });
          curY += doc.heightOfString(this.stripFormatting(hero.subtitle), { width }) + 14;
        }
        if (hero.elements) {
          for (const child of hero.elements) {
            curY = this.renderElement(doc, child, x, curY, width, theme, presentation) + 8;
          }
        }
        return curY;
      }

      case 'callout': {
        const c = element as CalloutElement;
        const sevColor =
          c.severity === 'warning'
            ? theme.colors.warning || '#f59e0b'
            : c.severity === 'danger'
              ? theme.colors.danger || '#ef4444'
              : c.severity === 'success'
                ? theme.colors.success || '#10b981'
                : theme.colors.info || theme.colors.primary;

        doc.font(this.getPdfFont(theme, 'regular')).fontSize(12);
        const textH = doc.heightOfString(this.stripFormatting(c.text), { width: width - 30 });
        const titleH = c.title ? 20 : 0;
        const totalH = textH + titleH + 16;

        doc.roundedRect(x, y, width, totalH, 6).fill(theme.colors.surface || '#151522');
        doc.rect(x, y, 4, totalH).fill(sevColor);

        let curY = y + 8;
        if (c.title) {
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(12).fillColor(sevColor);
          doc.text(this.stripFormatting(c.title), x + 16, curY, { width: width - 26 });
          curY += 18;
        }
        doc.font(this.getPdfFont(theme, 'regular')).fontSize(12).fillColor(theme.colors.text);
        doc.text(this.stripFormatting(c.text), x + 16, curY, { width: width - 26 });

        return y + totalH + 8;
      }

      case 'heading': {
        const h = element as HeadingElement;
        const fontSize = h.level === 1 ? 28 : h.level === 2 ? 22 : 18;
        const color = h.level === 1 ? theme.colors.primary : theme.colors.text;

        doc.font(this.getPdfFont(theme, 'bold')).fontSize(fontSize).fillColor(color);
        doc.text(this.stripFormatting(h.text), x, y, { width, lineGap: 4 });
        const height = doc.heightOfString(this.stripFormatting(h.text), { width });
        return y + height;
      }

      case 'paragraph': {
        const p = element as ParagraphElement;
        doc.font(this.getPdfFont(theme, 'regular')).fontSize(14).fillColor(theme.colors.text);
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
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(13)
            .fillColor(theme.colors.primary)
            .text(bullet, x, currentY, { width: 18 });

          doc
            .font(this.getPdfFont(theme, 'regular'))
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
          .font(this.getPdfFont(theme, 'italic'))
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
          .font(this.getPdfFont(theme, 'italic'))
          .fontSize(13)
          .fillColor(theme.colors.text)
          .text(quoteText, x + 16, y + 8, { width: width - 28 });

        if (authorText) {
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(11)
            .fillColor(theme.colors.muted || '#888888')
            .text(authorText, x + 16, y + 8 + textHeight + 4, { width: width - 28 });
        }

        return y + totalHeight;
      }

      case 'code': {
        const c = element as CodeElement;
        const lines = c.code.split('\n');
        doc.font(this.getPdfFont(theme, 'code')).fontSize(10);
        const lineHeight = 14;
        const boxHeight = lines.length * lineHeight + 20;

        doc
          .roundedRect(x, y, width, boxHeight, 6)
          .fill('#0a0a10')
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
          .stroke();

        const highlightSet = new Set<number>();
        if (c.highlight) {
          const parts = c.highlight.split(',');
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            if (trimmed.includes('-')) {
              const [startStr, endStr] = trimmed.split('-');
              const start = parseInt(startStr || '0', 10);
              const end = parseInt(endStr || '0', 10);
              if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let n = start; n <= end; n++) highlightSet.add(n);
              }
            } else {
              const num = parseInt(trimmed, 10);
              if (!isNaN(num)) highlightSet.add(num);
            }
          }
        }

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          const lineY = y + 10 + idx * lineHeight;
          const isHl = highlightSet.has(lineNum);

          const numColor = isHl ? theme.colors.primary : theme.colors.muted || '#555566';
          const textColor = c.highlight
            ? isHl
              ? theme.colors.primary || '#00f0ff'
              : theme.colors.muted || '#666677'
            : theme.colors.accent || '#38bdf8';

          doc
            .font(this.getPdfFont(theme, 'code'))
            .fontSize(9)
            .fillColor(numColor)
            .text(String(lineNum).padStart(2, ' '), x + 10, lineY, { width: 22 });

          doc
            .font(this.getPdfFont(theme, 'code'))
            .fontSize(10)
            .fillColor(textColor)
            .text(line || ' ', x + 36, lineY, { width: width - 48 });
        });

        return y + boxHeight;
      }

      case 'card': {
        const card = element as CardElement;
        const variantColor = this.getVariantColor(card.variant, theme);
        const cardPad = 14;

        // Estimate total card height without pre-drawing text
        let estHeight = cardPad * 2;
        if (card.title) {
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(15);
          estHeight +=
            doc.heightOfString(this.stripFormatting(card.title), { width: width - cardPad * 2 }) +
            8;
        }
        if (card.elements) {
          for (const child of card.elements) {
            if (child.type === 'metric') estHeight += 95;
            else if (child.type === 'paragraph') {
              doc.font(this.getPdfFont(theme, 'regular')).fontSize(12);
              estHeight +=
                doc.heightOfString(this.stripFormatting((child as ParagraphElement).text), {
                  width: width - cardPad * 2,
                }) + 8;
            } else {
              estHeight += 45;
            }
          }
        }
        const totalCardHeight = Math.max(80, estHeight);

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

        // Render card content once
        let renderTop = y + cardPad;
        if (card.title) {
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(15)
            .fillColor(variantColor)
            .text(this.stripFormatting(card.title), x + cardPad, renderTop, {
              width: width - cardPad * 2,
            });
          renderTop +=
            doc.heightOfString(this.stripFormatting(card.title), { width: width - cardPad * 2 }) +
            8;
        }

        if (card.elements) {
          for (const child of card.elements) {
            renderTop =
              this.renderElement(
                doc,
                child,
                x + cardPad,
                renderTop,
                width - cardPad * 2,
                theme,
                presentation
              ) + 6;
          }
        }

        return y + totalCardHeight;
      }

      case 'metric': {
        const m = element as MetricElement;
        const variantColor = this.getVariantColor(m.variant, theme);
        const boxHeight = 85;

        doc
          .roundedRect(x, y, width, boxHeight, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, width, boxHeight, 8)
          .lineWidth(1.5)
          .strokeColor(variantColor)
          .stroke();

        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(10)
          .fillColor(theme.colors.muted || '#888888')
          .text(m.label.toUpperCase(), x + 14, y + 12, { width: width - 28 });

        const displayVal = m.unit ? `${m.value} ${m.unit}` : m.value;
        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(26)
          .fillColor(variantColor)
          .text(displayVal, x + 14, y + 28, { width: width - 28 });

        if (m.change) {
          const changeColor = m.change.startsWith('+') ? '#10b981' : '#ef4444';
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(11)
            .fillColor(changeColor)
            .text(m.change, x + width - 85, y + 34, { width: 70, align: 'right' });
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
            colCursorY = this.renderElement(
              doc,
              child,
              curX,
              colCursorY,
              colWidth,
              theme,
              presentation
            );
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
              .font(this.getPdfFont(theme, 'bold'))
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
              .font(this.getPdfFont(theme, 'regular'))
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

      case 'badge': {
        const b = element as BadgeElement;
        const variantColor = this.getVariantColor(b.variant, theme);
        const text = this.stripFormatting(b.text).toUpperCase();
        const badgeW = Math.min(260, Math.max(70, text.length * 7.5 + 24));
        const badgeH = 24;
        const badgeX = width > 400 ? x + (width - badgeW) / 2 : x;

        doc
          .roundedRect(badgeX, y, badgeW, badgeH, 12)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.08)');
        doc
          .roundedRect(badgeX, y, badgeW, badgeH, 12)
          .lineWidth(1.2)
          .strokeColor(variantColor)
          .stroke();

        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(9.5)
          .fillColor(variantColor)
          .text(text, badgeX, y + 6, { width: badgeW, align: 'center' });

        return y + badgeH + 6;
      }

      case 'timeline': {
        const t = element as TimelineElement;
        const items = t.items || [];
        if (items.length === 0) return y;

        const itemW = (width - (items.length - 1) * 12) / items.length;
        const lineY = y + 14;

        doc
          .moveTo(x + 10, lineY)
          .lineTo(x + width - 10, lineY)
          .lineWidth(2)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.2)')
          .stroke();

        let maxItemH = 60;
        items.forEach((item, idx) => {
          const itemX = x + idx * (itemW + 12);
          const dotX = itemX + itemW / 2;

          // Milestone dot
          doc.circle(dotX, lineY, 6).fill(theme.colors.primary);

          let curItemY = lineY + 12;
          if (item.date) {
            doc
              .font(this.getPdfFont(theme, 'bold'))
              .fontSize(10)
              .fillColor(theme.colors.accent || theme.colors.primary)
              .text(this.stripFormatting(item.date), itemX, curItemY, {
                width: itemW,
                align: 'center',
              });
            curItemY += 14;
          }

          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(12)
            .fillColor(theme.colors.text)
            .text(this.stripFormatting(item.title), itemX, curItemY, {
              width: itemW,
              align: 'center',
            });
          curItemY += 16;

          if (item.description) {
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(9)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(item.description), itemX, curItemY, {
                width: itemW,
                align: 'center',
              });
            curItemY += 24;
          }

          if (curItemY - y > maxItemH) maxItemH = curItemY - y;
        });

        return y + maxItemH + 8;
      }

      case 'compare': {
        const c = element as CompareElement;
        const colW = (width - 32) / 2;
        const pad = 14;

        // 1. Calculate left content height
        let leftContentH = 0;
        if (c.leftTitle) leftContentH += 24;
        for (const el of c.left) {
          if (el.type === 'metric') leftContentH += 95;
          else if (el.type === 'paragraph') {
            doc.font(this.getPdfFont(theme, 'regular')).fontSize(12);
            leftContentH +=
              doc.heightOfString(this.stripFormatting((el as ParagraphElement).text), {
                width: colW - pad * 2,
              }) + 8;
          } else if (el.type === 'badge') leftContentH += 32;
          else leftContentH += 45;
        }

        // 2. Calculate right content height
        let rightContentH = 0;
        if (c.rightTitle) rightContentH += 24;
        for (const el of c.right) {
          if (el.type === 'metric') rightContentH += 95;
          else if (el.type === 'paragraph') {
            doc.font(this.getPdfFont(theme, 'regular')).fontSize(12);
            rightContentH +=
              doc.heightOfString(this.stripFormatting((el as ParagraphElement).text), {
                width: colW - pad * 2,
              }) + 8;
          } else if (el.type === 'badge') rightContentH += 32;
          else rightContentH += 45;
        }

        const totalH = Math.max(leftContentH, rightContentH, 90) + pad * 2;
        const rightX = x + colW + 32;

        // Draw left container
        doc.save();
        doc
          .roundedRect(x, y, colW, totalH, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, colW, totalH, 8)
          .lineWidth(1.5)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)')
          .stroke();

        // Draw right container
        doc
          .roundedRect(rightX, y, colW, totalH, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(rightX, y, colW, totalH, 8)
          .lineWidth(1.5)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)')
          .stroke();

        // Middle VS Badge
        const vsX = x + colW + 4;
        const vsY = y + totalH / 2 - 12;
        doc.roundedRect(vsX, vsY, 24, 24, 12).fill(theme.colors.surface || '#151522');
        doc
          .roundedRect(vsX, vsY, 24, 24, 12)
          .lineWidth(1)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.2)')
          .stroke();
        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(9)
          .fillColor(theme.colors.muted || '#888888')
          .text('VS', vsX, vsY + 7, { width: 24, align: 'center' });
        doc.restore();

        // Render left content
        let leftY = y + pad;
        if (c.leftTitle) {
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(14)
            .fillColor(theme.colors.primary)
            .text(this.stripFormatting(c.leftTitle), x + pad, leftY, { width: colW - pad * 2 });
          leftY += 24;
        }
        for (const el of c.left) {
          leftY =
            this.renderElement(doc, el, x + pad, leftY, colW - pad * 2, theme, presentation) + 6;
        }

        // Render right content
        let rightY = y + pad;
        if (c.rightTitle) {
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(14)
            .fillColor(theme.colors.primary)
            .text(this.stripFormatting(c.rightTitle), rightX + pad, rightY, {
              width: colW - pad * 2,
            });
          rightY += 24;
        }
        for (const el of c.right) {
          rightY =
            this.renderElement(doc, el, rightX + pad, rightY, colW - pad * 2, theme, presentation) +
            6;
        }

        return y + totalH + 8;
      }

      case 'chart': {
        const ch = element as ChartElement;

        if (ch.chartType === 'radar') {
          const boxH = 160;
          doc
            .roundedRect(x, y, width, boxH, 8)
            .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
          doc
            .roundedRect(x, y, width, boxH, 8)
            .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
            .stroke();

          let topY = y + 8;
          if (ch.title) {
            doc
              .font(this.getPdfFont(theme, 'bold'))
              .fontSize(13)
              .fillColor(theme.colors.text)
              .text(this.stripFormatting(ch.title), x + 14, topY, { width: width - 28, align: 'center' });
            topY += 18;
          }

          const values = ch.series[0]?.values || [];
          const maxVal = Math.max(...values, 1);
          const labels = ch.labels || [];
          const N = Math.max(3, labels.length || values.length);
          const cx = x + width / 2;
          const cy = topY + (boxH - (topY - y)) / 2;
          const radius = 52;

          // Draw concentric polygon rings
          [0.33, 0.66, 1.0].forEach((ratio) => {
            doc.save();
            doc.lineWidth(0.8).strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)');
            for (let i = 0; i < N; i++) {
              const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
              const px = cx + ratio * radius * Math.cos(angle);
              const py = cy + ratio * radius * Math.sin(angle);
              if (i === 0) doc.moveTo(px, py);
              else doc.lineTo(px, py);
            }
            doc.closePath().stroke();
            doc.restore();
          });

          // Draw radial spokes & labels
          for (let i = 0; i < N; i++) {
            const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            doc.save();
            doc.lineWidth(0.6).strokeColor(theme.colors.border || 'rgba(255,255,255,0.2)').dash(2, { space: 2 });
            doc.moveTo(cx, cy).lineTo(px, py).stroke();
            doc.restore();

            const lbl = labels[i] || `Axis ${i + 1}`;
            const lx = cx + (radius + 14) * Math.cos(angle);
            const ly = cy + (radius + 14) * Math.sin(angle);
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(8)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(lbl), lx - 30, ly - 5, { width: 60, align: 'center' });
          }

          // Draw data polygon
          if (values.length > 0) {
            doc.save();
            for (let i = 0; i < N; i++) {
              const val = values[i] || 0;
              const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
              const r = (Math.max(0, val) / maxVal) * radius;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              if (i === 0) doc.moveTo(px, py);
              else doc.lineTo(px, py);
            }
            doc.closePath();
            doc.fillColor(theme.colors.primary, 0.25).fill();
            doc.restore();

            doc.save();
            doc.lineWidth(1.5).strokeColor(theme.colors.primary);
            for (let i = 0; i < N; i++) {
              const val = values[i] || 0;
              const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
              const r = (Math.max(0, val) / maxVal) * radius;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              if (i === 0) doc.moveTo(px, py);
              else doc.lineTo(px, py);
            }
            doc.closePath().stroke();
            doc.restore();
          }

          return y + boxH + 8;
        }

        if (ch.chartType === 'gauge') {
          const boxH = 120;
          doc
            .roundedRect(x, y, width, boxH, 8)
            .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
          doc
            .roundedRect(x, y, width, boxH, 8)
            .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
            .stroke();

          let topY = y + 8;
          if (ch.title) {
            doc
              .font(this.getPdfFont(theme, 'bold'))
              .fontSize(13)
              .fillColor(theme.colors.text)
              .text(this.stripFormatting(ch.title), x + 14, topY, { width: width - 28, align: 'center' });
            topY += 18;
          }

          const val = ch.series[0]?.values[0] || 0;
          const cx = x + width / 2;
          const cy = topY + 58;
          const radius = 45;

          // Draw semi-circle track
          doc.save();
          doc.lineWidth(8).strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)');
          for (let a = Math.PI; a <= 2 * Math.PI; a += 0.05) {
            const px = cx + radius * Math.cos(a);
            const py = cy + radius * Math.sin(a);
            if (a === Math.PI) doc.moveTo(px, py);
            else doc.lineTo(px, py);
          }
          doc.stroke();
          doc.restore();

          // Draw progress arc
          const pct = Math.min(100, Math.max(0, val));
          const endAngle = Math.PI + (pct / 100) * Math.PI;
          if (pct > 0) {
            doc.save();
            doc.lineWidth(8).strokeColor(theme.colors.primary);
            for (let a = Math.PI; a <= endAngle; a += 0.05) {
              const px = cx + radius * Math.cos(a);
              const py = cy + radius * Math.sin(a);
              if (a === Math.PI) doc.moveTo(px, py);
              else doc.lineTo(px, py);
            }
            const pxEnd = cx + radius * Math.cos(endAngle);
            const pyEnd = cy + radius * Math.sin(endAngle);
            doc.lineTo(pxEnd, pyEnd);
            doc.stroke();
            doc.restore();
          }

          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(20)
            .fillColor(theme.colors.text)
            .text(`${val}%`, cx - 40, cy - 16, { width: 80, align: 'center' });

          if (ch.labels?.[0]) {
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(9)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(ch.labels[0]), cx - 60, cy + 6, { width: 120, align: 'center' });
          }

          return y + boxH + 8;
        }

        if (ch.chartType === 'area') {
          const boxH = 130;
          doc
            .roundedRect(x, y, width, boxH, 8)
            .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
          doc
            .roundedRect(x, y, width, boxH, 8)
            .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
            .stroke();

          let topY = y + 10;
          if (ch.title) {
            doc
              .font(this.getPdfFont(theme, 'bold'))
              .fontSize(13)
              .fillColor(theme.colors.text)
              .text(this.stripFormatting(ch.title), x + 14, topY, { width: width - 28 });
            topY += 20;
          }

          const values = ch.series[0]?.values || [];
          const maxVal = Math.max(...values, 1);
          const plotH = boxH - (topY - y) - 28;
          const pts: { x: number; y: number }[] = [];

          values.forEach((val, idx) => {
            const px = x + 30 + (idx / Math.max(values.length - 1, 1)) * (width - 60);
            const h = (val / maxVal) * plotH;
            const py = topY + plotH - h;
            pts.push({ x: px, y: py });
          });

          if (pts.length > 1) {
            const baselineY = topY + plotH;
            doc.save();
            doc.moveTo(pts[0]!.x, baselineY);
            pts.forEach((pt) => doc.lineTo(pt.x, pt.y));
            doc.lineTo(pts[pts.length - 1]!.x, baselineY);
            doc.closePath();
            doc.fillColor(theme.colors.primary, 0.25).fill();
            doc.restore();

            doc.save();
            doc.lineWidth(2).strokeColor(theme.colors.primary);
            doc.moveTo(pts[0]!.x, pts[0]!.y);
            pts.forEach((pt) => doc.lineTo(pt.x, pt.y));
            doc.stroke();
            doc.restore();

            pts.forEach((pt, idx) => {
              doc.circle(pt.x, pt.y, 2.5).fill(theme.colors.primary);
              if (ch.labels?.[idx]) {
                doc
                  .font(this.getPdfFont(theme, 'regular'))
                  .fontSize(8.5)
                  .fillColor(theme.colors.muted || '#888888')
                  .text(this.stripFormatting(ch.labels[idx]!), pt.x - 20, baselineY + 4, {
                    width: 40,
                    align: 'center',
                  });
              }
            });
          }

          return y + boxH + 8;
        }

        const boxH = 130;
        doc
          .roundedRect(x, y, width, boxH, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
        doc
          .roundedRect(x, y, width, boxH, 8)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
          .stroke();

        let topY = y + 10;
        if (ch.title) {
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(13)
            .fillColor(theme.colors.text)
            .text(this.stripFormatting(ch.title), x + 14, topY, { width: width - 28 });
          topY += 20;
        }

        const values = ch.series[0]?.values || [];
        const maxVal = Math.max(...values, 1);
        const plotH = boxH - (topY - y) - 28;
        const barW = Math.min(40, ((width - 40) / Math.max(values.length, 1)) * 0.6);

        values.forEach((val, idx) => {
          const barX = x + 24 + idx * ((width - 48) / Math.max(values.length, 1));
          const h = (val / maxVal) * plotH;
          const barY = topY + plotH - h;

          doc.rect(barX, barY, barW, h).fill(theme.colors.primary);
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(9)
            .fillColor(theme.colors.text)
            .text(String(val), barX, barY - 12, { width: barW, align: 'center' });
          if (ch.labels?.[idx]) {
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(9)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(ch.labels[idx]!), barX - 10, topY + plotH + 4, {
                width: barW + 20,
                align: 'center',
              });
          }
        });

        return y + boxH + 8;
      }

      case 'mermaid': {
        const m = element as MermaidElement;
        const boxH = 90;
        doc
          .roundedRect(x, y, width, boxH, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
        doc.roundedRect(x, y, width, boxH, 8).strokeColor(theme.colors.primary).stroke();
        doc
          .font(this.getPdfFont(theme, 'code'))
          .fontSize(11)
          .fillColor(theme.colors.text)
          .text(this.stripFormatting(m.code), x + 12, y + 12, { width: width - 24 });
        return y + boxH + 8;
      }

      case 'math': {
        const mathEl = element as MathElement;
        const boxH = 50;
        doc
          .roundedRect(x, y, width, boxH, 6)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, width, boxH, 6)
          .lineWidth(1)
          .strokeColor(theme.colors.border || theme.colors.primary)
          .stroke();
        doc.rect(x, y, 4, boxH).fill(theme.colors.primary);

        doc
          .font(this.getPdfFont(theme, 'italic'))
          .fontSize(14)
          .fillColor(theme.colors.text)
          .text(this.stripFormatting(mathEl.expression), x + 16, y + 18, {
            width: width - 32,
            align: 'center',
          });
        return y + boxH + 8;
      }

      case 'section': {
        const s = element as SectionElement;
        const boxH = 130;
        doc
          .roundedRect(x, y, width, boxH, 8)
          .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
        doc
          .roundedRect(x, y, width, boxH, 8)
          .lineWidth(2)
          .strokeColor(theme.colors.primary)
          .stroke();

        let curY = y + 18;
        if (s.number !== undefined) {
          const numStr = String(s.number);
          doc.roundedRect(x + width / 2 - 40, curY, 80, 18, 9).fill(theme.colors.primary);
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(9)
            .fillColor('#000000')
            .text(`SECTION ${numStr}`.toUpperCase(), x, curY + 4, { width, align: 'center' });
          curY += 28;
        }

        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(22)
          .fillColor(theme.colors.text)
          .text(this.stripFormatting(s.title), x + 20, curY, {
            width: width - 40,
            align: 'center',
          });
        curY += 28;

        if (s.subtitle) {
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(12)
            .fillColor(theme.colors.muted || '#999999')
            .text(this.stripFormatting(s.subtitle), x + 30, curY, {
              width: width - 60,
              align: 'center',
            });
        }

        return y + boxH + 8;
      }

      case 'toc': {
        const t = element as TocElement;
        const items = t.items ? [...t.items] : [];
        if (items.length === 0 && presentation) {
          let autoIdx = 1;
          for (const s of presentation.slides) {
            for (const el of s.elements) {
              if (el.type === 'section') {
                const sec = el as SectionElement;
                items.push({
                  number: sec.number !== undefined ? String(sec.number) : String(autoIdx++),
                  title: sec.title,
                  description: sec.subtitle,
                });
              }
            }
          }
          if (items.length === 0) {
            presentation.slides.forEach((s, idx) => {
              const heading = s.elements.find((el) => el.type === 'heading') as
                HeadingElement | undefined;
              if (heading) {
                items.push({
                  number: String(idx + 1),
                  title: heading.text,
                });
              }
            });
          }
        }

        let curY = y;
        if (t.title) {
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(18)
            .fillColor(theme.colors.primary)
            .text(this.stripFormatting(t.title), x, curY, { width });
          curY += 26;
        }

        const itemH = 34;
        items.forEach((item, idx) => {
          const num = item.number !== undefined ? String(item.number) : String(idx + 1);
          const descText = item.description || item.subtitle;
          const itemY = curY + idx * (itemH + 8);

          doc
            .roundedRect(x, itemY, width, itemH, 6)
            .fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
          doc
            .roundedRect(x, itemY, width, itemH, 6)
            .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
            .stroke();

          doc.roundedRect(x + 10, itemY + 6, 22, 22, 4).fill(theme.colors.primary);
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(10)
            .fillColor('#000000')
            .text(num, x + 10, itemY + 11, { width: 22, align: 'center' });

          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(12)
            .fillColor(theme.colors.text)
            .text(this.stripFormatting(item.title), x + 40, itemY + (descText ? 5 : 10), {
              width: width - 50,
            });

          if (descText) {
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(9)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(descText), x + 40, itemY + 19, {
                width: width - 50,
              });
          }
        });

        return curY + items.length * (itemH + 8) + 8;
      }

      case 'icon': {
        const ic = element as IconElement;
        const iconText = `★ ${ic.name.replace(/^[^:]+:/, '').toUpperCase()}`;
        doc.font(this.getPdfFont(theme, 'bold')).fontSize(11).fillColor(theme.colors.primary);
        doc.text(iconText, x, y, { width: 120 });
        return y + 20;
      }

      case 'grid': {
        const g = element as GridElement;
        const colCount =
          typeof g.columns === 'number' ? g.columns : parseInt(String(g.columns), 10) || 2;
        const gap = 16;
        const availableWidth = width - gap * (colCount - 1);
        const colWidth = availableWidth / colCount;

        let maxY = y;
        for (let i = 0; i < g.elements.length; i++) {
          const colIdx = i % colCount;
          const colX = x + colIdx * (colWidth + gap);
          const childY = this.renderElement(
            doc,
            g.elements[i]!,
            colX,
            y,
            colWidth,
            theme,
            presentation
          );
          if (childY > maxY) maxY = childY;
        }
        return maxY + 8;
      }

      case 'stack': {
        const st = element as StackElement;
        let curY = y;
        for (const child of st.elements) {
          curY = this.renderElement(doc, child, x, curY, width, theme, presentation) + 8;
        }
        return curY;
      }

      case 'diagram': {
        return this.renderDiagram(doc, element as DiagramElement, x, y, width, theme);
      }

      case 'sequence': {
        return this.renderSequence(doc, element as SequenceElement, x, y, width, theme);
      }

      case 'class-diagram': {
        return this.renderClassDiagram(doc, element as ClassDiagramElement, x, y, width, theme);
      }

      default:
        return y;
    }
  }

  private renderDiagram(
    doc: PDFKit.PDFDocument,
    diagram: DiagramElement,
    x: number,
    y: number,
    width: number,
    theme: YumiaTheme
  ): number {
    const isLR = (diagram.direction || 'LR').toUpperCase() === 'LR';
    const nodeIds = diagram.nodes.map((n) => n.id);
    if (nodeIds.length === 0) return y;

    // Calculate ranks
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodeIds.forEach((id) => {
      inDegree[id] = 0;
      adj[id] = [];
    });

    diagram.edges.forEach((e) => {
      if (adj[e.from]) adj[e.from]!.push(e.to);
      if (inDegree[e.to] !== undefined) inDegree[e.to]!++;
    });

    const ranks: Record<string, number> = {};
    const queue: string[] = [];
    nodeIds.forEach((id) => {
      if (inDegree[id] === 0) {
        ranks[id] = 0;
        queue.push(id);
      }
    });

    if (queue.length === 0) {
      ranks[nodeIds[0]!] = 0;
      queue.push(nodeIds[0]!);
    }

    while (queue.length > 0) {
      const u = queue.shift()!;
      const r = ranks[u] ?? 0;
      const neighbors = adj[u] || [];
      for (const v of neighbors) {
        const nextR = r + 1;
        if (ranks[v] === undefined || ranks[v]! < nextR) {
          ranks[v] = nextR;
          queue.push(v);
        }
      }
    }

    nodeIds.forEach((id, idx) => {
      if (ranks[id] === undefined) ranks[id] = idx;
    });

    const rankGroups: Record<number, string[]> = {};
    nodeIds.forEach((id) => {
      const r = ranks[id] ?? 0;
      if (!rankGroups[r]) rankGroups[r] = [];
      rankGroups[r]!.push(id);
    });

    const sortedRanks = Object.keys(rankGroups)
      .map(Number)
      .sort((a, b) => a - b);
    const numRanks = Math.max(1, sortedRanks.length);
    let maxLane = 1;
    sortedRanks.forEach((r) => {
      maxLane = Math.max(maxLane, rankGroups[r]!.length);
    });

    const nodeW = isLR
      ? Math.min(110, (width - 40) / (numRanks * 1.3))
      : Math.min(120, (width - 40) / maxLane);
    const nodeH = 40;
    const gapX = isLR ? 35 : 25;
    const gapY = isLR ? 25 : 35;

    let titleOffset = 0;
    if (diagram.title) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(14)
        .fillColor(theme.colors.primary)
        .text(this.stripFormatting(diagram.title), x, y, { width, align: 'center' });
      titleOffset = 24;
    }

    const startY = y + titleOffset;
    const maxLaneHeight = isLR ? maxLane * (nodeH + gapY) - gapY : numRanks * (nodeH + gapY) - gapY;
    const maxRankWidth = isLR ? numRanks * (nodeW + gapX) - gapX : maxLane * (nodeW + gapX) - gapX;

    const positions: Record<string, { x: number; y: number }> = {};
    sortedRanks.forEach((r, rIdx) => {
      const ids = rankGroups[r]!;
      if (isLR) {
        const colHeight = ids.length * (nodeH + gapY) - gapY;
        const offsetY = (maxLaneHeight - colHeight) / 2;
        ids.forEach((id, lIdx) => {
          positions[id] = {
            x: x + 20 + rIdx * (nodeW + gapX),
            y: startY + 10 + offsetY + lIdx * (nodeH + gapY),
          };
        });
      } else {
        const rowWidth = ids.length * (nodeW + gapX) - gapX;
        const offsetX = (maxRankWidth - rowWidth) / 2;
        ids.forEach((id, lIdx) => {
          positions[id] = {
            x: x + 20 + offsetX + lIdx * (nodeW + gapX),
            y: startY + 10 + rIdx * (nodeH + gapY),
          };
        });
      }
    });

    const arrowColor = theme.colors.accent || theme.colors.primary;

    // Draw edges
    diagram.edges.forEach((e) => {
      const p1 = positions[e.from];
      const p2 = positions[e.to];
      if (!p1 || !p2) return;

      const x1 = isLR ? p1.x + nodeW : p1.x + nodeW / 2;
      const y1 = isLR ? p1.y + nodeH / 2 : p1.y + nodeH;
      const x2 = isLR ? p2.x : p2.x + nodeW / 2;
      const y2 = isLR ? p2.y + nodeH / 2 : p2.y;

      doc.save();
      doc.lineWidth(1.5).strokeColor(arrowColor);
      if (e.style === 'dashed') doc.dash(4, { space: 3 });
      doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
      doc.restore();

      // Arrow head
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 6;
      doc.save();
      doc.fillColor(arrowColor);
      doc
        .moveTo(x2, y2)
        .lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        )
        .lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        )
        .fill();
      doc.restore();

      if (e.label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const labelText = this.stripFormatting(e.label);
        const labelW = Math.min(90, Math.max(45, labelText.length * 5.5 + 16));
        doc.save();
        doc
          .roundedRect(midX - labelW / 2, midY - 8, labelW, 16, 4)
          .fill(theme.colors.surface || '#151522');
        doc
          .roundedRect(midX - labelW / 2, midY - 8, labelW, 16, 4)
          .lineWidth(0.8)
          .strokeColor(theme.colors.border || '#334155')
          .stroke();
        doc.restore();

        doc
          .font(this.getPdfFont(theme, 'bold'))
          .fontSize(7.5)
          .fillColor(theme.colors.muted || '#888888')
          .text(labelText, midX - labelW / 2, midY - 5, { width: labelW, align: 'center' });
      }
    });

    // Draw nodes
    diagram.nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;

      const variant = n.variant || 'primary';
      let nodeColor = theme.colors.primary;
      if (variant === 'accent')
        nodeColor = theme.colors.accent || theme.colors.secondary || theme.colors.primary;
      else if (variant === 'success') nodeColor = theme.colors.success || '#10b981';
      else if (variant === 'warning') nodeColor = theme.colors.warning || '#f59e0b';
      else if (variant === 'danger') nodeColor = theme.colors.danger || '#ef4444';

      doc.save();
      doc.roundedRect(p.x, p.y, nodeW, nodeH, 6).fill(theme.colors.surface || '#151522');
      doc.roundedRect(p.x, p.y, nodeW, nodeH, 6).lineWidth(1.5).strokeColor(nodeColor).stroke();
      doc.restore();

      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(9.5)
        .fillColor(theme.colors.text)
        .text(this.stripFormatting(n.label), p.x + 4, p.y + nodeH / 2 - 5, {
          width: nodeW - 8,
          align: 'center',
        });
    });

    const totalH = isLR
      ? titleOffset + 20 + maxLane * (nodeH + gapY)
      : titleOffset + 20 + numRanks * (nodeH + gapY);

    return y + totalH + 8;
  }

  private renderSequence(
    doc: PDFKit.PDFDocument,
    s: SequenceElement,
    x: number,
    y: number,
    width: number,
    theme: YumiaTheme
  ): number {
    const participants = s.participants || [];
    const messages = s.messages || [];
    if (participants.length === 0) return y;

    const partCount = participants.length;
    const msgCount = Math.max(1, messages.length);
    const partW = Math.min(100, Math.max(50, (width - 30) / partCount - 15));
    const gapX = partCount > 1 ? (width - 30 - partW * partCount) / (partCount - 1) : 0;
    const stepY = 38;
    const totalH = 45 + msgCount * stepY + 30;

    let topY = y;
    if (s.title) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(14)
        .fillColor(theme.colors.primary)
        .text(this.stripFormatting(s.title), x, topY, { width, align: 'center' });
      topY += 24;
    }

    const positions: Record<string, number> = {};
    participants.forEach((p, idx) => {
      positions[p.id] = x + 15 + idx * (partW + gapX) + partW / 2;
    });

    const lifelineTop = topY + 28;
    const lifelineBottom = topY + totalH - 10;
    const primaryColor = theme.colors.primary;
    const accentColor = theme.colors.accent || theme.colors.primary;

    // Draw lifelines & top boxes
    participants.forEach((p) => {
      const cx = positions[p.id]!;
      const boxX = cx - partW / 2;

      doc.save();
      doc.lineWidth(1).strokeColor(primaryColor).dash(4, { space: 3 });
      doc.moveTo(cx, lifelineTop).lineTo(cx, lifelineBottom).stroke();
      doc.restore();

      doc.roundedRect(boxX, topY, partW, 26, 5).fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
      doc.roundedRect(boxX, topY, partW, 26, 5).lineWidth(1.2).strokeColor(primaryColor).stroke();

      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(9)
        .fillColor(theme.colors.text)
        .text(this.stripFormatting(p.name), boxX + 2, topY + 8, { width: partW - 4, align: 'center' });
    });

    // Draw messages
    messages.forEach((msg, idx) => {
      const x1 = positions[msg.from] || x + 20;
      const x2 = positions[msg.to] || x + width - 20;
      const lineY = topY + 45 + idx * stepY;
      const isReturn = msg.style === 'dashed' || msg.arrowType === 'return';
      const msgColor = isReturn ? accentColor : primaryColor;

      doc.save();
      doc.lineWidth(1.2).strokeColor(msgColor);
      if (isReturn) doc.dash(3, { space: 3 });
      doc.moveTo(x1, lineY).lineTo(x2, lineY).stroke();
      doc.restore();

      // Arrow head
      const dir = x2 >= x1 ? 1 : -1;
      doc.save();
      doc.fillColor(msgColor);
      doc.moveTo(x2, lineY).lineTo(x2 - dir * 6, lineY - 3.5).lineTo(x2 - dir * 6, lineY + 3.5).fill();
      doc.restore();

      // Message Label Pill
      const labelText = this.stripFormatting(msg.label);
      const midX = (x1 + x2) / 2;
      const pillW = Math.min(130, Math.max(50, labelText.length * 5.2 + 12));
      doc.roundedRect(midX - pillW / 2, lineY - 14, pillW, 12, 3).fill(theme.colors.surface || '#0f172a');
      doc.roundedRect(midX - pillW / 2, lineY - 14, pillW, 12, 3).lineWidth(0.8).strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)').stroke();

      doc
        .font(this.getPdfFont(theme, 'regular'))
        .fontSize(7.5)
        .fillColor(theme.colors.text)
        .text(labelText, midX - pillW / 2, lineY - 12, { width: pillW, align: 'center' });
    });

    return topY + totalH + 8;
  }

  private renderClassDiagram(
    doc: PDFKit.PDFDocument,
    cd: ClassDiagramElement,
    x: number,
    y: number,
    width: number,
    theme: YumiaTheme
  ): number {
    const classes = cd.classes || [];
    if (classes.length === 0) return y;

    let topY = y;
    if (cd.title) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(14)
        .fillColor(theme.colors.primary)
        .text(this.stripFormatting(cd.title), x, topY, { width, align: 'center' });
      topY += 24;
    }

    const cols = Math.min(3, Math.max(1, classes.length));
    const gap = 16;
    const colW = (width - (cols - 1) * gap) / cols;

    let maxClassH = 0;
    classes.forEach((c, idx) => {
      const colIdx = idx % cols;
      const cardX = x + colIdx * (colW + gap);
      const attrCount = c.members.filter((m) => !m.isMethod).length;
      const methodCount = c.members.filter((m) => m.isMethod).length;
      const cardH =
        34 + attrCount * 14 + (attrCount > 0 ? 6 : 0) + methodCount * 14 + (methodCount > 0 ? 6 : 0);

      doc.roundedRect(cardX, topY, colW, cardH, 6).fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
      doc
        .roundedRect(cardX, topY, colW, cardH, 6)
        .lineWidth(1.2)
        .strokeColor(theme.colors.border || 'rgba(255,255,255,0.2)')
        .stroke();

      // Header bar
      doc.rect(cardX, topY, colW, 24).fill(theme.colors.surface || 'rgba(255,255,255,0.04)');
      doc
        .moveTo(cardX, topY + 24)
        .lineTo(cardX + colW, topY + 24)
        .lineWidth(1.2)
        .strokeColor(theme.colors.primary)
        .stroke();

      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(10)
        .fillColor(theme.colors.primary)
        .text(this.stripFormatting(c.name), cardX, topY + 6, { width: colW, align: 'center' });

      let curItemY = topY + 28;
      c.members
        .filter((m) => !m.isMethod)
        .forEach((attr) => {
          const tStr = attr.type ? `: ${attr.type}` : '';
          doc
            .font(this.getPdfFont(theme, 'code'))
            .fontSize(8)
            .fillColor(theme.colors.text)
            .text(`${attr.visibility || '+'} ${attr.name}${tStr}`, cardX + 8, curItemY, {
              width: colW - 16,
            });
          curItemY += 13;
        });

      if (attrCount > 0 && methodCount > 0) {
        doc
          .moveTo(cardX, curItemY)
          .lineTo(cardX + colW, curItemY)
          .lineWidth(0.8)
          .strokeColor(theme.colors.border || 'rgba(255,255,255,0.1)')
          .stroke();
        curItemY += 4;
      }

      c.members
        .filter((m) => m.isMethod)
        .forEach((m) => {
          const pStr = `(${m.params || ''})`;
          const tStr = m.type ? `: ${m.type}` : '';
          doc
            .font(this.getPdfFont(theme, 'code'))
            .fontSize(8)
            .fillColor(theme.colors.accent || theme.colors.primary)
            .text(`${m.visibility || '+'} ${m.name}${pStr}${tStr}`, cardX + 8, curItemY, {
              width: colW - 16,
            });
          curItemY += 13;
        });

      if (cardH > maxClassH) maxClassH = cardH;
    });

    return topY + maxClassH + 16;
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
      .replace(/`(.*?)`/g, '$1')
      .replace(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}]/gu,
        ''
      )
      .replace(/\u200D/g, '')
      .replace(/\uFE0F/g, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—–]/g, '-')
      .trim();
  }
}
