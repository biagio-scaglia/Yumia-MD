# Yumia

> **Yumia** — A declarative language and compiler for structured visual documents and presentations.

[![CI](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml/badge.svg)](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/yumiamd.svg?color=blue)](https://www.npmjs.com/package/yumiamd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Yumia is a declarative visual language and multi-target compiler. It provides an indentation-based human and AI-friendly syntax (`.yumia`) and a Markdown-compatible surface (`.yumia.md`) to define structured slides, visual layouts, multi-provider icons, cards, metrics, and data charts, compiling them into **native, fully editable PowerPoint (.pptx)** presentations, crisp vector **PDF documents**, and interactive **HTML5 decks**.

---

## 1. Show, Don't Tell

### Native Yumia Syntax (`presentation.yumia`)

```yumia
document "Distributed Systems Overview"
  theme "cyberpunk"
  aspectRatio "16:9"
  transition "zoom"

slide "Architecture Pipeline"
  heading "Next-Gen Document Language"
  badge "v0.1.20" variant="accent"

  grid columns=3 gap=20
    card title="Unified AST" variant="primary"
      icon "lucide:layers" size=32 color="#00F0FF"
      text "Semantic node representation decoupled from output formats."

    card title="Multi-Provider Icons" variant="success"
      icon "material:rocket" size=32 color="#10B981"
      text "First-class abstraction supporting Lucide, Material, Tabler, FA, and SVG."

    card title="Universal Renderers" variant="accent"
      icon "fa:shield" size=32 color="#FF2E88"
      text "Compile cleanly into interactive HTML5, native PPTX, and Vector PDF."

slide "Key Performance Metrics"
  stack direction="horizontal" gap=16
    metric "0.5ms" label="Parse Latency" diff="-65%" variant="primary"
    metric "100%" label="Backward Compatible" diff="+100%" variant="success"
    metric "3 Targets" label="HTML, PPTX, PDF" diff="Native" variant="accent"
```

### Compilation

```bash
# Compile to native, editable PowerPoint (.pptx)
yumia build presentation.yumia --format pptx

# Compile to vector PDF
yumia build presentation.yumia --format pdf

# Start local dev server with hot reload
yumia dev presentation.yumia --port 3000
```

---

## 2. Why Yumia?

Creating presentations and visual documents has traditionally forced an inconvenient compromise:

- **Visual GUI Tools (PowerPoint, Keynote)**: Excellent for WYSIWYG placement, but hostile to Git version control, branch diffing, automated CI/CD builds, and generative AI pipelines.
- **Web/Markdown Slide Tools (Marp, Slidev, Reveal.js)**: Excellent for developer authoring, but export static screenshot-based PDFs or flat rasterized images inside PPTX containers.
- **Raw HTML/CSS**: Highly flexible, but excessively verbose for document and slide authoring.

Yumia bridges this divide by functioning as a true compiler:

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
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │ HtmlRenderer │     │ PptxRenderer │     │ PdfRenderer  │
     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
            ▼                    ▼                    ▼
       Interactive           Editable              Vector
         HTML5                 PPTX                 PDF
```

> **Native Object Guarantee**: In PowerPoint exports, elements are **not** static images. Text boxes, cards, metrics, and charts are generated as **100% native OpenXML shape and table objects** that can be customized in Microsoft PowerPoint or Google Slides.

---

## 3. Installation & Quick Start

### Global CLI

```bash
npm install -g yumiamd
# or using pnpm:
pnpm add -g yumiamd
```

### Local Project

```bash
# Initialize a new presentation project
yumia init my-deck
cd my-deck

# Start live preview
yumia dev presentation.yumia.md
```

---

## 4. Language Features

Yumia supports two complementary syntax surfaces that compile into the exact same Abstract Syntax Tree (AST):

### 1. Native Yumia (`.yumia`)

An indentation-based, clean DSL engineered for humans and AI models:

| Primitive  | Syntax Example                                | Purpose                                      |
| :--------- | :-------------------------------------------- | :------------------------------------------- |
| `document` | `document "Title"`                            | Top-level metadata, theme, ratio, transition |
| `slide`    | `slide "Slide Title"`                         | Defines a new slide boundary                 |
| `heading`  | `heading "Title"` or `h1 "Title"`             | Slide headings (levels 1–4)                  |
| `text`     | `text "Body copy"` or `p "Text"`              | Paragraph body text                          |
| `grid`     | `grid columns=3 gap=20`                       | Multi-column grid container                  |
| `stack`    | `stack direction="horizontal"`                | Linear flex stack layout                     |
| `card`     | `card title="..." variant="primary"`          | Styled theme card container                  |
| `metric`   | `metric "99.9%" label="Uptime" diff="+0.4%"`  | KPI stat callout card                        |
| `icon`     | `icon "lucide:rocket" size=32`                | Multi-provider icon element                  |
| `badge`    | `badge "v1.0" variant="success"`              | Status pill badge                            |
| `code`     | `code lang="ts" highlight="2,4-6"`            | Syntax highlighted code with line focus      |
| `section`  | `section "Part 1" subtitle="..." number="01"` | Distinct visual section slide                |
| `toc`      | `toc "Table of Contents"`                     | Automatic presentation agenda                |
| `notes`    | `notes \n Speaker notes text`                 | Speaker presenter notes                      |

### 2. Markdown Yumia (`.yumia.md`)

Standard Markdown syntax extended with semantic directives:

```markdown
---
title: 'Distributed Systems'
theme: 'cyberpunk'
aspectRatio: '16:9'
---

# Architecture Overview

:::grid columns=3 gap=20
:::card Title="Compute" variant="primary"
:::icon lucide:cpu size=32 :::
Cluster worker nodes.
:::
:::card Title="Storage" variant="success"
:::icon lucide:database size=32 :::
Distributed object store.
:::
:::card Title="Network" variant="accent"
:::icon lucide:globe size=32 :::
Mesh ingress routing.
:::
:::

:::metric value="99.99%" label="Availability" diff="+0.05%" variant="success" :::
```

---

## 5. Multi-Provider Icon System

Yumia treats icons as a **first-class abstraction** rather than a hardcoded icon package:

```text
Yumia Icon ("lucide:rocket" | "material:shield" | "fa:github")
                    │
                    ▼
           @yumiamd/renderer: IconResolver
                    │
                    ▼
        Provider Registry (Lucide, Material, FontAwesome, Tabler, Heroicons, Custom SVG)
```

```yumia
icon "lucide:rocket" size=32 color="#00F0FF"
icon "material:shield" size=28
icon "fa:github"
icon "tabler:activity"
```

- **Offline Bundling**: Built-in SVG definitions for instant offline compilation.
- **Strict / Lenient Mode**: Missing icons render a stylized fallback glyph without crashing the build pipeline.

---

## 6. Built-in Themes & Custom Theming

Yumia includes built-in themes optimized for dark/light presentations:

- `default` — High-contrast modern indigo/slate dark theme.
- `cyberpunk` — Vibrant neon cyan (`#00F0FF`) and pink (`#FF2E88`) palette.
- `corporate` — Crisp enterprise navy blue and white styling.
- `minimal` — Clean monochrome typography and subtle borders.
- `terminal` — Monospace developer theme with green/amber highlights.
- `academic` — Formal serif typography tailored for research and papers.

Override any theme token on the fly via CLI or frontmatter:

```bash
yumia build deck.yumia --theme corporate --primary "#2563EB" --bg "#FFFFFF"
```

---

## 7. CLI Reference

```text
Usage:
  yumia <command> [options] [file]

Commands:
  dev <file>         Start live-reload dev server with instant HTML preview
  build <file>       Compile to PowerPoint (.pptx), PDF (.pdf), or HTML (.html)
  validate <file>    Validate syntax, directives, and metadata without compiling
  lint <file>        Analyze presentation for layout overflows and contrast
  inspect <file>     Inspect the AST and geometric layout tree
  init [name]        Scaffold a new presentation project
  schema             Output JSON schema for AI agents and IDE autocomplete
  deploy <file>      Export presentation to a static directory for hosting

Options:
  --format, -f <fmt> Target format: pptx (default) | pdf | html
  --theme, -t <name> Base theme: default | cyberpunk | minimal | corporate | terminal | academic
  --primary, -p      Override primary accent color (hex)
  --bg, --background Override background color (hex)
  --port <number>    Dev server port (default: 3000)
  --watch, -w        Watch file and rebuild on save
  --strict           Treat lint warnings as errors (exit code 1)
  --json             Output results in machine-readable JSON
```

---

## 8. Programmatic API

```typescript
import { parseNativeYumia, YumiaCompiler } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { PptxRenderer } from '@yumiamd/renderer-pptx';

const source = `
document "API Demo"
  theme "cyberpunk"

slide "Hello World"
  heading "Built with Yumia"
  text "Programmatically compiled."
`;

const compiler = new YumiaCompiler();
const ast = parseNativeYumia(source);

// Compile to HTML
const htmlOutput = await compiler.render(ast, new HtmlRenderer());

// Compile to PPTX Buffer
const pptxOutput = await compiler.render(ast, new PptxRenderer());

// Compile to Vector PDF Buffer
const pdfOutput = await compiler.render(ast, new PdfRenderer());
```

---

## 9. Monorepo Architecture

```text
packages/
├── ast/             # Semantic AST interfaces and node factories
├── parser/          # Native Yumia parser, Markdown parser, and migrator
├── layout/          # Coordinate engine and box-model layout computation
├── theme/           # Design tokens, color palettes, and theme resolver
├── renderer/        # Abstract renderer contracts and multi-provider icon resolver
├── renderer-html/   # Interactive HTML5 presentation runner
├── renderer-pptx/   # Native OpenXML PowerPoint generator
├── renderer-pdf/    # Vector PDF document compiler
├── core/            # High-level compiler orchestration and AST linter
└── cli/             # Multi-command CLI tool and dev server
```

---

## 10. AI-First Workflow

Yumia is designed for seamless generative AI integration:

1. **Unambiguous Grammar**: Indentation and semantic keywords remove the syntactic ambiguities of nested Markdown HTML blocks.
2. **Deterministic Schema**: Run `yumia schema` to extract the full JSON schema for LLM system prompts.
3. **Machine-Readable Diagnostics**: Use `--json` in CI or agent loops to receive structured error codes, line numbers, and actionable suggestions.

---

## 11. Migration from YumiaMD (.yumia.md)

To convert legacy Markdown presentation decks into the native Yumia language format:

```typescript
import { migrateMarkdownToNative } from '@yumiamd/parser';

const nativeSource = migrateMarkdownToNative(legacyMarkdownSource);
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up the local workspace, running tests, and submitting PRs.

```bash
git clone https://github.com/biagio-scaglia/Yumia-MD.git
cd Yumia-MD
pnpm install
pnpm build
pnpm test
```

---

## License

MIT © [Biagio Scaglia](https://github.com/biagio-scaglia)
