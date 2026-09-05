# Yumia CLI & Tooling Reference

The Yumia CLI (`yumia` / `yumiamd`) is the developer interface for building, developing, linting, auditing, inspecting, and deploying presentations and visual documents.

---

## ⚡ Command Overview

| Command    | Syntax                                                         | Description                                                                           |
| :--------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `check`    | `yumia check <file> [--optimize] [--strict] [--json]`          | Runs design audit, computes Visual Quality Score (0–100), and validates WCAG contrast |
| `explain`  | `yumia explain <file> [--strict] [--json]`                     | Breaks down document composition, typography, density, safe-area, and rhythm          |
| `dev`      | `yumia dev <file> [--port 3000] [--open] [--json]`             | Starts instant live-reload dev server with DevTools / Interactive Visual Inspector    |
| `build`    | `yumia build <file> [--format pptx\|pdf\|html] [--out <path>]` | Compiles presentation to 100% native editable PPTX, vector PDF, or interactive HTML5  |
| `lint`     | `yumia lint <file> [--strict] [--json]`                        | Analyzes slide layout overflows, empty elements, and accessibility issues             |
| `validate` | `yumia validate <file> [--json]`                               | Validates grammar syntax and structural AST integrity                                 |
| `inspect`  | `yumia inspect <file> [--layout] [--json]`                     | Outputs parsed AST nodes or computed geometric bounding box coordinates               |
| `init`     | `yumia init [name] [--theme <name>] [--primary <hex>]`         | Scaffolds a new Yumia presentation repository template                                |
| `deploy`   | `yumia deploy <file> [--provider vercel\|gh-pages\|static]`    | Exports ready-to-deploy static assets, Vercel configs, or GitHub Pages bundles        |
| `watch`    | `yumia watch <file> [--format <fmt>]`                          | Watches file changes and automatically recompiles on save                             |
| `schema`   | `yumia schema`                                                 | Outputs canonical JSON schema for LLMs and generative AI system prompts               |

---

## 1. `yumia check` — Design Audit & Quality Score

Evaluates slides against design rules (density, contrast, missing headings, empty containers) and computes a **Visual Quality Score** from `0` to `100`.

```bash
yumia check presentation.yumia --optimize
```

### Options

- `--optimize`: Analyzes layout density and returns automated composition suggestions.
- `--strict`: Treats warnings as fatal errors (exits with code 1).
- `--json`: Formats the report as machine-readable JSON for CI/CD pipelines.

### Example Output

```text
Yumia Design Audit Report for 'presentation.yumia':

  ⚠ [YUM004] Slide 4: High information density: slide contains 10 list items (recommended max: 7).
  ⚠ [YUM010] Slide 6: Contrast ratio (3.8:1) between text '#A0AEC0' and background '#0F172A' does not meet WCAG AA (4.5:1).

Found 0 error(s), 2 warning(s).
Visual Quality Score: 85/100

Design Suggestions:
  → High density detected on Slide 4: consider converting bullet list into a 3-column metric grid.
  → Increase text luminance on Slide 6 to meet WCAG AAA requirements.
```

---

## 2. `yumia explain` — Document & Rhythm Explanation

Provides a holistic overview of presentation composition, visual rhythm, modular typography scales, safe-area compliance, and repetition diagnostics.

```bash
yumia explain presentation.yumia
```

### Example Output

```text
Yumia Design Explanation for 'presentation.yumia'
================================================
Document Analysis
  Slides:            12
  Theme:             corporate
  Aspect Ratio:      16:9

Composition Distribution
  Hero slides:       2
  Metric slides:     3
  Comparison slides: 2
  Chart slides:      2
  Timeline slides:   1
  Card / Grid:       2
  Content slides:    0

Design Intelligence
  Typography scale:  ✓ Scaled (Modular 1.25)
  Contrast:          AAA / WCAG 2.1
  Safe area:         ✓ Compliant (90px margin buffer)
  Density score:     94/100
  Visual hierarchy:  96/100

Diagnostics & Rhythm
  ⚠ Slides 8–10 use identical 'card' composition. → Consider introducing a visual break (e.g. metric, quote, or split compare).

Design Suggestions
  → Layout and structure are balanced.
================================================
```

---

## 3. `yumia dev` — Live Dev Server & Visual Inspector

Launches a zero-config local development server with instant SSE hot-reloading and embedded DevTools.

```bash
# Launch on port 3000 and automatically open browser
yumia dev presentation.yumia --open --port 3000
```

### Interactive Features in Browser

- **`I`** or **`Alt+Click`**: Opens the **Interactive Visual Inspector** HUD showing element variants, CSS theme tokens (`--yumia-primary`, `--yumia-surface`), bounding box coordinates, and source line numbers.
- **`S`**: Opens the synchronized dual-window **Speaker Console** with speaker notes, live elapsed timer, and next-slide preview via `BroadcastChannel`.
- **`F`**: Enters presentation fullscreen mode.
- **`O`** or **`Esc`**: Toggles slide thumbnail overview.

---

## 4. `yumia build` — Multi-Target Compilation

Compiles the semantic AST into production-ready output files.

```bash
# 1. Native Editable PowerPoint (.pptx)
yumia build presentation.yumia --format pptx --out dist/presentation.pptx

# 2. Vector PDF Document (.pdf)
yumia build presentation.yumia --format pdf --out dist/presentation.pdf

# 3. Interactive Standalone HTML5 (.html)
yumia build presentation.yumia --format html --out dist/presentation.html
```

### PPTX Master Template & Font Embedding

```bash
# Use a custom corporate master slide (.potx) and embed TrueType fonts
yumia build presentation.yumia --template ./templates/corporate.potx --embed-fonts
```

---

## 5. `yumia inspect` — AST & Layout Geometry

Dumps the Abstract Syntax Tree or the computed 2D bounding boxes calculated by the layout engine.

```bash
# Inspect AST
yumia inspect presentation.yumia

# Inspect 2D Cartesian Layout Bounding Boxes
yumia inspect presentation.yumia --layout
```

---

## 6. `yumia schema` — AI Agent System Prompt Generator

Outputs the formal machine-readable JSON Schema for LLM system prompts.

```bash
yumia schema > yumia.schema.json
```

---

## 7. `yumia deploy` — Cloud Deployment Bundler

Prepares static deployment packages for Vercel, GitHub Pages, or any static hosting provider.

```bash
# Export with Vercel routing configuration
yumia deploy presentation.yumia --provider vercel --out dist-site

# Export for GitHub Pages with .nojekyll marker
yumia deploy presentation.yumia --provider gh-pages --out public
```

---

## 🎨 Global Theming & Color Override Flags

All compile and server commands accept runtime theme overrides:

```bash
yumia dev presentation.yumia \
  --theme cyberpunk \
  --primary "#FF2E88" \
  --secondary "#00F0FF" \
  --background "#0B0B12" \
  --text "#FFFFFF" \
  --accent "#FFE600"
```
