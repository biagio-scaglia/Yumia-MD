document "Yumia — Un linguaggio dichiarativo per documenti visivi"
  theme "cyberpunk"
  aspectRatio "16:9"
  author "[Nome e Cognome]"
  watermark "Yumia • Design Compiler"

// Slide 1 — Copertina
slide "Copertina"
  hero title="Yumia" subtitle="Un linguaggio dichiarativo per documenti visivi" tagline="[Classe / Corso] • [Data della presentazione]" badge="Design Compiler" align="center" emphasis="primary"
  text "[Nome e Cognome]" align="center"
  notes
    Benvenuti a questa presentazione su Yumia.
    Oggi esploreremo come Yumia ridefinisce la creazione di presentazioni tecniche introducendo il concetto di Design Compiler: un approccio dichiarativo in cui l'autore descrive l'intento comunicativo e il compilatore genera output multipiattaforma garantiti e coerenti.

// Slide 2 — Il problema
slide "Il problema delle presentazioni tecniche"
  heading "Perché creare slide tecniche è complesso e inefficiente"

  compare left="Approccio Tradizionale (WYSIWYG / Manuale)" right="Problemi & Limiti Strutturali"
    left
      badge "Tool Visuali & Slide Editor" variant="warning"
      text "• Disposizione manuale di box di testo e forme"
      text "• Formattazione incoerente che degrada nel tempo"
      text "• File binari opachi non versionabili con Git"
      text "• Rischio costante di disallineamenti tra formati"
    right
      badge "Attriti di Sviluppo & AI" variant="danger"
      text "• Zero riutilizzabilità tra documentazione e slide"
      text "• Frammentazione tra Markdown, HTML e PPTX"
      text "• Gli LLM faticano a generare layout geometrici stabili"
      text "• Nessun test automatico di qualità visiva"

  notes
    I tool tradizionali come PowerPoint o Canva costringono gli sviluppatori a gestire manualmente pixel, forme e coordinate. Questo genera file binari pesanti e non versionabili con Git.
    Inoltre, quando chiediamo a un'intelligenza artificiale di creare una slide in HTML/CSS grezzo, i risultati visivi sono spesso rotti o disallineati perché il modello non controlla la geometria finale.

// Slide 3 — La soluzione proposta
slide "La soluzione: Il Design Compiler"
  heading "Dall'intento comunicativo alla composizione automatica"

  grid columns=3 gap=16
    card title="Intento vs Geometria" variant="primary" icon="lucide:sparkles"
      text "Non diciamo al computer 'disegna un rettangolo a coordinate (x,y)', ma 'crea una Card per evidenziare una funzionalità'."
    card title="Componenti Semantici" variant="accent" icon="lucide:layout-grid"
      text "Primitive di alto livello: hero, metric, card, grid, compare, timeline, chart e diagram."
    card title="Layout Deterministico" variant="success" icon="lucide:cpu"
      text "Un motore di calcolo automatico distribuisce spazi, gap, contrasti e gerarchie visive senza overflow."

  callout severity="info" title="Cambio di paradigma" icon="lucide:lightbulb"
    Yumia separa radicalmente il contenuto dal rendering visivo: lo sviluppatore scrive la semantica, il compilatore applica il design system.

  notes
    Yumia introduce il concetto di Design Intent. Invece di posizionare pixel a mano, usiamo blocchi semantici come hero, card, compare o chart.
    Il motore di layout si occupa di calcolare spazi, allineamenti e palette cromatiche, garantendo che il risultato finale sia sempre professionale e privo di difetti visivi.

// Slide 4 — Un'unica sorgente, più formati
slide "Un'unica sorgente, più formati"
  heading "Compilazione Multi-Target da una Singola Sorgente"

  diagram type="flow" direction="LR" title="Flusso di Trasformazione Multi-Target"
    [Sorgente Yumia] -> [AST Semantico] -> [Design System] -> [HTML Interattivo]
    [Design System] -> [PowerPoint PPTX]
    [Design System] -> [PDF Vettoriale]
    node [Sorgente Yumia] variant="primary"
    node [AST Semantico] variant="accent"
    node [Design System] variant="warning"
    node [HTML Interattivo] variant="success"
    node [PowerPoint PPTX] variant="info"
    node [PDF Vettoriale] variant="danger"

  callout severity="success" title="Principio Single Source of Truth" icon="lucide:check-circle-2"
    Un unico file di testo (.yumia) compilabile istantaneamente per il web, per presentazioni aziendali modificabili e per la stampa/distribuzione fissa.

  notes
    Con un solo file sorgente possiamo compilare verso tre formati completamente diversi:
    1) HTML interattivo con navigazione e speaker view per presentare direttamente da browser;
    2) PowerPoint con forme native e testo modificabile per i colleghi o clienti;
    3) PDF vettoriale pronto per la stampa o la condivisione formale.
    Nessun bisogno di riscrivere o ricreare le slide da zero.

