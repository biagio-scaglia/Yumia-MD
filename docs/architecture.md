# YumiaMD Architecture

YumiaMD is designed around a strict unidirectional compiler pipeline with clear separation of concerns across parsing, semantics, layout, and rendering.

## Pipeline Flow

```
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
 │   layout    │  Geometric placement (stack, columns, split, hero, grid)
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │  renderer   │  Target-specific compiler (PPTX, PDF, HTML)
 └─────────────┘
```

## Packages Overview

| Package                | Responsibility                                                 | Dependencies                                                     |
| :--------------------- | :------------------------------------------------------------- | :--------------------------------------------------------------- |
| `@yumia/ast`           | Pure semantic presentation AST data structures                 | None                                                             |
| `@yumia/parser`        | Parses frontmatter, slides, and presentation markdown into AST | `@yumia/ast`                                                     |
| `@yumia/theme`         | Theme definitions, tokens, and default palettes                | None                                                             |
| `@yumia/layout`        | Computes geometry, sizes, and coordinates                      | `@yumia/ast`                                                     |
| `@yumia/renderer`      | Core renderer abstraction and rendering context                | `@yumia/ast`, `@yumia/layout`, `@yumia/theme`                    |
| `@yumia/renderer-pptx` | Native editable PowerPoint presentation compiler (planned)     | `@yumia/ast`, `@yumia/renderer`, `@yumia/layout`, `@yumia/theme` |
| `@yumia/renderer-pdf`  | Vector PDF document compiler (planned)                         | `@yumia/ast`, `@yumia/renderer`                                  |
| `@yumia/renderer-html` | Interactive HTML5 presentation deck compiler (planned)         | `@yumia/ast`, `@yumia/renderer`                                  |
| `@yumia/core`          | High-level orchestration layer coordinating all stages         | All core packages                                                |
| `@yumia/cli`           | Command-line developer tool (`yumia`)                          | `@yumia/core`, `@yumia/ast`, `@yumia/parser`                     |

## Native Object Philosophy (PPTX)

Unlike tools that convert slides into full-screen raster images or SVG captures, YumiaMD is engineered from the ground up to produce **native, editable shapes and text runs** in target formats like PowerPoint:

- Headings and paragraphs become editable TextFrames.
- Lists preserve native PPTX bullet levels.
- Cards map to vector shapes with formatted text containers.
- Tables become native presentation table entities.
