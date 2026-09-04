import {
  CardElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  HeadingElement,
  ImageElement,
  ListElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  Slide,
  SlideElement,
  TableElement,
} from '@yumiamd/ast';
import { RenderContext, YumiaRenderer } from '@yumiamd/renderer';
import { defaultTheme, resolveTheme, ThemeOverrides, YumiaTheme } from '@yumiamd/theme';

export interface HtmlRenderOptions {
  liveReload?: boolean;
  liveReloadPort?: number;
  author?: string;
  title?: string;
}

export interface HtmlOutput {
  format: 'html';
  html: string;
  slideCount: number;
}

export class HtmlRenderer implements YumiaRenderer<HtmlOutput> {
  readonly name = 'HtmlRenderer';
  readonly targetFormat = 'html';

  async render(presentation: Presentation, context: RenderContext = {}): Promise<HtmlOutput> {
    const colorOverrides = presentation.metadata.colors
      ? ({ colors: presentation.metadata.colors } as ThemeOverrides)
      : undefined;
    const resolvedTheme = resolveTheme(presentation.metadata.theme, colorOverrides);
    const theme = context.theme || resolvedTheme || defaultTheme;

    const title = presentation.metadata.title || 'YumiaMD Presentation';
    const aspectRatio = presentation.metadata.aspectRatio || '16:9';
    const is43 = aspectRatio === '4:3';
    const ratioAspect = is43 ? '4 / 3' : '16 / 9';

    const options = (context.options || {}) as HtmlRenderOptions;
    const liveReloadScript = options.liveReload
      ? `
    <!-- YumiaMD Live Reload -->
    <script>
      (function() {
        const port = ${options.liveReloadPort || 3000};
        const evtSource = new EventSource('/__yumia_live_reload');
        evtSource.onmessage = function(event) {
          if (event.data === 'reload') {
            const currentHash = window.location.hash;
            fetch(window.location.href)
              .then(res => res.text())
              .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newDeck = doc.getElementById('yumia-deck');
                const oldDeck = document.getElementById('yumia-deck');
                if (newDeck && oldDeck) {
                  oldDeck.innerHTML = newDeck.innerHTML;
                  window.deckController.init();
                  if (currentHash) window.location.hash = currentHash;
                } else {
                  window.location.reload();
                }
              })
              .catch(() => window.location.reload());
          }
        };
      })();
    </script>
`
      : '';

    const slidesHtml = presentation.slides
      .map((slide, idx) => this.renderSlide(slide, idx + 1, presentation.slides.length, theme))
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --yumia-bg: ${theme.colors.background};
      --yumia-surface: ${theme.colors.surface};
      --yumia-text: ${theme.colors.text};
      --yumia-muted: ${theme.colors.muted || '#94a3b8'};
      --yumia-primary: ${theme.colors.primary};
      --yumia-secondary: ${theme.colors.secondary || theme.colors.primary};
      --yumia-accent: ${theme.colors.accent || theme.colors.primary};
      --yumia-border: ${theme.colors.border || 'rgba(255,255,255,0.1)'};
      --yumia-success: ${theme.colors.success || '#10b981'};
      --yumia-warning: ${theme.colors.warning || '#f59e0b'};
      --yumia-danger: ${theme.colors.danger || '#ef4444'};
      --yumia-info: ${theme.colors.info || '#3b82f6'};
      --yumia-font-heading: ${theme.typography.headingFont};
      --yumia-font-body: ${theme.typography.bodyFont};
      --yumia-font-code: ${theme.typography.codeFont || 'monospace'};
      --yumia-ratio: ${ratioAspect};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #050508;
      color: var(--yumia-text);
      font-family: var(--yumia-font-body);
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    #yumia-deck {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .yumia-slide-wrapper {
      position: relative;
      width: min(94vw, calc(94vh * (${is43 ? '4 / 3' : '16 / 9'})));
      height: min(calc(94vw / (${is43 ? '4 / 3' : '16 / 9'})), 94vh);
      aspect-ratio: var(--yumia-ratio);
      background-color: var(--yumia-bg);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--yumia-border);
      overflow: hidden;
      display: none;
      flex-direction: column;
      padding: 4.5% 5.5%;
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .yumia-slide-wrapper.active {
      display: flex;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.985); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Headings */
    h1, h2, h3, h4 {
      font-family: var(--yumia-font-heading);
      font-weight: 700;
      line-height: 1.15;
      margin-bottom: 0.7em;
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: clamp(2rem, 3.8vw, 3.4rem);
      color: var(--yumia-primary);
    }