// Slide 5 — Come funziona l'architettura
slide "Architettura della Pipeline"
  heading "Dalla sintassi al rendering finale: la pipeline a 7 stadi"

  diagram type="flow" direction="LR" title="Pipeline di Compilazione Deterministica"
    [Sorgente DSL] -> [Parser AST] -> [Design Linter] -> [Theme Engine] -> [Layout Engine] -> [Renderer Multipli]
    node [Sorgente DSL] variant="primary"
    node [Parser AST] variant="accent"
    node [Design Linter] variant="warning"
    node [Theme Engine] variant="info"
    node [Layout Engine] variant="primary"
    node [Renderer Multipli] variant="success"

  callout severity="info" title="Pipeline deterministica a passate isolate" icon="lucide:cpu"
    Ogni stadio trasforma il modello dati in modo puro: dal parsing sintattico all'AST, dal controllo qualità al calcolo geometrico e all'emissione su DOM, OpenXML o PDFKit.

  notes
    La pipeline di Yumia si ispira ai compilatori tradizionali:
    1. Il Parser analizza il file sorgente e genera l'AST;
    2. Il Design Linter controlla contrasti, densità e accessibilità;
    3. Il Theme Engine risolve palette, font e icone;
    4. Il Layout Engine calcola bounding box e posizioni in coordinate assolute;
    5. I Renderer emettono il codice nativo per ciascun formato di output.

// Slide 6 — L'AST e il design intent
slide "L'AST e il Design Intent"
  heading "Rappresentazione intermedia del significato e della struttura"

  columns 50:50
    column
      card title="AST: Abstract Syntax Tree" variant="accent" icon="lucide:git-branch"
        text "Struttura dati intermedia ad albero che incapsula il contenuto, la gerarchia logica e i vincoli semantici di presentazione."
        badge "emphasis" variant="primary"
        badge "density" variant="accent"
        badge "hierarchy" variant="warning"
        badge "align" variant="info"
    column
      card title="Componenti Semantici Astratti" variant="primary" icon="lucide:layout-grid"
        text "• Struttura: Hero, Heading, Paragraph, Columns, Grid"
        text "• Dati & Logica: Metric, Card, Compare, Timeline"
        text "• Visuali: Diagram, Sequence, Class, Chart, Table"
        text "• Annotazioni: Badge, Callout, Math, Notes"

  notes
    L'AST non memorizza 'rettangolo blu a x=100 y=200', ma memorizza 'Elemento Card con variante Accent e ruolo primario'.
    Questo disaccoppiamento permette ai renderer di interpretare lo stesso elemento semantico nel modo più efficace per ogni formato di destinazione.

// Slide 7 — Esempio di codice Yumia
slide "Esempio di Codice Native Yumia"
  heading "Sintassi pulita, dichiarativa e basata su indentazione"

  columns 55:45
    column
      code lang="yumia"
        document "Yumia Demo"
          theme "cyberpunk"
          aspectRatio "16:9"

        slide "Yumia in azione"
          hero title="Design Compiler" subtitle="Dall'intento al documento visivo" badge="Demo"

          grid columns=3 gap=20
            metric "1" label="Sorgente"
            metric "3" label="Formati"
            metric "0" label="Layout manuale"
    column
      card title="Caratteristiche del linguaggio" variant="primary"
        text "• Struttura gerarchica pulita basata sull'indentazione"
        text "• Componenti semantici senza CSS a basso livello"
        text "• Nessun tag HTML di chiusura o sintassi verbosa"
        text "• Perfettamente leggibile e modificabile in qualsiasi editor"

  notes
    Come potete vedere da questo frammento, il codice Native Yumia è essenziale e intuitivo.
    Con poche righe dichiariamo il documento, il tema, una slide con titolo hero e una griglia con tre metriche.
    Non c'è bisogno di scrivere codice CSS, div annidati o coordinate numeriche.

// Slide 8 — I tre output principali
slide "I Tre Output Principali"
  heading "Generazione nativa e specializzata per ogni ecosistema"

  grid columns=3 gap=16
    card title="HtmlRenderer" variant="primary" icon="lucide:globe"
      text "• Presentazione web interattiva SPA"
      text "• Navigazione da tastiera e fullscreen"
      text "• Modalità Speaker View con note"
      text "• Inspector visuale in tempo reale"
    card title="PptxRenderer" variant="accent" icon="lucide:presentation"
      text "• Forme OpenXML native e testo modificabile"
      text "• Tabelle, card e grafici nativi Office"
      text "• Zero screenshot o immagini statiche"
      text "• Modificabile su PowerPoint / Keynote"
    card title="PdfRenderer" variant="success" icon="lucide:file-text"
      text "• Rendering vettoriale ad alta definizione"
      text "• Layout e tipografia rigorosamente fissati"
      text "• Ideale per dispense, esami e stampa"
      text "• Dimensioni del file ottimizzate"

  notes
    È fondamentale sottolineare come lavorano i tre renderer:
    L'HTML offre interattività e speaker view;
    Il renderer PPTX non incolla immagini, ma genera veri oggetti e forme vettoriali OpenXML modificabili all'interno di Microsoft PowerPoint;
    Il renderer PDF produce documenti vettoriali perfetti per la stampa e l'archiviazione.

