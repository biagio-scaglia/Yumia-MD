# YumiaMD

> **YumiaMD** — A Markdown-based presentation language and compiler designed for humans and AI.

[![CI](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml/badge.svg)](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

YumiaMD is a modern presentation compiler. It provides a human-readable and AI-friendly way to author slide decks in plain Markdown with semantic presentation directives (`:::columns`, `:::card`, `:::notes`), and compiles them into **native, fully editable PowerPoint (.pptx)** presentations, clean vector PDFs, and interactive HTML5 decks.

---

## The Problem

Creating slide decks today usually forces a frustrating trade-off:

- **Visual GUI Tools (PowerPoint, Keynote)**: Great for layout and native objects, but hostile to version control, diffs, automation, and AI generation workflows.
- **HTML/Markdown Deck Tools (Marp, Reveal.js, Slidev)**: Great for web display and code-first authoring, but export static PDFs or flat rasterized PPTX images rather than native, editable PowerPoint objects.

YumiaMD provides a true compiler architecture designed around **semantic decoupling**:

```text
presentation.yumia.md
          │
          ▼
   @yumiamd/parser
          │
          ▼
    Presentation AST
          │
          ▼
  Deterministic Layout Engine
          │
          ▼
   ┌──────┼────────┐
   ▼      ▼        ▼
 PPTX    PDF      HTML
```

> **Native Object Principle**: A slide compiled to PowerPoint is **not** an image or HTML/CSS screenshot. Headings, bullet lists, vector card shapes, and notes are generated as **100% native OpenXML PowerPoint objects** that you can click, edit, and re-theme in Microsoft PowerPoint or Google Slides.

---

## Syntax Example

```markdown
---
title: System Overview
theme: default
author: Biagio Scaglia
---

# High-Performance State Machines

Deterministic reactive workflows powered by HomuraJS.

:::notes
Opening slide introducing deterministic workflows.
:::

---

# Architecture & Capabilities

:::columns ratios="50:50"

:::column
:::card Core Engine

- 100% Deterministic execution
- Zero runtime dependencies
- TypeScript-first typing
  :::
  :::

:::column
:::card Compiler Targets

- Native editable PPTX
- Vector PDF documents
- Interactive HTML5 decks
  :::
  :::

:::
```

---

## ⚡ Quick Start

You can run YumiaMD immediately without installing anything via `npx`:

```bash
# Initialize a new presentation project
npx yumiamd init my-deck

# Compile presentation directly to native editable PowerPoint (.pptx)
npx yumiamd build presentation.yumia.md --out dist/presentation.pptx
```

---

## 📦 Installation & Usage

### 1. Global CLI Tool

Install the `yumia` / `yumiamd` command-line tool globally:

```bash
npm install -g yumiamd
# or
pnpm add -g yumiamd
```

```bash
# Initialize a starter project (optionally with custom theme & colors)
yumia init my-deck --theme cyberpunk --primary "#FF2E88"

# Start instant live-reload dev server with HTML preview (zero config!)
yumia dev presentation.yumia.md --open

# Compile to native editable PowerPoint (.pptx)
yumia build presentation.yumia.md --out dist/presentation.pptx

# Compile to crisp vector PDF document (.pdf)
yumia build presentation.yumia.md --format pdf --out dist/presentation.pdf

# Compile to standalone interactive HTML5 presentation deck (.html)
yumia build presentation.yumia.md --format html --out dist/presentation.html

# Watch presentation file and recompile automatically on save
yumia watch presentation.yumia.md --format pdf

# Validate markdown syntax and AST structure (supports --json for CI/CD & AI agents)
yumia validate presentation.yumia.md --json

# Lint presentation for overflow, high density, and accessibility
yumia lint presentation.yumia.md --strict

# Inspect AST and deterministic layout bounding boxes
yumia inspect presentation.yumia.md --layout

# Export machine-readable JSON schema for LLMs & AI agents
yumia schema
```

### 2. Node.js & TypeScript Library

Use YumiaMD programmatically in your applications:

```bash
npm install yumiamd
```

```typescript
import { compile, parse, YumiaCompiler } from 'yumiamd';
import fs from 'node:fs';

const markdown = fs.readFileSync('presentation.yumia.md', 'utf-8');

// 1. Validate syntax & inspect diagnostics
const compiler = new YumiaCompiler();
const validation = compiler.validate(markdown);
console.log(`Valid: ${validation.valid}, Slides: ${validation.slideCount}`);

// 2. Compile directly to PPTX, PDF, or HTML
const { buffer } = await compile(markdown, { format: 'pptx' });
fs.writeFileSync('output.pptx', buffer);

const { data: pdfBuffer } = await compile(markdown, { format: 'pdf' });
fs.writeFileSync('output.pdf', Buffer.from(pdfBuffer));

const { html } = await compile(markdown, { format: 'html' });
fs.writeFileSync('output.html', html);

// 3. Export JSON schema for LLM generation
const schema = compiler.getSchema();
```

---

## 🏛️ Architecture & Internal Modules

YumiaMD is developed as a modular monorepo and distributed as a self-contained **All-in-One package (`yumiamd`)**:

| Module                   | Responsibility                                                    |
| :----------------------- | :---------------------------------------------------------------- |
| `@yumiamd/ast`           | Pure semantic presentation AST data structures with locations     |
| `@yumiamd/parser`        | Converts Markdown + Presentation DSL & Tables into AST            |
| `@yumiamd/theme`         | Semantic design tokens (6 themes + custom colors & typography)    |
| `@yumiamd/layout`        | Deterministic geometric placement (stack, columns, cards, bounds) |
| `@yumiamd/renderer`      | Base renderer abstractions and rendering context                  |
| `@yumiamd/renderer-pptx` | **Native editable PowerPoint (`.pptx`) generation engine**        |
| `@yumiamd/renderer-pdf`  | **Crisp Vector PDF (`.pdf`) document compiler**                   |
| `@yumiamd/renderer-html` | **Interactive HTML5 deck + Dual-Window Speaker View (`.html`)**   |
| `@yumiamd/core`          | Compiler pipeline coordinator, linter & schema generation         |
| **`yumiamd`**            | **Unified All-in-One package & CLI published to NPM**             |

---

## Development & Testing

This monorepo uses **pnpm** and **TypeScript** (strict mode).

```bash
# Install all dependencies across workspaces
pnpm install

# Build all packages
pnpm build

# Typecheck workspace packages
pnpm typecheck

# Run test suite with Vitest (17 test suites, 50+ unit & integration tests)
pnpm test

# Lint code with ESLint
pnpm lint

# Format code with Prettier
pnpm format
```

### Release & Publish to NPM

```bash
# Increment version, build, test, publish to NPM, commit, tag, and push to GitHub:
pnpm release patch
```

---

## Roadmap

- [x] Initial monorepo setup & strict TypeScript configuration
- [x] Semantic AST model (`@yumiamd/ast`)
- [x] Markdown and directive parser (`@yumiamd/parser`)
- [x] Built-in themes (`default`, `cyberpunk`, `minimal`, `corporate`, `terminal`, `academic`) & custom CLI flags
- [x] Deterministic Layout Engine (`@yumiamd/layout`)
- [x] **Native PowerPoint generation engine (`@yumiamd/renderer-pptx`)**
- [x] **Vector PDF document compiler (`@yumiamd/renderer-pdf`)**
- [x] **Interactive HTML5 deck + Speaker View & Overview Grid (`@yumiamd/renderer-html`)**
- [x] **Live-Reload Dev Server (`yumia dev`) & Watch Mode (`yumia watch`)**
- [x] Rule-Based Presentation Linter (`yumia lint`)
- [x] Automated NPM and GitHub release tooling (`pnpm release`)

---

## License

[MIT](LICENSE) © 2026 Biagio Scaglia
