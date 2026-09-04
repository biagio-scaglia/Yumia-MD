---
title: YumiaMD — Compiler Showcase
subtitle: Next-Generation Markdown Presentation Engine
author: Biagio Scaglia
date: 2026-09-04
theme: cyberpunk
aspectRatio: "16:9"
---

# YumiaMD Presentation Engine
A Markdown-based presentation language & compiler designed for humans and AI.

Deterministic layout, native PowerPoint objects, and vector precision.

:::notes
Benvenuti allo showcase ufficiale di YumiaMD. Questa presentazione è stata compilata direttamente da un file Markdown (.yumia.md).
:::

---

# Live Performance & Telemetry

:::columns ratios="33:33:34"

:::column
:::metric value="99.99%" label="Availability" change="+0.04%" variant="success"
:::

:::column
:::metric value="14ms" label="Compile Time" change="-42%" variant="info"
:::

:::column
:::metric value="100%" label="Native PPTX" change="Zero raster" variant="primary"
:::

:::

:::card Real-Time Compiler Status variant="info"
- **Pipeline**: Tokenizer ➔ AST ➔ Theme Resolver ➔ Box Layout Engine ➔ Native OpenXML
- **Strict Linting**: 100% compliant with standard `YUM001-YUM009` rules
:::

---

# Architecture & Modularity

:::columns ratios="50:50"

:::column
:::card Core Pipeline variant="primary"
- **AST Decoupling**: Semantic presentation data model
- **Deterministic Layout**: Exact bounding box calculations
- **Zero Runtime Dependencies**: Ultra-fast execution
:::
:::

:::column
:::card Compiler Targets variant="warning"
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

# Developer Experience

:::card Simple Node.js & CLI API variant="info"

```typescript
import { YumiaCompiler, PptxRenderer } from 'yumiamd';
import fs from 'node:fs';

const compiler = new YumiaCompiler();
const pptx = await compiler.compile(markdown, new PptxRenderer());
fs.writeFileSync('deck.pptx', Buffer.from(pptx.data));
```

:::

> "The Native Object Principle: Slides compiled to PowerPoint must be 100% editable vector objects, never flat screenshots."