    h2 {
      font-size: clamp(1.6rem, 2.8vw, 2.5rem);
      color: var(--yumia-text);
    }

    h3 {
      font-size: clamp(1.3rem, 2.2vw, 1.9rem);
      color: var(--yumia-text);
    }

    h4 {
      font-size: clamp(1.1rem, 1.7vw, 1.4rem);
      color: var(--yumia-muted);
    }

    /* Paragraphs */
    p {
      font-size: clamp(1rem, 1.4vw, 1.25rem);
      line-height: 1.6;
      color: var(--yumia-text);
      margin-bottom: 0.8em;
    }

    p strong, li strong {
      color: var(--yumia-primary);
      font-weight: 700;
    }

    p em, li em {
      font-style: italic;
      color: var(--yumia-secondary);
    }

    p code, li code {
      font-family: var(--yumia-font-code);
      background: rgba(255, 255, 255, 0.08);
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
      color: var(--yumia-accent);
    }

    /* Lists */
    ul, ol {
      font-size: clamp(1rem, 1.35vw, 1.2rem);
      line-height: 1.65;
      margin-bottom: 1em;
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.5em;
      color: var(--yumia-text);
    }

    li::marker {
      color: var(--yumia-primary);
    }

    /* Columns */
    .yumia-columns {
      display: grid;
      gap: 1.5rem;
      width: 100%;
      margin: 0.8rem 0;
      align-items: stretch;
    }

    .yumia-column {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    /* Cards */
    .yumia-card {
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .yumia-card[data-variant="primary"] {
      border-color: var(--yumia-primary);
    }
    .yumia-card[data-variant="primary"] .yumia-card-title {
      color: var(--yumia-primary);
    }

    .yumia-card[data-variant="warning"] {
      border-color: var(--yumia-warning);
    }
    .yumia-card[data-variant="warning"] .yumia-card-title {
      color: var(--yumia-warning);
    }

    .yumia-card[data-variant="success"] {
      border-color: var(--yumia-success);
    }
    .yumia-card[data-variant="success"] .yumia-card-title {
      color: var(--yumia-success);
    }

    .yumia-card[data-variant="info"] {
      border-color: var(--yumia-info);
    }
    .yumia-card[data-variant="info"] .yumia-card-title {
      color: var(--yumia-info);
    }

    .yumia-card-title {
      font-family: var(--yumia-font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--yumia-primary);
      margin-bottom: 0.3rem;
    }

    /* Metrics */
    .yumia-metric {
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 12px;
      padding: 1rem 1.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.25rem;
    }

    .yumia-metric[data-variant="primary"] { border-color: var(--yumia-primary); }
    .yumia-metric[data-variant="primary"] .yumia-metric-value { color: var(--yumia-primary); }
    .yumia-metric[data-variant="success"] { border-color: var(--yumia-success); }
    .yumia-metric[data-variant="success"] .yumia-metric-value { color: var(--yumia-success); }
    .yumia-metric[data-variant="info"] { border-color: var(--yumia-info); }
    .yumia-metric[data-variant="info"] .yumia-metric-value { color: var(--yumia-info); }
    .yumia-metric[data-variant="warning"] { border-color: var(--yumia-warning); }
    .yumia-metric[data-variant="warning"] .yumia-metric-value { color: var(--yumia-warning); }
    .yumia-metric[data-variant="danger"] { border-color: var(--yumia-danger); }
    .yumia-metric[data-variant="danger"] .yumia-metric-value { color: var(--yumia-danger); }

    .yumia-metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--yumia-muted);
    }

    .yumia-metric-value {
      font-family: var(--yumia-font-heading);
      font-size: clamp(1.8rem, 3.2vw, 2.6rem);
      font-weight: 800;
      line-height: 1.1;
      color: var(--yumia-primary);
    }

