/**
 * Yumia Documentation Data Store
 * Complete, authoritative documentation content for the official Yumia Documentation Website.
 * Uses Font Awesome 6 icons (Zero Emojis).
 */

export const DOCS_SECTIONS = [
  {
    id: 'overview',
    title: 'What is Yumia?',
    category: 'Philosophy & Concepts',
    icon: 'fa-solid fa-compass',
    lead: 'A declarative visual language and design compiler that transforms content and communicative intent into structured visual artifacts.',
    content: `
      <h2>The Core Paradigm Shift</h2>
      <p>Traditional slide and document tools force creators to manually position and align raw geometry (<code>rectangle</code>, <code>textbox</code>, <code>shape</code>, <code>line</code>). Markdown slide generators simply inject fragile HTML and CSS classes into slides, producing fragile layouts that cannot export to genuine, editable presentation formats.</p>
      
      <p><strong>Yumia defines a new category: A Programming Language for Visual Documents.</strong></p>

      <div class="callout tip">
        <div class="callout-title"><i class="fa-solid fa-lightbulb" style="color: var(--yumia-success); margin-right: 0.4rem;"></i> The Mental Model</div>
        <p>Just as <code>HTML ➔ DOM ➔ CSS ➔ Layout Engine ➔ Browser</code> revolutionized the web, Yumia introduces <code>Yumia Source ➔ Semantic AST ➔ Design Intelligence ➔ Layout Engine ➔ Multi-Target Output</code> for visual documents.</p>
      </div>

      <h2>The Compiler Pipeline</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">ARCHITECTURE</span></div>
        <pre><code>CONTENT & COMMUNICATIVE INTENT (.yumia / .yumia.md)
                      │
                      ▼
             YUMIA SEMANTIC AST
                      │
                      ▼
        DESIGN INTELLIGENCE & LAYOUT ENGINE
                      │
      ┌───────────────┼───────────────┬───────────────┐
      ▼               ▼               ▼               ▼
 NATIVE PPTX      VECTOR PDF     HTML5 DECK         SVG
 (OpenXML XML)   (Vector Fonts)  (DevTools UI)   (Components)</code></pre>
      </div>

      <h2>Core Capabilities</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <h3>Intent-First Primitives</h3>
          <p>Express ideas with <code>hero</code>, <code>metric</code>, <code>compare</code>, <code>timeline</code>, <code>card</code>, and <code>chart</code> instead of fragile CSS styles.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-bullseye"></i></div>
          <h3>100% Native PowerPoint</h3>
          <p>Compiles directly to real, fully editable OpenXML PowerPoint shapes, text frames, and Microsoft charts.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-magnifying-glass-chart"></i></div>
          <h3>Design Intelligence</h3>
          <p>Built-in <code>yumia explain</code> and <code>yumia check</code> auditing contrast (WCAG AAA), density, and visual rhythm.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-robot"></i></div>
          <h3>AI-Deterministic</h3>
          <p>Strict indentation grammar and JSON Schema eliminates hallucinated CSS and unclosed HTML tags in LLM pipelines.</p>
        </div>
      </div>
    `,
  },
  {
    id: 'philosophy',
    title: 'The Yumia Philosophy',
    category: 'Philosophy & Concepts',
    icon: 'fa-solid fa-brain',
    lead: 'The four fundamental architectural pillars that distinguish Yumia from drag-and-drop tools and markdown converters.',
    content: `
      <h2>Why Yumia is Not Canva</h2>
      <p>GUI editors like <strong>Canva</strong> and <strong>PowerPoint</strong> are built on manual pixel manipulation: drag, drop, align, resize. They cannot be versioned with Git, automated in CI/CD pipelines, tested programmatically, or generated deterministically by AI agents.</p>
      
      <p>Markdown converters like <strong>Marp</strong> or <strong>Slidev</strong> attempt to bridge this gap, but rely on fragile CSS classes and produce flat rasterized screenshot images when exporting to presentation formats.</p>

      <p><strong>Yumia is a true Programming Language:</strong> source code goes into a compiler, and a deterministic, native visual document comes out.</p>

      <div class="docs-table-wrapper">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>GUI Tools (Canva, PPT)</th>
              <th>Markdown Converters</th>
              <th>Yumia (Visual Language)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Source Format</strong></td>
              <td>Binary / Proprietary JSON</td>
              <td>Markdown + HTML/CSS hacks</td>
              <td><strong>Pure Semantic DSL / AST</strong></td>
            </tr>
            <tr>
              <td><strong>Design Model</strong></td>
              <td>Manual Pixel Geometry</td>
              <td>Fragile CSS classes</td>
              <td><strong>Declarative Communicative Intent</strong></td>
            </tr>
            <tr>
              <td><strong>Version Control</strong></td>
              <td>None (Blob files)</td>
              <td>Partial (CSS diff noise)</td>
              <td><strong>100% Git-Native & Diffable</strong></td>
            </tr>
            <tr>
              <td><strong>Automation / CI</strong></td>
              <td>Impossible</td>
              <td>Basic Web Export</td>
              <td><strong>Headless CLI & Multi-Target Build</strong></td>
            </tr>
            <tr>
              <td><strong>PowerPoint Output</strong></td>
              <td>Native (Manual)</td>
              <td>Flat Raster Screenshots</td>
              <td><strong>100% Native OpenXML Vector Shapes</strong></td>
            </tr>
            <tr>
              <td><strong>Design Verification</strong></td>
              <td>Human eye inspection</td>
              <td>None</td>
              <td><strong>Design Intelligence (WCAG AAA, Rhythm)</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>The Four Pillars</h2>

      <h3>01 — Documents are Code</h3>
      <p>A document is not an arbitrary collection of pixels. It is structured source text that can be versioned, reviewed in Pull Requests, branched, tested in continuous integration pipelines, and generated by backend microservices.</p>

      <h3>02 — Design is Declarative</h3>
      <p>Creators should never specify <em>"shift this box 13 pixels to the right"</em>. You declare <strong>what</strong> you want to communicate (<code>metric</code>, <code>compare</code>, <code>timeline</code>, <code>hero</code>), and the Yumia layout engine calculates optimal typography hierarchies, margins, contrast, and cognitive density.</p>

      <h3>03 — Content & Themes are Strictly Decoupled</h3>
      <p>The semantic content of a document does not know about pixel colors or font families. Switching between <code>theme "corporate"</code>, <code>theme "cyberpunk"</code>, and <code>theme "terminal"</code> transforms the visual identity instantly across all output formats without altering a single word of content.</p>

      <h3>04 — One Source, Multi-Target Determinism</h3>
      <p>A single Yumia document compiles deterministically to all major presentation and document targets without rasterization compromises:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">MULTI-TARGET ECOSYSTEM</span></div>
        <pre><code>                    YUMIA SOURCE (.yumia)
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  HTML5      PDF      PPTX
                    │         │         │
                    └─────────┼─────────┘
                              ▼
                         SVG / ASSETS</code></pre>
      </div>
    `,
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-rocket',
    lead: 'Get up and running with the Yumia compiler in under 30 seconds.',
    content: `
      <h2>Zero-Install Execution</h2>
      <p>You can compile and preview Yumia documents immediately via <code>npx</code>:</p>
      
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">BASH</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code># 1. Initialize a starter presentation with corporate theme
npx yumiamd init my-deck --theme corporate

# 2. Launch instant dev server with live-reload and Visual Inspector
npx yumiamd dev presentation.yumia.md --open

# 3. Run automated design audit & visual quality score
npx yumiamd check presentation.yumia.md --optimize

# 4. Compile directly to an editable PowerPoint (.pptx)
npx yumiamd build presentation.yumia.md --out dist/deck.pptx</code></pre>
      </div>

      <h2>Global CLI Installation</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">BASH</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code># npm
npm install -g yumiamd

# pnpm
pnpm add -g yumiamd

# yarn
yarn global add yumiamd</code></pre>
      </div>

      <h2>Your First Yumia Document</h2>
      <p>Create a file named <code>deck.yumia</code>:</p>
      
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>document "Cloud Infrastructure v2"
  theme "corporate"
  aspectRatio "16:9"

slide "Executive Summary"
  hero title="Distributed Edge Compute" subtitle="Next-generation stream processing engine" badge="Q4 Release" align="center"

slide "Key Performance Indicators"
  grid columns=3 gap=20
    metric "99.999%" label="Service SLA" diff="+0.009%" variant="success" trend="up"
    metric "1.2ms" label="p99 Latency" diff="-35%" variant="primary" trend="down"
    metric "14.2M" label="Invocations/sec" diff="+120%" variant="accent" trend="up"

  chart type="bar" title="Monthly Throughput (M)" labels="Jan,Feb,Mar,Apr,May,Jun" data="4.2,6.8,9.1,11.5,13.2,14.2"</code></pre>
      </div>
    `,
  },
  {
    id: 'syntax-grammar',
    title: 'Syntax & Grammar',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-code',
    lead: 'Formal grammar, semantic document targets, directives, and indentation rules.',
    content: `
      <h2>Dual Grammar Support</h2>
      <p>Yumia provides two syntax flavors designed for different workflows:</p>
      
      <ul>
        <li><strong>Native Yumia DSL (<code>.yumia</code>):</strong> Clean, indentation-based grammar with strict AST predictability. Optimal for AI generation and developer speed.</li>
        <li><strong>Markdown Hybrid (<code>.yumia.md</code>):</strong> Standard Markdown extended with Yumia directive blocks (<code>:::card</code>, <code>:::metric</code>). Optimal for content writers.</li>
      </ul>

      <h2>Semantic Target Directives</h2>
      <p>Yumia supports multiple target document formats beyond slides:</p>

      <div class="docs-table-wrapper">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Directive</th>
              <th>Target Artifact</th>
              <th>Default Aspect Ratio / Page Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>document</code> / <code>@slide</code></td>
              <td>Presentation Slide Deck</td>
              <td>16:9 (1920 × 1080) or 4:3</td>
            </tr>
            <tr>
              <td><code>@article</code></td>
              <td>Technical Whitepaper / Article</td>
              <td>A4 / Letter (Vertical Scroll)</td>
            </tr>
            <tr>
              <td><code>@report</code></td>
              <td>Executive Briefing / Financial Summary</td>
              <td>A4 Landscape / Multi-page</td>
            </tr>
            <tr>
              <td><code>@poster</code></td>
              <td>Conference Poster / Infographic</td>
              <td>A0 / Custom Banner Ratio</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Indentation & Structure Rules</h2>
      <p>In <code>.yumia</code> files, nesting is defined by 2-space indentation:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DSL</span></div>
        <pre><code>document "System Architecture"
  theme "cyberpunk"
  aspectRatio "16:9"

slide "Cluster Node Topology"
  grid columns=2 gap=24
    card title="Ingress Gateway" variant="primary"
      text "Handles SSL termination and HTTP/3 edge routing."
    card title="Service Mesh" variant="success"
      text "mTLS zero-trust communication across all worker nodes."</code></pre>
      </div>
    `,
  },
  {
    id: 'language-primitives',
    title: 'Visual Primitives',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-shapes',
    lead: 'Comprehensive reference of Yumia high-level design intent blocks.',
    content: `
      <h2>Primitives Matrix</h2>
      <div class="docs-table-wrapper">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Primitive</th>
              <th>Intent & Purpose</th>
              <th>Attributes</th>
              <th>Targets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>hero</code></td>
              <td>Prominent visual anchor statement for covers and section breaks</td>
              <td><code>title</code>, <code>subtitle</code>, <code>badge</code>, <code>align</code>, <code>emphasis</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>callout</code></td>
              <td>Highlighted contextual notification with semantic tone</td>
              <td><code>variant</code> (<code>info</code>, <code>warning</code>, <code>success</code>, <code>danger</code>), <code>title</code>, <code>icon</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>metric</code></td>
              <td>Key performance indicator with value, delta, and directional trend</td>
              <td><code>value</code>, <code>label</code>, <code>diff</code>, <code>variant</code>, <code>trend</code> (<code>up</code>/<code>down</code>)</td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>compare</code></td>
              <td>Side-by-side comparison with automatic visual contrast</td>
              <td><code>left</code>, <code>right</code>, <code>leftVariant</code>, <code>rightVariant</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>timeline</code></td>
              <td>Chronological event milestones and roadmaps</td>
              <td><code>layout</code> (<code>horizontal</code>/<code>vertical</code>), <code>variant</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>chart</code></td>
              <td>Native data visualization compiled to real OpenXML charts</td>
              <td><code>type</code> (<code>bar</code>, <code>line</code>, <code>pie</code>, <code>doughnut</code>, <code>radar</code>, <code>area</code>, <code>gauge</code>, <code>scatter</code>), <code>labels</code>, <code>series</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>sequence</code></td>
              <td>PlantUML-style sequence diagrams with lifelines, actors, message arrows, and notes</td>
              <td><code>title</code>, participants, actors, databases, arrows (<code>-&gt;</code>, <code>--&gt;</code>, <code>-&gt;&gt;</code>)</td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>class</code></td>
              <td>PlantUML-style class diagrams with interfaces, members, and relationships</td>
              <td><code>title</code>, classes, interfaces, attributes, methods, relationships (<code>&lt;\|--</code>, <code>&lt;\|..</code>)</td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>diagram</code></td>
              <td>Sugiyama-layered vector architecture, DAGs, and flowcharts</td>
              <td><code>type</code> (<code>flow</code>), <code>direction</code> (<code>LR</code>, <code>TB</code>), <code>title</code></td>
              <td>PPTX, PDF, HTML, SVG</td>
            </tr>
            <tr>
              <td><code>card</code></td>
              <td>Container for grouped concepts and structured points</td>
              <td><code>title</code>, <code>variant</code>, <code>glow</code>, <code>padding</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
            <tr>
              <td><code>image</code></td>
              <td>Responsive media element with smart aspect ratio and radius</td>
              <td><code>src</code>, <code>alt</code>, <code>fit</code>, <code>radius</code>, <code>shadow</code>, <code>aspectRatio</code></td>
              <td>PPTX, PDF, HTML</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Hero Block Example</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>slide "Hero Section"
  hero title="Autonomous Cloud Platform" subtitle="Sub-millisecond processing at exabyte scale" badge="Enterprise v2" align="center" emphasis="high"</code></pre>
      </div>

      <h2>Callout Block Example</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">MARKDOWN (.yumia.md)</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>:::callout variant="warning" title="Breaking API Changes" icon="lucide:alert-triangle"
All deprecated v1 endpoints will be sunset on October 1st. Please migrate to the v2 GraphQL API.
:::</code></pre>
      </div>
    `,
  },
  {
    id: 'diagrams-graphs',
    title: 'Vector Flowcharts & Diagrams',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-diagram-project',
    lead: 'The next evolution of text-to-diagram engines. Compiles hierarchical DAGs directly into native vector SVG, editable PowerPoint shapes, and PDF.',
    content: `
      <h2>The Mermaid & PlantText Evolution</h2>
      <p>For years, developers relied on tools like <strong>Mermaid.js</strong> and <strong>PlantText / PlantUML</strong> to describe diagrams in text. But when integrating diagrams into decks, whitepapers, or executive presentations, these legacy tools fall short: they produce rasterized PNGs or rigid HTML embeds that break responsive layouts and cannot be edited in PowerPoint or Illustrator.</p>
      
      <p><strong>Yumia redefines text-to-diagram compilation:</strong> A pure declarative syntax powered by the <strong>Sugiyama Layered Graph Framework</strong>, providing automatic cross-axis centering, smooth Bézier curves, bidirectional node aliasing, and <em>100% native vector multi-target rendering</em>.</p>

      <div class="docs-table-wrapper">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Mermaid.js</th>
              <th>PlantText / PlantUML</th>
              <th>Yumia Vector Diagrams</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>PowerPoint Export</strong></td>
              <td>Raster Screenshot (PNG)</td>
              <td>Raster Screenshot (PNG)</td>
              <td><strong>Native OpenXML Vector Shapes</strong></td>
            </tr>
            <tr>
              <td><strong>Layout Engine</strong></td>
              <td>Dagre JS (Client-only)</td>
              <td>Graphviz Server C/Java</td>
              <td><strong>Built-in Sugiyama DAG Compiler</strong></td>
            </tr>
            <tr>
              <td><strong>Theme Intelligence</strong></td>
              <td>Hardcoded CSS Themes</td>
              <td>Custom Skinparams</td>
              <td><strong>Theme-Adaptive Design Tokens</strong></td>
            </tr>
            <tr>
              <td><strong>Interactive HTML5</strong></td>
              <td>Web Only</td>
              <td>Static Images</td>
              <td><strong>Responsive SVG + Glassmorphism</strong></td>
            </tr>
            <tr>
              <td><strong>Vector PDF Export</strong></td>
              <td>Browser Print</td>
              <td>GhostScript / Batik</td>
              <td><strong>Vector Bezier Tracing via PDFKit</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Diagram Syntax & Semantics</h2>
      <p>Declare your topology naturally with bracketed nodes, edge protocols, and semantic modifiers:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DSL</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>slide "System Topology & Neural Dispatch"
  heading "Vector-Compiled Distributed Ingestion Mesh"
  
  diagram type="flow" direction="LR" title="Multi-Tier Neural Processing Pipeline"
    [Edge Sensors] -> [Ingestion Broker] -[TLS 1.3]-> [Neural Dispatcher]
    [Neural Dispatcher] -[gRPC Streaming]-> [Quantum Tensor Cores] -> [(Vector Knowledge Base)]
    [Quantum Tensor Cores] -[Hot Cache]-> [(Redis Semantic Cache)]
    node qtc label="Quantum Tensor Cores" variant="accent"
    node vkb label="Vector Knowledge Base" shape="database" variant="primary"
    node cache label="Redis Semantic Cache" shape="database" variant="success"</code></pre>
      </div>

      <h2>Node Shape Tokens</h2>
      <p>Yumia recognizes concise inline shape tokens inspired by modern diagramming grammars:</p>
      <ul>
        <li><code>[(Database Node)]</code> or <code>shape="database"</code> — Cylinder storage node</li>
        <li><code>((Circle Milestone))</code> or <code>shape="circle"</code> — Rounded milestone / event node</li>
        <li><code>{Decision Logic}</code> or <code>shape="diamond"</code> — Conditional branch diamond</li>
        <li><code>[Standard Box]</code> or <code>shape="round"</code> — Card node with design token borders</li>
      </ul>

      <h2>Bidirectional Node Aliasing</h2>
      <p>Reference nodes by explicit IDs (e.g. <code>sensors[Edge Sensors]</code>) or label text (<code>[Edge Sensors]</code>). Yumia automatically links edges and preserves custom node modifiers (<code>variant="accent"</code>) across the entire graph.</p>

      <h2>PlantUML Sequence Diagrams (<code>sequence</code> / <code>:::sequence</code>)</h2>
      <p>Model distributed communication, authentication protocols, and microservice handshakes with lifelines, actor figurines, dashed return arrows, and floating note callouts. Renders to crisp SVG in HTML, vector lines in PDF, and native OpenXML shapes in PowerPoint:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DSL</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>sequence title="OAuth 2.0 PKCE Handshake Protocol"
  actor User as "Mobile User"
  participant App as "Native Client"
  participant Auth as "Identity Authority"
  database DB as "Token Vault"

  User -> App: Tap Login with SSO
  App -> Auth: /oauth/authorize (code_challenge)
  Auth -> User: Render Consent Screen
  User -> Auth: Grant Permissions
  Auth --> App: Authorization Code
  App -> Auth: /oauth/token (code_verifier)
  Auth -> DB: Verify Nonce & Issue Tokens
  Auth --> App: Access Token + JWT Proof
  note over Auth: Token expiration window: 3600s</code></pre>
      </div>

      <h2>PlantUML Class Diagrams (<code>class</code> / <code>:::class</code>)</h2>
      <p>Model domain architectures, object-oriented contracts, and system hierarchies with interface/abstract stereotypes, member visibility (<code>+</code> public, <code>-</code> private, <code>#</code> protected, <code>~</code> package), and standard UML relationships:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DSL</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>class title="Distributed Processing Engine Architecture"
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
  DispatchEngine --> INeuralKernel : orchestrates</code></pre>
      </div>

      <h2>Advanced Analytical Charts</h2>
      <p>Yumia provides cutting-edge analytical visual primitives that scale cleanly across PDF, PPTX, and HTML:</p>

      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-spider"></i></div>
          <h3>Radar Charts (<code>type="radar"</code>)</h3>
          <p>Multi-axis concentric polygonal web comparing capability benchmarks across 3 or more dimensions.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-gauge-high"></i></div>
          <h3>SLA Gauges (<code>type="gauge"</code>)</h3>
          <p>180° circular speedometer progress meters showing uptime, SLA targets, and KPI fulfillment percentages.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-chart-area"></i></div>
          <h3>Area Plots (<code>type="area"</code>)</h3>
          <p>Filled gradient baseline curves showcasing continuous ingestion volume, bandwidth, and resource telemetry over time.</p>
        </div>
      </div>
    `,
  },
  {
    id: 'components-macros',
    title: 'Components, Macros & Data-Binding',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-cube',
    lead: 'Build reusable visual macros and bind slide decks dynamically to JSON, CSV, or live arrays.',
    content: `
      <h2>Visual Macros & Reusable Components</h2>
      <p>Stop repeating repetitive cards and layout boilerplate. Define reusable visual components at the top of your document and instantiate them cleanly with parameters:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DSL</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code># Declare a reusable KPI Macro
component ResearchPill title, description, metricVal, status
  card title="{{title}}" variant="{{status}}"
    metric "{{metricVal}}" label="Measured Benchmark" variant="{{status}}"
    text "{{description}}"

slide "Benchmark Results"
  grid columns=2 gap=20
    ResearchPill "Inference Latency", "Sub-millisecond p99 reduction under load.", "1.42ms", "success"
    ResearchPill "Throughput Capacity", "Peak distributed operations sustained.", "450k op/s", "accent"</code></pre>
      </div>

      <h2>Data-Binding & Iterative Slides (<code>each</code>)</h2>
      <p>Generate hundreds of consistent, customized client decks, financial summaries, or team reports from external data feeds using the <code>each</code> directive:</p>

      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA DATA BINDING</span><button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div>
        <pre><code>slide "Cluster Performance: {{region}}" each="regions"
  heading "Telemetry for Data Center: {{region}}"
  
  grid columns=3 gap=20
    metric "{{uptime}}" label="SLA Uptime" variant="success"
    metric "{{latency}}" label="P99 Response" variant="primary"
    metric "{{nodes}}" label="Active Worker Nodes" variant="accent"</code></pre>
      </div>
    `,
  },
  {
    id: 'themes-styling',
    title: 'Themes & Design Tokens',
    category: 'Language & Syntax',
    icon: 'fa-solid fa-palette',
    lead: 'Design token architecture, built-in themes, and custom theme authoring.',
    content: `
      <h2>Built-in Themes</h2>
      <p>Yumia ships with production-grade themes calibrated for contrast, typography rhythm, and brand tone:</p>

      <div class="feature-grid">
        <div class="feature-card">
          <h3><code>corporate</code></h3>
          <p>Crisp slate, cobalt blue, and emerald accents. Optimized for executive presentations, board decks, and quarterly reviews.</p>
        </div>
        <div class="feature-card">
          <h3><code>cyberpunk</code></h3>
          <p>Deep abyss black, neon magenta (<code>#FF2E88</code>), and electric cyan (<code>#00F0FF</code>). Designed for tech keynotes and developer talks.</p>
        </div>
        <div class="feature-card">
          <h3><code>terminal</code></h3>
          <p>Monochrome matrix green and monospace typography. Ideal for infrastructure reports and DevOps audits.</p>
        </div>
        <div class="feature-card">
          <h3><code>academic</code></h3>
          <p>Cream/ivory canvas, crimson headers, and high-contrast serif typography for scientific papers, theses, and research summaries.</p>
        </div>
        <div class="feature-card">
          <h3><code>neo-brutalist</code></h3>
          <p>Vibrant high-contrast yellow (<code>#FFE600</code>), bold 3px black borders, stark geometric cards, and high-impact shadows.</p>
        </div>
        <div class="feature-card">
          <h3><code>luxury</code></h3>
          <p>Royal obsidian black (<code>#0B0C10</code>), brushed gold (<code>#D4AF37</code>), and champagne accents for prestige keynotes and luxury brands.</p>
        </div>
        <div class="feature-card">
          <h3><code>monokai</code></h3>
          <p>Legendary code editor dark olive (<code>#272822</code>), neon green (<code>#A6E22E</code>), hot pink (<code>#F92672</code>), and electric cyan.</p>
        </div>
        <div class="feature-card">
          <h3><code>solarized-dark</code></h3>
          <p>Classic Ethan Schoonover palette: deep teal (<code>#002B36</code>), cyan (<code>#2AA198</code>), and soft cream for perfect ergonomic reading.</p>
        </div>
        <div class="feature-card">
          <h3><code>nebula</code></h3>
          <p>Deep cosmos purple (<code>#0A0915</code>), radiant violet (<code>#8B5CF6</code>), and sky blue (<code>#38BDF8</code>) with stellar glow effects.</p>
        </div>
      </div>

      <h2>Theme Switching Example</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">YUMIA</span></div>
        <pre><code># Change theme by setting a single directive:
document "Security Report"
  theme "academic"  # Change to "corporate", "cyberpunk", or "terminal" instantly</code></pre>
      </div>
    `,
  },
  {
    id: 'cli-reference',
    title: 'CLI & Tooling Reference',
    category: 'Compiler & Tooling',
    icon: 'fa-solid fa-terminal',
    lead: 'Complete documentation for all commands in the Yumia CLI toolchain.',
    content: `
      <h2>CLI Commands Overview</h2>
      
      <div class="docs-table-wrapper">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Usage</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>check</code></td>
              <td><code>yumia check &lt;file&gt; [--optimize]</code></td>
              <td>Runs design audit, computes Visual Quality Score (0–100), and validates contrast</td>
            </tr>
            <tr>
              <td><code>explain</code></td>
              <td><code>yumia explain &lt;file&gt;</code></td>
              <td>Breaks down document composition, typography, density, safe-area, and rhythm</td>
            </tr>
            <tr>
              <td><code>dev</code></td>
              <td><code>yumia dev &lt;file&gt; [--port 3000] [--open]</code></td>
              <td>Starts instant live-reload dev server with embedded DevTools/Inspector</td>
            </tr>
            <tr>
              <td><code>build</code></td>
              <td><code>yumia build &lt;file&gt; [--format pptx|pdf|html|all]</code></td>
              <td>Compiles presentation to native editable PPTX, vector PDF, or HTML5</td>
            </tr>
            <tr>
              <td><code>lint</code></td>
              <td><code>yumia lint &lt;file&gt; [--strict]</code></td>
              <td>Analyzes slide layout overflows, empty elements, and accessibility</td>
            </tr>
            <tr>
              <td><code>validate</code></td>
              <td><code>yumia validate &lt;file&gt; [--json]</code></td>
              <td>Validates grammar syntax and structural AST integrity</td>
            </tr>
            <tr>
              <td><code>inspect</code></td>
              <td><code>yumia inspect &lt;file&gt; [--layout]</code></td>
              <td>Outputs parsed AST nodes or computed geometric bounding box coordinates</td>
            </tr>
            <tr>
              <td><code>schema</code></td>
              <td><code>yumia schema</code></td>
              <td>Outputs canonical JSON schema for LLMs and generative AI prompts</td>
            </tr>
            <tr>
              <td><code>deploy</code></td>
              <td><code>yumia deploy &lt;file&gt; [--provider vercel|gh-pages]</code></td>
              <td>Exports ready-to-deploy static assets with routing configuration</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>1. yumia check</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">BASH</span></div>
        <pre><code>yumia check presentation.yumia --optimize</code></pre>
      </div>

      <h2>2. yumia explain</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">BASH</span></div>
        <pre><code>yumia explain presentation.yumia</code></pre>
      </div>
    `,
  },
  {
    id: 'design-intelligence',
    title: 'Design Intelligence & Auditing',
    category: 'Compiler & Tooling',
    icon: 'fa-solid fa-chart-line',
    lead: 'Automated cognitive density, WCAG AAA contrast, and composition rhythm diagnostics.',
    content: `
      <h2>The Quality Engine</h2>
      <p>Yumia is not just a layout renderer; it is a <strong>design-aware compiler</strong> that evaluates documents against professional presentation design standards:</p>

      <ul>
        <li><strong>WCAG 2.1 Contrast (YUM010):</strong> Verifies text against background colors to ensure AA (4.5:1) and AAA (7.0:1) accessibility.</li>
        <li><strong>Information Density (YUM004):</strong> Flags slides exceeding cognitive limits (&gt;7 list items or &gt;120 words per slide).</li>
        <li><strong>Safe Area Compliance:</strong> Enforces margin buffers preventing edge clipping on displays and print.</li>
        <li><strong>Composition Rhythm:</strong> Detects repetitive slide layouts (e.g. 3 consecutive card grids) and suggests visual breaks.</li>
      </ul>

      <h2>Visual Quality Score (0–100)</h2>
      <p>The compiler computes a normalized score reflecting design polish:</p>

      <div class="callout tip">
        <div class="callout-title"><i class="fa-solid fa-bullseye" style="color: var(--yumia-success); margin-right: 0.4rem;"></i> Target Score: 90+</div>
        <p>A score above 90 guarantees balanced hierarchy, high-contrast readability, and optimal information density.</p>
      </div>
    `,
  },
  {
    id: 'ai-workflows',
    title: 'AI & LLM Integration',
    category: 'Ecosystem & Workflows',
    icon: 'fa-solid fa-microchip',
    lead: 'Deterministic generation architecture designed specifically for AI models.',
    content: `
      <h2>Why Yumia Outperforms Markdown & HTML for LLMs</h2>
      <p>Generating presentations with AI via Markdown or HTML frequently fails due to:</p>
      <ul>
        <li><strong>Unclosed HTML Tags:</strong> Corrupted nested <code>&lt;div&gt;</code> tags break page rendering.</li>
        <li><strong>CSS Hallucinations:</strong> LLMs invent fragile CSS properties that break responsive viewports.</li>
        <li><strong>Zero Semantic Feedback:</strong> Models cannot verify if generated slides will overflow.</li>
      </ul>

      <h2>The Deterministic Yumia Solution</h2>
      <ol>
        <li><strong>Indentation-Based Grammar:</strong> Strict whitespace grammar guarantees valid AST creation.</li>
        <li><strong>Intent Primitives:</strong> The model outputs <code>metric "$2.4M" label="Revenue" trend="up"</code>, leaving layout geometry to the compiler.</li>
        <li><strong>JSON Schema:</strong> Run <code>yumia schema</code> to embed the machine-readable grammar into agent prompts.</li>
        <li><strong>Automated Agent Loops:</strong> AI agents run <code>yumia check --optimize --json</code> to auto-correct slide defects programmatically.</li>
      </ol>
    `,
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions (FAQ)',
    category: 'Ecosystem & Workflows',
    icon: 'fa-solid fa-circle-question',
    lead: 'Answers to common questions about Yumia, its architecture, and comparison with other tools.',
    content: `
      <h2>What is Yumia?</h2>
      <p><strong>Yumia</strong> is a declarative programming language and design compiler designed by <strong>Biagio Scaglia</strong> for creating structured presentations and visual documents. It translates high-level communicative intent (<code>hero</code>, <code>metric</code>, <code>compare</code>, <code>timeline</code>, <code>card</code>, <code>chart</code>, <code>diagram</code>) into native editable PowerPoint (.pptx), vector PDF, and interactive HTML5 slides.</p>

      <h2>Who created Yumia?</h2>
      <p>Yumia was created and architected by <strong>Biagio Scaglia</strong> as an open-source visual document compiler and ecosystem.</p>

      <h2>How does Yumia differ from PowerPoint, Canva, Mermaid, Marp, or Slidev?</h2>
      <p>Traditional tools force you into compromises:</p>
      <ul>
        <li><strong>PowerPoint / Canva:</strong> GUI tools where geometry is positioned manually with pixel coordinates. Difficult to automate, version with Git, or generate programmatically.</li>
        <li><strong>Mermaid / PlantUML:</strong> Great for diagramming, but export flat raster PNGs or rigid HTML embeds without native PowerPoint vector shape generation.</li>
        <li><strong>Marp / Slidev:</strong> Markdown slide engines that export flat rasterized screenshot images when generating PowerPoint files.</li>
        <li><strong>Yumia:</strong> A true <em>Design Compiler</em>. It uses pure semantic ASTs and compiles into <strong>100% native OpenXML vector shapes, editable text frames, Microsoft charts, and Sugiyama-layered architecture flowcharts</strong>.</li>
      </ul>

      <h2>What CLI commands are available?</h2>
      <p>The Yumia CLI includes: <code>yumia check --optimize</code> (design audit & visual quality score), <code>yumia explain</code> (rhythm and composition breakdown), <code>yumia dev</code> (live-reload server with DevTools inspector), <code>yumia build</code> (multi-target compilation), <code>yumia lint</code>, <code>yumia validate</code>, <code>yumia schema</code>, and <code>yumia deploy</code>.</p>

      <h2>How do AI models generate Yumia documents?</h2>
      <p>AI models can use Yumia's indentation-based syntax (<code>.yumia</code>) and JSON Schema (<code>yumia schema</code>) to generate documents with zero unclosed HTML tags and zero CSS hallucinations, verifying results automatically via <code>yumia check --json</code>.</p>
    `,
  },
];

