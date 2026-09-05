import {
  CardElement,
  ColumnsElement,
  ImageElement,
  ListElement,
  ParagraphElement,
  Presentation,
  SlideElement,
  SourceLocation,
} from '@yumiamd/ast';
import { DefaultLayoutEngine, LayoutEngine, PresentationLayoutResult, Size } from '@yumiamd/layout';

export interface LintRuleResult {
  code: string;
  slide: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  loc?: SourceLocation | undefined;
}

export interface LintReport {
  passed: boolean;
  totalSlides: number;
  issueCount: number;
  score: number;
  errors: LintRuleResult[];
  warnings: LintRuleResult[];
  infos: LintRuleResult[];
  suggestions: string[];
}

export interface LintOptions {
  viewport?: Size;
  strict?: boolean;
  includeOptionalNotesRule?: boolean;
  layoutEngine?: LayoutEngine;
  themeColors?: { background?: string; text?: string; primary?: string };
}

export class YumiaLinter {
  private layoutEngine: LayoutEngine;

  constructor(layoutEngine?: LayoutEngine) {
    this.layoutEngine = layoutEngine ?? new DefaultLayoutEngine();
  }

  lint(presentation: Presentation, options: LintOptions = {}): LintReport {
    const issues: LintRuleResult[] = [];
    const layout: PresentationLayoutResult = this.layoutEngine.computePresentation(
      presentation,
      options.viewport
    );

    // Collect parser/AST diagnostics (e.g. YUM002)
    if (presentation.diagnostics) {
      for (const diag of presentation.diagnostics) {
        issues.push({
          code: diag.code || 'YUM002',
          slide: 1,
          message: diag.message,
          severity: diag.severity === 'error' ? 'error' : 'warning',
          loc: diag.loc,
        });
      }
    }

    presentation.slides.forEach((slide, index) => {
      const slideNum = index + 1;
      const slideLayout = layout.slides[index];

      // YUM006: Empty Slide
      if (slide.elements.length === 0) {
        issues.push({
          code: 'YUM006',
          slide: slideNum,
          message: 'Slide contains no content elements.',
          severity: 'warning',
          loc: slide.loc,
        });
        return;
      }

      // YUM001: Content Overflow
      if (slideLayout && slideLayout.overflow) {
        const overflowPx = Math.round(slideLayout.overflowAmount || 0);
        issues.push({
          code: 'YUM001',
          slide: slideNum,
          message: `Content exceeds slide viewport bounds by ~${overflowPx}px. Consider reducing font size or splitting into multiple slides.`,
          severity: options.strict ? 'error' : 'warning',
          loc: slide.loc,
        });
      }

      // YUM003: Missing Slide Title/Heading
      const hasHeading = this.slideHasHeading(slide.elements);
      if (!hasHeading) {
        issues.push({
          code: 'YUM003',
          slide: slideNum,
          message:
            'Slide has no heading (h1-h4). Consider adding a descriptive title for structure.',
          severity: 'warning',
          loc: slide.loc,
        });
      }

      // YUM004: High Information Density (> 7 list items or > 120 words)
      const { listCount, wordCount } = this.calculateSlideDensity(slide.elements);
      if (listCount > 7) {
        issues.push({
          code: 'YUM004',
          slide: slideNum,
          message: `High information density: slide contains ${listCount} list items (recommended max: 7).`,
          severity: 'warning',
          loc: slide.loc,
        });
      } else if (wordCount > 120) {
        issues.push({
          code: 'YUM004',
          slide: slideNum,
          message: `High information density: slide contains ~${wordCount} words (recommended max: 120 words).`,
          severity: 'warning',
          loc: slide.loc,
        });
      }

      // YUM007 & YUM005: Image checks
      this.checkImages(slide.elements, slideNum, issues);

      // YUM011 & YUM012: Tables and Code checks
      this.checkTablesAndCode(slide.elements, slideNum, issues);

      // YUM008: Excessive Nesting Depth (> 2 container levels)
      const maxDepth = this.getMaxNestingDepth(slide.elements, 0);
      if (maxDepth > 2) {
        issues.push({
          code: 'YUM008',
          slide: slideNum,
          message: `Excessive directive nesting depth (${maxDepth} levels). Maximum recommended depth is 2.`,
          severity: 'warning',
          loc: slide.loc,
        });
      }

      // YUM009: Missing Speaker Notes (info severity)
      if (options.includeOptionalNotesRule && (!slide.notes || slide.notes.trim() === '')) {
        issues.push({
          code: 'YUM009',
          slide: slideNum,
          message: 'Slide has no speaker notes (:::notes directive).',
          severity: 'info',
          loc: slide.loc,
        });
      }
    });

    // YUM010: Custom Color Palette Contrast Validation (WCAG AA check)
    if (presentation.metadata?.colors?.background && presentation.metadata?.colors?.text) {
      const bg = presentation.metadata.colors.background;
      const text = presentation.metadata.colors.text;
      if (bg.startsWith('#') && text.startsWith('#')) {
        const ratio = this.getContrastRatio(bg, text);
        if (ratio < 3.0) {
          issues.push({
            code: 'YUM010',
            slide: 1,
            message: `Insufficient color contrast in custom palette: background (${bg}) vs text (${text}) has a ratio of ${ratio.toFixed(1)}:1 (minimum recommended: 4.5:1 for WCAG AA).`,
            severity: 'warning',
          });
        }
      }
    }

    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const infos = issues.filter((i) => i.severity === 'info');

    const score = Math.max(
      0,
      Math.min(100, 100 - errors.length * 20 - warnings.length * 5 - infos.length * 1)
    );

    const suggestions: string[] = [];
    if (warnings.some((w) => w.code === 'YUM001')) {
      suggestions.push('Reduce text length or split overflowing slides using slide breaks.');
    }
    if (warnings.some((w) => w.code === 'YUM004')) {
      suggestions.push(
        'High density detected: consider converting dense bullet lists into cards or a multi-column layout.'
      );
    }
    if (warnings.some((w) => w.code === 'YUM007')) {
      suggestions.push('Add alt="description" to all images for full accessibility.');
    }
    if (warnings.some((w) => w.code === 'YUM010')) {
      suggestions.push(
        'Increase color contrast between text and background to meet WCAG AA (4.5:1).'
      );
    }
    if (suggestions.length === 0 && score === 100) {
      suggestions.push('Design layout and visual hierarchy are optimal.');
    }

    return {
      passed: options.strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0,
      totalSlides: presentation.slides.length,
      issueCount: issues.length,
      score,
      errors,
      warnings,
      infos,
      suggestions,
    };
  }

