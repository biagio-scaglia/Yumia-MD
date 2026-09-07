document "Yumia — Creare Presentazioni con Semplicità"
  theme "tokyonight"
  aspectRatio "16:9"
  author "Biagio Scaglia"
  watermark "Yumia • Corso Web Dev 25726"

// Slide 1 — Benvenuti e Saluti Iniziali
slide "Benvenuti e Introduzione"
  hero title="Yumia" subtitle="Creare presentazioni belle e veloci partendo dal semplice testo" tagline="Corso di Web Dev • Classe 25726 • Progetto di Biagio Scaglia" badge="Presentazione Progetto" align="center" emphasis="primary"

  grid columns=3 gap=20
    metric "1" label="File di testo sorgente" diff="Zero fatica" variant="primary"
    metric "3" label="Formati (Web, PPTX, PDF)" diff="In 1 secondo" variant="accent"
    metric "100%" label="Layout e design garantiti" diff="Zero disallineamenti" variant="success"

  notes
    Ciao a tutti e benvenuti! Sono Biagio Scaglia del corso di Web Dev (classe 25726).
    Oggi vi presento Yumia, uno strumento pensato per rivoluzionare il modo in cui creiamo le nostre slide e presentazioni.

// Slide 2 — Il problema delle presentazioni tradizionali
slide "Il Problema: Creare Slide è Lento"
  heading "Cosa non funziona nei programmi tradizionali come PowerPoint o Canva?"

  compare left="Come facciamo oggi le slide" right="I problemi di tutti i giorni"
    left
      badge "Programmi Tradizionali" variant="warning"
      text "• Trasciniamo caselle e forme col mouse per ore"
      text "• I titoli e i margini non sono mai dritti uguali"
      text "• Cambiare un colore richiede di rifare ogni slide"
      text "• File pesanti che non si possono gestire facilmente col codice"
    right
      badge "Perché è frustrante" variant="danger"
      text "• Perdiamo più tempo sulla grafica che sulle idee"
      text "• Il risultato spesso non sembra professionale"
      text "• Difficile collaborare o riutilizzare il lavoro già fatto"
      text "• Le intelligenze artificiali faticano a creare slide grafiche corrette"

  notes
    Tutti noi abbiamo usato programmi come PowerPoint o Canva. Spesso passiamo ore a spostare caselle di testo col mouse, cercare di allineare i box e sistemare i colori.
    Per noi sviluppatori questo è noioso e ci fa perdere un sacco di tempo utile.

// Slide 3 — La Soluzione: Cos'è Yumia?
slide "La Soluzione: Cos'è Yumia?"
  heading "Scrivi solo il testo, alla grafica ci pensa il computer!"

  columns 48:52
    column
      card title="Separazione Intelligente" variant="primary" icon="lucide:pencil"
        text "Tu scrivi solo le idee e i concetti in un semplice file di testo, come se prendessi appunti veloci."
        badge "Semplice da scrivere" variant="accent"
    column
      card title="Composizione Automatica" variant="accent" icon="lucide:sparkles"
        text "Yumia posiziona automaticamente i blocchi, calcola i margini e sceglie i colori più armoniosi."
        badge "Design garantito" variant="success"

  callout severity="info" title="L'idea chiave" icon="lucide:lightbulb"
    Non diciamo dove mettere ogni singolo pixel: diciamo solo cosa vogliamo mostrare e Yumia trova il modo migliore per disegnarlo.

  notes
    L'idea di Yumia è semplicissima: dividere il testo dalla grafica.
    Noi ci concentriamo solo su cosa vogliamo comunicare, mentre il programma si occupa di allineare tutto, scegliere i colori giusti e rendere le slide bellissime in automatico.

// Slide 4 — Come Funziona in 3 Passi
slide "Come Funziona in Pratica"
  heading "Un percorso semplice e diretto in 3 passaggi"

  diagram type="flow" direction="LR" title="Il percorso da testo a presentazione"
    [1. Scrivi il Testo] -> [2. Yumia Organizza] -> [3. Presentazione Pronta]
    node [1. Scrivi il Testo] variant="primary"
    node [2. Yumia Organizza] variant="accent"
    node [3. Presentazione Pronta] variant="success"

  callout severity="success" title="Facile e veloce per tutti" icon="lucide:zap"
    Non serve essere grafici o esperti di design: basta scrivere poche righe per ottenere un lavoro pulito ed elegante.

  notes
    Il funzionamento è intuitivo:
    1. Apriamo il nostro editor preferito e scriviamo il contenuto in un semplice file di testo;
    2. Yumia calcola gli spazi, i contrasti e i margini;
    3. In un secondo la presentazione è pronta per essere proiettata o condivisa.

