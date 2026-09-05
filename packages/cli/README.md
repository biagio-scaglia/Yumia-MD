# YumiaMD (`yumiamd`)

> **The Design Compiler for Presentations & Visual Documents.**  
> Author decks with high-level design intent and compile directly to **100% native, editable PowerPoint (.pptx)** presentations, crisp vector PDFs, and interactive HTML5 slides.

[![npm version](https://img.shields.io/npm/v/yumiamd.svg?color=blue)](https://www.npmjs.com/package/yumiamd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/biagio-scaglia/Yumia-MD/blob/main/LICENSE)

---

## ⚡ Quick Start (Zero Install)

You can run Yumia immediately without installing anything via `npx`:

```bash
# Initialize a starter presentation with custom theme
npx yumiamd init my-deck --theme corporate

# Launch instant dev server with live-reload and Visual Inspector
npx yumiamd dev presentation.yumia.md --open

# Run automated design audit & visual quality score
npx yumiamd check presentation.yumia.md --optimize

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

## 🚀 CLI Commands & Design Tooling

Once installed globally or locally, the `yumia` / `yumiamd` commands are available in your terminal:

```bash
# Initialize a new presentation template (supports --theme and custom color overrides)
yumia init my-presentation --theme cyberpunk --primary "#FF2E88"

# Start instant live-reload dev server with HTML preview & Visual Inspector (zero config!)
yumia dev presentation.yumia.md --open

# Run design audit, check WCAG contrast, density & compute Visual Quality Score (0-100)
yumia check presentation.yumia.md --optimize

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

# Validate markdown syntax and AST structure (supports --json for CI & AI agents)
yumia validate presentation.yumia.md --json

# Lint presentation for overflow, high density, and layout issues
yumia lint presentation.yumia.md --strict

# Inspect parsed AST and computed layout bounding boxes
yumia inspect presentation.yumia.md --layout

# Export machine-readable JSON schema for LLMs & AI prompt generation
yumia schema
```

---

## 📝 Syntax Example (`presentation.yumia.md`)

```markdown
---
title: System Architecture & Capabilities
theme: corporate
aspectRatio: '16:9'
author: Engineering Team
---

<!-- Slide 1: Hero Cover -->

:::hero title="Next-Generation Cloud Architecture" subtitle="High-throughput distributed compute platform" badge="v2.4 Enterprise" align="center"
:::

---

<!-- Slide 2: Primitives & Visual Intent -->

# Core Infrastructure Breakdown

:::callout variant="info" title="Zero Downtime Rollout"
All worker nodes are upgraded progressively with active health probing.
:::

:::grid columns=3 gap=20
:::card "Edge Routing" variant="primary"

- Global Anycast DNS
- Sub-5ms SSL Termination
  :::

:::card "Stateful Compute" variant="success"

- Autonomous Actor Runtime
- Distributed Raft Consensus
  :::

:::card "Vector Store" variant="accent"

- Multi-index HNSW Search
- 10M query/sec throughput
  :::
  :::

---

<!-- Slide 3: Key Performance Metrics -->

# Operational Performance

:::grid columns=3 gap=20
:::metric value="99.999%" label="Service SLA" change="+0.009%" variant="success" trend="up"
:::
:::metric value="1.2ms" label="p99 Latency" change="-35%" variant="primary" trend="down"
:::
:::metric value="14.2M" label="Active Invocations" change="+120%" variant="accent" trend="up"
:::
:::

---

<!-- Slide 4: Data Visualization -->

# Global Throughput & Adoption

:::chart type="bar" title="Monthly API Invocations (Millions)" labels="Jan,Feb,Mar,Apr,May,Jun" data="4.2,6.8,9.1,11.5,13.2,14.2"
:::
```

---

## 🔍 Visual Inspector & Speaker View

When previewing in HTML5 (`yumia dev` or `--format html`):

- **Visual Inspector**: Press `I` or `Alt+Click` on any element to view computed design tokens, variants, bounding boxes, and source lines.
- **Dual-Window Speaker View**: Press `S` to open an synchronized second screen with speaker notes, elapsed timer, and next-slide preview.
- **Overview Mode**: Press `O` or `Esc` to view slide grid thumbnails.
