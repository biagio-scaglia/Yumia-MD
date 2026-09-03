# YumiaMD

> **YumiaMD** — A Markdown-based presentation language and compiler designed for humans and AI.

[![CI](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml/badge.svg)](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

YumiaMD is an experimental Markdown-based presentation authoring and compilation tool. It provides a human-readable and AI-friendly way to author slide decks in plain Markdown with semantic extensions, and compiles them through a modular pipeline.

> [!NOTE]
> **Current Status: Experimental.** This repository is in its initial architectural phase. Rendering targets (PPTX, PDF, HTML) are currently defined as architectural interfaces and placeholders.

---

## The Problem

Creating slide decks today usually forces a trade-off between:

- **Visual GUI Tools (PowerPoint, Keynote)**: Great for layout and native objects, but hostile to version control, diffs, automation, and AI workflows.
- **HTML/Markdown Deck Tools (Marp, Reveal.js, Slidev)**: Great for web display and code-first authoring, but generally export static PDFs or flat rasterized PPTX images rather than native, editable PowerPoint objects.

YumiaMD explores a compiler architecture designed from day one around **semantic decoupling**:

1. Clean Markdown source representation.
2. An intermediate semantic presentation Abstract Syntax Tree (AST).
3. Pluggable layout calculation.
4. Native object code generation for downstream targets (PowerPoint, PDF, HTML).

---

## Syntax Example

```markdown
---
title: My Presentation
theme: default
---

# Hello Yumia

Presentation authoring using Markdown.

---

# Key Concepts

- Separation of content and presentation
- Native editable presentation export
- First-class toolchain for humans and AI
```

---

## Planned Architecture

YumiaMD processes presentations through a strict unidirectional compiler pipeline:

```
Source (.yumia.md) ──► @yumia/parser ──► @yumia/ast ──► @yumia/theme
                                                              │
                                                              ▼
Output Target ◄── @yumia/renderer-* ◄── @yumia/layout ◄───────┘
```

- **`@yumia/ast`**: Semantic data structures representing presentation entities (slides, headings, cards, tables, code blocks).
- **`@yumia/parser`**: Converts Markdown + presentation DSL into the semantic AST.
- **`@yumia/theme`**: Semantic design tokens (colors, typography scales, spacing, border radii).
- **`@yumia/layout`**: Calculates positions and dimensions independently of target rendering formats.
- **`@yumia/renderer`**: Core rendering abstractions and contexts.
- **`@yumia/renderer-pptx`** _(planned)_: Compiles presentations into native, editable PowerPoint `.pptx` objects.
- **`@yumia/renderer-pdf`** _(planned)_: Compiles presentations into vector PDF documents.
- **`@yumia/renderer-html`** _(planned)_: Compiles presentations into interactive HTML5 decks.
- **`@yumia/core`**: Orchestrates parsing, theming, layout, and rendering into unified compile workflows.
- **`@yumia/cli`**: Command-line developer tool for building, validating, and inspecting presentations.

---

## Repository Structure

```
Yumia-MD/
├── packages/
│   ├── ast/             # Semantic AST data structures
│   ├── parser/          # Markdown & frontmatter parser
│   ├── theme/           # Semantic design tokens & theme model
│   ├── layout/          # Geometry and layout computation engine
│   ├── renderer/        # Base renderer abstractions
│   ├── renderer-pptx/   # Native PPTX renderer (placeholder)
│   ├── renderer-pdf/    # PDF renderer (placeholder)
│   ├── renderer-html/   # HTML deck renderer (placeholder)
│   ├── core/            # Pipeline coordinator
│   └── cli/             # Command-line interface
├── examples/
│   └── basic/           # Sample YumiaMD presentations
├── tests/               # Workspace integration tests
├── docs/                # Architecture and design documentation
└── .github/
    └── workflows/       # GitHub Actions CI workflow
```

---

## Development

This monorepo uses **pnpm** and **TypeScript** (strict mode).

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Setup

```bash
# Install all dependencies across workspaces
pnpm install

# Typecheck all packages
pnpm typecheck

# Run test suite with Vitest
pnpm test

# Lint code with ESLint
pnpm lint

# Check code formatting
pnpm format:check

# Format code with Prettier
pnpm format
```

---

## Roadmap

- [x] Initial monorepo setup & strict TypeScript configuration
- [x] Semantic AST model (`@yumia/ast`)
- [x] Minimal Markdown and frontmatter parser (`@yumia/parser`)
- [x] Theme token interfaces and default theme (`@yumia/theme`)
- [x] Layout model and engine abstraction (`@yumia/layout`)
- [x] Renderer contracts and pipeline orchestration (`@yumia/renderer`, `@yumia/core`, `@yumia/cli`)
- [ ] Markdown presentation DSL extensions (grid layouts, column directives, speaker notes)
- [ ] Native PowerPoint generation engine (`@yumia/renderer-pptx`)
- [ ] Vector PDF renderer (`@yumia/renderer-pdf`)
- [ ] HTML presentation previewer (`@yumia/renderer-html`)
- [ ] Watch mode and live preview dev server

---

## License

[MIT](LICENSE) © 2026 Biagio Scaglia