// Slide 5 — Un Solo File, Tre Formati
slide "Un Solo File, Tre Formati"
  heading "Da una sola pagina di testo ottieni subito 3 risultati diversi"

  grid columns=3 gap=16
    card title="1. Sito Web Interattivo" variant="primary" icon="lucide:globe"
      text "• Si apre direttamente nel browser"
      text "• Navigazione con frecce da tastiera"
      text "• Schermo intero e vista note per chi parla"
    card title="2. PowerPoint (.pptx)" variant="accent" icon="lucide:presentation"
      text "• File standard di PowerPoint"
      text "• Caselle di testo e forme modificabili"
      text "• Perfetto per colleghi o clienti"
    card title="3. Documento PDF" variant="success" icon="lucide:file-text"
      text "• Grafica fissa ad alta qualità"
      text "• Ottimo per stampare o inviare via email"
      text "• Si legge bene su qualsiasi dispositivo"

  notes
    Uno dei vantaggi più grandi: scriviamo il testo una volta sola e Yumia può creare:
    1) Una pagina web interattiva per presentare direttamente dal browser;
    2) Un vero file PowerPoint con testi modificabili;
    3) Un PDF pronto per essere stampato o inviato come dispensa.

// Slide 6 — Esempio Pratico di Codice
slide "Esempio Pratico di Codice"
  heading "Guardate quanto è facile e leggibile il testo!"

  columns 55:45
    column
      code lang="yumia"
        slide "La mia presentazione"
          hero title="Yumia" subtitle="Progetto Web Dev"

          grid columns=3 gap=20
            metric "1" label="File sorgente"
            metric "3" label="Formati generati"
            metric "0" label="Fatica grafica"
    column
      card title="Perché è comodo?" variant="primary" icon="lucide:code-2"
        text "• Si legge come una normale lista ordinata"
        text "• Nessun codice complicato o simboli strani"
        text "• Se vuoi cambiare una parola, ci metti 2 secondi"
        text "• Si salva su GitHub come qualsiasi progetto web"

  notes
    Questo è un vero esempio di codice Yumia.
    Come potete notare, è chiarissimo: abbiamo una slide, un titolo Hero e una griglia con tre numeri evidenziati.
    Non ci sono tag complicati, parentesi difficili o stili da memorizzare.

// Slide 7 — I Mattoncini Pronti all'Uso
slide "I Componenti Pronti all'Uso"
  heading "Tutto quello che serve per spiegare bene qualsiasi argomento"

  grid columns=3 gap=16
    card title="Schede e Colonne" variant="primary" icon="lucide:layout-grid"
      text "Per dividere i punti chiave ed evidenziare i concetti importanti."
    card title="Numeri in Evidenza" variant="accent" icon="lucide:hash"
      text "Grandi metriche con etichette per mostrare subito dati importanti."
    card title="Schemi e Flussi" variant="warning" icon="lucide:git-commit"
      text "Frecce e passaggi chiari per spiegare come funziona un processo."
    card title="Confronti a Due Lati" variant="info" icon="lucide:columns"
      text "Perfetti per mettere a paragone due idee (Prima vs Dopo)."
    card title="Tabelle e Liste" variant="success" icon="lucide:table"
      text "Per elenchi ordinati di informazioni e dati di sintesi."
    card title="Grafici & Icone" variant="danger" icon="lucide:bar-chart-3"
      text "Grafici a barre, ciambelle e oltre 10.000 icone vettoriali integrate."

  notes
    Yumia mette a disposizione tutti i mattoncini utili: schede colorate, numeri in evidenza, confronti visivi, grafici e migliaia di icone già integrate.
    Non c'è bisogno di scaricare immagini o ritagliare icone da internet.

// Slide 8 — Il Controllo Automatico della Qualità
slide "Il Controllo Qualità Automatico"
  heading "Un assistente che ti avvisa se la slide è poco leggibile"

  columns 50:50
    column
      card title="Cosa controlla Yumia per te?" variant="primary" icon="lucide:shield-check"
        text "• Se c'è troppo testo e la slide diventa pesante"
        text "• Se il colore del testo si legge bene sullo sfondo"
        text "• Se gli elementi sono troppo vicini ai bordi"
        text "• Se ci sono slide vuote o incomplete"
    column
      callout severity="warning" title="Esempio di Avviso Semplice" icon="lucide:alert-circle"
        Avviso: Hai inserito troppo testo in questa slide!
        Suggerimento: Dividi il contenuto in due schede o in una seconda slide per renderla più chiara.
      badge "Controllo WCAG e Accessibilità" variant="success"

  notes
    Proprio come quando scriviamo su Word c'è il correttore ortografico, in Yumia c'è un controllore visivo.
    Se esageriamo con il testo o scegliamo colori difficili da leggere per il pubblico, Yumia ci suggerisce subito come migliorare la slide.

