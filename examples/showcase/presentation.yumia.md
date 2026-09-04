---
title: YumiaMD — Compiler Showcase
subtitle: Next-Generation Markdown Presentation Engine
author: Biagio Scaglia
date: 2026-09-04
theme: default
aspectRatio: "16:9"
---

# YumiaMD Presentation Engine
A Markdown-based presentation language & compiler designed for humans and AI.

Deterministic layout, native PowerPoint objects, and vector precision.

:::notes
Benvenuti allo showcase ufficiale di YumiaMD. Questa presentazione è stata compilata direttamente da un file Markdown (.yumia.md).
:::

---

# Architecture & Modularity

:::columns ratios="50:50"

:::column
:::card Core Pipeline
- **AST Decoupling**: Semantic presentation data model
- **Deterministic Layout**: Pixel-exact bounding box calculations
- **Zero Runtime Dependencies**: Ultra-fast execution
:::
:::

:::column
:::card Compiler Targets
- **Native PPTX**: 100% editable OpenXML shapes & text
- **Vector PDF**: Crisp typography and printing
- **HTML5 Interactive**: Web-first presentations
:::
:::

:::

---

# Feature & Capability Matrix

| Feature | YumiaMD | Legacy Markdown Tools | GUI Slide Tools |
| :--- | :--- | :--- | :--- |
| **Source Format** | Plain Markdown (`.yumia.md`) | HTML / CSS Markdown | Proprietary Binary |
| **PowerPoint Output** | Native Vector Shapes & Tables | Flat Raster Screenshots | Native Objects |
| **Git / Diff Friendly** | 100% Version Controllable | 100% Version Controllable | Hostile to Diff & Git |
| **AI / Agent Automation** | Native JSON Schema & CLI | Complex DOM Scraping | Manual Interaction |

---

# Code & Integration

:::card Developer Experience

```typescript
import { compile } from 'yumiamd';
import fs from 'node:fs';

const markdown = fs.readFileSync('presentation.yumia.md', 'utf-8');
const { buffer } = await compile(markdown, { format: 'pptx' });
fs.writeFileSync('deck.pptx', buffer);
```

:::

> "The Native Object Principle: Slides compiled to PowerPoint must be 100% editable vector objects, never flat screenshots."