  private getLuminance(hex: string): number {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6 && clean.length !== 3) return 0.5;
    const rgb =
      clean.length === 3
        ? clean.split('').map((c) => parseInt(c + c, 16) / 255)
        : [
            parseInt(clean.slice(0, 2), 16) / 255,
            parseInt(clean.slice(2, 4), 16) / 255,
            parseInt(clean.slice(4, 6), 16) / 255,
          ];
    const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    const r = a[0] ?? 0;
    const g = a[1] ?? 0;
    const b = a[2] ?? 0;
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  }

  private getContrastRatio(hex1: string, hex2: string): number {
    const l1 = this.getLuminance(hex1);
    const l2 = this.getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private checkTablesAndCode(
    elements: SlideElement[],
    slideNum: number,
    issues: LintRuleResult[]
  ): void {
    const traverse = (els: SlideElement[]) => {
      for (const el of els) {
        if (el.type === 'table') {
          const colCount = Math.max(
            el.headers?.length || 0,
            el.rows && el.rows[0] ? el.rows[0].length : 0
          );
          if (colCount > 5) {
            issues.push({
              code: 'YUM011',
              slide: slideNum,
              message: `Table contains ${colCount} columns (recommended max: 5 for 16:9 slides). Content may cause horizontal clipping.`,
              severity: 'warning',
              loc: el.loc,
            });
          }
        } else if (el.type === 'code') {
          const lines = el.code.split('\n');
          const maxLineLength = Math.max(...lines.map((l) => l.length));
          if (maxLineLength > 80) {
            issues.push({
              code: 'YUM012',
              slide: slideNum,
              message: `Code block contains lines exceeding 80 characters (max: ${maxLineLength} chars). May cause line wrapping or overflow.`,
              severity: 'info',
              loc: el.loc,
            });
          }
        } else if (el.type === 'card' && (el as CardElement).elements) {
          traverse((el as CardElement).elements);
        } else if (el.type === 'columns') {
          for (const col of (el as ColumnsElement).columns) {
            traverse(col.elements);
          }
        }
      }
    };
    traverse(elements);
  }

  private slideHasHeading(elements: SlideElement[]): boolean {
    for (const el of elements) {
      if (el.type === 'heading') return true;
      if (el.type === 'card' && (el as CardElement).title) return true;
      if (el.type === 'columns') {
        const cols = (el as ColumnsElement).columns;
        for (const col of cols) {
          if (this.slideHasHeading(col.elements)) return true;
        }
      }
    }
    return false;
  }

  private calculateSlideDensity(elements: SlideElement[]): {
    listCount: number;
    wordCount: number;
  } {
    let listCount = 0;
    let wordCount = 0;

    const traverse = (els: SlideElement[]) => {
      for (const el of els) {
        if (el.type === 'list') {
          const list = el as ListElement;
          listCount += list.items.length;
          for (const item of list.items) {
            wordCount += item.text.split(/\s+/).filter(Boolean).length;
          }
        } else if (el.type === 'paragraph') {
          const p = el as ParagraphElement;
          wordCount += p.text.split(/\s+/).filter(Boolean).length;
        } else if (el.type === 'card') {
          const card = el as CardElement;
          if (card.title) wordCount += card.title.split(/\s+/).filter(Boolean).length;
          if (card.elements) traverse(card.elements);
        } else if (el.type === 'columns') {
          const cols = el as ColumnsElement;
          for (const col of cols.columns) {
            traverse(col.elements);
          }
        }
      }
    };

    traverse(elements);
    return { listCount, wordCount };
  }

  private checkImages(elements: SlideElement[], slideNum: number, issues: LintRuleResult[]): void {
    const traverse = (els: SlideElement[]) => {
      for (const el of els) {
        if (el.type === 'image') {
          const img = el as ImageElement;
          if (!img.alt || img.alt.trim() === '') {
            issues.push({
              code: 'YUM007',
              slide: slideNum,
              message: `Image '${img.src}' is missing descriptive alt text for accessibility.`,
              severity: 'warning',
              loc: img.loc,
            });
          }
          if (!img.src || img.src.trim() === '') {
            issues.push({
              code: 'YUM005',
              slide: slideNum,
              message: 'Image element has empty src attribute.',
              severity: 'error',
              loc: img.loc,
            });
          }
        } else if (el.type === 'card' && (el as CardElement).elements) {
          traverse((el as CardElement).elements);
        } else if (el.type === 'columns') {
          for (const col of (el as ColumnsElement).columns) {
            traverse(col.elements);
          }
        }
      }
    };

    traverse(elements);
  }

  private getMaxNestingDepth(elements: SlideElement[], currentDepth: number): number {
    let max = currentDepth;
    for (const el of elements) {
      if (el.type === 'card' && (el as CardElement).elements) {
        const d = this.getMaxNestingDepth((el as CardElement).elements, currentDepth + 1);
        if (d > max) max = d;
      } else if (el.type === 'columns') {
        for (const col of (el as ColumnsElement).columns) {
          const d = this.getMaxNestingDepth(col.elements, currentDepth + 1);
          if (d > max) max = d;
        }
      }
    }
    return max;
  }
}
