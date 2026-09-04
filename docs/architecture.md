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

| Package                  | Responsibility                                                  | Dependencies                                                                          |
| :----------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `@yumiamd/ast`           | Pure semantic presentation AST data structures                  | None                                                                                  |
| `@yumiamd/parser`        | Parses frontmatter, slides, and presentation markdown into AST  | `@yumiamd/ast`                                                                        |
| `@yumiamd/theme`         | Theme definitions, tokens, and default palettes                 | None                                                                                  |
| `@yumiamd/layout`        | Computes geometry, bounding boxes, overflow, and coordinates    | `@yumiamd/ast`                                                                        |
| `@yumiamd/renderer`      | Core renderer abstraction and rendering context                 | `@yumiamd/ast`, `@yumiamd/layout`, `@yumiamd/theme`                                   |
| `@yumiamd/renderer-pptx` | **Native editable PowerPoint (`.pptx`) presentation compiler**  | `@yumiamd/ast`, `@yumiamd/renderer`, `@yumiamd/layout`, `@yumiamd/theme`, `pptxgenjs` |
| `@yumiamd/renderer-pdf`  | Vector PDF document compiler _(in development)_                 | `@yumiamd/ast`, `@yumiamd/renderer`                                                   |
| `@yumiamd/renderer-html` | Interactive HTML5 presentation deck compiler _(in development)_ | `@yumiamd/ast`, `@yumiamd/renderer`                                                   |
| `@yumiamd/core`          | High-level orchestration layer coordinating all stages          | All core packages                                                                     |
| `yumiamd`                | Command-line developer tool (`yumia`)                           | `@yumiamd/core`, `@yumiamd/ast`, `@yumiamd/parser`, `@yumiamd/renderer-pptx`          |

## Native Object Philosophy (PPTX)

Unlike tools that convert slides into full-screen raster images or SVG captures, YumiaMD produces **native, editable shapes and text runs** in PowerPoint:

- **Headings and paragraphs**: Mapped to native OpenXML TextFrames with font family, size, line height, and color tokens.
- **Lists**: Rendered as native PPTX bullet items with proper indentation levels.
- **Cards**: Rendered as native vector rounded rectangle shapes with theme fill and border styling, containing child elements.
- **Code blocks**: Rendered with dedicated monospace font formatting and syntax background containers.
- **Blockquotes**: Vector accent bars accompanied by styled quote text frames.
- **Speaker notes**: Attached directly to slide metadata via OpenXML note frames.
