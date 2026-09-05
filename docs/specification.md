# Yumia Formal Language & Compiler Specification

> **Specification Version**: 1.1.0  
> **Compiler Target**: Yumia Monorepo (`yumiamd`)

---

## 1. Syntax & Lexical Grammar

Yumia documents are UTF-8 encoded text files using either:

1. **Native Yumia (`.yumia`)**: Clean, indentation-based declarative grammar.
2. **Markdown Yumia (`.yumia.md`)**: Extended Markdown with triple-colon `:::` directives.

### 1.1 Frontmatter / Document Declaration

**Markdown (`.yumia.md`)**:

```yaml
---
title: <string>
theme: default | cyberpunk | minimal | corporate | terminal | academic
aspectRatio: "16:9" | "4:3" | "16:10"
author: <string>
transition: fade | push | wipe | zoom | split | none
template: <path-to-potx>
embedFonts: true | false
colors:
  background: <hex-color>
  text: <hex-color>
  primary: <hex-color>
  secondary: <hex-color>
  accent: <hex-color>
---
```

**Native Yumia (`.yumia`)**:

```yumia
document "Title"
  theme "corporate"
  aspectRatio "16:9"
  author "Author Name"
  transition "fade"
```

### 1.2 Slide Separation

- **Markdown**: Slides are delimited by isolated `---` lines.
- **Native**: Slides are declared with `slide "<Title>"` blocks.

---

## 2. Block Directives & Visual Intent Specification

All directives express high-level design intent rather than low-level CSS properties.

### 2.1 Directives Grammar Matrix

| Directive       | Syntax (`.yumia.md` / `.yumia`)                                            | Supported Attributes                                                                  | Renderers Supported                                    |
| :-------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| `:::hero`       | `:::hero title="..." [subtitle="..."] [badge="..."] [align="..."]`         | `title`, `subtitle`, `badge`, `emphasis` (`high\|medium\|subtle`), `align`, `density` | PPTX, PDF, HTML                                        |
| `:::callout`    | `:::callout [variant="..."] [title="..."] [icon="..."] \n ... \n :::`      | `variant` (`info\|warning\|success\|danger\|accent`), `title`, `icon`, `collapsible`  | PPTX, PDF, HTML                                        |
| `:::image`      | `:::image src="..." [alt="..."] [fit="..."] [radius="..."] [shadow="..."]` | `src`, `alt`, `caption`, `fit`, `radius`, `shadow`, `aspectRatio`, `zoomable`         | PPTX (Shape/Bitmap), PDF (Vector/Bitmap), HTML (Image) |
| `:::columns`    | `:::columns ratios="A:B" \n :::column \n ... \n ::: \n :::`                | `ratios` (e.g. `"50:50"`, `"30:70"`), `gap`                                           | PPTX, PDF, HTML                                        |
| `:::grid`       | `:::grid columns=N gap=N \n ... \n :::`                                    | `columns` (1..6), `gap`, `density`                                                    | PPTX, PDF, HTML                                        |
| `:::card`       | `:::card [Title] [variant="..."] \n ... \n :::`                            | `variant` (`primary\|success\|warning\|danger\|accent`), `glow`, `padding`            | PPTX, PDF, HTML                                        |
| `:::metric`     | `:::metric value="..." label="..." [change="..."] [variant="..."]`         | `value`, `label`, `change`/`diff`, `variant`, `trend` (`up\|down`)                    | PPTX, PDF, HTML                                        |
| `:::chart`      | `:::chart type="..." title="..." labels="..." data="..."`                  | `type` (`bar\|line\|pie\|doughnut`), `title`, `labels`, `data`, `height`              | PPTX (Native OpenXML Chart), PDF (Vector), HTML (SVG)  |
| `:::timeline`   | `:::timeline [layout="..."] \n - [Date] Title: Desc \n :::`                | `layout` (`horizontal\|vertical`), `variant`                                          | PPTX (Vector), PDF (Vector), HTML (Flex/Grid)          |
| `:::compare`    | `:::compare left="..." right="..." \n ... \n :::vs \n ... \n :::`          | `left`, `right`, `leftVariant`, `rightVariant`                                        | PPTX (Split Box), PDF (Vector), HTML (Grid)            |
| `:::mermaid`    | `:::mermaid \n graph ... \n :::`                                           | Diagram source text                                                                   | PPTX (Box), PDF (Box), HTML (Client SVG)               |
| `:::math`       | `:::math \n <LaTeX / AsciiMath> \n :::` or `$$ ... $$`                     | Display equation formula                                                              | PPTX (Cambria Math), PDF (Vector Box), HTML (KaTeX)    |
| `:::badge`      | `:::badge text="..." [variant="..."] :::`                                  | `text`, `variant`                                                                     | PPTX (Pill), PDF (Pill), HTML (Pill)                   |
| `:::quote`      | `:::quote author="..." [title="..."] \n ... \n :::`                        | `author`, `title`, `avatar`                                                           | PPTX, PDF, HTML                                        |
| `:::transition` | `:::transition [push\|fade\|wipe\|zoom\|split] [duration="..."]`           | `type`, `duration`, `direction`                                                       | PPTX (Native Slide Effect), HTML (CSS3 Animation)      |
| `:::step`       | `:::step \n ... \n :::`                                                    | Content to progressively reveal                                                       | PPTX (Click Animation), PDF (Static), HTML (Keyframe)  |
| `:::notes`      | `:::notes \n ... \n :::`                                                   | Speaker note text                                                                     | PPTX (Notes Frame), PDF (Summary), HTML (Speaker View) |

