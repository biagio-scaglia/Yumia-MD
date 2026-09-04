# YumiaMD (`yumiamd`)

> **A Markdown-based presentation language & compiler designed for humans and AI.**  
> Author slide decks in clean Markdown and compile directly to **100% native, editable PowerPoint (.pptx)** presentations, vector PDFs, and interactive HTML5 slides.

[![npm version](https://img.shields.io/npm/v/yumiamd.svg?color=blue)](https://www.npmjs.com/package/yumiamd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/biagio-scaglia/Yumia-MD/blob/main/LICENSE)

---

## ⚡ Quick Start (Zero Install)

You can run YumiaMD immediately without installing anything via `npx`:

```bash
# Initialize a starter presentation
npx yumiamd init my-deck

# Compile presentation directly to an editable PowerPoint (.pptx)
npx yumiamd build presentation.yumia.md --out presentation.pptx
```

---

## 📦 Installation

### Global CLI Installation

```bash
npm install -g yumiamd
# or
pnpm add -g yumiamd
# or
yarn global add yumiamd
```

### Local Project Dependency

```bash
npm install yumiamd
# or
pnpm add yumiamd
```

---

## 🚀 CLI Commands & AI Tooling

Once installed globally or locally, the `yumia` / `yumiamd` commands are available in your terminal:

```bash
# Initialize a new presentation template
yumia init my-presentation

# Validate markdown syntax and AST structure (supports --json for CI & AI agents)
yumia validate presentation.yumia.md --json

# Lint presentation for vertical overflow and layout issues
yumia lint presentation.yumia.md --json

# Inspect parsed AST and computed layout bounding boxes
yumia inspect presentation.yumia.md --layout

# Export machine-readable JSON schema for LLMs & AI prompt generation
yumia schema

# Compile to native editable PowerPoint (.pptx)
yumia build presentation.yumia.md --out dist/presentation.pptx
```

---

## 📝 Syntax Example (`presentation.yumia.md`)

```markdown
---
title: System Architecture & Capabilities
theme: default
aspectRatio: '16:9'
author: Biagio Scaglia
---

# High-Performance Presentation Engine

Deterministic compilation from Markdown directly to native PowerPoint slides.

:::notes
Opening slide introducing the core architectural vision.
:::

---

# Architecture & Capabilities

:::columns ratios="50:50"

:::column
:::card Core Engine

- 100% Deterministic placement
- Zero runtime dependencies
- TypeScript-first architecture
  :::
  :::

:::column
:::card Native PowerPoint Export

- Headings, cards, shapes & notes
- Fully editable OpenXML objects
- Compatible with PowerPoint & Google Slides
  :::
  :::

:::

---

# Feature Comparison

| Feature                  | YumiaMD                          | Legacy HTML Deck Tools               |
| :----------------------- | :------------------------------- | :----------------------------------- |
| **Output Type**          | Native OpenXML Shapes & Text     | Flat rasterized images / screenshots |
| **Full Editability**     | ✅ 100% Editable in PowerPoint   | ❌ Read-only image slides            |
| **Deterministic Layout** | ✅ Pixel-exact bounding boxes    | ❌ Browser rendering variance        |
| **AI / Agent Tooling**   | ✅ Machine-readable schema & CLI | ❌ Complex DOM scraping              |
```

---

## 💻 JavaScript / TypeScript API

You can also use `yumiamd` programmatically inside your Node.js or TypeScript backend, CLI tools, and AI pipelines:

```typescript
import { compile, parse, YumiaCompiler } from 'yumiamd';
import fs from 'node:fs';

const markdown = fs.readFileSync('presentation.yumia.md', 'utf-8');

// 1. Validate syntax and collect diagnostics
const compiler = new YumiaCompiler();
const validation = compiler.validate(markdown);
console.log(`Valid: ${validation.valid}, Slides: ${validation.slideCount}`);

// 2. Compile directly to PPTX buffer
const { buffer, errors } = await compile(markdown, { format: 'pptx' });

if (errors.length === 0) {
  fs.writeFileSync('output.pptx', buffer);
  console.log('✅ Presentation generated successfully!');
}

// 3. Export JSON schema for LLM generation
const schema = compiler.getSchema();
```

---

## ✨ Key Features

- 🎯 **Native Object Principle**: Slides compiled to PowerPoint are **NOT** rasterized screenshot images. Headings, bullet points, cards, tables, and speaker notes are generated as **100% native vector PowerPoint shapes, tables & textboxes** that you can click, re-format, and edit in Microsoft PowerPoint or Google Slides.
- 📊 **Native Tables & Multicolumn**: Full support for Markdown tables and semantic responsive multi-column layouts with customizable ratio splits (`ratios="50:50"` or `"30:70"`).
- 📐 **Deterministic Layout Engine**: Exact coordinate calculations for stack, columns, cards, and automatic overflow detection.
- 🎨 **Semantic Design Tokens**: Built-in themes with typography scales, color palettes, and contrast-safe themes.
- 🤖 **AI-Friendly Format**: Clean Markdown syntax designed for LLM prompts and agentic workflows, complete with `yumia schema` and `--json` CLI diagnostics.

---

## 📄 License

MIT © [Biagio Scaglia](https://github.com/biagio-scaglia)