export const PLAYGROUND_EXAMPLES = {
  corporate: `document "Executive Strategy Deck"
  theme "corporate"
  aspectRatio "16:9"

slide "Revenue & Growth"
  hero title="Hyper-Growth Phase" subtitle="ARR beats quarterly target by 42%" badge="Q4 Audit" align="center"

  grid columns=3 gap=20
    metric "$24.8M" label="ARR Run-Rate" diff="+142% YoY" variant="success" trend="up"
    metric "118%" label="Net Retention" diff="+4%" variant="primary" trend="up"
    metric "9.2x" label="LTV / CAC" diff="+1.8x" variant="accent" trend="up"

  chart type="bar" title="Quarterly ARR ($M)" labels="Q1,Q2,Q3,Q4" data="12.4,15.8,19.2,24.8"`,

  academic: `document "Quantum Neural Architecture & Distributed Systems"
  theme "academic"
  author "Biagio Scaglia"
  aspectRatio "16:9"

slide "System Topology & Architecture"
  heading "Vector-Compiled Neural Processing Pipeline"
  
  diagram type="flow" direction="LR" title="Distributed Ingestion, Inference & Vector Storage"
    [Edge Sensors] -> [Ingestion Broker] -[TLS 1.3]-> [Neural Dispatcher]
    [Neural Dispatcher] -[gRPC Streaming]-> [Quantum Tensor Cores] -> [(Vector Knowledge Base)]
    [Quantum Tensor Cores] -[Hot Cache]-> [(Redis Semantic Cache)]
    node qtc label="Quantum Tensor Cores" variant="accent"
    node vkb label="Vector Knowledge Base" shape="database" variant="primary"
    node cache label="Redis Semantic Cache" shape="database" variant="success"`,

  cyberpunk: `document "Next-Gen Cyber Protocol"
  theme "cyberpunk"
  aspectRatio "16:9"

slide "Autonomous Security Matrix"
  heading "Zero-Trust Mesh Architecture"
  badge "v2.4 Kernel" variant="accent"

  grid columns=3 gap=20
    card title="Neural Firewall" variant="primary"
      text "Sub-millisecond packet filtering with automated anomaly mitigation."
    card title="Quantum Crypt" variant="success"
      text "Lattice-based encryption resistant to post-quantum decryption attacks."
    card title="Distributed Mesh" variant="accent"
      text "Decentralized consensus across 10,000 independent edge nodes."`,

  terminal: `document "System Diagnostic Report"
  theme "terminal"
  aspectRatio "16:9"

slide "Kernel Performance"
  callout variant="info" title="System Status: Healthy"
    text "All 64 compute clusters reporting zero dropped frames."

  grid columns=3 gap=20
    metric "0.4ms" label="Avg IO Latency" diff="-60%" variant="primary"
    metric "99.999%" label="Uptime SLA" diff="Optimal" variant="success"
    metric "100GB/s" label="Backplane Bus" diff="Max" variant="accent"`,
};
