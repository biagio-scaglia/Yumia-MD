---
title: YumiaMD Ultimate Showcase
subtitle: Universal Compiler for Native PowerPoint, Vector PDF & Web Decks
author: Biagio Scaglia & YumiaMD Team
theme: cyberpunk
aspectRatio: '16:9'
transition: push
embedFonts: true
watermark: 'YumiaMD Engine'
---

# YumiaMD Presentation Engine

Universal Presentation Engine designed for Humans & AI Agents.

:::badge text="v0.1.20" variant="primary" :::
:::badge text="Enterprise Ready" variant="success" :::
:::badge text="Full Multi-Format" variant="info" :::
:::badge text="Zero-Config" variant="warning" :::

Author in pure Markdown. Compile to native PowerPoint `.pptx`, vector `.pdf`, and interactive `.html`.

:::notes
Benvenuti alla presentazione d'esempio completa di YumiaMD!
Questo slide deck mette in mostra ogni singolo componente ed elemento supportato dal compilatore:
Table of Contents, Section Dividers, Cards, Columns, Metric KPI, Timelines, Comparisons, Charts, Code Highlighting, Math LaTeX, Diagrammi Mermaid, Tabelle e Note del relatore.
:::

---

:::toc "📑 Indice dei Contenuti"

1. Esperienza & Sviluppo - Speaker view, stampa diretta e controlli live
2. Architettura & Metriche - Layout geometrico deterministico e KPI
3. Codice & Line Highlighting - Evidenziazione selettiva del codice sorgente
4. Dati, Formule & Flussi - KaTeX, diagrammi Mermaid, grafici e roadmap
   :::

:::notes
L'indice della presentazione è generato con la direttiva :::toc, ideale per deck lunghi ed enterprise.
:::

---

:::section "Parte 1: Sviluppatore & Speaker Experience"
subtitle="Controlli per il relatore, hot-reload e stampa diretta dal browser"
number="01"
:::

---

# 🚀 Speaker View, Stampa PDF & Controlli

:::transition type="fade" duration="0.4s"

:::columns ratios="50:50"

:::column
:::card Controlli per il Relatore variant="primary"

- **Frecce / Spazio**: Navigazione slide fluida e transizioni animate
- **[ S ] Tasto Speaker**: Apre la Speaker View sincronizzata in finestra separata
- **[ P / 🖨️ ] Stampa & PDF**: Esporta in PDF orizzontale A4/16:9 con `@media print`
- **[ ESC / O ] Panoramica**: Visualizza la griglia panoramica di tutte le slide
- **[ F ] Fullscreen**: Modalità a tutto schermo per le conferenze
- **[ N ] Note**: Mostra/nasconde il cassetto note del relatore
  :::
  :::

:::column
:::card Hot-Reload & Dev Server variant="success"

- **Zero-Config Dev Server**: Powered by native `node:http` & SSE
- **Instant Hot-Reload**: Modifica il file `.yumia.md` e visualizza i cambi in tempo reale
- **State Preservation**: Mantiene la posizione della slide attiva
- **Zero Dipendenze Esterne**: Compilatore autonomo, ultra-veloce e robusto
  :::
  :::

:::

:::notes
Premi 'P' o il pulsante della stampante nella toolbar per generare all'istante il PDF ad alta risoluzione.
:::

---

:::section "Parte 2: Architettura, Metriche & Prestazioni"
subtitle="Throughput di compilazione e metriche prestazionali a confronto"
number="02"
:::

---

# 📊 Metriche di Prestazione & Throughput

:::transition type="slide" duration="0.5s"

:::columns ratios="33:33:34"

:::column
:::metric "250+" label="Slide / Secondo" diff="+320%" trend="up"
Throughput di compilazione ultra-veloce su multi-core
:::
:::

:::column
:::metric "< 15ms" label="Latenza Hot-Reload" diff="-65%" trend="up"
Aggiornamento istantaneo del browser via Server-Sent Events
:::
:::

:::column
:::metric "100%" label="Fedeltà PPTX Nativo" diff="+100%" trend="up"
Forme vettoriali, tabelle e grafici completamente editabili
:::
:::

:::

