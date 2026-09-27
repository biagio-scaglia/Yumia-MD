document "Impara HTML e CSS — Laboratorio Interattivo"
  theme "cyberpunk"
  aspectRatio "16:9"
  author "Biagio Scaglia"
  watermark "ITS Final Exam • Biagio Scaglia • Moon-Inferno"

// Slide 1 — Titolo e Cover
slide "Impara HTML e CSS"
  hero title="Impara HTML & CSS" subtitle="Laboratorio interattivo con Live Visualizer, Verifica Esercizi e Motore RPG" tagline="Progetto Finale Esame ITS • Biagio Scaglia" badge="Moon-Inferno Ecosystem" align="center" emphasis="primary"

  grid columns=3 gap=20
    metric "6" label="Moduli Didattici" diff="12 Lezioni interattive" variant="primary"
    metric "8" label="Badge di Maestria" diff="4 Ranghi RPG" variant="accent"
    metric "100%" label="Client-Side Privacy" diff="Zero backend richiesto" variant="success"

  notes
    Buongiorno a tutti i membri della commissione. Sono Biagio Scaglia e oggi vi presento "Impara HTML e CSS".
    Si tratta di un laboratorio interattivo open-source ideato per insegnare le basi del web moderno attraverso pratica immediata, gamification RPG e il design system proprietario Moon-Inferno.

// Slide 2 — Il Problema: Come si impara il frontend oggi?
slide "Il Problema: L'Apprendimento Passivo"
  heading "Perché molti studenti si bloccano quando iniziano con HTML e CSS?"

  compare left="Didattica Tradizionale" right="Approccio Laboratorio Interattivo"
    left
      badge "Cosa Non Funziona" variant="danger"
      text "• Pagine di teoria noiosa prima di scrivere una singola riga"
      text "• Attrito di setup locale: editor, estensioni, server web"
      text "• Nessun feedback istantaneo sulla correttezza del markup"
      text "• Mancanza di incentivi e senso di progressione"
    right
      badge "La Nostra Soluzione" variant="success"
      text "• Teoria micro-dosata e focalizzata sui concetti chiave"
      text "• Live editor istantaneo nel browser con anteprima in tempo reale"
      text "• Validazione automatica del codice ad ogni esercizio"
      text "• Guadagno di XP, ranghi e badge collezionabili"

  notes
    Spesso chi approccia il web development si trova di fronte a tutorial chilometrici o guide poco pratiche.
    Il nostro obiettivo è azzerare l'attrito iniziale mettendo subito le mani sul codice con feedback immediato e divertimento tramite elementi di gioco.

// Slide 3 — Il Loop Didattico
slide "Il Game Loop Didattico"
  heading "Un ciclo virtuoso di apprendimento continuo"

  diagram type="flow" direction="LR" title="Loop di Apprendimento"
    [1. Teoria Breve] -> [2. Live Coding] -> [3. Validazione Esercizio] -> [4. Quiz Opzionale] -> [5. XP & Badge]
    node [1. Teoria Breve] variant="primary"
    node [2. Live Coding] variant="accent"
    node [3. Validazione Esercizio] variant="warning"
    node [4. Quiz Opzionale] variant="info"
    node [5. XP & Badge] variant="success"

  callout severity="info" title="Zero Frustrazione" icon="lucide:sparkles"
    Lo studente sperimenta direttamente le modifiche visive senza attendere reload o configurazioni esterne.

  notes
    Ogni lezione segue una struttura ripetibile e scientificamente efficace:
    Prima si legge una pillola teorica, poi si modifica il codice nell'editor live, si verifica l'esercizio con un click, si consolida con un quiz e si ottengono punti esperienza e badge.

// Slide 4 — Il Percorso Didattico
slide "Curriculum: 6 Moduli & 12 Lezioni"
  heading "Dalle basi del markup fino ai moderni layout Flexbox"

  grid columns=3 gap=16
    card title="Mod 1: Fondamenti HTML" variant="primary" icon="lucide:code"
      text "• DOCTYPE, html, head, body (+10 XP)"
      text "• Titoli h1-h6 e Paragrafi (+10 XP)"
      text "• Enfasi: strong, em, code (+10 XP)"
      badge "Badge: Maestro dei Tag" variant="primary"
    card title="Mod 2: Testo, Link & Immagini" variant="accent" icon="lucide:image"
      text "• Collegamenti con <a> e target (+10 XP)"
      text "• Immagini accessibili e alt (+10 XP)"
      text "• Liste ordinate e non ordinate (+10 XP)"
      badge "Badge: Costruttore Box" variant="accent"
    card title="Mod 3: Struttura Semantica" variant="success" icon="lucide:layout"
      text "• Tag semantici vs <div> (+15 XP)"
      text "• Section vs Article per SEO (+15 XP)"
      text "• Gerarchia e accessibilità semantica"
      badge "Badge: Eroe Semantico" variant="success"
    card title="Mod 4: Form & Input" variant="warning" icon="lucide:check-square"
      text "• Tag form, label, input (+20 XP)"
      text "• Attributi required e validazione"
      text "• Raccolta dati utente pulita"
      badge "Badge: Creatore di Form" variant="warning"
    card title="Mod 5: Tabelle & A11y" variant="info" icon="lucide:table"
      text "• Tabelle dati: table, tr, th, td (+25 XP)"
      text "• thead, tbody e accessibilità"
      text "• Best practice per lettori di schermo"
      badge "Badge: Maestro della Griglia" variant="info"
    card title="Mod 6: CSS & Flexbox" variant="danger" icon="lucide:palette"
      text "• Colori e Tipografia (+20 XP)"
      text "• Flexbox layout: gap, justify (+25 XP)"
      text "• Allineamenti e box model moderno"
      badge "Badge: Stilista + Architetto" variant="danger"

  notes
    Il piano didattico guida lo studente partendo dall'anatomia elementare di una pagina HTML fino ai concetti più ricercati nel frontend contemporaneo come Flexbox e l'accessibilità web.

