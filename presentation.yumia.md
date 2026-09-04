---
title: 'YumiaMD Presentation Engine'
subtitle: 'Universal Compiler for Native PowerPoint, Vector PDF & Interactive HTML5'
author: 'Biagio Scaglia'
theme: cyberpunk
aspectRatio: '16:9'
transition: push
watermark: 'YumiaMD'
---

# YumiaMD Presentation Engine

Universal presentation compiler designed for humans and AI agents.

:::badge text="v0.1.19" variant="primary" :::
:::badge text="Enterprise Ready" variant="success" :::
:::badge text="Open Source" variant="info" :::

Author in pure Markdown. Compile to native editable PowerPoint, vector PDF, and interactive HTML5.

:::notes
Benvenuti alla presentazione di esempio di YumiaMD!
Questa presentazione mostra tutte le funzionalità del compilatore: layout deterministico a coordinate reali, formule matematiche, grafici nativi, timeline, diagrammi Mermaid e speaker notes.
:::

---

# 🚀 Speaker View & Controlli Interattivi

:::transition type="fade" duration="0.4s"

:::columns ratios="50:50"

:::column
:::card Controlli per il Relatore variant="primary"

- **Frecce / Spazio**: Navigazione slide fluida
- **[ S ] Tasto Speaker**: Apre la Speaker View sincronizzata in finestra separata
- **[ ESC / O ] Panoramica**: Griglia visiva con tutte le slide
- **[ F ] Fullscreen**: Modalità a schermo intero
- **[ N ] Note**: Mostra/nasconde il cassetto note
  :::
  :::

:::column
:::card Hot-Reload & Dev Server variant="success"

- **Zero-Config Dev Server**: Powered by native `node:http` & SSE
- **Instant Hot-Reload**: Modifica questo file `.yumia.md` e guarda il browser aggiornarsi in tempo reale!
- **State Preservation**: Mantiene la posizione della slide corrente
- **Zero Dipendenze Esterne**: Compilatore autonomo ed estremamente veloce
  :::
  :::

:::

:::notes
Premi il tasto 'O' o 'ESC' per testare la griglia di panoramica slide, oppure 'S' per aprire la finestra separata del relatore sincronizzata con BroadcastChannel.
:::

---

# ⚡ Metriche di Prestazione & Throughput

:::transition type="wipe" duration="0.4s"

:::columns ratios="33:33:34"

:::column
:::metric value="2.4ms" label="AST Compile Time" change="-85% latency" variant="success"
:::
:::

:::column
:::metric value="100%" label="Native PPTX Objects" change="Zero raster images" variant="primary"
:::
:::

:::column
:::metric value="600 DPI" label="Vector PDF Fidelity" change="Ultra-crisp typography" variant="info"
:::
:::

:::

:::card Architettura Deterministica ad Alte Prestazioni variant="primary"
La pipeline di YumiaMD calcola coordinate assolute e bounding box geometrici reali, garantendo **zero overflow** di testo e perfetta armonia visiva su qualsiasi schermo o formato.
:::

:::notes
Metriche generate come componenti nativi con varianti di colore personalizzabili da tema.
:::

---

# 📐 Equazioni Matematiche KaTeX & Cambria Math

:::transition type="fade" duration="0.4s"

:::math
i \hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t) = \left[ -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r}, t) \right] \Psi(\mathbf{r}, t)
:::

$$
\mathcal{L}_{\text{total}} = \mathbb{E}_{x \sim p_{\text{data}}}\left[ \log D(x) \right] + \mathbb{E}_{z \sim p_z}\left[ \log(1 - D(G(z))) \right]
$$

:::card Resa Matematica sui Diversi Target variant="info"

- **HTML5**: Rendering client-side KaTeX ad alta risoluzione
- **PowerPoint (.pptx)**: Visualizzazione tipografica Cambria Math ad alto contrasto
- **Vector PDF**: Percorsi vettoriali precisi isolati dai font di sistema
  :::

:::notes
Formule matematiche complesse per paper scientifici e documentazione tecnica.
:::

