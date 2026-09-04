# YumiaMD Architecture

YumiaMD is designed around a strict unidirectional compiler pipeline with clear separation of concerns across parsing, semantics, layout, and rendering.

## Pipeline Flow

```text
Source (.yumia.md)
       │
       ▼
 ┌─────────────┐
 │   parser    │  Converts Markdown + Presentation DSL into AST
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │     ast     │  Pure semantic presentation data structures
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │    theme    │  Semantic tokens (colors, typography, spacing)
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │   layout    │  Deterministic geometric placement (stack, columns, cards, bounds)
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │  renderer   │  Target-specific compiler (PPTX, PDF, HTML)
 └─────────────┘
```

## Packages Overview

| Package                  | Responsibility                                                 | Dependencies                                                                          |
| :----------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `@yumiamd/ast`           | Pure semantic presentation AST data structures                 | None                                                                                  |
| `@yumiamd/parser`        | Parses frontmatter, slides, and presentation markdown into AST | `@yumiamd/ast`                                                                        |
| `@yumiamd/theme`         | Theme definitions, tokens, and default palettes                | None                                                                                  |
| `@yumiamd/layout`        | Computes geometry, bounding boxes, overflow, and coordinates   | `@yumiamd/ast`                                                                        |
| `@yumiamd/renderer`      | Core renderer abstraction and rendering context                | `@yumiamd/ast`, `@yumiamd/layout`, `@yumiamd/theme`                                   |
| `@yumiamd/renderer-pptx` | **Native editable PowerPoint (`.pptx`) presentation compiler** | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/layout`, `@yumiamd/theme`, `pptxgenjs` |
| `@yumiamd/renderer-pdf`  | **Crisp Vector PDF (`.pdf`) document compiler**                | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/layout`, `@yumiamd/theme`, `pdfkit`    |
| `@yumiamd/renderer-html` | **Interactive HTML5 deck + Speaker View (`.html`) compiler**   | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/layout`, `@yumiamd/theme`              |
| `@yumiamd/core`          | High-level orchestration layer coordinating all stages         | All core packages                                                                     |
| `yumiamd`                | Command-line developer tool (`yumia`)                          | `@yumiamd/core`, `@yumiamd/ast`, `@yumiamd/parser`, all renderers                     |

## Multi-Target Compiler Philosophy

### 1. PowerPoint (`.pptx`) — Native Object Engine

Unlike tools that convert slides into full-screen raster images or SVG captures, YumiaMD produces **native, editable shapes and text runs** in PowerPoint:

- **Headings and paragraphs**: Mapped to native OpenXML TextFrames with font family, size, line height, and color tokens.
- **Lists**: Rendered as native PPTX bullet items with proper indentation levels.
- **Cards**: Rendered as native vector rounded rectangle shapes with theme fill and border styling, containing child elements.
- **Charts (`:::chart`)**: Compiled directly into native PowerPoint chart objects (`pptx.addChart()`) editable directly within Microsoft PowerPoint.
- **Timelines (`:::timeline`)**: Rendered with vector node circles, text frames, and connector line shapes.
- **Comparisons (`:::compare`)**: Multi-column vector container shapes with headers and vs badges.
- **Badges (`:::badge`)**: Vector pill shapes with theme color tokens.
- **Speaker notes**: Attached directly to slide metadata via OpenXML note frames.

### 2. Interactive HTML5 (`.html`) — Interactive & Speaker Mode

- Standalone self-contained HTML single-page app with embedded CSS design tokens.
- Dynamic responsive SVG chart rendering and client-side Mermaid.js diagram compilation.
- Step animations (`:::step`) with keyboard click triggers.
- Multi-screen Speaker View (`S` key) communicating via `BroadcastChannel` with slide timer, notes, and preview.
- Overview grid (`ESC` key) and full-screen presentation mode (`F` key).

### 3. Vector PDF (`.pdf`) — Pixel-Perfect Print Target

- Direct vector rendering via PDFKit at 1920x1080 canonical slide dimensions.
- High-resolution typography with Unicode and emoji fallback sanitization.
- Vector chart bars, lines, and pie slices drawn directly on PDF vector canvas.
