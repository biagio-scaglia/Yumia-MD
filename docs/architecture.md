# Yumia Architecture & Compiler Design

This document details the internal architecture, data structures, and pipeline flow of **Yumia**.

---

## 1. Architectural Pipeline

```text
       ┌───────────────────────┐       ┌───────────────────────┐
       │     Native Yumia      │       │     Markdown Yumia    │
       │       (.yumia)        │       │       (.yumia.md)     │
       └──────────┬────────────┘       └──────────┬────────────┘
                  │                               │
                  ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │   NativeYumiaParser   │       │   DefaultYumiaParser  │
       └──────────┬────────────┘       └──────────┬────────────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │      Yumia AST      │
                       │   (Pure Semantic)   │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │   Style Resolution  │
                       │  + Icon Resolution  │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │  Deterministic IR   │
                       │  + Layout Engine    │
                       └──────────┬──────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │ HtmlRenderer │     │ PptxRenderer │     │ PdfRenderer  │
     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
            ▼                    ▼                    ▼
       Interactive           Editable              Vector
         HTML5                 PPTX                 PDF
```

---

## 2. Core Packages

| Package                    | Purpose                                                                                  | Dependencies                                                        |
| :------------------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `@yumiamd/ast`             | Pure TypeScript interfaces defining the Presentation AST, elements, and factory helpers. | None (Zero-dependency)                                              |
| `@yumiamd/theme`           | Design tokens, color palettes, and theme resolution algorithms.                          | `@yumiamd/ast`                                                      |
| `@yumiamd/layout`          | 2D box-model geometry computation and layout coordinate engine.                          | `@yumiamd/ast`                                                      |
| `@yumiamd/parser`          | Native Yumia indentation parser, Markdown directive parser, and legacy migrator.         | `@yumiamd/ast`                                                      |
| `@yumiamd/renderer`        | Universal renderer interfaces, render contexts, and `IconResolver` registry.             | `@yumiamd/ast`, `@yumiamd/theme`                                    |
| `@yumiamd/renderer-html`   | Interactive HTML5 presentation runner with KaTeX, Mermaid, and speaker mode.             | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/theme`               |
| `@yumiamd/renderer-pptx`   | Native OpenXML PowerPoint generator producing 100% editable shapes and tables.           | `pptxgenjs`, `@yumiamd/ast`, `@yumiamd/layout`, `@yumiamd/renderer` |
| `@yumiamd/renderer-pdf`    | Vector PDF document generator with precise coordinate layout.                            | `pdfkit`, `@yumiamd/ast`, `@yumiamd/renderer`                       |
| `@yumiamd/core`            | High-level compiler orchestration, AST linter, and schema definitions.                   | All packages above                                                  |
| `yumiamd` (`packages/cli`) | Command line interface, live dev server, formatters, and deployment exports.             | `@yumiamd/core`                                                     |

---

## 3. AST Semantic Model

The Abstract Syntax Tree is decoupled from any HTML or styling library. All nodes extend `BaseElement`:

```typescript
export interface BaseElement {
  loc?: SourceLocation;
  step?: number;
}

export type SlideElement =
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

## 4. Multi-Target Rendering Principles

1. **HTML5 (`HtmlRenderer`)**:
   - Compiles AST nodes into semantic HTML5 with custom CSS variables (`--yumia-primary`, `--yumia-background`).
   - Supports keyboard navigation, fullscreen, speaker notes window, live overview, and `@media print` PDF generation.

2. **PowerPoint (`PptxRenderer`)**:
   - Elements are mapped to OpenXML shapes, text boxes, and table cells.
   - Text remains editable with proper font faces (`headingFont`, `bodyFont`).
   - Charts are compiled into native Microsoft Chart OpenXML structures.

3. **PDF (`PdfRenderer`)**:
   - Layout nodes are mapped into vector drawing paths and typography commands using PDFKit.
   - Supports custom DPI coordinate scaling, page breaks, and embedded vector graphics.