---

# 📊 Visualizzazione Dati & Grafici Nativi

:::transition type="push" duration="0.4s"

:::columns ratios="50:50"

:::column
:::chart type="bar" title="Adozione Developer (k)" labels="Q1, Q2, Q3, Q4" data="120, 240, 480, 890"
:::
:::

:::column
:::chart type="pie" title="Target di Esportazione (%)" labels="PowerPoint, Vector PDF, HTML5 Web" data="45, 30, 25"
:::
:::

:::

:::notes
In PowerPoint i grafici sono veri oggetti chart nativi modificabili in Excel/PowerPoint. In HTML sono SVG reattivi.
:::

---

# 🏛️ Diagrammi Mermaid & Flussi Architetturali

:::transition type="fade" duration="0.4s"

:::mermaid
graph LR
A[Markdown Source .yumia.md] --> B[@yumiamd/parser]
B --> C[Presentation AST]
C --> D[Deterministic Layout Engine]
D --> E[Native PPTX Generator]
D --> F[Vector PDF Compiler]
D --> G[HTML5 Interactive Deck]
:::

:::notes
Mermaid viene eseguito e renderizzato dinamicamente nel browser e formattato nei documenti offline.
:::

---

# ⚖️ Confronto Architetturale: YumiaMD vs Tool Tradizionali

:::transition type="fade" duration="0.4s"

:::compare left="Tool GUI Tradizionali (PowerPoint, Canva)" right="YumiaMD Modern Toolchain"

- Layout manuale time-consuming
- Nessun version control Git
- Esportazioni PDF o immagini statiche non editabili
- Impossibile integrazione in CI/CD o con agenti AI

:::vs

- Sintassi Markdown pulita e leggibile
- Full version control, PR e diffs con Git
- 100% Oggetti PowerPoint editabili e PDF vettoriali
- AI-Native: generazione immediata via prompt e schema

:::

:::notes
Slide di confronto a 2 colonne ideale per pitch deck e presentazioni aziendali.
:::

---

# 🚀 Roadmap & Timeline di Sviluppo

:::transition type="wipe" duration="0.4s"

:::timeline layout="horizontal"

- [Q1 2026] Core Engine | Parser AST semantico, coordinate reali e layout deterministico
- [Q2 2026] Multi-Format | Supporto simultaneo PowerPoint (.pptx), PDF e HTML5
- [Q3 2026] Math & Template | Equazioni LaTeX e master template aziendali .potx
- [Q4 2026] Enterprise Scale | Deploy automatizzato su GitHub Pages e Vercel con un comando
  :::

:::notes
La timeline mostra chiaramente i traguardi temporali e le fasi di rilascio.
:::

---

# 🎯 Step-by-Step Progressive Reveal

:::transition type="push" duration="0.4s"

:::step

- **1. Inizializzazione Istantanea**: `npx yumiamd init my-deck`
- **2. Live Development**: `yumia dev presentation.yumia.md --open`
- **3. Compilazione PowerPoint**: `yumia build presentation.yumia.md --out dist/deck.pptx`
- **4. Compilazione PDF**: `yumia build presentation.yumia.md --format pdf`
- **5. Deploy Web**: `yumia deploy presentation.yumia.md --provider gh-pages`
  :::

:::notes
Durante la presentazione, i punti compaiono progressivamente ad ogni pressione di tasto o click.
:::

---

# 💡 Inizia Ora con YumiaMD

:::transition type="zoom" duration="0.4s"

:::card Comandi Rapidi da Terminale variant="primary"

```bash
# Avvia il dev server con hot-reload e preview istantanea
yumia dev presentation.yumia.md --open

# Compila tutti i formati
yumia build presentation.yumia.md --out dist/presentation.pptx
yumia build presentation.yumia.md --format pdf --out dist/presentation.pdf
yumia build presentation.yumia.md --format html --out dist/presentation.html
```

:::

> _"Author in Markdown. Present with perfection. Integrate with everything."_

:::notes
Grazie per aver utilizzato YumiaMD!
:::
