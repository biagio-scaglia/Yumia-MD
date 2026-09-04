---
title: YumiaMD
subtitle: Next-Gen Markdown Presentation Language & Compiler
author: Biagio Scaglia
theme: cyberpunk
aspectRatio: '16:9'
---

# YumiaMD Presentation Engine

Presentation authoring designed for humans and AI agents.

Author in clean Markdown. Compile to native editable PowerPoint, vector PDF, and interactive HTML5.

:::notes
Benvenuti allo showcase interattivo di YumiaMD!
Questa è la vista relatore sincronizzata in tempo reale: puoi vedere il timer, l'anteprima della slide successiva e queste note.
:::

---

# 🚀 Live Interactive Presentation Engine

:::columns ratios="50:50"

:::column
:::card Keyboard & Presenter Controls variant="primary"

- **Frecce / Spazio**: Navigazione slide fluida
- **[ S ] Tasto Speaker**: Apre questa Speaker View in finestra separata
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
  :::
  :::

:::

:::notes
Premi il tasto 'O' o 'ESC' per testare la griglia di panoramica slide, oppure 'S' per aprire la finestra separata del relatore sincronizzata con BroadcastChannel.
:::

---

# 📊 Compiler Performance & Benchmarks

:::columns ratios="33:33:34"

:::column
:::metric value="14ms" label="Compile Latency" change="-45% vs AST" variant="success"
:::
:::

:::column
:::metric value="100%" label="Native Objects" change="Zero raster" variant="primary"
:::
:::

:::column
:::metric value="3 Formats" label="PPTX · PDF · HTML" change="Universal" variant="info"
:::
:::

:::

:::card Architecture & Reliability variant="info"

- **Deterministic Box Model**: Calcolo esatto delle coordinate geometriche per evitare overflow
- **Linter Integrato**: Controllo automatico di leggibilità, contrasto e accessibilità (`yumia lint`)
  :::

:::notes
Tutti i componenti visivi (metriche, card, colonne, tabelle) sono renderizzati come oggetti vettoriali nativi sia in PPTX che in PDF e con variabili CSS dinamiche in HTML5.
:::

---

# 🎨 6 Temi Nativi & Personalizzazione

:::columns ratios="50:50"

:::column
:::card Built-in Themes variant="primary"

- `cyberpunk`: Neon futuristico ad alto contrasto (Attivo)
- `minimal`: Tipografia pulita in stile editoriale
- `corporate`: Tonalità enterprise affidabili
- `terminal`: Look hacker monocromatico & monospace
- `academic`: Tipografia serif adatta a paper e lezioni
- `default`: Palette moderna bilanciata
  :::
  :::

:::column
:::card Custom Colors on the Fly variant="warning"
Personalizza qualsiasi colore direttamente dalla riga di comando:

```bash
yumia dev presentation.yumia.md \
  --bg "#0B0B12" \
  --primary "#FF2E88" \
  --accent "#00F0FF"
```

:::
:::

:::

:::notes
I temi sono completamente estendibili nel frontmatter YAML o tramite flag CLI per rispettare le linee guida di qualsiasi brand.
:::

---

# ⚔️ Tabella Comparativa

| Funzionalità            | YumiaMD                             | Tool Markdown Legacy       | PowerPoint / Keynote      |
| :---------------------- | :---------------------------------- | :------------------------- | :------------------------ |
| **Formato Sorgente**    | Plain Markdown (`.yumia.md`)        | HTML / CSS Markdown        | File binario proprietario |
| **Output PowerPoint**   | **Oggetti Vettoriali Modificabili** | Screenshot raster sgranati | Oggetti nativi            |
| **Output PDF**          | **Vettoriale Pixel-Perfect**        | Export da browser          | Export nativo             |
| **Live Dev Server**     | **Hot-Reload + Speaker View**       | Web preview base           | Nessuno                   |
| **Git / AI Automation** | **100% Versionabile & Schema JSON** | Parziale                   | Ostile a Git e diff       |

:::notes
Il principio fondamentale di YumiaMD è il 'Native Object Principle': non creare mai screenshot statici quando si può generare un file PowerPoint nativo con forme, testi e tabelle cliccabili.
:::

---

# 🤖 API & Integrazione per Sviluppatori e Agenti AI

:::card Utilizzo Programmabile in Node.js / TypeScript variant="info"

```typescript
import { YumiaCompiler, PptxRenderer, PdfRenderer, HtmlRenderer } from 'yumiamd';

const compiler = new YumiaCompiler();

// Compila in PowerPoint nativo (.pptx)
const pptx = await compiler.compile(source, new PptxRenderer());

// Compila in PDF vettoriale (.pdf)
const pdf = await compiler.compile(source, new PdfRenderer());

// Compila in Web Deck interattivo (.html)
const html = await compiler.compile(source, new HtmlRenderer());
```

:::

> "Author in Markdown. Present with perfection. Integrate with everything."

:::notes
Grazie a `yumia schema`, gli agenti LLM possono generare presentazioni strutturate prive di errori di sintassi.
:::