---

## 3. Deterministic Layout Engine

The layout engine executes at fixed canonical resolution **1920 x 1080 px** (or 1440 x 1080 px for 4:3).

- **Coordinate System**: Bounding boxes are computed as Cartesian rectangles: `{ x: number, y: number, width: number, height: number }`.
- **Flow Model**: Vertical flex stack with auto-wrapping, card padding (40px horizontal, 30px vertical), and multi-column grid fractional distribution.
- **Math Formula Box**: Deterministic 90px equation height allocation with center alignment and accent stroke.
- **Office Font Safe Fallback**:
  - Headings: `Arial, Helvetica, "Trebuchet MS", Calibri, sans-serif`
  - Body: `Calibri, Arial, Helvetica, "Segoe UI", sans-serif`
  - Math: `"Cambria Math", "JetBrains Mono", monospace`
  - Monospace: `"Courier New", Consolas, Menlo, monospace`

---

## 4. Multi-Target Output Guarantees

### 4.1 PowerPoint (`.pptx`)

- 100% native OpenXML shape generation via PptxGenJS.
- Native editable charts via `pptx.addChart()`.
- Native text frames with proper font sizing, line height, and color tokens.
- Native slide transition effects (`push`, `fade`, `wipe`, `zoom`, `split`).
- Corporate `.potx` master slide preservation via `--template`.
- Presentation font embedding via `embedFonts: true` / `--embed-fonts`.
- Styled mathematical equation boxes with `Cambria Math` scientific typography.

### 4.2 Vector PDF (`.pdf`)

- Direct vector rendering via PDFKit.
- High-definition typography with WinAnsi / Unicode emoji fallback sanitization.
- Vector boxed formulas with primary accent bar and italicized typography.

### 4.3 Interactive HTML5 (`.html`)

- Standalone self-contained single-page application.
- Dual-window Speaker View synchronizing clock, elapsed timer, slide notes, and next-slide preview via `BroadcastChannel`.
- Hardware-accelerated CSS3 transition animations (`fadeIn`, `pushIn`, `wipeIn`, `zoomIn`).
- Interactive Visual Inspector (`I` key / `Alt+Click`) displaying design tokens and bounding boxes.
