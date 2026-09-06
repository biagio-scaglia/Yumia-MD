# Yumia for AI & Generative Workflows

Yumia was specifically engineered to be the most deterministic, unambiguous declarative language for LLMs (Large Language Models) generating slide decks and visual documents.

---

## 1. Why Yumia Outperforms Markdown & HTML for AI

1. **Design Intent over Technical CSS**:
   Rather than asking an LLM to hallucinate fragile CSS flexbox/grid styles (`display: flex; justify-content: center;`), the model outputs semantic design intent (`hero`, `callout`, `grid columns=3`, `metric`, `compare`).

2. **Unambiguous Syntax & Structure**:
   Yumia provides strict, clean grammar in both Native (`.yumia`) and Markdown (`.yumia.md`) modes without fragile closing tag issues.

3. **Built-in Quality Audit & JSON Schema**:
   Run `yumia schema` to extract the complete machine-readable specification to embed into LLM system prompts, and use `yumia check --optimize` to evaluate the generated output.

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

3. Use high-level visual design primitives:
   - hero title="<Title>" subtitle="<Subtitle>" badge="<Badge>" align="<center|left>"
   - callout variant="<info|warning|success|danger|accent>" title="<Title>"
   - grid columns=<2|3|4> gap=<number>
   - stack direction="<horizontal|vertical>" gap=<number>
   - card title="<Title>" variant="<primary|success|warning|danger|accent>"
   - metric "<Value>" label="<Label>" diff="<Change>" variant="<primary|success|warning|danger|accent>"
   - image src="<URL>" fit="<cover|contain>" radius="<md|lg|full>" shadow="<md|glow>"
   - chart type="<bar|line|pie|doughnut>" title="<Title>" labels="<A,B,C>" data="<1,2,3>"
   - compare left="<TitleA>" right="<TitleB>"
   - timeline layout="<horizontal|vertical>"
   - icon "<provider>:<name>" size=<number> color="<hex>"
   - code lang="<language>" highlight="<lines>"
   - badge "<Text>" variant="<variant>"
   - quote author="<Author>"
   - section "<Title>" subtitle="<Subtitle>" number="<01>"
   - toc "<Title>"
   - notes

4. Output pure Yumia indentation-based syntax. Never invent low-level CSS or unclosed tags.
```

---

## 3. Example AI Generated Document

```yumia
document "Next-Gen Data Platform"
  theme "corporate"
  aspectRatio "16:9"

slide "Executive Summary"
  hero title="Autonomous Cloud Data Platform" subtitle="Sub-millisecond processing at exabyte scale" badge="Enterprise Edition" align="center"

slide "Core Ingestion Engine"
  callout variant="info" title="Zero-Loss Architecture"
    text "Continuous streaming replication with automated multi-region failover."

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