// Slide 9 — Design Linter e qualità visiva
slide "Design Linter e Qualità Visiva"
  heading "Static Analysis per la leggibilità e l'accessibilità"

  columns 50:50
    column
      card title="Controlli Automatici di Design" variant="primary"
        text "• Densità informativa e carico cognitivo"
        text "• Verifica slide vuote o incomplete"
        text "• Contrasto testo/sfondo secondo standard WCAG"
        text "• Rispetto della Safe Area e margini"
        text "• Calcolo del Visual Score da 0 a 100"
    column
      card title="Esempio di Diagnostica CLI" variant="warning"
        code lang="text"
          [YUM004] Alta densità informativa
          La slide contiene troppi elementi complessi.
          Suggerimento: dividere la slide o usare
          una griglia di metriche.

  callout severity="info" title="Prevenzione prima della build" icon="lucide:shield-check"
    Il linter intercetta difetti grafici, errori tipografici e problemi di leggibilità prima di distribuire la presentazione.

  notes
    Proprio come usiamo ESLint o i compilatori per trovare errori logici nel codice sorgente, il Design Linter di Yumia analizza le slide per individuare problemi di design: testo troppo denso, scarso contrasto cromatico o sovrapposizioni, restituendo suggerimenti operativi.

// Slide 10 — CLI e workflow di sviluppo
slide "CLI e Workflow di Sviluppo"
  heading "L'esperienza di sviluppo pensata per sviluppatori e CI/CD"

  grid columns=3 gap=16
    card title="1. Scrittura & Validazione" variant="primary" icon="lucide:terminal"
      code lang="bash"
        yumia validate pres.yumia
        yumia explain pres.yumia
    card title="2. Live Dev & Audit" variant="accent" icon="lucide:play"
      code lang="bash"
        yumia dev pres.yumia --open
        yumia check --optimize
    card title="3. Build & Deploy" variant="success" icon="lucide:rocket"
      code lang="bash"
        yumia build --format pptx
        yumia deploy --provider gh-pages

  callout severity="success" title="Workflow integrabile in CI/CD" icon="lucide:git-pull-request"
    Ogni commit su Git può validare le slide, generare la documentazione HTML e pubblicare la versione aggiornata su GitHub Pages.

  notes
    La CLI di Yumia offre un set completo di comandi:
    - validate ed explain per analizzare sintassi e ritmo visivo;
    - dev per avere un server locale con hot-reload e inspector;
    - check per eseguire l'audit di contrasto e densità;
    - build e deploy per compilare e pubblicare in automatico nei pipeline CI/CD.

// Slide 11 — Yumia e intelligenza artificiale
slide "Yumia e Intelligenza Artificiale"
  heading "Perché i linguaggi dichiarativi semantici superano l'HTML grezzo"

  compare left="AI con HTML / CSS Grezzo" right="AI con Yumia DSL"
    left
      badge "Fragile & Imprevedibile" variant="danger"
      text "• Allucinazioni di coordinate pixel e layout rotti"
      text "• Codice verboso con rischio di sintassi non valida"
      text "• Difficile da vincolare a un design system coerente"
      text "• Revisione manuale complessa per l'utente"
    right
      badge "Robusto & Strutturato" variant="success"
      text "• Generazione guidata da JSON Schema (yumia schema)"
      text "• Sintassi concisa focalizzata sul contenuto semantico"
      text "• Il motore garantisce allineamenti e layout perfetti"
      text "• Validazione deterministica automatica post-generazione"

  notes
    Gli LLM hanno difficoltà a calcolare geometrie esatte e layout CSS complessi. Con Yumia, il modello di AI deve solo generare blocchi semantici concisi come card o compare.
    Il compilatore si fa carico di renderizzare tutto alla perfezione, riducendo drasticamente il tasso di allucinazioni e codice malformato.

