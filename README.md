<div align="center">
  <img src="site/favicon.svg" alt="Yumia Alchemical Logo" width="80" height="80" />
  <h1>Yumia</h1>
  <p><strong>A programming language for visual documents.</strong></p>
  <p>Describe what you want to communicate. Yumia handles structure, composition, design, and output.</p>

  <p>
    <a href="https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml"><img src="https://github.com/biagio-scaglia/Yumia-MD/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
    <a href="https://www.npmjs.com/package/yumiamd"><img src="https://img.shields.io/npm/v/yumiamd.svg?color=blue" alt="npm version" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  </p>
</div>

---

## One Source. Every Visual Format.

Traditional slide tools force you to arrange raw geometry (`rectangle`, `textbox`, `shape`, `line`).  
**Yumia compiles communicative intent (`hero`, `metric`, `compare`, `timeline`, `card`, `chart`) into structured visual artifacts.**

```text
                  CONTENT & COMMUNICATIVE INTENT
                                │
                                ▼
                       YUMIA SEMANTIC AST
                                │
                                ▼
                  DESIGN SYSTEM & COMPOSITION
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │   PPTX Gen   │        │  Vector PDF  │        │ Interactive  │
 │ 100% Editable│        │  Millimeter  │        │   HTML5 +    │
 │    Shapes    │        │  Precision   │        │ DevTools/HUD │
 └──────────────┘        └──────────────┘        └──────────────┘
```

### The Source (`presentation.yumia`)

```yumia
document "Q4 Financial Trajectory"
  theme "corporate"
  aspectRatio "16:9"

slide "Revenue & Growth"
  hero title="Hyper-Growth Execution" subtitle="ARR beats quarterly target by 42%" badge="Q4 Audit" align="center"

  grid columns=3 gap=20
    metric "$24.8M" label="ARR Run-Rate" diff="+142% YoY" variant="success" trend="up"
    metric "118%" label="Net Retention" diff="+4%" variant="primary" trend="up"
    metric "9.2x" label="LTV / CAC" diff="+1.8x" variant="accent" trend="up"

  chart type="bar" title="Quarterly ARR ($M)" labels="Q1,Q2,Q3,Q4" data="12.4,15.8,19.2,24.8"
```

### The Compilation

```bash
# Compile to 100% native editable PowerPoint (real OpenXML shapes & charts)
yumia build presentation.yumia --format pptx --out dist/deck.pptx

# Compile to vector PDF with high-definition typography
yumia build presentation.yumia --format pdf --out dist/deck.pdf

# Launch instant dev server with live-reload and Interactive Visual Inspector
yumia dev presentation.yumia --open
```

---

## The Paradigm Shift

| Feature               | Legacy Presentation Tools (PowerPoint, Keynote) | Markdown Slide Generators (Marp, Slidev) | Yumia (Design Compiler)                                     |
| :-------------------- | :---------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------- |
| **Model**             | Absolute canvas coordinates (fragile to resize) | HTML/CSS strings inside markdown         | **Pure Semantic AST with Design Intent**                    |
| **PowerPoint Output** | Native proprietary binary                       | Rasterized screenshot images in PPTX     | **100% Native OpenXML editable shapes & charts**            |
| **PDF Output**        | Exported print driver                           | Rasterized browser screenshots           | **Vector PDF drawing via PDFKit**                           |
| **Design Control**    | Manual pixel dragging                           | Fragile inline CSS / Tailwind classes    | **High-level intent (`hero`, `compare`, `metric`, `grid`)** |
| **AI Integration**    | None / Add-on chat sidecars                     | Unstable HTML generation (unclosed tags) | **Deterministic Grammar & JSON Schema**                     |
| **Design Auditing**   | None                                            | None                                     | **Design Linter & `yumia explain` Intelligence**            |

---

## Design Intelligence: `yumia explain`

Yumia is a **design-aware compiler**. Run `yumia explain` to audit visual rhythm, cognitive density, typography hierarchy, and composition balance before publishing:

```bash
yumia explain presentation.yumia
```

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
  ⚠ Slide 7 contains 38% more text than the presentation average.
  ⚠ Slides 8–10 use identical 'card' composition. → Consider introducing a visual break.

Design Suggestions
  → Consider splitting Slide 7 into two slides or converting list items into a 3-column metric grid.