:::notes
I blocchi metriche consentono di enfatizzare i KPI chiave con calcolo del trend visivo.
:::

---

# ⚖️ Confronto Architetturale: YumiaMD vs Strumenti Tradizionali

:::transition type="fade" duration="0.4s"

:::compare
:::column

### ❌ Strumenti Tradizionali (PPTX / Web)

- 🐢 Creazione manuale e dispendiosa tramite GUI
- 🔒 Lock-in proprietario e file binari non versionabili
- 💥 Difficile collaborazione con Git e conflitti continui
- 📉 Nessuna integrazione nativa con agenti AI
  :::

:::column

### 🚀 YumiaMD Modern Engine

- ⚡ Sintassi Markdown pulita, espressiva e semantica
- 🌐 Multi-formato nativo: PPTX editabile, PDF e Web Deck
- 🐙 Perfetto per Git, versioning e CI/CD automatizzata
- 🤖 API progettata da zero per interazione con agenti AI
  :::
  :::

:::notes
La direttiva :::compare genera un layout a confronto con pill centrale 'VS' e stili coordinati.
:::

---

:::section "Parte 3: Codice Sorgente & Line Highlighting"
subtitle="Evidenziazione selettiva delle righe per presentazioni tecniche"
number="03"
:::

---

# 💻 Code Highlighting con Focus di Riga

:::transition type="fade" duration="0.4s"

Nelle presentazioni tecniche per sviluppatori, guidare l'attenzione sulle righe rilevanti è fondamentale:

:::code lang="typescript" highlight="3,7-9"
import { compile, resolveTheme } from 'yumiamd';

// 1. Carica la configurazione e il tema selezionato
const theme = resolveTheme('cyberpunk');
const markdown = await readFile('./presentation.yumia.md', 'utf-8');

// 2. Compila contemporaneamente nei 3 formati universali
const pptxBuffer = await compile(markdown, { format: 'pptx', theme });
const pdfBuffer = await compile(markdown, { format: 'pdf', theme });
const htmlOutput = await compile(markdown, { format: 'html', theme });

console.log('Compilazione multi-formato completata in 42ms!');
:::

:::notes
Il line highlighting applica opacità alle righe secondarie e illumina quelle evidenziate con numerazione riga.
:::

---

:::section "Parte 4: Dati, Formule, Diagrammi & Roadmap"
subtitle="Equazioni LaTeX, diagrammi di flusso Mermaid e tabelle dati"
number="04"
:::

---

# 📐 Equazioni Matematiche KaTeX

:::transition type="wipe" duration="0.5s"

Supporto integrato per formule matematiche KaTeX complesse:

:::math
i \hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t) = \left[ -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r}, t) \right] \Psi(\mathbf{r}, t)
:::

$$
\mathcal{L}_{GAN} = \mathbb{E}_{x \sim p_{\text{data}}(x)}[\log D(x)] + \mathbb{E}_{z \sim p_z(z)}[\log(1 - D(G(z)))]
$$

:::card Ottimizzazione & Stabilità Numerica variant="info"
I modelli di simulazione quantistica e neurale vengono compilati con rendering ad alta risoluzione sia sul Web che nei documenti Office PowerPoint e PDF vettoriali.
:::

:::notes
KaTeX è supportato sia con la direttiva :::math sia con i delimitatori standard $$ formula $$.
:::

---

# 🔀 Diagrammi di Flusso & Architettura Mermaid

:::transition type="fade" duration="0.4s"

Generazione automatica di grafi e diagrammi architetturali via sintassi Mermaid:

:::mermaid
graph LR
MD["📄 File Markdown (.yumia.md)"] --> Parser["⚙️ Lexer & AST Parser"]
Parser --> Layout["📐 Geometric Layout Engine"]
Layout --> PPTX["📊 PowerPoint (.pptx)"]
Layout --> PDF["📑 Vector PDF (.pdf)"]
Layout --> HTML["🌐 Web Deck (.html)"]

    style MD fill:#1a1b26,stroke:#7aa2f7,stroke-width:2px,color:#fff
    style Parser fill:#1a1b26,stroke:#bb9af7,stroke-width:2px,color:#fff
    style Layout fill:#1a1b26,stroke:#7dcfff,stroke-width:2px,color:#fff
    style PPTX fill:#1a1b26,stroke:#9ece6a,stroke-width:2px,color:#fff
    style PDF fill:#1a1b26,stroke:#f7768e,stroke-width:2px,color:#fff
    style HTML fill:#1a1b26,stroke:#e0af68,stroke-width:2px,color:#fff