// Slide 12 — Icone, diagrammi e componenti avanzati
slide "Funzionalità e Componenti Avanzati"
  heading "Un ricco ecosistema integrato senza dipendenze esterne"

  grid columns=3 gap=16
    card title="Icon Provider Multipli" variant="primary" icon="lucide:shapes"
      text "Supporto nativo a oltre 10.000 icone da Lucide, Material, Tabler e FontAwesome."
    card title="Diagrammi Integrati" variant="accent" icon="lucide:git-commit"
      text "Flowchart direzionali, Sequence diagram, architetture e diagrammi di classi UML."
    card title="Grafici & Timeline" variant="warning" icon="lucide:bar-chart-3"
      text "Grafici a barre, ciambella, radar, gauge e timeline storiche generate nativamente."
    card title="Componenti & Macro" variant="info" icon="lucide:blocks"
      text "Creazione di blocchi riutilizzabili parametrici con la direttiva component."
    card title="Data Binding 'each'" variant="success" icon="lucide:database"
      text "Iterazione dinamica su dataset JSON o CSV per reportistica automatica."
    card title="Formule Matematiche" variant="danger" icon="lucide:binary"
      text "Rendering di formule scientifiche complesse in sintassi LaTeX / KaTeX."

  notes
    Yumia integra direttamente nella sintassi diagrammi di flusso, diagrammi di sequenza, grafici di dati, timeline e formule matematiche LaTeX.
    Questo elimina la necessità di fare screenshot da tool esterni o incollare immagini a bassa risoluzione.

// Slide 13 — Compatibilità e migrazione
slide "Compatibilità e Percorso di Migrazione"
  heading "Continuità garantita tra ecosistema Markdown e Native DSL"

  columns 50:50
    column
      card title="Markdown Yumia (.yumia.md)" variant="primary"
        code lang="markdown"
          :::metric value="99%" label="Uptime" change="+1%" :::
      text "Compatibile con lettori Markdown standard, esteso tramite direttive semantiche."
    column
      card title="Native Yumia (.yumia)" variant="success"
        code lang="yumia"
          metric "99%" label="Uptime" diff="+1%"
      text "Sintassi nativa più concisa, pulita e ottimizzata per i Design Compiler."

  callout severity="info" title="Utility di Migrazione Automatica" icon="lucide:refresh-cw"
    Il compilatore include tool di migrazione bidirezionale per consentire un passaggio progressivo senza perdere i contenuti esistenti.

  notes
    Yumia offre una doppia compatibilità:
    supporta sia file Markdown standard con blocchi di direttive, sia la nuova sintassi Native Yumia, più concisa e priva di boilerplate.
    Un tool di migrazione integrato consente di convertire i file in modo completamente trasparente.

// Slide 14 — Vantaggi, limiti e sviluppi futuri
slide "Vantaggi, Limiti e Sviluppi Futuri"
  heading "Valutazione dello stato attuale e roadmap del progetto"

  grid columns=3 gap=16
    card title="Vantaggi Attuali" variant="success" icon="lucide:check-circle"
      list
        - Sorgente 100% versionabile con Git
        - Tre output compilati da un unico file
        - Layout e gerarchia visiva garantiti
        - Linter automatico per design e WCAG
        - Integrazione nativa con workflow AI
    card title="Aspetti da Consolidare" variant="warning" icon="lucide:alert-triangle"
      list
        - Parità totale di rendering su edge case
        - Estensione della copertura dei test
        - Supporto a font e asset esterni complessi
        - Documentazione di scenari avanzati
    card title="Sviluppi Futuri" variant="primary" icon="lucide:compass"
      list
        - Editor visuale WYSIWYG bidirezionale
        - Collaborazione in tempo reale su browser
        - Integrazione con modelli LLM in locale
        - Plugin per VS Code ed estensioni IDE

  notes
    È importante mantenere uno sguardo critico e trasparente sullo stato del progetto:
    Yumia ha già solidi punti di forza nella versionabilità e nella compilazione multi-target.
    I prossimi passi si concentreranno sull'affinamento dei casi limite nei renderer e sullo sviluppo di estensioni IDE e funzionalità di collaborazione in tempo reale.

// Slide 15 — Conclusioni e Domande
slide "Conclusioni"
  hero title="Descrivere ciò che si vuole comunicare," subtitle="lasciare al compilatore il compito di comporlo." badge="Design as Code" align="center" emphasis="primary"

  grid columns=3 gap=16
    card title="1. Separazione" variant="primary"
      text "Il contenuto è completamente disaccoppiato dalle coordinate grafiche."
    card title="2. Flessibilità" variant="accent"
      text "Un singolo sorgente produce Web interattivo, PowerPoint nativo e PDF."
    card title="3. Futuro" variant="success"
      text "Un ponte naturale tra sviluppatori, designer e intelligenza artificiale."

  callout severity="info" title="Sessione Q&A" icon="lucide:help-circle"
    Grazie per l'attenzione. Spazio per domande, chiarimenti e feedback della commissione.

  notes
    In conclusione, Yumia dimostra come i principi dell'ingegneria del software — compilatori, AST, linter e separazione delle responsabilità — possano essere applicati con successo alla comunicazione visiva.
    Grazie per l'attenzione: sono a vostra completa disposizione per domande e approfondimenti tecnici.
