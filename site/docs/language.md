# Yumia Language Specification & Reference

This document defines the syntax, lexical structure, semantic primitives, and layout blocks of the **Native Yumia Language** (`.yumia`).

---

## 1. Lexical Structure

- **File Extension**: `.yumia`
- **Encoding**: UTF-8
- **Indentation**: 2 or 4 spaces (whitespace-sensitive for nested blocks such as `card`, `grid`, `stack`, `columns`, and `notes`).
- **Comments**: Single-line comments start with `//` or `#`.
- **Strings**: Values containing spaces should be enclosed in double quotes (`"..."`) or single quotes (`'...'`).

---

## 2. Document-Level Directives

A Yumia document starts with document-level configuration commands:

```yumia
document "Title of Presentation"
  theme "cyberpunk"
  author "Engineering Team"
  aspectRatio "16:9"
  transition "zoom"
  watermark "CONFIDENTIAL"
```

| Command                 | Arguments                        | Description                                                                                                                                                  |
| :---------------------- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document` / `title`    | `"<title>"`                      | The document or presentation title.                                                                                                                          |
| `theme`                 | `"<name>"`                       | Base visual theme: `default`, `cyberpunk`, `minimal`, `corporate`, `terminal`, `academic`, `neo-brutalist`, `luxury`, `monokai`, `solarized-dark`, `nebula`. |
| `author`                | `"<author>"`                     | Presentation author or organization.                                                                                                                         |
| `aspectRatio` / `ratio` | `"16:9"` \| `"4:3"` \| `"16:10"` | Target aspect ratio for slides and PDF pages.                                                                                                                |
| `transition`            | `"<type>"`                       | Default slide transition (`push`, `fade`, `wipe`, `zoom`, `split`).                                                                                          |
| `watermark`             | `"<text>"`                       | Watermark text displayed in the slide footer.                                                                                                                |

---

## 3. Slide Boundaries

Slides are defined using the `slide` keyword:

```yumia
slide "Architecture Overview"
  heading "System Pipeline"
  text "Detailed description of system components."
```

If a title string is passed to `slide "Title"`, it is automatically treated as the slide's primary heading (level 1).

---

## 4. Content Primitives

### Headings

```yumia
heading "Main Section Title"
h1 "Level 1 Heading"
h2 "Level 2 Heading"
h3 "Level 3 Heading"
```

### Paragraphs & Text

```yumia
text "Single line paragraph."
paragraph:
  Multi-line paragraphs can be written
  with indented text blocks.
```

### Lists

```yumia
list
  item "First item"
  item "Second item"
  item "Third item"
```

### Code Blocks

```yumia
code lang="typescript" highlight="2,4-6"
  import { YumiaCompiler } from '@yumiamd/core';

  // Highlighted line
  const compiler = new YumiaCompiler();
  const result = await compiler.render(ast, renderer);
```

### Quotes

```yumia
quote author="Alan Turing"
  We can only see a short distance ahead, but we can see plenty there that needs to be done.
```

### Badges

```yumia
badge "Production Ready" variant="success"
badge "Experimental" variant="warning"
badge "Critical" variant="danger"
badge "Accent" variant="accent"
```

### Callouts & Alerts

```yumia
callout variant="success" title="Production Ready" icon="lucide:check-circle"
  Distributed ingestion nodes passed stress tests with 0 buffer dropped.
```

### Hero Elements

```yumia
hero "Presentation Title" subtitle="Subtitle description" badge="v2.0" align="center" emphasis="high"
```

### Key Metrics & KPIs

```yumia
metric "99.98%" label="High Availability SLA" diff="+0.04%" variant="success" trend="up"
```

### Data Charts (Native SVG, Vector PDF & Editable PowerPoint Charts)

Supported chart types: `bar`, `line`, `pie`, `doughnut`, `radar`, `area`, `gauge`, `scatter`.

```yumia
# Multi-Dimensional Radar Chart
chart type="radar" title="System Capabilities" labels="Speed, Reliability, Security, Scalability, DX"
  series "Benchmark: 95, 90, 98, 88, 92"
  series "Baseline: 70, 75, 80, 65, 70"

# Real-time SLA Gauge
chart type="gauge" title="Service Availability" labels="Target 99.9%"
  series "Availability: 99.95"

# Gradient Bandwidth Area Chart
chart type="area" title="Bandwidth Ingestion (GB/s)" labels="00:00, 04:00, 08:00, 12:00, 16:00, 20:00"
  series Ingress: 14, 22, 58, 92, 74, 38
  series Egress: 9, 14, 32, 64, 48, 26
```

### PlantUML / Plantext Sequence Diagrams (`sequence`)

Native declarative sequence diagrams with lifelines, actor figurines, dashed return arrows, and note callouts:

```yumia
sequence title="OAuth 2.0 PKCE Handshake"
  actor User as "Mobile User"
  participant App as "Native Client"
  participant Auth as "Identity Provider"
  database DB as "Token Vault"
  User -> App: Tap Login with SSO
  App -> Auth: /oauth/authorize (code_challenge)
  Auth -> User: Render Consent UI
  User -> Auth: Grant Permission
  Auth --> App: Authorization Code
  App -> Auth: /oauth/token (code_verifier)
  Auth -> DB: Verify & Save Session
  Auth --> App: Access Token + JWT
  note over Auth: Token expiration 3600s
```

### PlantUML Class Diagrams (`class`)

Full object model diagrams with interface/abstract stereotypes, attribute and method member visibility (`+`, `-`, `#`, `~`), and standard UML relationships (`<|--` inheritance, `<|..` implementation, `*--` composition, `o--` aggregation):