================================================
```

---

## DevTools for Documents: Interactive Visual Inspector

Presentations running in HTML mode (`yumia dev` or `--format html`) include an embedded **Design HUD**:

- **Keyboard Trigger**: Press `I` or `Alt+Click` on any rendered element.
- **Floating HUD**: Displays bounding box dimensions, element variant, computed CSS tokens (`--yumia-primary`, `--yumia-surface`), WCAG contrast ratios, and source line numbers.
- **Speaker Mode**: Press `S` to launch a synchronized dual-window presentation console with notes, elapsed timer, and next-slide preview.

---

## Semantic Primitives

Yumia provides purpose-built intent primitives that adapt across themes and aspect ratios:

| Primitive  | Intent & Description                                               | Supported Attributes                                                |
| :--------- | :----------------------------------------------------------------- | :------------------------------------------------------------------ |
| `hero`     | Prominent visual anchor statement for covers and section breaks    | `title`, `subtitle`, `badge`, `emphasis`, `align`, `density`        |
| `callout`  | Highlighted context block with semantic tone                       | `variant` (`info`, `warning`, `success`, `danger`), `title`, `icon` |
| `metric`   | Key performance indicator with value, delta, and directional trend | `value`, `label`, `diff`/`change`, `variant`, `trend` (`up`/`down`) |
| `compare`  | Structured side-by-side comparison with automatic visual contrast  | `left`, `right`, `leftVariant`, `rightVariant`                      |
| `timeline` | Chronological event milestones                                     | `layout` (`horizontal`, `vertical`), `variant`                      |
| `chart`    | Native data visualization                                          | `type` (`bar`, `line`, `pie`, `doughnut`), `labels`, `data`         |
| `card`     | Container for grouped ideas and structured details                 | `title`, `variant`, `glow`, `padding`                               |
| `image`    | Responsive media element with smart aspect ratio and styling       | `src`, `alt`, `fit`, `radius`, `shadow`, `aspectRatio`, `zoomable`  |
| `grid`     | Multi-column spatial layout engine                                 | `columns` (1..6), `gap`, `density`                                  |
| `stack`    | Linear flex distribution                                           | `direction` (`horizontal`, `vertical`), `gap`                       |
| `mermaid`  | Architectural diagrams and state flowcharts                        | Complete Mermaid.js syntax                                          |
| `math`     | LaTeX and AsciiMath scientific typography                          | Inline `$..$` and display `$$..$$`                                  |

---

## AI Ecosystem: Deterministic by Design

Yumia was architected from day one as the ideal compilation target for Large Language Models (LLMs):

1. **Unambiguous Indentation**: Eliminates unclosed `</div>` syntax errors typical of Markdown/HTML.
2. **Intent over Implementation**: AI specifies _what_ to communicate (`metric "$4M" label="Revenue" trend="up"`), and Yumia computes exact spacing, typography, and contrast.
3. **Machine-Readable Schema**: Run `yumia schema` to extract the full JSON Schema for direct injection into system prompts.
4. **Automated Audit**: AI agents can run `yumia check --optimize --json` to receive structured feedback and auto-correct visual defects in a loop.

---

## Architectural Roadmap

- [x] **Phase 1 — Core Foundation**: Pure semantic AST, Native (`.yumia`) & Markdown (`.yumia.md`) parsers, deterministic 2D layout engine, multi-target renderers (PPTX, PDF, HTML).
- [x] **Phase 2 — Design System & Composition Engine**: Intent primitives (`hero`, `callout`, `compare`, `timeline`, `metric`, `chart`), theme token scales, WCAG AAA contrast checker.
- [x] **Phase 3 — Design Intelligence**: Automated Visual Quality Score (`yumia check`), rhythm diagnostics (`yumia explain`), and Interactive DevTools Inspector.
- [ ] **Phase 4 — Universal Documents**: Multi-surface compilation from a single AST (Presentations 16:9, A4 Reports/Docs, Social Cards 1080x1350, Responsive Web).
- [ ] **Phase 5 — Autonomous Design Agent**: Real-time iterative layout optimizer with automated visual asset placement.

---

## Quick Start

### Zero Install (via `npx`)

```bash
# Initialize starter deck
npx yumiamd init my-deck --theme corporate

# Start live dev server
npx yumiamd dev presentation.yumia.md --open

# Compile to PowerPoint
npx yumiamd build presentation.yumia.md --out presentation.pptx
```

### Global Installation

```bash
npm install -g yumiamd
# or
pnpm add -g yumiamd
```

---

## Documentation

- [CLI & Tooling Reference](docs/cli.md) — Complete guide to `yumia check`, `explain`, `dev`, `build`, and options.
- [Language Specification](docs/language.md) — Complete syntax reference for Native & Markdown modes.
- [Architecture & Design Compiler](docs/architecture.md) — Pipeline flow and internal data structures.
- [AI Integration Guidelines](docs/ai-guidelines.md) — System prompts and deterministic generation workflows.
- [Icon System](docs/icons.md) — Multi-provider icon registry (Lucide, Material, Tabler, FontAwesome).
- [Formal Compiler Specification](docs/specification.md) — Canonical grammar and layout rules.

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for local workspace setup and guidelines.

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
