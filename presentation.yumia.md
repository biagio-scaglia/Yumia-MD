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

:::badge text="v0.1.20" variant="primary" :::
:::badge text="Enterprise Ready" variant="success" :::
:::badge text="Open Source" variant="info" :::

Author in pure Markdown. Compile to native editable PowerPoint, vector PDF, and interactive HTML5.

:::notes
Benvenuti alla presentazione ufficiale di YumiaMD v0.1.20!
Questa presentazione mostra le ultime novità del compilatore: Table of Contents, Section Dividers, Code Line Highlighting, Stampa PDF diretta da browser e controlli per il relatore.
:::

---

:::toc "📑 Indice della Presentazione"

1. Esperienza Sviluppatore & Speaker View - Controlli live e Dev Server
2. Architettura & Metriche - Layout geometrico e throughput
3. Line Highlighting & Codice - Focus dettagliato sul codice sorgente
4. Dati, Formule & Flussi - KaTeX, diagrammi Mermaid e grafici
   :::

:::notes
L'indice viene generato automaticamente oppure specificato con elenchi numerati ordinati.
:::

---

:::section "Parte 1: Sviluppatore & Relatore" subtitle="Hot-reload, Speaker View sincrona e Stampa PDF istantanea" number="01"
:::

---

# 🚀 Speaker View, Stampa PDF & Controlli

:::transition type="fade" duration="0.4s"

:::columns ratios="50:50"

:::column
:::card Controlli per il Relatore variant="primary"

- **Frecce / Spazio**: Navigazione slide fluida
- **[ S ] Tasto Speaker**: Apre la Speaker View in finestra separata
- **[ P / 🖨️ ] Stampa & PDF**: Esporta in PDF orizzontale A4/16:9 via browser
- **[ ESC / O ] Panoramica**: Griglia panoramica di tutte le slide
- **[ F ] Fullscreen**: Modalità a schermo intero
- **[ N ] Note**: Mostra/nasconde il cassetto note
  :::
  :::

:::column
:::card Hot-Reload & Dev Server variant="success"

- **Zero-Config Dev Server**: Powered by native `node:http` & SSE
- **Instant Hot-Reload**: Modifica il file `.yumia.md` e guarda il browser aggiornarsi!
- **State Preservation**: Mantiene la posizione della slide corrente
- **Zero Dipendenze Esterne**: Compilatore autonomo ed estremamente veloce
  :::
  :::

:::

:::notes
Premi il tasto 'P' o l'icona della stampante nella toolbar per generare istantaneamente il PDF stampabile ad alta fedeltà.
:::

---

:::section "Parte 2: Code Block con Line Highlighting" subtitle="Evidenziazione selettiva delle righe durante le spiegazioni tecniche" number="02"
:::

---

# 💻 Code Highlighting & Line Focus

:::transition type="fade" duration="0.4s"

Le presentazioni tecniche per sviluppatori richiedono di guidare l'attenzione su righe specifiche di codice:

```typescript {2,5-7}
import { compile } from 'yumiamd';

// Inizializza il compilatore universale
const source = await readFile('./deck.yumia.md', 'utf-8');
const result = await compile(source, {
  format: 'pptx',
  theme: 'cyberpunk',
});

console.log(`Presentazione compilata con successo: ${result.slideCount} slide`);
```

:::notes
In HTML le righe non evidenziate vengono sfumate con un contrasto ottimale, mentre in PowerPoint vengono formattate con numeri di riga e risalto cromatico nativo.
:::

---

:::section "Parte 3: Architettura, Dati & Grafici" subtitle="Layout deterministico a coordinate reali, SVG, KaTeX e Mermaid" number="03"
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
- [Q3 2026] Section & Code | TOC, sezioni divisorie e line highlighting
- [Q4 2026] Enterprise Scale | Deploy automatizzato su GitHub Pages e Vercel con un comando
  :::

:::notes
La timeline mostra chiaramente i traguardi temporali e le fasi di rilascio.
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
