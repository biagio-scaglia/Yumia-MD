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

| Package                              | Responsibility                                                 | Dependencies                                                                                                             |
| :----------------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `@biagioscaglia/yumia-ast`           | Pure semantic presentation AST data structures                 | None                                                                                                                     |
| `@biagioscaglia/yumia-parser`        | Parses frontmatter, slides, and presentation markdown into AST | `@biagioscaglia/yumia-ast`                                                                                               |
| `@biagioscaglia/yumia-theme`         | Theme definitions, tokens, and default palettes                | None                                                                                                                     |
| `@biagioscaglia/yumia-layout`        | Computes geometry, sizes, and coordinates                      | `@biagioscaglia/yumia-ast`                                                                                               |
| `@biagioscaglia/yumia-renderer`      | Core renderer abstraction and rendering context                | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-layout`, `@biagioscaglia/yumia-theme`                                  |
| `@biagioscaglia/yumia-renderer-pptx` | Native editable PowerPoint presentation compiler (planned)     | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`, `@biagioscaglia/yumia-layout`, `@biagioscaglia/yumia-theme` |
| `@biagioscaglia/yumia-renderer-pdf`  | Vector PDF document compiler (planned)                         | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`                                                              |
| `@biagioscaglia/yumia-renderer-html` | Interactive HTML5 presentation deck compiler (planned)         | `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-renderer`                                                              |
| `@biagioscaglia/yumia-core`          | High-level orchestration layer coordinating all stages         | All core packages                                                                                                        |
| `yumiamd`                            | Command-line developer tool (`yumia`)                          | `@biagioscaglia/yumia-core`, `@biagioscaglia/yumia-ast`, `@biagioscaglia/yumia-parser`                                   |

## Native Object Philosophy (PPTX)

Unlike tools that convert slides into full-screen raster images or SVG captures, YumiaMD is engineered from the ground up to produce **native, editable shapes and text runs** in target formats like PowerPoint:

- Headings and paragraphs become editable TextFrames.
- Lists preserve native PPTX bullet levels.
- Cards map to vector shapes with formatted text containers.
- Tables become native presentation table entities.
