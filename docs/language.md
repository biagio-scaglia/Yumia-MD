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

| Command                 | Arguments                        | Description                                                                                |
| :---------------------- | :------------------------------- | :----------------------------------------------------------------------------------------- |
| `document` / `title`    | `"<title>"`                      | The document or presentation title.                                                        |
| `theme`                 | `"<name>"`                       | Base visual theme: `default`, `cyberpunk`, `minimal`, `corporate`, `terminal`, `academic`. |
| `author`                | `"<author>"`                     | Presentation author or organization.                                                       |
| `aspectRatio` / `ratio` | `"16:9"` \| `"4:3"` \| `"16:10"` | Target aspect ratio for slides and PDF pages.                                              |
| `transition`            | `"<type>"`                       | Default slide transition (`push`, `fade`, `wipe`, `zoom`, `split`).                        |
| `watermark`             | `"<text>"`                       | Watermark text displayed in the slide footer.                                              |

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

### Metrics & KPI Callouts

```yumia
metric "99.99%" label="Uptime" diff="+0.05%" variant="success"
metric "0.4ms" label="Latency" diff="-12%" variant="primary"
```

### Multi-Provider Icons

```yumia
icon "lucide:rocket" size=32 color="#00F0FF"
icon "material:shield" size=28
icon "fa:github"
icon "tabler:activity"
```

---

## 5. Layout Containers

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
