/**
 * Yumia Documentation Data Store
 * Complete, authoritative documentation content for the official Yumia Documentation Website.
 * Uses Font Awesome 6 icons (Zero Emojis).
 */

export const DOCS_SECTIONS = [
  {
    id: 'overview',
    title: 'What is Yumia?',
    category: 'Introduction',
    lead: 'A programming language and compiler for visual documents created by Biagio Scaglia.',
    content: `
      <h2>The Core Paradigm Shift</h2>
      <p>Traditional slide tools force you to arrange raw geometry (<code>rectangle</code>, <code>textbox</code>, <code>shape</code>, <code>line</code>). Markdown slide generators simply dump fragile HTML/CSS tags inside slides, creating unmaintainable layouts that cannot export to genuine presentation formats.</p>
      
      <p><strong>Yumia compiles communicative intent into structured visual artifacts.</strong></p>

      <div class="callout tip">
        <div class="callout-title"><i class="fa-solid fa-lightbulb" style="color: var(--yumia-success); margin-right: 0.4rem;"></i> The Mental Model</div>
        <p>Just as <code>HTML ➔ DOM ➔ CSS ➔ Layout ➔ Browser</code> redefined the web, Yumia introduces <code>Yumia Source ➔ Semantic AST ➔ Design System ➔ Composition Engine ➔ Multi-Target Output</code> for visual documents.</p>
      </div>

      <h2>The Compiler Pipeline</h2>
      <div class="code-block">
        <div class="code-header"><span class="code-lang-tag">ARCHITECTURE</span></div>
        <pre><code>CONTENT & COMMUNICATIVE INTENT
            │
            ▼
   YUMIA SEMANTIC AST
            │
            ▼
DESIGN SYSTEM & COMPOSITION ENGINE
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
  PPTX     PDF    HTML5
(OpenXML)(Vector)(DevTools)</code></pre>
      </div>

      <h2>Key Capabilities</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <h4>Intent-First Primitives</h4>
          <p>Express ideas with <code>hero</code>, <code>metric</code>, <code>compare</code>, <code>timeline</code>, <code>card</code>, and <code>chart</code> instead of fragile CSS styles.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-bullseye"></i></div>
          <h4>100% Native PowerPoint</h4>
          <p>Compiles directly to real, fully editable OpenXML PowerPoint shapes, text frames, and Microsoft charts.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-magnifying-glass-chart"></i></div>
          <h4>Design Intelligence</h4>
          <p>Built-in <code>yumia explain</code> and <code>yumia check</code> auditing contrast (WCAG AAA), density, and visual rhythm.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-robot"></i></div>
          <h4>AI-Deterministic</h4>
          <p>Strict indentation grammar and JSON Schema eliminates hallucinated CSS and unclosed HTML tags in LLM pipelines.</p>
        </div>
      </div>
    `,
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    category: 'Introduction',
    lead: 'Get up and running with Yumia in under 30 seconds.',
    content: `
      <h2>Zero-Install Execution</h2>
      <p>You can run Yumia immediately without installing anything via <code>npx</code>:</p>
      
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
    id: 'language-primitives',
    title: 'Visual Primitives',
    category: 'Language Reference',
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
              <td><code>type</code> (<code>bar</code>, <code>line</code>, <code>pie</code>, <code>doughnut</code>), <code>labels</code>, <code>data</code></td>
              <td>PPTX, PDF, HTML</td>
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
    id: 'cli-reference',
    title: 'CLI & Tooling Reference',
    category: 'CLI',
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
              <td><code>yumia build &lt;file&gt; [--format pptx|pdf|html]</code></td>
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
    category: 'Design System',
    lead: 'Automated cognitive density, WCAG AAA contrast, and composition rhythm diagnostics.',
    content: `
      <h2>The Quality Engine</h2>
      <p>Yumia is not just a layout renderer; it is a <strong>design-aware compiler</strong> that evaluates documents against professional presentation design standards:</p>

      <ul>
        <li><strong>WCAG 2.1 Contrast (YUM010):</strong> Verifies text against background colors to ensure AA (4.5:1) and AAA (7.0:1) accessibility.</li>
        <li><strong>Information Density (YUM004):</strong> Flags slides exceeding cognitive limits (&gt;7 list items or &gt;120 words per slide).</li>
        <li><strong>Safe Area Compliance:</strong> Enforces 90px margin buffers preventing edge clipping on displays and print.</li>
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
    category: 'AI Workflows',
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