:::

:::notes
I diagrammi Mermaid vengono renderizzati con supporto SVG e palette coerente con il tema corrente.
:::

---

# 📈 Analisi Dati & Grafici Interattivi

:::transition type="fade" duration="0.4s"

:::columns ratios="50:50"

:::column
:::chart type="bar" title="Throughput di Compilazione (Slide/s)"

- Q1 2025: 45
- Q2 2025: 98
- Q3 2025: 180
- Q4 2025: 265
  :::
  :::

:::column
:::chart type="pie" title="Distribuzione Output Formati"

- PowerPoint PPTX: 45%
- Interactive HTML5: 35%
- Vector PDF: 20%
  :::
  :::

:::

:::notes
I grafici supportano bar chart, line chart, pie chart e doughnut chart sia in HTML che come oggetti grafici nativi in PPTX.
:::

---

# 📋 Matrice di Compatibilità & Funzionalità

:::transition type="fade" duration="0.4s"

| Funzionalità              |         HTML5 Viewer         |      PowerPoint PPTX       |      Vector PDF      |
| :------------------------ | :--------------------------: | :------------------------: | :------------------: |
| **Line Highlighting**     |    ✅ Con Focus & Opacità    | ✅ Linee Formattate Native | ✅ Bande Evidenziate |
| **Section & TOC**         |        ✅ Interattivo        | ✅ Layout a Griglia & Card | ✅ Pagine Divisorie  |
| **Diagrammi Mermaid**     |      ✅ SVG Interattivo      |  ✅ Vettoriale / Immagine  |    ✅ Vettoriale     |
| **Formule KaTeX**         |     ✅ KaTeX HTML/MathML     |   ✅ MathML / Vettoriale   |  ✅ Rendering KaTeX  |
| **Speaker View & Stampa** | ✅ Browser Print + Live Sync |   ➖ N/A (Tool Esterno)    |  ✅ Stampa Diretta   |

:::quote author="YumiaMD Engineering Team"
L'obiettivo è rendere ogni presentazione un'opera d'arte tecnica, accessibile da riga di comando e integrabile in qualsiasi pipeline CI/CD.
:::

---

# 🗺️ Roadmap & Traguardi 2025-2026

:::transition type="slide" duration="0.5s"

:::timeline

- **Q1 2025** | Motore AST Deterministico: Definizione del layout geometrico e parser semantico
- **Q2 2025** | Multi-Formato Universale: Supporto nativo contemporaneo per PPTX, PDF e HTML5
- **Q3 2025** | Speaker View & Dev Server: Hot-reload sincrono via SSE e strumenti per il relatore
- **Q4 2025** | Code Highlighting & TOC: Gestione di presentazioni lunghe con sezioni e highlight di riga
- **2026+** | AI Agentic Orchestration: Generazione ed editing autonomo di slide deck con agenti AI
  :::

:::notes
La timeline visualizza milestone con nodi concentrici e connettori responsive.
:::

---

# 🎉 Grazie per l'Attenzione!

Inizia subito a costruire presentazioni sbalorditive con **YumiaMD**.

:::columns ratios="50:50"

:::column
:::card Risorse & Documentazione variant="primary"

- 📦 **NPM**: `npm install yumiamd`
- 🐙 **GitHub**: `github.com/biagio-scaglia/Yumia-MD`
- 📚 **Docs**: Documentazione completa e guide
  :::
  :::

:::column
:::card Contatti & Community variant="success"

- 💬 **Discord**: Community sviluppatori
- 🐦 **Social**: Aggiornamenti e release notes
- 🚀 **CLI**: `npx yumiamd dev presentation.yumia.md`
  :::
  :::

:::

:::quote author="Biagio Scaglia"
Presentations as Code. Fast, Beautiful, and Everywhere.
:::
