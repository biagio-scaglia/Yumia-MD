# YumiaMD Formal Language & Compiler Specification

> **Specification Version**: 1.0.0-rc  
> **Compiler Target**: YumiaMD Core Monorepo (`yumiamd`)

---

## 1. Syntax & Lexical Grammar

A YumiaMD document is a UTF-8 encoded text document with the `.yumia.md` or `.md` extension.

### 1.1 Frontmatter

Frontmatter must be positioned at the top of the file enclosed by triple dashes `---`:

```yaml
---
title: <string>
theme: default | cyberpunk | minimal | corporate | terminal | academic
aspectRatio: "16:9" | "4:3" | "16:10"
author: <string>
colors:
  background: <hex-color>
  text: <hex-color>
  primary: <hex-color>
  secondary: <hex-color>
  accent: <hex-color>
---
```

### 1.2 Slide Separation

Slides are delimited by top-level horizontal rules: `---` on an isolated line.

---

## 2. Block Directives Specification

All directives use the semantic block notation `:::name [attributes] ... :::` or inline single-line syntax.

### 2.1 Directives Grammar Matrix

| Directive     | Syntax                                                             | Attributes                                                           | Renderers Supported                                    |
| :------------ | :----------------------------------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------- |
| `:::columns`  | `:::columns ratios="A:B" \n :::column \n ... \n ::: \n :::`        | `ratios` (e.g. `"50:50"`, `"30:70"`)                                 | PPTX, PDF, HTML                                        |
| `:::card`     | `:::card [Title] [variant="..."] \n ... \n :::`                    | `variant` (`primary`, `success`, `warning`, `danger`, `info`)        | PPTX, PDF, HTML                                        |
| `:::metric`   | `:::metric value="..." label="..." [change="..."] [variant="..."]` | `value`, `label`, `change`, `variant`                                | PPTX, PDF, HTML                                        |
| `:::chart`    | `:::chart type="..." title="..." labels="..." data="..."`          | `type` (`bar`, `line`, `pie`, `doughnut`), `title`, `labels`, `data` | PPTX (Native), PDF (Vector), HTML (SVG)                |
| `:::mermaid`  | `:::mermaid \n graph ... \n :::`                                   | Diagram source text                                                  | PPTX (Box), PDF (Box), HTML (Client SVG)               |
| `:::timeline` | `:::timeline [layout="horizontal                                   | vertical"] \n - [Date] Title: Desc \n :::`                           | `layout`                                               | PPTX (Vector), PDF (Vector), HTML (CSS) |
| `:::compare`  | `:::compare left="..." right="..." \n ... \n :::vs \n ... \n :::`  | `left`, `right`                                                      | PPTX (Split Box), PDF (Vector), HTML (Grid)            |
| `:::badge`    | `:::badge text="..." [variant="..."] :::`                          | `text`, `variant`                                                    | PPTX (Pill), PDF (Pill), HTML (Pill)                   |
| `:::step`     | `:::step \n ... \n :::`                                            | Content to progressively reveal                                      | PPTX (Click), PDF (Static), HTML (Key-Triggered)       |
| `:::notes`    | `:::notes \n ... \n :::`                                           | Speaker note text                                                    | PPTX (Notes Frame), PDF (Summary), HTML (Speaker View) |

---

## 3. Deterministic Layout Engine

The layout engine executes at fixed canonical resolution **1920 x 1080 px** (or 1440 x 1080 px for 4:3).

- **Coordinate System**: Bounding boxes are computed as Cartesian rectangles: `{ x: number, y: number, width: number, height: number }`.
- **Flow Model**: Vertical flex stack with auto-wrapping, card padding (40px horizontal, 30px vertical), and multi-column grid fractional distribution.
- **Office Font Safe Fallback**:
  - Headings: `Arial, Helvetica, "Trebuchet MS", Calibri, sans-serif`
  - Body: `Calibri, Arial, Helvetica, "Segoe UI", sans-serif`
  - Monospace: `"Courier New", Consolas, Menlo, monospace`

---

## 4. Multi-Target Output Guarantees

### 4.1 PowerPoint (`.pptx`)

- 100% native OpenXML shape generation via PptxGenJS.
- Native editable charts via `pptx.addChart()`.
- Native text frames with proper font sizing, line height, and color tokens.

### 4.2 Vector PDF (`.pdf`)

- Direct vector rendering via PDFKit.
- High-definition typography with WinAnsi / Unicode emoji fallback sanitization.

### 4.3 Interactive HTML5 (`.html`)

- Standalone self-contained single-page application.
- Dual-window Speaker View synchronizing clock, elapsed timer, slide notes, and next-slide preview via `BroadcastChannel`.
- Keyboard hotkeys:
  - `ArrowRight` / `Space`: Next slide / fragment step
  - `ArrowLeft` / `Backspace`: Previous slide
  - `S`: Speaker View
  - `ESC` / `O`: Overview grid modal
  - `F`: Fullscreen mode
  - `N`: Notes drawer
