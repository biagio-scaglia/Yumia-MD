# Yumia Architecture & Design Compiler System

This document details the internal architecture, semantic data structures, design pipeline flow, and multi-target compilation of **Yumia**.

---

## 1. Architectural Pipeline

Yumia functions as a **Design Compiler** that transforms content, intent, and structure into high-fidelity visual presentations across multiple target formats.

```text
┌────────────────────────┐       ┌────────────────────────┐
│   Native Yumia (.yumia)│       │ Markdown (.yumia.md)   │
└───────────┬────────────┘       └───────────┬────────────┘
            │                                │
            ▼                                ▼
┌────────────────────────┐       ┌────────────────────────┐
│   NativeYumiaParser    │       │   DefaultYumiaParser   │
└───────────┬────────────┘       └───────────┬────────────┘
            │                                │
            └───────────────┬────────────────┘
                            ▼
               ┌────────────────────────┐
               │       Yumia AST        │
               │ (Design Intent Nodes)  │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  Design Linter & Audit │
               │ (Visual Quality Score) │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │    Style Resolution    │
               │  + Theme & Icon Engine │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  Deterministic Layout  │
               │   Box-Model Geometry   │
               └────────────┬───────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ HtmlRenderer │   │ PptxRenderer │   │ PdfRenderer  │
 └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
        ▼                  ▼                  ▼
   Interactive          Editable            Vector
     HTML5 +              PPTX               PDF
Visual Inspector        OpenXML            Drawing
```

---

## 2. Core Monorepo Packages

| Package                    | Purpose                                                                                | Dependencies                                                        |
| :------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `@yumiamd/ast`             | Pure TypeScript interfaces defining presentation AST, visual intent, and node factory. | None (Zero-dependency)                                              |
| `@yumiamd/theme`           | Design tokens, color palettes, typography scales, and theme resolution.                | `@yumiamd/ast`                                                      |
| `@yumiamd/layout`          | 2D box-model geometry computation and layout coordinate engine.                        | `@yumiamd/ast`                                                      |
| `@yumiamd/parser`          | Indentation-based Native parser, Markdown directive parser, and migration utility.     | `@yumiamd/ast`                                                      |
| `@yumiamd/renderer`        | Universal renderer interfaces, render contexts, and `IconResolver` registry.           | `@yumiamd/ast`, `@yumiamd/theme`                                    |
| `@yumiamd/renderer-html`   | Interactive HTML5 presentation runner with KaTeX, Mermaid, and Visual Inspector.       | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/theme`               |
| `@yumiamd/renderer-pptx`   | Native OpenXML PowerPoint generator producing 100% editable shapes and charts.         | `pptxgenjs`, `@yumiamd/ast`, `@yumiamd/layout`, `@yumiamd/renderer` |
| `@yumiamd/renderer-pdf`    | Vector PDF document generator with precise coordinate layout and typography.           | `pdfkit`, `@yumiamd/ast`, `@yumiamd/renderer`                       |
| `@yumiamd/core`            | High-level compiler orchestration, Design Linter, and schema definitions.              | All packages above                                                  |
| `yumiamd` (`packages/cli`) | Command line interface, live dev server, formatters, and deployment exports.           | `@yumiamd/core`                                                     |

---

## 3. AST Semantic & Design Intent Model

The Abstract Syntax Tree captures both content and **visual intent** (hierarchy, emphasis, density, alignment) decoupled from any concrete CSS or rendering framework:

```typescript
export interface BaseElement {
  id?: string;
  loc?: SourceLocation;
  step?: number;
  emphasis?: 'high' | 'medium' | 'subtle';
  density?: 'compact' | 'comfortable' | 'spacious';
  hierarchy?: 'primary' | 'secondary' | 'supporting';
  align?: 'left' | 'center' | 'right' | 'justify';
  semanticRole?: 'hero' | 'feature' | 'detail' | 'meta' | 'data' | 'aside';
}

export type SlideElement =
  | HeroElement
  | CalloutElement
  | HeadingElement
  | ParagraphElement
  | ListElement
  | ImageElement
  | CardElement
  | MetricElement
  | CodeElement
  | SectionElement
  | TocElement
  | QuoteElement
  | TableElement
  | ChartElement
  | MermaidElement
  | TimelineElement
  | CompareElement
  | BadgeElement
  | MathElement
  | IconElement
  | GridElement
  | StackElement
  | ComponentElement
  | SlotElement
  | ColumnElement
  | ColumnsElement;
```

---

## 4. Design Linter & Visual Quality Scoring

The compiler incorporates an automated design linter (`@yumiamd/core/src/linter.ts`) that analyzes parsed slides for design anti-patterns before compilation:

1. **Information Density (`YUM004`)**: Warns if a slide exceeds optimal cognitive load (>12 complex elements or excessive body text).
2. **Empty Content Containers (`YUM001`)**: Identifies empty slides, grids, or containers.
3. **Contrast & Readability (`YUM010`)**: Validates text against background colors to ensure compliance with WCAG AA (4.5:1) and AAA (7:1).
4. **Hierarchy Balance (`YUM006`)**: Detects missing headings or inconsistent visual weighting.
5. **Quality Score Calculation**: Produces a normalized score (0–100) reflecting overall design polish and presentation quality.

---

## 5. Interactive Visual Inspector

Presentations rendered to HTML include an on-demand Design Inspector:

- Activated via pressing `I`, clicking the bottom-right `🔍 Inspect` trigger, or `Alt+Click` on any element.
- Shows live bounding boxes, computed color tokens (`--yumia-primary`, `--yumia-surface`), element variant, and source file line references.

---

## 6. Multi-Target Rendering Principles

1. **HTML5 (`HtmlRenderer`)**:
   - Compiles AST nodes into responsive, hardware-accelerated HTML5 with CSS custom properties.
   - Includes full keyboard navigation, fullscreen mode, dual-screen Speaker Notes with elapsed timer, and live Design Inspector.

2. **PowerPoint (`PptxRenderer`)**:
   - Maps AST nodes to native Microsoft PowerPoint OpenXML shapes, text boxes, and tables.
   - Charts are rendered as genuine editable OpenXML charts.
   - Supports `.potx` corporate templates and custom font embedding.

3. **PDF (`PdfRenderer`)**:
   - Vector graphics rendering via PDFKit with precise DPI scaling, page breaks, and embedded vector icons.