```yumia
class title="Distributed Processing Engine Architecture"
  interface INeuralKernel {
    + executeTensor(ctx: Context): TensorResult
    + syncGradients(): void
  }
  class QuantumCore {
    + executeTensor(ctx: Context): TensorResult
    + stateVector: ComplexMatrix
    - qubitCount: number
  }
  class DispatchEngine {
    + schedule(batch: IngestionBatch): void
    - kernel: INeuralKernel
  }
  INeuralKernel <|.. QuantumCore : implements
  DispatchEngine --> INeuralKernel : orchestrates
```

### Compare (Before & After)

```yumia
compare leftTitle="Manual Canvas (Canva)" rightTitle="Design Compiler (Yumia)"
  left
    card
      text "Manual drag-and-drop, pixel misalignment, no Git versioning."
  right
    card variant="primary"
      text "Semantic intent, automated composition, reproducible builds."
```

### Timelines & Roadmaps

```yumia
timeline layout="horizontal"
  item date="Q1 2025" title="Core AST" desc="Decoupled semantic tree"
  item date="Q3 2025" title="Multi-Target" desc="HTML, PDF, PPTX"
  item date="Q1 2026" title="Design Compiler" desc="Visual intent & optimizer"
```

### Vector Architecture & Flowcharts (`diagram`)

Native declarative flowcharts and topology graphs compiled via a **cycle-safe layered graph layout** (longest-path ranking + orthogonal elbows) into native vector SVG, editable PowerPoint shapes, and PDF:

```yumia
diagram type="flow" direction="LR" title="Distributed Neural Pipeline"
  [Edge Sensors] -> [Ingestion Broker] -[TLS 1.3]-> [Neural Dispatcher]
  [Neural Dispatcher] -[gRPC Streaming]-> [Quantum Tensor Cores] -> [(Vector Knowledge Base)]
  [Quantum Tensor Cores] -[Hot Cache]-> [(Redis Semantic Cache)]
  node [Quantum Tensor Cores] variant="accent"
  node [Vector Knowledge Base] shape="database" variant="primary"
  node [Redis Semantic Cache] shape="database" variant="success"
```

You can also target nodes by id alias:

```yumia
  node qtc label="Quantum Tensor Cores" variant="accent"
```

When using bracket form (`node [Full Label] …`), the full label is matched so variants apply to the existing edge-declared node (no ghost duplicates).

Supported inline shapes:

- `[(Database Node)]` (`shape="database"`)
- `((Circle Milestone))` (`shape="circle"`)
- `{Decision Logic}` (`shape="diamond"`)
- `[Standard Node]` (`shape="round"`)

### Reusable Visual Components & Macros (`component`)

Declare modular layout macros at the top of your document and instantiate them with clean parameters:

```yumia
component ResearchPill title, description, metricVal, status
  card title="{{title}}" variant="{{status}}"
    metric "{{metricVal}}" label="Measured Benchmark" variant="{{status}}"
    text "{{description}}"

slide "Empirical Results"
  grid columns=2 gap=20
    ResearchPill "Inference Latency", "p99 reduction under heavy concurrent load.", "1.42ms", "success"
    ResearchPill "Throughput Capacity", "Peak distributed operations sustained.", "450k op/s", "accent"
```

### Data-Binding & Iterative Decks (`each`)

Bind slide decks dynamically to JSON arrays, lists, or CSV feeds:

```yumia
slide "Cluster Performance: {{region}}" each="regions"
  heading "Telemetry for {{region}}"

  grid columns=3 gap=20
    metric "{{uptime}}" label="SLA Uptime" variant="success"
    metric "{{latency}}" label="P99 Response" variant="primary"
    metric "{{nodes}}" label="Active Nodes" variant="accent"
```

### Mathematical Equations (KaTeX)

```yumia
math "E = mc^2"
```

### Data Tables

```yumia
table
  headers "Feature", "Canva", "Yumia"
  row "Source Controlled", "No", "Yes (Git)"
  row "Multi-Target Compile", "No", "Yes (HTML/PDF/PPTX)"
  row "Design Linter", "No", "Yes (yumia check)"
```

### Grid Layout

Creates an evenly divided grid of elements:

```yumia
grid columns=3 gap=20
  card title="Compute" variant="primary"
    icon "lucide:cpu" size=32
    text "Cluster worker nodes."

  card title="Storage" variant="success"
    icon "lucide:database" size=32
    text "Distributed object store."

  card title="Network" variant="accent"
    icon "lucide:globe" size=32
    text "Mesh ingress routing."
```

### Stack Layout

Arranges children linearly along a horizontal or vertical axis:

```yumia
stack direction="horizontal" gap=16
  metric "100K" label="Requests / sec"
  metric "99.9%" label="Availability"
  metric "0.5ms" label="Avg Latency"
```

### Multi-Column Layout

Defines custom width ratio columns:

```yumia
columns 60:40
  column
    heading "Primary Focus"
    text "Detailed breakdown of the core algorithm."
  column
    card title="Summary"
      text "Key findings."
```

---

## 6. Structural & Agenda Elements

### Section Slide

```yumia
section "Part 1: Architecture & Pipeline" subtitle="Detailed coordinate analysis" number="01"
```

### Table of Contents (TOC)

Automatically aggregates all `section` or top-level headings across the deck:

```yumia
toc "Presentation Agenda"
```

### Speaker Notes

```yumia
notes
  Remember to emphasize the 0.5ms parse latency on this slide.
  Mention backward compatibility with legacy Markdown.
```