// Slide 9 — Yumia e l'Intelligenza Artificiale
slide "Yumia e l'Intelligenza Artificiale"
  heading "La sintassi perfetta da far scrivere agli assistenti AI"

  compare left="Chiedere all'AI codice normale (HTML/CSS)" right="Chiedere all'AI testo Yumia"
    left
      badge "Spesso si rompe" variant="danger"
      text "• Layout sballati e testi che si sovrappongono"
      text "• Troppe righe di codice difficili da correggere"
      text "• Colori e font spesso poco armoniosi"
    right
      badge "Sempre perfetto" variant="success"
      text "• L'AI scrive poche righe semplici e ordinate"
      text "• Yumia garantisce che la grafica sia perfetta"
      text "• Se vuoi cambiare qualcosa, lo fai in un attimo"

  notes
    Oggi usiamo spesso l'Intelligenza Artificiale per aiutarci a creare contenuti.
    Se chiediamo all'AI di fare una pagina web con slide, spesso la grafica si rompe.
    Con Yumia, l'AI deve solo scrivere frasi semplici: ci pensa poi Yumia a posizionare tutto con ordine e armonia.

// Slide 10 — Il Confronto dei Tempi di Creazione
slide "Tempo Risparmiato con Yumia"
  heading "Meno tempo perso sulla grafica, più spazio ai contenuti"

  columns 52:48
    column
      chart type="bar" title="Minuti per creare 10 slide" labels="PowerPoint, Canva, Yumia" data="90, 60, 5"
    column
      card title="Perché tanta differenza?" variant="primary" icon="lucide:clock"
        text "• Zero spostamenti manuali di caselle col mouse"
        text "• Palette di colori e layout calcolati in un secondo"
        text "• Aggiornamenti immediati su tutte le slide"
        badge "Risparmio di oltre l'80% del tempo" variant="success"

  callout severity="success" title="Efficienza Immediata" icon="lucide:zap"
    Con Yumia passi subito dai tuoi appunti alla presentazione pronta senza stress.

  notes
    In questa slide vediamo un grafico a barre che mette a confronto il tempo necessario per realizzare 10 slide:
    con PowerPoint o Canva si perdono tra i 60 e i 90 minuti per allineare forme e caselle, mentre con Yumia bastano appena 5 minuti di scrittura.

// Slide 11 — Roadmap e Progetti per il Futuro
slide "Cosa Vogliamo Aggiungere in Futuro"
  heading "I prossimi passi per rendere Yumia ancora più completo"

  timeline layout="horizontal"
    item date="Fase 1" title="Nuovi Temi" desc="Stili grafici moderni, accademici ed eleganti"
    item date="Fase 2" title="Lavoro di Gruppo" desc="Collaborazione live via web con i compagni"
    item date="Fase 3" title="Anteprima Live" desc="Rendering immediato mentre scrivi il testo"

  callout severity="info" title="Sviluppo Aperto" icon="lucide:sparkles"
    Un progetto in costante evoluzione per semplificare la vita a studenti e sviluppatori.

  notes
    Il progetto è in continua evoluzione.
    Nella roadmap futura prevediamo tre fasi: nuovi temi grafici, collaborazione live tra compagni di gruppo e anteprima istantanea in tempo reale.

// Slide 12 — Saluti Finali e Ringraziamenti
slide "Conclusioni e Ringraziamenti"
  hero title="Grazie per l'attenzione!" subtitle="Yumia: descrivi le tue idee, al resto pensa il codice." badge="Domande & Curiosità" align="center" emphasis="primary"

  grid columns=3 gap=16
    card title="Spazio Domande" variant="primary" icon="lucide:help-circle"
      text "Chiarimenti, curiosità e domande sul funzionamento di Yumia."
    card title="Dimostrazione Live" variant="accent" icon="lucide:play-circle"
      text "Disponibile a mostrare la generazione istantanea dei file."
    card title="Classe 25726" variant="success" icon="lucide:award"
      text "Progetto per il corso di Web Dev presentato da Biagio Scaglia."

  callout severity="success" title="Spazio alle Domande" icon="lucide:message-circle"
    Sono a disposizione per chiarimenti, dimostrazioni pratiche e domande della classe e del docente!

  notes
    Siamo arrivati alla fine della presentazione!
    Grazie mille a tutti per l'attenzione. Se avete domande, dubbi o curiosità su Yumia e su come funziona, sono felice di rispondervi!