    .yumia-metric-change {
      font-size: 0.85rem;
      font-weight: 600;
    }
    .yumia-metric-change.positive { color: var(--yumia-success); }
    .yumia-metric-change.negative { color: var(--yumia-danger); }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: clamp(0.9rem, 1.15vw, 1.05rem);
      border: 1px solid var(--yumia-border);
      border-radius: 8px;
      overflow: hidden;
    }

    th {
      background: var(--yumia-primary);
      color: #ffffff;
      font-weight: 700;
      padding: 0.75rem 1rem;
      text-align: left;
    }

    td {
      padding: 0.7rem 1rem;
      border-top: 1px solid var(--yumia-border);
      color: var(--yumia-text);
      background: var(--yumia-surface);
    }

    tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.03);
    }

    /* Code Blocks */
    pre {
      background: #0a0a10;
      border: 1px solid var(--yumia-border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      margin: 0.8rem 0;
    }

    pre code {
      font-family: var(--yumia-font-code);
      font-size: 0.95rem;
      color: #00F0FF;
      background: none;
      padding: 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid var(--yumia-accent);
      padding: 0.6rem 1.2rem;
      margin: 1rem 0;
      font-style: italic;
      color: var(--yumia-muted);
      font-size: 1.1rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 0 8px 8px 0;
    }

    /* Controls Overlay */
    .yumia-controls {
      position: fixed;
      bottom: 20px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 1000;
      font-size: 13px;
      color: #e2e8f0;
    }

    .yumia-btn {
      background: none;
      border: none;
      color: #f8fafc;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .yumia-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .yumia-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: var(--yumia-primary);
      transition: width 0.25s ease;
    }

    /* Notes Drawer */
    .yumia-notes-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 220px;
      background: rgba(10, 10, 18, 0.95);
      backdrop-filter: blur(16px);
      border-top: 1px solid var(--yumia-primary);
      padding: 16px 24px;
      overflow-y: auto;
      display: none;
      z-index: 2000;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }

    .yumia-notes-drawer.open {
      display: block;
    }
  </style>
</head>
<body>
  <div id="yumia-deck">
    ${slidesHtml}
  </div>

  <div class="yumia-controls">
    <button class="yumia-btn" id="btn-prev" title="Previous Slide (←)">◀</button>
    <span id="slide-indicator">1 / ${presentation.slides.length}</span>
    <button class="yumia-btn" id="btn-next" title="Next Slide (→)">▶</button>
    <button class="yumia-btn" id="btn-notes" title="Toggle Notes (N)">📝</button>
    <button class="yumia-btn" id="btn-fs" title="Fullscreen (F)">⛶</button>
  </div>

  <div id="notes-drawer" class="yumia-notes-drawer"></div>

  <script>
    (function() {
      const slides = document.querySelectorAll('.yumia-slide-wrapper');
      const indicator = document.getElementById('slide-indicator');
      const notesDrawer = document.getElementById('notes-drawer');
      let currentIdx = 0;

      function updateSlide(newIdx) {
        if (newIdx < 0 || newIdx >= slides.length) return;
        slides[currentIdx]?.classList.remove('active');
        currentIdx = newIdx;
        slides[currentIdx]?.classList.add('active');

        if (indicator) {
          indicator.textContent = (currentIdx + 1) + ' / ' + slides.length;
        }

        const currentSlide = slides[currentIdx];
        const notes = currentSlide ? currentSlide.getAttribute('data-notes') : '';
        if (notesDrawer) {
          notesDrawer.innerHTML = notes ? '<strong>Speaker Notes:</strong><br>' + notes : '<em>No notes for this slide.</em>';
        }

        window.location.hash = '#' + (currentIdx + 1);
      }

      function init() {
        const hash = window.location.hash.replace('#', '');
        const initialIdx = parseInt(hash, 10) - 1;
        updateSlide(isNaN(initialIdx) ? 0 : initialIdx);
      }

      window.deckController = {
        init: init,
        next: function() { updateSlide(currentIdx + 1); },
        prev: function() { updateSlide(currentIdx - 1); },
        toggleNotes: function() { notesDrawer?.classList.toggle('open'); },
        toggleFs: function() {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }
      };

      document.getElementById('btn-next')?.addEventListener('click', window.deckController.next);
      document.getElementById('btn-prev')?.addEventListener('click', window.deckController.prev);
      document.getElementById('btn-notes')?.addEventListener('click', window.deckController.toggleNotes);
      document.getElementById('btn-fs')?.addEventListener('click', window.deckController.toggleFs);

      window.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          window.deckController.next();
        } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
          e.preventDefault();
          window.deckController.prev();
        } else if (e.key.toLowerCase() === 'f') {
          window.deckController.toggleFs();
        } else if (e.key.toLowerCase() === 'n') {
          window.deckController.toggleNotes();
        }
      });

      // Touch swipe support
      let touchStartX = 0;
      window.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0]?.screenX || 0;
      });
      window.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0]?.screenX || 0;
        if (touchStartX - touchEndX > 50) window.deckController.next();
        if (touchEndX - touchStartX > 50) window.deckController.prev();
      });

      init();
    })();
  </script>
  ${liveReloadScript}