// Slide 5 — Live Visualizer & Playground
slide "Playground & MoonHtmlVisualizer"
  heading "Uno spazio di sperimentazione live a zero latenza"

  columns 55:45
    column
      card title="Sandbox Libera (/playground)" variant="primary" icon="lucide:terminal"
        text "• Preset didattici: Prima Pagina, Colori, Box Model, Flexbox"
        text "• Canvas vuoto istantaneo (IT / EN)"
        text "• Export del codice con un singolo click"
        text "• Switch rapido del viewport (Desktop, Tablet, Mobile)"
        text "• Sblocco badge speciale: Pioniere Moon-Inferno"
    column
      image src="placeholder-playground.png" alt="Screenshot del Playground Live con MoonHtmlVisualizer" radius="12" shadow="true"
      callout severity="success" title="Feedback Istantaneo" icon="lucide:play"
        L'editor calcola l'altezza in modo responsive tramite l'hook useVisualizerHeight.

  notes
    Oltre al percorso guidato, la piattaforma include un'area Playground libera.
    Gli studenti possono caricare preset pronti, testare esperimenti personali, ridimensionare il viewport per verificare la responsività ed esportare i loro lavori.

// Slide 6 — Gamification: Motore RPG & Badge
slide "Motore RPG: Ranghi ed Inventario"
  heading "Un sistema di incentivo psicologico basato sulla Mastery"

  columns 50:50
    column
      table
        headers "XP Totali", "Rango Raggiunto", "Competenza"
        row "0 – 99", "Apprendista HTML", "Fondamenti"
        row "100 – 249", "Apprendista CSS", "Media & Stili"
        row "250 – 499", "Costruttore Frontend", "Semantica & Form"
        row "500+", "Architetto Web", "Mastery Flexbox"
    column
      card title="8 Badge di Maestria" variant="accent" icon="lucide:award"
        text "• Maestro dei Tag (Mod. 1)"
        text "• Costruttore Box (Mod. 2)"
        text "• Eroe Semantico (Mod. 3)"
        text "• Creatore di Form (Mod. 4)"
        text "• Maestro della Griglia (Mod. 5)"
        text "• Stilista CSS & Architetto Flexbox (Mod. 6)"
        text "• Pioniere Moon-Inferno (Playground)"

  callout severity="warning" title="Mastery Reale" icon="lucide:shield-check"
    I badge non si ottengono accumulando XP casuali: richiedono il completamento del 100% delle lezioni del rispettivo modulo.

  notes
    Il sistema RPG è stato calibrato con cura: non premia il mero click-farming, ma la reale maestria.
    L'inventario visualizza fino a 8 slot con badge personalizzati e grafiche CRT.

// Slide 7 — Architettura & Stack Tecnologico
slide "Architettura Software & Stack Tecnico"
  heading "Tecnologie moderne, prestazioni estreme e zero complessità server"

  grid columns=4 gap=16
    card title="UI Core" variant="primary" icon="lucide:layers"
      text "• React 19"
      text "• TypeScript rigoroso"
      text "• Functional Hooks"
    card title="Build & Tooling" variant="accent" icon="lucide:cpu"
      text "• Vite 8"
      text "• oxlint (analisi rapida)"
      text "• Zero config overhead"
    card title="Design System" variant="success" icon="lucide:palette"
      text "• @moon-inferno/react"
      text "• Temi & CRT FX"
      text "• Icone vettoriali native"
    card title="Persistenza" variant="info" icon="lucide:database"
      text "• localStorage sync"
      text "• Zero tracking"
      text "• 100% Client-Side"

  notes
    Sul piano ingegneristico abbiamo scelto React 19 unito a TypeScript per la massima affidabilità.
    L'analisi del codice è affidata a oxlint per garantire standard qualitativi eccellenti. La build con Vite 8 consente caricamenti istantanei.

