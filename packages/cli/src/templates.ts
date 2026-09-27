export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  theme: string;
  generateMarkdown: (projectName: string) => string;
  generateNative: (projectName: string) => string;
}

export const STARTER_TEMPLATES: Record<string, StarterTemplate> = {
  'pitch-deck': {
    id: 'pitch-deck',
    name: 'Startup Pitch Deck',
    description:
      'Venture pitch with ARR metrics, competitive compare, timeline, and growth charts.',
    theme: 'corporate',
    generateMarkdown: (projectName: string) =>
      `---
title: "${projectName}"
theme: "corporate"
aspectRatio: "16:9"
---

# ${projectName}
## The Autonomous Platform for Next-Gen Enterprise Workflows

:::badge variant="success" Series A Investor Deck :::

---

# Problem vs Solution

:::compare [leftTitle="Legacy Approach" rightTitle="Our Autonomous Engine"]
:::left
- Manual pixel dragging and fragile layout files
- Disconnected tools without version control
- Slow feedback loops and inconsistent branding
:::
:::vs
:::right
- 100% deterministic, intent-based compilation
- Native Git workflows and CI/CD automation
- Multi-format generation (PowerPoint, PDF, HTML)
:::
:::

---

# Traction & Hyper-Growth

:::grid columns=4 gap=20
:::metric value="$18.4M" label="ARR Run-Rate" change="+142% YoY" variant="success"
:::metric value="118%" label="Net Retention" change="+6%" variant="primary"
:::metric value="9.2x" label="LTV / CAC" change="+1.8x" variant="accent"
:::metric value="420+" label="Enterprise Logos" change="+85 New" variant="info"
:::

:::chart type="bar" title="Quarterly ARR ($M)" labels="Q1,Q2,Q3,Q4" data="6.2,9.8,13.5,18.4"

---

# Strategic Roadmap

:::timeline
- date: Q1
  title: Global Cloud Expansion
  description: Multi-region latency reduced to <15ms.
- date: Q2
  title: Enterprise AI Copilot
  description: Autonomous presentation compiler API rollout.
- date: Q3
  title: Real-Time Collaboration
  description: Live multi-user CRDT synchronization.
- date: Q4
  title: Marketplace Launch
  description: 500+ curated community design modules.
:::

---

# The Investment Opportunity

:::callout variant="success" title="Raising $15M Series A"
Accelerating go-to-market execution, scaling enterprise sales, and expanding R&D engineering.
:::

:::notes
Conclude the pitch with confidence and open the floor for investor Q&A.
:::
`.trim(),
    generateNative: (projectName: string) =>
      `document "${projectName}"
  theme "corporate"
  aspectRatio "16:9"

slide "Title"
  hero title="${projectName}" subtitle="The Autonomous Platform for Next-Gen Enterprise Workflows" badge="Series A Investor Deck" align="center"

slide "Problem & Market Disruption"
  compare leftTitle="Legacy Approach" rightTitle="Our Autonomous Engine"
    left
      card title="Fragmented Tools" variant="outlined"
        text "Manual pixel dragging and fragile unversioned slide decks."
      card title="High Churn & Latency" variant="outlined"
        text "Hours lost in formatting misalignment."
    right
      card title="Intent Compilation" variant="filled"
        text "Deterministic grammar compiled into PPTX, PDF, and HTML."
      card title="Developer First" variant="filled"
        text "Full Git integration with automated CI/CD pipelines."

slide "Traction & Hyper-Growth"
  grid columns=4 gap=20
    metric "$18.4M" label="ARR Run-Rate" change="+142% YoY" variant="success"
    metric "118%" label="Net Retention" change="+6%" variant="primary"
    metric "9.2x" label="LTV / CAC" change="+1.8x" variant="accent"
    metric "420+" label="Enterprise Logos" change="+85 New" variant="info"

  chart type="bar" title="Quarterly ARR ($M)" labels="Q1,Q2,Q3,Q4" data="6.2,9.8,13.5,18.4"

slide "Strategic Roadmap"
  timeline layout="horizontal"
    item date="Q1" title="Global Cloud Expansion" description="Multi-region latency reduced to <15ms."
    item date="Q2" title="Enterprise AI Copilot" description="Autonomous presentation compiler API rollout."
    item date="Q3" title="Real-Time Sync" description="Live multi-user CRDT synchronization."
    item date="Q4" title="Marketplace Launch" description="500+ curated community design modules."

slide "The Investment Opportunity"
  callout title="Raising $15M Series A" variant="success"
    text "Accelerating go-to-market execution, scaling enterprise sales, and expanding R&D engineering."
`.trim(),
  },

  'scientific-research': {
    id: 'scientific-research',
    name: 'Scientific & Academic Research',
    description: 'Peer-reviewed research deck with LaTeX math, integrals, charts, and citations.',
    theme: 'academic',
    generateMarkdown: (projectName: string) =>
      `---
title: "${projectName}"
theme: "academic"
aspectRatio: "16:9"
---

# ${projectName}
## Advanced Statistical Foundations & Quantum Waveform Mechanics

:::badge variant="info" Peer-Reviewed Research :::

---

# Theoretical Formulations

The macroscopic state equation and energy quantization:

:::math caption="Energy Quantization & Equivalence" color="#1e3a8a"
E = mc^2 \\quad \\Longleftrightarrow \\quad \\Delta E = h\\nu
:::

Wavefunction evolution through generalized Hamiltonian operators:

\`\`\`math
i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)
\`\`\`

---

# Gaussian Distribution & Integration

Continuous probability density across continuous parameter space $\\Omega$:

:::math caption="Normalized Gaussian Probability Integral"
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
:::

$$\\lim_{N \\to \\infty} \\sum_{k=1}^{N} \\frac{1}{k^s} = \\zeta(s)$$

---

# Experimental Dispersion & Convergence

:::chart type="line" title="Variance vs Iteration Depth (N=10^6)" labels="10k,50k,100k,250k,500k,1M" data="0.84,0.42,0.19,0.08,0.03,0.01"

:::callout variant="note" title="Empirical Observation"
Asymptotic convergence validates the theoretical lower bound within $p < 0.001$ statistical significance.
:::

---

# Conclusions & References

:::quote author="Physical Review Letters (2026)"
"A deterministic compilation model for mathematical research presentations ensures pixel-perfect formula vectorization across all physical media."
:::
`.trim(),
    generateNative: (projectName: string) =>
      `document "${projectName}"
  theme "academic"
  aspectRatio "16:9"

slide "Title"
  hero title="${projectName}" subtitle="Advanced Statistical Foundations & Quantum Waveform Mechanics" badge="Peer-Reviewed Research" align="center"

slide "Theoretical Formulations"
  math "E = mc^2 \\quad \\Longleftrightarrow \\quad \\Delta E = h\\nu" caption="Energy Quantization & Equivalence"

  math caption="Time-Dependent Schrödinger Wave Equation"
    i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)

slide "Gaussian Distribution & Integration"
  math "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}" caption="Normalized Gaussian Probability Integral"
  math "\\lim_{N \\to \\infty} \\sum_{k=1}^{N} \\frac{1}{k^s} = \\zeta(s)" caption="Riemann Zeta Limit"

slide "Experimental Convergence"
  chart type="line" title="Variance vs Iteration Depth (N=10^6)" labels="10k,50k,100k,250k,500k,1M" data="0.84,0.42,0.19,0.08,0.03,0.01"
  callout title="Empirical Observation" variant="note"
    text "Asymptotic convergence validates the theoretical lower bound within p < 0.001 statistical significance."

slide "Conclusions"
  quote text="A deterministic compilation model for mathematical research presentations ensures pixel-perfect formula vectorization across all physical media." author="Physical Review Letters (2026)"
`.trim(),
  },

  'tech-architecture': {
    id: 'tech-architecture',
    name: 'Technical Architecture & Engineering',
    description: 'System architecture with sequence diagrams, microservices, and code highlight.',
    theme: 'terminal',
    generateMarkdown: (projectName: string) =>
      `---
title: "${projectName}"
theme: "terminal"
aspectRatio: "16:9"
---

# ${projectName}
## Event-Driven Distributed Microservices Architecture

:::badge variant="primary" Architecture Review 2026 :::

---

# Core Infrastructure Primitives

:::grid columns=3 gap=20
:::card title="Ingress Gateway" variant="primary"
- Edge TLS termination & WAF
- JWT validation & Token bucket rate limiting
- Global Anycast IP routing
:::

:::card title="Event Stream Bus" variant="accent"
- Distributed Kafka log partition
- Zero-loss transactional outbox
- 500k msg/sec throughput
:::

:::card title="Storage Mesh" variant="success"
- Multi-region Raft replication
- Sub-5ms document queries
- Automated continuous snapshots
:::
:::

---

# Distributed Authentication Flow

:::sequence
Client -> Gateway: POST /api/v2/authenticate
Gateway -> AuthProvider: Validate OAuth2 Bearer Token
AuthProvider --> Gateway: 200 OK (Claims & Scopes)
Gateway -> ClusterMesh: Forward gRPC Request (TraceId: 0x9f82)
ClusterMesh --> Client: 200 OK Response Stream
:::

---

# Resilient Service Implementation

\`\`\`typescript {highlight="3-6,11"}
import { createCluster, DistributedEventBus } from '@enterprise/mesh';

export async function bootstrapServiceWorker(config: ServiceConfig) {
  const bus = new DistributedEventBus({ partitionCount: 16 });
  await bus.connect(config.brokerEndpoints);

  bus.subscribe('order.created', async (event) => {
    await processOrderTransaction(event.payload);
  });

  return { status: 'HEALTHY', pid: process.pid };
}
\`\`\`

---

# Production SLA & Telemetry

:::grid columns=3 gap=20
:::metric value="99.995%" label="Monthly Availability" change="Zero Downtime" variant="success"
:::metric value="4.2ms" label="P99 Response Time" change="-1.2ms" variant="primary"
:::metric value="1.8M" label="Req / Second Peak" change="+450k" variant="accent"
:::
`.trim(),
    generateNative: (projectName: string) =>
      `document "${projectName}"
  theme "terminal"
  aspectRatio "16:9"

slide "Title"
  hero title="${projectName}" subtitle="Event-Driven Distributed Microservices Architecture" badge="Architecture Review 2026" align="center"

slide "Core Infrastructure Primitives"
  grid columns=3 gap=20
    card title="Ingress Gateway" variant="primary"
      text "Edge TLS termination & token bucket rate limiting with global Anycast routing."
    card title="Event Stream Bus" variant="accent"
      text "Distributed Kafka log partition with 500k msg/sec zero-loss throughput."
    card title="Storage Mesh" variant="success"
      text "Multi-region Raft replication with sub-5ms latency and continuous snapshots."

slide "Distributed Authentication Flow"
  sequence
    participant Client
    participant Gateway
    participant AuthProvider
    participant ClusterMesh

    message from="Client" to="Gateway" label="POST /api/v2/authenticate"
    message from="Gateway" to="AuthProvider" label="Validate OAuth2 Bearer Token"
    message from="AuthProvider" to="Gateway" label="200 OK (Claims & Scopes)"
    message from="Gateway" to="ClusterMesh" label="Forward gRPC Request"
    message from="ClusterMesh" to="Client" label="200 OK Response Stream"

slide "Production SLA & Telemetry"
  grid columns=3 gap=20
    metric "99.995%" label="Monthly Availability" change="Zero Downtime" variant="success"
    metric "4.2ms" label="P99 Response Time" change="-1.2ms" variant="primary"
    metric "1.8M" label="Req / Second Peak" change="+450k" variant="accent"
`.trim(),
  },

  'quarterly-business': {
    id: 'quarterly-business',
    name: 'Quarterly Business Review (QBR)',
    description: 'Executive leadership deck with KPI scorecards, financial charts, and tables.',
    theme: 'corporate',
    generateMarkdown: (projectName: string) =>
      `---
title: "${projectName}"
theme: "corporate"
aspectRatio: "16:9"
---

# ${projectName}
## Q4 Executive Financial & Operational Review

:::badge variant="success" Executive Leadership :::

---

# Executive KPI Scorecard

:::grid columns=4 gap=20
:::metric value="$42.5M" label="Total Revenue" change="+28% YoY" variant="success"
:::metric value="78.4%" label="Gross Margin" change="+3.2%" variant="primary"
:::metric value="$12.8M" label="Free Cash Flow" change="+45%" variant="accent"
:::metric value="1,850" label="Total Headcount" change="+220" variant="info"
:::

---

# Revenue by Business Segment

:::chart type="bar" title="Quarterly Segment Performance ($M)" labels="Q1,Q2,Q3,Q4" data="18.2,24.6,33.1,42.5"

:::callout variant="success" title="Q4 Target Outperformance"
Enterprise SaaS expansion surpassed forecasted quarterly projections by $4.2M (+11.8%).
:::

---

# Regional Market Breakdown

| Region | Revenue ($M) | YoY Growth | Status |
| :--- | :--- | :--- | :--- |
| **North America** | $24.2M | +32% | Leading |
| **EMEA** | $12.1M | +24% | Expanding |
| **APAC** | $6.2M | +48% | High-Growth |

---

# Next Quarter Strategic Focus

:::timeline
- date: Month 1
  title: Sales Acceleration
  description: Onboarding 40 new enterprise account executives.
- date: Month 2
  title: Product GA
  description: General availability of the v2.0 Enterprise Suite.
- date: Month 3
  title: Operational Review
  description: Mid-year audit and international compliance certification.
:::
`.trim(),
    generateNative: (projectName: string) =>
      `document "${projectName}"
  theme "corporate"
  aspectRatio "16:9"

slide "Title"
  hero title="${projectName}" subtitle="Q4 Executive Financial & Operational Review" badge="Executive Leadership" align="center"

slide "Executive KPI Scorecard"
  grid columns=4 gap=20
    metric "$42.5M" label="Total Revenue" change="+28% YoY" variant="success"
    metric "78.4%" label="Gross Margin" change="+3.2%" variant="primary"
    metric "$12.8M" label="Free Cash Flow" change="+45%" variant="accent"
    metric "1,850" label="Total Headcount" change="+220" variant="info"

slide "Revenue by Business Segment"
  chart type="bar" title="Quarterly Segment Performance ($M)" labels="Q1,Q2,Q3,Q4" data="18.2,24.6,33.1,42.5"
  callout title="Q4 Target Outperformance" variant="success"
    text "Enterprise SaaS expansion surpassed forecasted quarterly projections by $4.2M (+11.8%)."

slide "Regional Market Breakdown"
  table
    headers "Region", "Revenue ($M)", "YoY Growth", "Status"
    row "North America", "$24.2M", "+32%", "Leading"
    row "EMEA", "$12.1M", "+24%", "Expanding"
    row "APAC", "$6.2M", "+48%", "High-Growth"

slide "Next Quarter Strategic Focus"
  timeline layout="horizontal"
    item date="Month 1" title="Sales Acceleration" description="Onboarding 40 new enterprise account executives."
    item date="Month 2" title="Product GA" description="General availability of the v2.0 Enterprise Suite."
    item date="Month 3" title="Operational Review" description="Mid-year audit and international compliance certification."
`.trim(),
  },
};

export function listTemplates(): string {
  const lines: string[] = ['Available Starter Templates:'];
  for (const t of Object.values(STARTER_TEMPLATES)) {
    lines.push(`  • ${t.id.padEnd(22)} ${t.name} (Theme: ${t.theme})\n    ${t.description}`);
  }
  return lines.join('\n');
}
