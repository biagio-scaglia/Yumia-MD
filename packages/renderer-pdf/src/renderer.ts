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
  ImageElement,
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
import {
  RenderContext,
  YumiaRenderer,
  findSystemFont,
  rasterizeIcon,
  resolveLocalAsset,
  resolveSlideGeometry,
  themeSizeToPdfPoints,
} from '@yumiamd/renderer';
import {
  DefaultLayoutEngine,
  LayoutNode,
  computeDiagramLayout,
  fitDiagramLabel,
  orthogonalEdgePoints,
} from '@yumiamd/layout';
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

  private unicodeFontsRegistered = false;
  private hasUnicodeFont = false;
  /** When false, PDFKit is prevented from auto-creating overflow pages mid-slide. */
  private allowAutoPage = true;
  private layoutEngine = new DefaultLayoutEngine();

  private getPdfFont(
    theme: YumiaTheme,
    weight: 'regular' | 'bold' | 'italic' | 'boldItalic' | 'code' = 'regular'
  ): string {
    if (weight === 'code') {
      return 'Courier';
    }

    // Prefer embedded system Unicode fonts when available (Windows/macOS/Linux).
    if (this.hasUnicodeFont) {
      if (weight === 'bold' || weight === 'boldItalic') return 'YumiaUnicodeBold';
      return 'YumiaUnicode';
    }

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

    if (isMono) {
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

  private ensureUnicodeFonts(doc: PDFKit.PDFDocument): void {
    if (this.unicodeFontsRegistered) return;
    this.unicodeFontsRegistered = true;
    const regular = findSystemFont('regular');
    const bold = findSystemFont('bold') || regular;
    if (regular) {
      try {
        doc.registerFont('YumiaUnicode', regular);
        if (bold) doc.registerFont('YumiaUnicodeBold', bold);
        this.hasUnicodeFont = true;
      } catch {
        this.hasUnicodeFont = false;
      }
    }
  }

  async render(presentation: Presentation, context: RenderContext = {}): Promise<PdfOutput> {
    const colorOverrides = presentation.metadata.colors
      ? ({ colors: presentation.metadata.colors } as ThemeOverrides)
      : undefined;
    const resolvedTheme = resolveTheme(presentation.metadata.theme, colorOverrides);
    const theme = context.theme || resolvedTheme || defaultTheme;

    const geometry = resolveSlideGeometry(presentation.metadata.aspectRatio);
    const pageWidth = geometry.points.width;
    const pageHeight = geometry.points.height;

    // Reset per-render font registration state
    this.unicodeFontsRegistered = false;
    this.hasUnicodeFont = false;
    this.allowAutoPage = true;

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

        // PDFKit's text() auto-adds pages on overflow. For slide decks that is a
        // correctness bug (extra blank/partial pages). Guard addPage so only
        // explicit slide breaks create pages.
        let createdPages = 0;
        const originalAddPage = doc.addPage.bind(doc);
        doc.addPage = ((...args: Parameters<typeof doc.addPage>) => {
          if (!this.allowAutoPage) {
            // Swallow overflow page breaks; content is clipped to the slide canvas.
            return doc;
          }
          createdPages += 1;
          return originalAddPage(...args);
        }) as typeof doc.addPage;

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolvePromise({
            format: 'pdf',
            data: new Uint8Array(buffer),
            pageCount: createdPages,
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
    this.ensureUnicodeFonts(doc);

    this.allowAutoPage = true;
    doc.addPage({
      size: [pageWidth, pageHeight],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    // Lock page creation for the rest of this slide's paint cycle.
    this.allowAutoPage = false;

    // 1. Fill Slide Background
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.colors.background);

    // 2. Shared layout geometry (parity with PPTX) scaled into PDF points
    const geometry = resolveSlideGeometry(presentation?.metadata.aspectRatio);
    const viewport = geometry.pixelViewport;
    const scaleX = pageWidth / viewport.width;
    const scaleY = pageHeight / viewport.height;
    const padPx = Math.round((pageWidth * 0.06) / scaleX);
    const footerBand = 28;
    const contentBottom = pageHeight - footerBand;
    const padX = pageWidth * 0.06;

    const slideLayout = this.layoutEngine.computeSlide(slide, viewport, {
      padding: padPx,
      gap: 24,
    });

    // 3. Paint layout tree (roots + nested children for parity with PPTX)
    for (const node of slideLayout.nodes) {
      this.paintLayoutNode(doc, node, scaleX, scaleY, theme, presentation, contentBottom);
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
          width: pageWidth - padX * 2 - 80,
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

  private paintLayoutNode(
    doc: PDFKit.PDFDocument,
    node: LayoutNode,
    scaleX: number,
    scaleY: number,
    theme: YumiaTheme,
    presentation: Presentation | undefined,
    contentBottom: number
  ): void {
    const el = node.element;
    const x = node.bounds.x * scaleX;
    const y = node.bounds.y * scaleY;
    const w = node.bounds.width * scaleX;
    const h = node.bounds.height * scaleY;
    if (y >= contentBottom - 8) return;

    const hasChildren = !!(node.children && node.children.length > 0);
    if (
      hasChildren &&
      (el.type === 'grid' || el.type === 'stack' || el.type === 'columns' || el.type === 'column')
    ) {
      for (const child of node.children!) {
        this.paintLayoutNode(doc, child, scaleX, scaleY, theme, presentation, contentBottom);
      }
      return;
    }

    if (hasChildren && el.type === 'card') {
      this.paintCardFrame(doc, el as CardElement, x, y, w, h, theme);
      for (const child of node.children!) {
        this.paintLayoutNode(doc, child, scaleX, scaleY, theme, presentation, contentBottom);
      }
      return;
    }

    if (hasChildren && el.type === 'compare') {
      this.paintCompareFrame(doc, el as CompareElement, x, y, w, h, theme);
      for (const child of node.children!) {
        this.paintLayoutNode(doc, child, scaleX, scaleY, theme, presentation, contentBottom);
      }
      return;
    }

    if (el.type === 'hero') {
      this.paintHeroInBounds(doc, el as HeroElement, x, y, w, h, theme);
      if (hasChildren) {
        for (const child of node.children!) {
          this.paintLayoutNode(doc, child, scaleX, scaleY, theme, presentation, contentBottom);
        }
      }
      return;
    }

    this.renderElement(doc, el, x, y, w, theme, presentation);
  }

  private paintCardFrame(
    doc: PDFKit.PDFDocument,
    card: CardElement,
    x: number,
    y: number,
    width: number,
    height: number,
    theme: YumiaTheme
  ): void {
    const variantColor = this.getVariantColor(card.variant, theme);
    doc.save();
    doc.roundedRect(x, y, width, height, 8).fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
    doc.roundedRect(x, y, width, height, 8).lineWidth(1.5).strokeColor(variantColor).stroke();
    doc.restore();
    if (card.title) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(13)
        .fillColor(variantColor)
        .text(this.stripFormatting(card.title), x + 12, y + 10, {
          width: width - 24,
          height: 22,
          ellipsis: true,
        });
    }
  }

  private paintCompareFrame(
    doc: PDFKit.PDFDocument,
    compare: CompareElement,
    x: number,
    y: number,
    width: number,
    height: number,
    theme: YumiaTheme
  ): void {
    const gap = 16;
    const colW = (width - gap) / 2;
    const leftColor = theme.colors.primary;
    const rightColor = theme.colors.accent || theme.colors.secondary || theme.colors.primary;
    doc.save();
    doc.roundedRect(x, y, colW, height, 8).fill(theme.colors.surface || '#151522');
    doc
      .roundedRect(x, y, colW, height, 8)
      .lineWidth(1.4)
      .strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)')
      .stroke();
    doc.roundedRect(x + colW + gap, y, colW, height, 8).fill(theme.colors.surface || '#151522');
    doc
      .roundedRect(x + colW + gap, y, colW, height, 8)
      .lineWidth(1.4)
      .strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)')
      .stroke();
    doc.restore();

    const midX = x + colW + gap / 2;
    const midY = y + height / 2;
    doc.circle(midX, midY, 16).fill(theme.colors.surface || '#151522');
    doc.circle(midX, midY, 16).lineWidth(1.4).strokeColor(theme.colors.primary).stroke();
    doc
      .font(this.getPdfFont(theme, 'bold'))
      .fontSize(10)
      .fillColor(theme.colors.text)
      .text('VS', midX - 14, midY - 5, { width: 28, align: 'center' });

    if (compare.leftTitle) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(11)
        .fillColor(leftColor)
        .text(this.stripFormatting(compare.leftTitle), x + 10, y + 10, {
          width: colW - 20,
          height: 28,
          ellipsis: true,
        });
    }
    if (compare.rightTitle) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(11)
        .fillColor(rightColor)
        .text(this.stripFormatting(compare.rightTitle), x + colW + gap + 10, y + 10, {
          width: colW - 20,
          height: 28,
          ellipsis: true,
        });
    }
  }

  private paintHeroInBounds(
    doc: PDFKit.PDFDocument,
    hero: HeroElement,
    x: number,
    y: number,
    width: number,
    height: number,
    theme: YumiaTheme
  ): void {
    const align = (hero.align as 'left' | 'center' | 'right') || 'center';
    const compact = height < 140;
    let curY = y;
    const maxY = y + height - 4;

    if (hero.badge && curY < maxY) {
      const label = this.stripFormatting(hero.badge).toUpperCase();
      doc.font(this.getPdfFont(theme, 'bold')).fontSize(compact ? 8 : 9);
      const labelW = Math.min(width, Math.max(70, doc.widthOfString(label) + 24));
      const badgeX =
        align === 'left' ? x : align === 'right' ? x + width - labelW : x + (width - labelW) / 2;
      doc
        .roundedRect(badgeX, curY, labelW, compact ? 16 : 18, 9)
        .lineWidth(1.2)
        .strokeColor(theme.colors.primary)
        .fillColor(theme.colors.surface || '#f8fafc')
        .fillAndStroke();
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(compact ? 8 : 9)
        .fillColor(theme.colors.primary)
        .text(label, badgeX, curY + 3, { width: labelW, align: 'center' });
      curY += compact ? 22 : 28;
    } else if (hero.tagline && curY < maxY) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(compact ? 10 : 11)
        .fillColor(theme.colors.primary);
      doc.text(this.stripFormatting(hero.tagline).toUpperCase(), x, curY, { width, align });
      curY += 20;
    }

    if (curY < maxY) {
      const titleSize = compact
        ? themeSizeToPdfPoints(theme.typography.sizes?.h1, 44)
        : themeSizeToPdfPoints(theme.typography.sizes?.display, 56);
      doc.font(this.getPdfFont(theme, 'bold')).fontSize(titleSize).fillColor(theme.colors.text);
      doc.text(this.stripFormatting(hero.title), x, curY, {
        width,
        height: Math.max(20, maxY - curY - (hero.subtitle ? 28 : 4)),
        lineGap: 4,
        align,
        ellipsis: true,
      });
      curY += Math.min(
        maxY - curY,
        doc.heightOfString(this.stripFormatting(hero.title), { width }) + 8
      );
    }

    if (hero.subtitle && curY < maxY) {
      const subSize = themeSizeToPdfPoints(theme.typography.sizes?.body, 18);
      doc
        .font(this.getPdfFont(theme, 'regular'))
        .fontSize(compact ? subSize - 1 : subSize + 1)
        .fillColor(theme.colors.muted || '#888888');
      doc.text(this.stripFormatting(hero.subtitle), x, curY, {
        width,
        height: Math.max(16, maxY - curY),
        align,
        ellipsis: true,
      });
    }
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

        if (hero.badge) {
          const label = this.stripFormatting(hero.badge).toUpperCase();
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(9);
          const labelW = Math.min(width, Math.max(70, doc.widthOfString(label) + 24));
          const badgeX =
            align === 'left'
              ? x
              : align === 'right'
                ? x + width - labelW
                : x + (width - labelW) / 2;
          doc
            .roundedRect(badgeX, curY, labelW, 18, 9)
            .lineWidth(1.2)
            .strokeColor(theme.colors.primary)
            .fillColor(theme.colors.surface || '#f8fafc')
            .fillAndStroke();
          doc
            .font(this.getPdfFont(theme, 'bold'))
            .fontSize(9)
            .fillColor(theme.colors.primary)
            .text(label, badgeX, curY + 4, { width: labelW, align: 'center' });
          curY += 28;
        } else if (hero.tagline) {
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(11).fillColor(theme.colors.primary);
          doc.text(this.stripFormatting(hero.tagline).toUpperCase(), x, curY, { width, align });
          curY += 22;
        }

        const titleSize = themeSizeToPdfPoints(theme.typography.sizes?.display, 56);
        doc.font(this.getPdfFont(theme, 'bold')).fontSize(titleSize).fillColor(theme.colors.text);
        doc.text(this.stripFormatting(hero.title), x, curY, { width, lineGap: 6, align });
        curY += doc.heightOfString(this.stripFormatting(hero.title), { width }) + 10;
        if (hero.subtitle) {
          const subSize = themeSizeToPdfPoints(theme.typography.sizes?.body, 18) + 1;
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(subSize)
            .fillColor(theme.colors.muted || '#888888');
          doc.text(this.stripFormatting(hero.subtitle), x, curY, { width, lineGap: 4, align });
          curY += doc.heightOfString(this.stripFormatting(hero.subtitle), { width }) + 14;
        }
        if (hero.tagline && hero.badge) {
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(11)
            .fillColor(theme.colors.muted || '#888888');
          doc.text(this.stripFormatting(hero.tagline), x, curY, { width, align });
          curY += 18;
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
        const sizes = theme.typography.sizes;
        const fontSize =
          h.level === 1
            ? themeSizeToPdfPoints(sizes?.h1, 44)
            : h.level === 2
              ? themeSizeToPdfPoints(sizes?.h2, 36)
              : themeSizeToPdfPoints(sizes?.h3, 28);
        const color = h.level === 1 ? theme.colors.primary : theme.colors.text;

        doc.font(this.getPdfFont(theme, 'bold')).fontSize(fontSize).fillColor(color);
        doc.text(this.stripFormatting(h.text), x, y, {
          width,
          lineGap: 4,
          align: h.align || 'left',
        });
        const height = doc.heightOfString(this.stripFormatting(h.text), { width });
        return y + height;
      }

      case 'paragraph': {
        const p = element as ParagraphElement;
        const bodySize = themeSizeToPdfPoints(theme.typography.sizes?.body, 18);
        doc.font(this.getPdfFont(theme, 'regular')).fontSize(bodySize).fillColor(theme.colors.text);
        doc.text(this.stripFormatting(p.text), x, y, {
          width,
          lineGap: 4,
          align: p.align || 'left',
        });
        const height = doc.heightOfString(this.stripFormatting(p.text), { width });
        return y + height;
      }

      case 'image': {
        const img = element as ImageElement;
        const resolved = resolveLocalAsset(img.src);
        const maxH = typeof img.height === 'number' ? Math.min(img.height, 280) : 220;
        const boxH = maxH;

        if (!resolved || !resolved.exists) {
          doc
            .roundedRect(x, y, width, Math.min(120, boxH), 6)
            .lineWidth(1)
            .strokeColor(theme.colors.border || '#94a3b8')
            .fillColor(theme.colors.surface || '#e2e8f0')
            .fillAndStroke();
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(11)
            .fillColor(theme.colors.muted || '#64748b')
            .text(`[Image: ${img.alt || img.src}]`, x + 8, y + 40, {
              width: width - 16,
              align: 'center',
            });
          return y + Math.min(120, boxH) + 8;
        }

        try {
          // Fit image into available width while preserving aspect ratio (no stretch).
          const fitW = width;
          const fitH = boxH;
          doc.image(resolved.absolutePath, x, y, {
            fit: [fitW, fitH],
            align: 'center',
            valign: 'center',
          });
          if (img.caption) {
            doc
              .font(this.getPdfFont(theme, 'regular'))
              .fontSize(10)
              .fillColor(theme.colors.muted || '#888888')
              .text(this.stripFormatting(img.caption), x, y + fitH + 4, {
                width,
                align: 'center',
              });
            return y + fitH + 22;
          }
          return y + fitH + 8;
        } catch {
          doc.roundedRect(x, y, width, 80, 6).fill(theme.colors.surface || '#e2e8f0');
          doc
            .font(this.getPdfFont(theme, 'regular'))
            .fontSize(11)
            .fillColor(theme.colors.muted || '#64748b')
            .text(`[Image unavailable: ${img.alt || img.src}]`, x + 8, y + 30, {
              width: width - 16,
              align: 'center',
            });
          return y + 88;
        }
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
        const textW = Math.max(40, width - 48);
        doc.font(this.getPdfFont(theme, 'code')).fontSize(10);

        // Measure wrapped line heights so long lines never overlap the next line.
        const lineGap = 2;
        const heights = lines.map((line) =>
          Math.max(14, doc.heightOfString(line || ' ', { width: textW, lineGap: 0 }))
        );
        const contentH =
          heights.reduce((sum, h) => sum + h, 0) + Math.max(0, lines.length - 1) * lineGap;
        const boxHeight = contentH + 20;

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

        let lineY = y + 10;
        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          const isHl = highlightSet.has(lineNum);
          const lineH = heights[idx]!;

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
            .text(String(lineNum).padStart(2, ' '), x + 10, lineY, {
              width: 22,
              lineBreak: false,
            });

          doc
            .font(this.getPdfFont(theme, 'code'))
            .fontSize(10)
            .fillColor(textColor)
            .text(line || ' ', x + 36, lineY, { width: textW, lineGap: 0 });

          lineY += lineH + lineGap;
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
              .text(this.stripFormatting(ch.title), x + 14, topY, {
                width: width - 28,
                align: 'center',
              });
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
            doc
              .lineWidth(0.6)
              .strokeColor(theme.colors.border || 'rgba(255,255,255,0.2)')
              .dash(2, { space: 2 });
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
              .text(this.stripFormatting(ch.title), x + 14, topY, {
                width: width - 28,
                align: 'center',
              });
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
              .text(this.stripFormatting(ch.labels[0]), cx - 60, cy + 6, {
                width: 120,
                align: 'center',
              });
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
        const rawSize = typeof ic.size === 'number' ? ic.size : parseInt(String(ic.size || 28), 10);
        const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(96, rawSize) : 28;
        const color = ic.color || theme.colors.primary;
        try {
          const raster = rasterizeIcon(ic.name, size, color);
          doc.image(raster.png, x, y, { width: size, height: size });
          return y + size + 8;
        } catch {
          const iconText = `★ ${ic.name.replace(/^[^:]+:/, '').toUpperCase()}`;
          doc.font(this.getPdfFont(theme, 'bold')).fontSize(11).fillColor(color);
          doc.text(iconText, x, y, { width: Math.max(120, size * 3) });
          return y + 20;
        }
      }

      case 'grid': {
        const g = element as GridElement;
        const colCount =
          typeof g.columns === 'number' ? g.columns : parseInt(String(g.columns), 10) || 2;
        const gap = 16;
        const availableWidth = width - gap * (colCount - 1);
        const colWidth = availableWidth / colCount;

        const colYs = Array(colCount).fill(y);
        for (let i = 0; i < g.elements.length; i++) {
          const colIdx = i % colCount;
          const colX = x + colIdx * (colWidth + gap);
          const curColY = colYs[colIdx]!;
          const childY = this.renderElement(
            doc,
            g.elements[i]!,
            colX,
            curColY,
            colWidth,
            theme,
            presentation
          );
          colYs[colIdx] = childY + 12;
        }
        return Math.max(...colYs);
      }

      case 'stack': {
        const st = element as StackElement;
        const direction = (st.direction || 'vertical').toLowerCase();
        if (direction === 'horizontal' || direction === 'row') {
          const count = Math.max(1, st.elements.length);
          const gap = 12;
          const colW = (width - gap * (count - 1)) / count;
          let maxY = y;
          st.elements.forEach((child, i) => {
            const childY = this.renderElement(
              doc,
              child,
              x + i * (colW + gap),
              y,
              colW,
              theme,
              presentation
            );
            maxY = Math.max(maxY, childY);
          });
          return maxY;
        }
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
    if (diagram.nodes.length === 0) return y;

    const layout = computeDiagramLayout(diagram, width, isLR, {
      originX: x,
      originY: y,
      titleHeight: 24,
    });
    const { nodeWidth: nodeW, nodeHeight: nodeH, positions } = layout;

    if (diagram.title) {
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(14)
        .fillColor(theme.colors.primary)
        .text(this.stripFormatting(diagram.title), x, y, { width, align: 'center' });
    }

    const arrowColor = theme.colors.accent || theme.colors.primary;

    diagram.edges.forEach((e) => {
      const p1 = positions[e.from];
      const p2 = positions[e.to];
      if (!p1 || !p2) return;

      const pts = orthogonalEdgePoints(isLR, p1, p2, nodeW, nodeH);
      if (pts.length < 2) return;
      const last = pts[pts.length - 1]!;
      const prev = pts[pts.length - 2]!;

      doc.save();
      doc.lineWidth(1.5).strokeColor(arrowColor);
      if (e.style === 'dashed') doc.dash(4, { space: 3 });
      doc.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i]!.x, pts[i]!.y);
      doc.stroke();
      doc.restore();

      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const headLen = 6;
      doc.save();
      doc.fillColor(arrowColor);
      doc
        .moveTo(last.x, last.y)
        .lineTo(
          last.x - headLen * Math.cos(angle - Math.PI / 6),
          last.y - headLen * Math.sin(angle - Math.PI / 6)
        )
        .lineTo(
          last.x - headLen * Math.cos(angle + Math.PI / 6),
          last.y - headLen * Math.sin(angle + Math.PI / 6)
        )
        .fill();
      doc.restore();

      if (e.label) {
        const mid = pts[Math.floor(pts.length / 2)]!;
        const midX = mid.x;
        const midY = mid.y;
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

    const maxChars = Math.max(6, Math.floor((nodeW - 10) / 6));
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
      else if (variant === 'info') nodeColor = theme.colors.info || theme.colors.primary;

      doc.save();
      doc.roundedRect(p.x, p.y, nodeW, nodeH, 6).fill(theme.colors.surface || '#151522');
      doc.roundedRect(p.x, p.y, nodeW, nodeH, 6).lineWidth(1.5).strokeColor(nodeColor).stroke();
      doc.restore();

      const label = fitDiagramLabel(this.stripFormatting(n.label), maxChars);
      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(Math.min(10, Math.max(7.5, nodeH / 4)))
        .fillColor(theme.colors.text)
        .text(label, p.x + 4, p.y + Math.max(4, nodeH / 2 - 6), {
          width: nodeW - 8,
          height: nodeH - 8,
          align: 'center',
          ellipsis: true,
        });
    });

    return y + layout.height + 8;
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

      doc
        .roundedRect(boxX, topY, partW, 26, 5)
        .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
      doc.roundedRect(boxX, topY, partW, 26, 5).lineWidth(1.2).strokeColor(primaryColor).stroke();

      doc
        .font(this.getPdfFont(theme, 'bold'))
        .fontSize(9)
        .fillColor(theme.colors.text)
        .text(this.stripFormatting(p.name), boxX + 2, topY + 8, {
          width: partW - 4,
          align: 'center',
        });
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
      doc
        .moveTo(x2, lineY)
        .lineTo(x2 - dir * 6, lineY - 3.5)
        .lineTo(x2 - dir * 6, lineY + 3.5)
        .fill();
      doc.restore();

      // Message Label Pill
      const labelText = this.stripFormatting(msg.label);
      const midX = (x1 + x2) / 2;
      const pillW = Math.min(130, Math.max(50, labelText.length * 5.2 + 12));
      doc
        .roundedRect(midX - pillW / 2, lineY - 14, pillW, 12, 3)
        .fill(theme.colors.surface || '#0f172a');
      doc
        .roundedRect(midX - pillW / 2, lineY - 14, pillW, 12, 3)
        .lineWidth(0.8)
        .strokeColor(theme.colors.border || 'rgba(255,255,255,0.15)')
        .stroke();

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
        34 +
        attrCount * 14 +
        (attrCount > 0 ? 6 : 0) +
        methodCount * 14 +
        (methodCount > 0 ? 6 : 0);

      doc
        .roundedRect(cardX, topY, colW, cardH, 6)
        .fill(theme.colors.surface || 'rgba(255,255,255,0.06)');
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
    let result = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—–]/g, '-')
      .trim();

    // Only strip emoji when falling back to WinAnsi core fonts (no Unicode TTF).
    if (!this.hasUnicodeFont) {
      result = result
        .replace(
          /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}]/gu,
          ''
        )
        .replace(/\u200D/g, '')
        .replace(/\uFE0F/g, '')
        .trim();
    }

    return result;
  }
}