// Slide 8 — Moon-Inferno & Temi Cyberpunk
slide "Design System: Moon-Inferno Ecosystem"
  heading "Un'identità visiva unica distribuita come package NPM"

  grid columns=3 gap=16
    card title="Tema Inferno" variant="primary" icon="lucide:flame"
      text "Arancio neon ad alto contrasto, ideale per lunghe sessioni di studio."
    card title="Tema Terminal" variant="success" icon="lucide:terminal"
      text "Fosfori verdi monocromatici stile mainframe e hacker terminal."
    card title="Tema Y2K" variant="accent" icon="lucide:disc"
      text "Estetica cyberpunk retro-futuristica anni 2000 con scanlines CRT."

  callout severity="accent" title="Componenti Proprietari" icon="lucide:box"
    Integrazione di MoonHtmlVisualizer, MoonRPGGrid, MoonHealthMeter, MoonSafeGlitch e Command Palette (Ctrl+K).

  notes
    L'interfaccia si appoggia al design system Moon-Inferno, creato e pubblicato su npm.
    Offre tre temi commutabili a runtime, effetti CRT, scanline retrò e una navigazione fluida tramite Command Palette.

// Slide 9 — Sfide Tecniche Risolte
slide "Sfide Tecniche & Soluzioni Ingegneristiche"
  heading "Problematiche di sviluppo e scelte architetturali"

  grid columns=3 gap=16
    card title="1. Routing su GitHub Pages" variant="primary" icon="lucide:git-branch"
      text "• Superato il limite del 404 sui reload"
      text "• Router History API nativo"
      text "• Auto-migrazione dai vecchi URL #hash"
    card title="2. Sandbox Sicura Live" variant="warning" icon="lucide:shield-alert"
      text "• Rendering isolato in tempo reale"
      text "• Gestione dei glitch con MoonSafeGlitch"
      text "• Nessun crash del thread UI"
    card title="3. i18n & Overlay Didattico" variant="success" icon="lucide:globe"
      text "• Bilinguismo completo IT / EN"
      text "• Dizionari UI e overlay dinamico"
      text "• Switch lingua istantaneo senza reload"

  notes
    Durante lo sviluppo abbiamo affrontato sfide concrete: dal routing SPA su hosting statico GitHub Pages senza rottura dei deep-link, alla sicurezza della sandbox HTML/CSS fino all'internazionalizzazione completa.

// Slide 10 — Esperienza Utente & Accessibilità
slide "Accessibilità, UX & Navigazione"
  heading "Progettato per essere accessibile, reattivo e user-friendly"

  grid columns=3 gap=16
    card title="Command Palette (Ctrl+K)" variant="primary" icon="lucide:command"
      text "Navigazione fulminea da tastiera per moduli, pagine, temi e impostazioni."
    card title="Responsive Design" variant="accent" icon="lucide:smartphone"
      text "Layout ottimizzato per mobile, tablet e schermi desktop ultra-wide."
    card title="Educazione A11y" variant="success" icon="lucide:eye"
      text "Esercizi che premiano l'uso di tag semantici, label e attributi alt corretti."

  notes
    La piattaforma adotta le best practice di accessibilità sia nel proprio codice che nei contenuti insegnati agli utenti, incoraggiando buone abitudini fin dal primo giorno.

// Slide 11 — Roadmap e Sviluppi Futuri
slide "Roadmap di Sviluppo"
  heading "Prossime evoluzioni della piattaforma didattica"

  timeline layout="horizontal"
    item date="v1.0 (Attuale)" title="Core & Moduli 1-6" desc="HTML base, Semantica, Flexbox, RPG"
    item date="v1.5" title="CSS Grid & Animations" desc="Nuovi moduli su Griglie 2D e Keyframes"
    item date="v2.0" title="Certificato & PDF" desc="Export attestato con verifica crittografica"
    item date="v2.5" title="Cloud Sync Opzionale" desc="Sincronizzazione progressi multi-device"

  notes
    La roadmap prevede l'introduzione di nuovi moduli dedicati a CSS Grid e Animazioni, la generazione automatica di certificati di completamento e la sincronizzazione cloud opzionale.

// Slide 12 — Conclusioni & Live Demo
slide "Conclusioni & Live Demo"
  hero title="Grazie per l'Attenzione!" subtitle="Pronto per la dimostrazione dal vivo e la sessione di Q&A" tagline="Biagio Scaglia • Candidato Esame Finale ITS" badge="Demo Live Ready" align="center" emphasis="primary"

  grid columns=3 gap=20
    metric "Live Web" label="biagio-scaglia.github.io/learn-html-and-css" diff="Online" variant="primary"
    metric "GitHub" label="biagio-scaglia/learn-html-and-css" diff="Open Source" variant="accent"
    metric "NPM" label="@moon-inferno/react" diff="v0.4.9" variant="success"

  notes
    Vi ringrazio molto per l'attenzione.
    Passo ora alla dimostrazione pratica del laboratorio e sono a vostra completa disposizione per qualsiasi domanda tecnica.
