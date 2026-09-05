# Yumia for AI & Generative Workflows

Yumia was specifically engineered to be the most deterministic, unambiguous declarative language for LLMs (Large Language Models) generating slide decks and visual documents.

---

## 1. Why Yumia Outperforms Markdown & HTML for AI

1. **Unambiguous Boundaries**:
   Nested HTML blocks inside Markdown frequently cause LLMs to fail closing tags (`</div>`), creating corrupted ASTs. Yumia uses strict, clean indentation and keyword primitives (`grid`, `stack`, `card`, `metric`).

2. **Deterministic Token Names**:
   Rather than asking an LLM to invent CSS styling rules (`display: flex; justify-content: center;`), the model outputs semantic intent (`stack direction="horizontal"` or `grid columns=3`).

3. **Built-in Validation & JSON Schema**:
   Run `yumia schema` to extract the complete machine-readable specification to embed into LLM system prompts.

---

## 2. Recommended System Prompt for AI Generation

When instructing an LLM to produce Yumia presentations, provide the following prompt:

```text
You are an expert presentation designer generating Yumia Native (.yumia) presentations.

Follow these syntax rules strictly:
1. Start with the document declaration:
   document "<Title>"
     theme "<default|cyberpunk|minimal|corporate|terminal|academic>"
     aspectRatio "16:9"

2. Define slides with:
   slide "<Slide Title>"
     heading "<Heading>"
     text "<Body text>"

3. Use visual layout primitives:
   - grid columns=<2|3|4> gap=<number>
   - stack direction="<horizontal|vertical>" gap=<number>
   - card title="<Title>" variant="<primary|success|warning|danger|accent>"
   - metric "<Value>" label="<Label>" diff="<Change>" variant="<primary|success|warning|danger|accent>"
   - icon "<provider>:<name>" size=<number> color="<hex>"
   - code lang="<language>" highlight="<lines>"
   - badge "<Text>" variant="<variant>"
   - quote author="<Author>"
   - section "<Title>" subtitle="<Subtitle>" number="<01>"
   - toc "<Title>"
   - notes

4. Never output raw HTML or complex CSS tags. Output pure Yumia indentation-based syntax.
```

---

## 3. Example AI Generated Document

```yumia
document "Next-Gen Data Pipeline"
  theme "corporate"
  aspectRatio "16:9"

slide "Core Ingestion Engine"
  heading "Scalable Event Stream Processing"
  badge "Architecture v2" variant="primary"

  grid columns=3 gap=20
    card title="Kafka Cluster" variant="primary"
      icon "lucide:layers" size=32
      text "Handles 10M events per second with sub-5ms partition latency."

    card title="Flink Analytics" variant="success"
      icon "lucide:cpu" size=32
      text "Real-time stateful stream transformations and aggregations."

    card title="ClickHouse Lake" variant="accent"
      icon "lucide:database" size=32
      text "Columnar analytics storage with real-time vector indexing."

slide "Key Performance Indicators"
  stack direction="horizontal" gap=20
    metric "10M+" label="Events / sec" diff="+150%" variant="primary"
    metric "99.99%" label="SLA Uptime" diff="+0.04%" variant="success"
    metric "3.2ms" label="End-to-End Latency" diff="-45%" variant="accent"
```
