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

| Package                              | Responsibility                                                  | Dependencies                                                                                                                          |
| :----------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `@biagioscaglia/yumia-ast`           | Pure semantic presentation AST data structures                  | None                                                                                                                                  |
| `@biagioscaglia/yumia-parser`        | Parses frontmatter, slides, and presentation markdown into AST  | `@biagioscaglia/yumia-ast`                                                                                                            |
| `@biagioscaglia/yumia-theme`         | Theme definitions, tokens, and default palettes                 | None                                                                                                                                  |
| `@biagioscaglia/yumia-layout`        | Computes geometry, bounding boxes, overflow, and coordinates    | `@biagioscaglia/yumia-ast`                                                                                                            |
| `@biagioscaglia/yumia-renderer`      | Core renderer abstraction and rendering context                 | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-layout`, `@biagioscaglia/yumia-theme`                                               |
| `@biagioscaglia/yumia-renderer-pptx` | **Native editable PowerPoint (`.pptx`) presentation compiler**  | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`, `@biagioscaglia/yumia-layout`, `@biagioscaglia/yumia-theme`, `pptxgenjs` |
| `@biagioscaglia/yumia-renderer-pdf`  | Vector PDF document compiler _(in development)_                 | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`                                                                           |
| `@biagioscaglia/yumia-renderer-html` | Interactive HTML5 presentation deck compiler _(in development)_ | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`                                                                           |
| `@biagioscaglia/yumia-core`          | High-level orchestration layer coordinating all stages          | All core packages                                                                                                                     |
| `yumiamd`                            | Command-line developer tool (`yumia`)                           | `@biagioscaglia/yumia-core`, `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-parser`, `@biagioscaglia/yumia-renderer-pptx`          |

## Native Object Philosophy (PPTX)

Unlike tools that convert slides into full-screen raster images or SVG captures, YumiaMD produces **native, editable shapes and text runs** in PowerPoint:

- **Headings and paragraphs**: Mapped to native OpenXML TextFrames with font family, size, line height, and color tokens.
- **Lists**: Rendered as native PPTX bullet items with proper indentation levels.
- **Cards**: Rendered as native vector rounded rectangle shapes with theme fill and border styling, containing child elements.
- **Code blocks**: Rendered with dedicated monospace font formatting and syntax background containers.
- **Blockquotes**: Vector accent bars accompanied by styled quote text frames.
- **Speaker notes**: Attached directly to slide metadata via OpenXML note frames.
