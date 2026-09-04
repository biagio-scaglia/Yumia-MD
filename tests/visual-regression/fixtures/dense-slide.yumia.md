---
title: Dense Multi-Column Layout Fixture
theme: cyberpunk
---

# Architecture & Pipeline

:::columns ratios="1:1"
:::column
:::card title="Core Compiler Pipeline" variant="accent"

- Parser converts Markdown to semantic AST
- Layout Engine computes box metrics in 1920x1080 space
- Linter detects accessibility and overflow issues
  :::
  :::

:::column
:::card title="Multi-Format Exporters" variant="outlined"

- **HTML5**: Speaker view & reactive slides
- **PDF**: Vector PostScript engine
- **PowerPoint**: Clean OpenXML shapes & typography
  :::
  :::
  :::
