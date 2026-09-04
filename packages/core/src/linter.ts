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
  errors: LintRuleResult[];
  warnings: LintRuleResult[];
  infos: LintRuleResult[];
}

export interface LintOptions {
  viewport?: Size;
  strict?: boolean;
  includeOptionalNotesRule?: boolean;
  layoutEngine?: LayoutEngine;
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
          message: 'Slide has no heading (h1-h4). Consider adding a descriptive title for structure.',
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

    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const infos = issues.filter((i) => i.severity === 'info');

    return {
      passed: options.strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0,
      totalSlides: presentation.slides.length,
      issueCount: issues.length,
      errors,
      warnings,
      infos,
    };
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

  private calculateSlideDensity(elements: SlideElement[]): { listCount: number; wordCount: number } {
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
