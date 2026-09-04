# YumiaMD

> **YumiaMD** — A Markdown-based presentation language and compiler designed for humans and AI.

[![CI](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml/badge.svg)](https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/yumiamd.svg?color=blue)](https://www.npmjs.com/package/yumiamd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

YumiaMD is a modern presentation compiler. It provides a human-readable and AI-friendly way to author slide decks in plain Markdown with semantic presentation directives (`:::columns`, `:::card`, `:::chart`, `:::mermaid`, `:::timeline`, `:::compare`, `:::badge`, `:::step`, `:::notes`), and compiles them into **native, fully editable PowerPoint (.pptx)** presentations, clean vector PDFs, and interactive HTML5 decks.

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

> **Native Object Principle**: A slide compiled to PowerPoint is **not** an image or HTML/CSS screenshot. Headings, bullet lists, vector card shapes, native chart objects, timelines, badges, and notes are generated as **100% native OpenXML PowerPoint objects** that you can click, edit, and re-theme in Microsoft PowerPoint or Google Slides.

---

## 🎨 Rich Directive Syntax

```markdown
---
title: System Overview & Metrics
theme: default
aspectRatio: '16:9'
author: Biagio Scaglia
---

# High-Performance State Machines

Deterministic reactive workflows compiled across targets.

:::badge text="v0.1.15" variant="primary" :::
:::badge text="Production Ready" variant="success" :::

:::notes
Opening slide introducing deterministic workflows and target capabilities.
:::

---

# Multi-Column & Comparisons

:::compare left="Traditional Approach" right="YumiaMD Architecture"

- Manual slide design in GUI
- Read-only screenshot exports
- Inconsistent branding across decks

:::vs

- Semantic Markdown + AI tooling
- 100% Native editable PowerPoint objects
- Deterministic layout & vector graphics

:::

---

# Native Charts & Data Visualization

:::chart type="bar" title="Performance Benchmark (ops/sec)" labels="Core Parser, Layout Engine, PDFKit, PPTX Gen" data="1200, 850, 430, 680"

:::notes
Compiled as native editable PowerPoint chart objects and crisp vector SVGs/PDFs!
:::

---

# Architecture & Diagrams

:::mermaid
graph LR
A[Markdown Source] --> B[Yumia Parser]
B --> C[Presentation AST]
C --> D[Layout Engine]
D --> E[Native PPTX]
D --> F[Vector PDF]
D --> G[HTML5 Deck]
:::

---

# Roadmap Timeline & Progressive Steps

:::timeline layout="horizontal"

- [Q1 2026] Core Compiler: AST parser, layout engine & PPTX generation
- [Q2 2026] Multi-Format: Vector PDF & Interactive HTML5 Speaker View
- [Q3 2026] Rich Directives: Native charts, Mermaid, timelines & compare
- [Q4 2026] Cloud Deploy: Instant static, GitHub Pages & Vercel hosting
  :::

:::step

- ⚡ **Next Step**: Seamless CI/CD slide pipelines with `yumia deploy`!
  :::
```

---

## ⚡ Quick Start

You can run YumiaMD immediately without installing anything via `npx`:

```bash
# Initialize a new presentation project
npx yumiamd init my-deck

# Start live-reloading dev server
npx yumiamd dev presentation.yumia.md --open

# Compile presentation directly to native editable PowerPoint (.pptx)
npx yumiamd build presentation.yumia.md --out dist/presentation.pptx
```

---

## 📦 Installation & CLI Usage

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

# Deploy presentation deck (static, GitHub Pages, or Vercel)
yumia deploy presentation.yumia.md --provider gh-pages --out public

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

## 🌐 Multi-Target Presentation Rendering

| Feature / Directive            | PowerPoint (`.pptx`)                 | Vector PDF (`.pdf`)        | HTML5 Interactive (`.html`)        |
| :----------------------------- | :----------------------------------- | :------------------------- | :--------------------------------- |
| **Output Type**                | Native OpenXML shapes & text         | Native vector paths & text | Responsive interactive web app     |
| **Headings & Cards**           | Native PPTX rounded rects            | Vector rounded boxes       | Glassmorphic CSS cards             |
| **Data Charts (`:::chart`)**   | Editable PowerPoint Chart objects    | Native vector PDF graphics | Responsive interactive SVG charts  |
| **Diagrams (`:::mermaid`)**    | Formatted code container             | Formatted code container   | Client-side Mermaid.js rendering   |
| **Timelines (`:::timeline`)**  | Native vector shapes & connectors    | Vector nodes & step lines  | Responsive CSS timeline steps      |
| **Comparisons (`:::compare`)** | Multi-column vector containers       | Side-by-side vector boxes  | Dual-column comparison grid        |
| **Badges (`:::badge`)**        | Vector pill shapes with theme colors | Vector badge pills         | Themed inline badge elements       |
| **Step Reveal (`:::step`)**    | Native click transitions             | Visible print layout       | Progressive reveal keyboard clicks |
| **Speaker View**               | Native PPTX slide notes              | Notes summary section      | Dedicated dual-screen window (`S`) |

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

# Run test suite with Vitest (19 test files, 80 unit & integration tests)
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

## License

[MIT](LICENSE) © 2026 Biagio Scaglia