</body>
</html>`;

    return {
      format: 'html',
      html,
      slideCount: presentation.slides.length,
    };
  }

  private renderSlide(
    slide: Slide,
    slideNum: number,
    totalSlides: number,
    theme: YumiaTheme
  ): string {
    const activeClass = slideNum === 1 ? 'active' : '';
    const notesAttr = slide.notes ? this.escapeHtml(slide.notes.replace(/\n/g, '<br>')) : '';
    const progressPercent = Math.round((slideNum / totalSlides) * 100);

    const elementsHtml = slide.elements.map((el) => this.renderElement(el, theme)).join('\n');

    return `
    <div class="yumia-slide-wrapper ${activeClass}" id="slide-${slideNum}" data-notes="${notesAttr}">
      ${elementsHtml}
      <div class="yumia-progress-bar" style="width: ${progressPercent}%;"></div>
    </div>`;
  }

  private renderElement(element: SlideElement, theme: YumiaTheme): string {
    switch (element.type) {
      case 'heading': {
        const h = element as HeadingElement;
        const tag = `h${Math.min(4, Math.max(1, h.level))}`;
        return `<${tag}>${this.formatInline(h.text)}</${tag}>`;
      }
      case 'paragraph': {
        const p = element as ParagraphElement;
        return `<p>${this.formatInline(p.text)}</p>`;
      }
      case 'list': {
        const l = element as ListElement;
        const tag = l.ordered ? 'ol' : 'ul';
        const items = l.items.map((i) => `<li>${this.formatInline(i.text)}</li>`).join('\n');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'code': {
        const c = element as CodeElement;
        const langClass = c.language ? `class="language-${c.language}"` : '';
        return `<pre><code ${langClass}>${this.escapeHtml(c.code)}</code></pre>`;
      }
      case 'quote': {
        const q = element as QuoteElement;
        const author = q.author ? `<br><small>— ${this.escapeHtml(q.author)}</small>` : '';
        return `<blockquote>“${this.formatInline(q.text)}”${author}</blockquote>`;
      }
      case 'table': {
        const t = element as TableElement;
        let html = '<table>';
        if (t.headers && t.headers.length > 0) {
          html += '<thead><tr>';
          html += t.headers
            .map((h) => `<th>${this.formatInline(h.replace(/\*\*/g, ''))}</th>`)
            .join('');
          html += '</tr></thead>';
        }
        if (t.rows) {
          html += '<tbody>';
          for (const row of t.rows) {
            html += '<tr>';
            html += row
              .map((c) => `<td>${this.formatInline(c.replace(/\*\*/g, ''))}</td>`)
              .join('');
            html += '</tr>';
          }
          html += '</tbody>';
        }
        html += '</table>';
        return html;
      }
      case 'image': {
        const img = element as ImageElement;
        const alt = img.alt ? `alt="${this.escapeHtml(img.alt)}"` : '';
        return `<img src="${this.escapeHtml(img.src)}" ${alt} style="max-width: 100%; border-radius: 8px;">`;
      }
      case 'metric': {
        const m = element as MetricElement;
        const variant = m.variant || 'primary';
        const displayVal = m.unit ? `${m.value} ${m.unit}` : m.value;
        const changeHtml = m.change
          ? `<span class="yumia-metric-change ${m.change.startsWith('+') ? 'positive' : 'negative'}">${this.escapeHtml(m.change)}</span>`
          : '';
        return `
        <div class="yumia-metric" data-variant="${variant}">
          <span class="yumia-metric-label">${this.escapeHtml(m.label)}</span>
          <span class="yumia-metric-value">${this.escapeHtml(displayVal)}</span>
          ${changeHtml}
        </div>`;
      }
      case 'card': {
        const card = element as CardElement;
        const variant = card.variant || 'default';
        const titleHtml = card.title
          ? `<div class="yumia-card-title">${this.escapeHtml(card.title)}</div>`
          : '';
        const innerHtml = card.elements
          ? card.elements.map((child) => this.renderElement(child, theme)).join('\n')
          : '';
        return `
        <div class="yumia-card" data-variant="${variant}">
          ${titleHtml}
          ${innerHtml}
        </div>`;
      }
      case 'columns': {
        const cols = element as ColumnsElement;
        const colCount = cols.columns.length;
        const ratioTemplate = cols.ratios
          ? cols.ratios
              .split(':')
              .map((r) => `${r}fr`)
              .join(' ')
          : `repeat(${colCount}, 1fr)`;
        const colsHtml = cols.columns
          .map((col: ColumnElement) => {
            const inner = col.elements.map((child) => this.renderElement(child, theme)).join('\n');
            return `<div class="yumia-column">${inner}</div>`;
          })
          .join('\n');
        return `<div class="yumia-columns" style="grid-template-columns: ${ratioTemplate};">${colsHtml}</div>`;
      }
      default:
        return '';
    }
  }

  private formatInline(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
