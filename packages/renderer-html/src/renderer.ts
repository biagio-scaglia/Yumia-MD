import {
  BadgeElement,
  CalloutElement,
  CardElement,
  ChartElement,
  CodeElement,
  ColumnElement,
  ColumnsElement,
  CompareElement,
  GridElement,
  HeadingElement,
  HeroElement,
  IconElement,
  ImageElement,
  ListElement,
  MathElement,
  MermaidElement,
  MetricElement,
  ParagraphElement,
  Presentation,
  QuoteElement,
  SectionElement,
  Slide,
  SlideElement,
  StackElement,
  TableElement,
  TimelineElement,
  TocElement,
} from '@yumiamd/ast';
import { RenderContext, YumiaRenderer, defaultIconResolver } from '@yumiamd/renderer';
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
    const ratioW = is43 ? 4 : 16;
    const ratioH = is43 ? 3 : 9;

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
      .map((slide, idx) =>
        this.renderSlide(
          slide,
          idx + 1,
          presentation.slides.length,
          theme,
          presentation.metadata.watermark,
          presentation
        )
      )
      .join('\n');

    const customStyles = presentation.metadata.styles
      ? (Array.isArray(presentation.metadata.styles)
          ? presentation.metadata.styles
          : [presentation.metadata.styles]
        )
          .map((url) => `<link rel="stylesheet" href="${url}">`)
          .join('\n  ')
      : '';

    const customScripts = presentation.metadata.scripts
      ? (Array.isArray(presentation.metadata.scripts)
          ? presentation.metadata.scripts
          : [presentation.metadata.scripts]
        )
          .map((url) => `<script src="${url}"></script>`)
          .join('\n  ')
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Orbitron:wght@500;700;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;600;700&display=swap">
  ${customStyles}
  ${customScripts}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        themeVariables: {
          darkMode: true,
          background: '${theme.colors.background}',
          primaryColor: '${theme.colors.primary}',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '${theme.colors.primary}',
          lineColor: '${theme.colors.accent || theme.colors.primary}',
          secondaryColor: '${theme.colors.surface}',
          tertiaryColor: '${theme.colors.surface}'
        }
      });
      window.mermaid = mermaid;
      window.renderMermaidInSlide = async function(slideEl) {
        if (!slideEl || !window.mermaid) return;
        const nodes = Array.from(slideEl.querySelectorAll('.mermaid:not([data-processed="true"])'));
        if (nodes.length > 0) {
          try {
            await window.mermaid.run({ nodes: nodes });
          } catch (e) {
            console.warn('Mermaid render notice:', e);
          }
        }
      };
      // Auto-render visible slide if present
      const cur = document.querySelector('.yumia-slide-wrapper.active');
      if (cur) window.renderMermaidInSlide(cur);
    } catch (err) {
      console.warn('Mermaid load notice:', err);
    }
  </script>
  <style>
    :root {
      --yumia-bg: ${theme.colors.background};
      --yumia-surface: ${theme.colors.surface};
      --yumia-elevated-surface: ${theme.colors.elevatedSurface || theme.colors.surface};
      --yumia-text: ${theme.colors.text};
      --yumia-muted: ${theme.colors.muted || '#94a3b8'};
      --yumia-primary: ${theme.colors.primary};
      --yumia-secondary: ${theme.colors.secondary || theme.colors.primary};
      --yumia-accent: ${theme.colors.accent || theme.colors.primary};
      --yumia-border: ${theme.colors.border || 'rgba(255,255,255,0.1)'};
      --yumia-divider: ${theme.colors.divider || 'rgba(255,255,255,0.12)'};
      --yumia-success: ${theme.colors.success || '#10b981'};
      --yumia-warning: ${theme.colors.warning || '#f59e0b'};
      --yumia-danger: ${theme.colors.danger || '#ef4444'};
      --yumia-info: ${theme.colors.info || '#3b82f6'};
      --yumia-font-heading: ${theme.typography.headingFont};
      --yumia-font-body: ${theme.typography.bodyFont};
      --yumia-font-code: ${theme.typography.codeFont || 'monospace'};
      --yumia-line-height-tight: ${theme.typography.lineHeights?.tight || 1.15};
      --yumia-line-height-normal: ${theme.typography.lineHeights?.normal || 1.55};
      --yumia-line-height-relaxed: ${theme.typography.lineHeights?.relaxed || 1.7};
      --yumia-line-height-body: ${theme.typography.lineHeights?.normal || 1.55};
      --yumia-letter-spacing-tight: ${theme.typography.letterSpacing?.tight || '-0.02em'};
      --yumia-radius-sm: ${theme.radius.sm || 4}px;
      --yumia-radius-md: ${theme.radius.md || 8}px;
      --yumia-radius-lg: ${theme.radius.lg || 16}px;
      --yumia-radius-default: ${theme.radius.default}px;
      --yumia-radius-card: ${theme.components?.card?.borderRadius ?? theme.radius.default}px;
      --yumia-shadow-glow: ${theme.shadows?.glow || 'none'};
      --yumia-ratio: ${ratioAspect};
      --yumia-ratio-w: ${ratioW};
      --yumia-ratio-h: ${ratioH};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #050508;
      color: var(--yumia-text);
      font-family: var(--yumia-font-body), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    #deck-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #050508;
    }

    #yumia-deck {
      position: relative;
      width: 100%;
      height: 100%;
      max-width: calc(100vh * var(--yumia-ratio-w) / var(--yumia-ratio-h));
      max-height: calc(100vw * var(--yumia-ratio-h) / var(--yumia-ratio-w));
      aspect-ratio: var(--yumia-ratio);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .yumia-slide-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      aspect-ratio: var(--yumia-ratio);
      background-color: var(--yumia-bg);
      border-radius: var(--yumia-radius-default);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--yumia-border);
      overflow: hidden;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      padding: clamp(2rem, 4vw, 3.5rem) clamp(2.5rem, 5vw, 4.5rem);
      box-sizing: border-box;
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
      font-family: var(--yumia-font-heading), system-ui, -apple-system, sans-serif;
      font-weight: 700;
      line-height: var(--yumia-line-height-tight);
      margin-bottom: 0.4em;
      letter-spacing: var(--yumia-letter-spacing-tight);
      overflow-wrap: break-word;
      word-break: break-word;
    }

    h1 {
      font-size: clamp(1.8rem, 3.2vw, 2.9rem);
      color: var(--yumia-primary);
      line-height: 1.15;
    }

    h2 {
      font-size: clamp(1.5rem, 2.6vw, 2.3rem);
      color: var(--yumia-text);
      line-height: 1.2;
    }

    h3 {
      font-size: clamp(1.25rem, 2vw, 1.8rem);
      color: var(--yumia-text);
    }

    h4 {
      font-size: clamp(1.05rem, 1.5vw, 1.35rem);
      color: var(--yumia-muted);
    }

    /* Paragraphs */
    p {
      font-size: clamp(0.95rem, 1.35vw, 1.2rem);
      line-height: var(--yumia-line-height-normal);
      color: var(--yumia-text);
      margin-bottom: 0.6em;
      overflow-wrap: break-word;
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
      font-size: clamp(0.95rem, 1.3vw, 1.15rem);
      line-height: 1.6;
      margin-bottom: 0.8em;
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.4em;
      color: var(--yumia-text);
    }

    li::marker {
      color: var(--yumia-primary);
    }

    /* Grid & Stack Layout Containers */
    .yumia-grid {
      display: grid;
      width: 100%;
      flex: 1;
      min-height: 0;
      gap: clamp(1rem, 1.8vw, 1.6rem);
      align-items: stretch;
      margin-top: 0.4rem;
    }

    .yumia-stack {
      display: flex;
      width: 100%;
      flex: 1;
      min-height: 0;
      gap: clamp(1rem, 1.8vw, 1.6rem);
      align-items: stretch;
      margin-top: 0.4rem;
    }

    .yumia-stack.stack-horizontal > * {
      flex: 1 1 0px;
      min-width: 0;
      height: 100%;
    }

    /* Columns */
    .yumia-columns {
      display: grid;
      gap: clamp(1rem, 1.8vw, 1.6rem);
      width: 100%;
      flex: 1;
      min-height: 0;
      margin: 0.4rem 0;
      align-items: stretch;
    }

    .yumia-column {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      height: 100%;
    }

    /* Cards */
    .yumia-card {
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 14px;
      padding: clamp(1.2rem, 2vw, 1.8rem);
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.7rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .yumia-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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

    .yumia-card[data-variant="accent"] {
      border-color: var(--yumia-accent);
    }
    .yumia-card[data-variant="accent"] .yumia-card-title {
      color: var(--yumia-accent);
    }

    .yumia-card[data-variant="info"] {
      border-color: var(--yumia-info);
    }
    .yumia-card[data-variant="info"] .yumia-card-title {
      color: var(--yumia-info);
    }

    .yumia-card-title {
      font-family: var(--yumia-font-heading);
      font-size: clamp(1.1rem, 1.6vw, 1.35rem);
      font-weight: 700;
      color: var(--yumia-primary);
      margin-bottom: 0.2rem;
    }

    /* Metrics */
    .yumia-metric {
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 14px;
      padding: clamp(1.4rem, 2.5vw, 2.4rem) clamp(1rem, 2vw, 1.8rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.5rem;
      height: 100%;
      min-height: 150px;
      box-sizing: border-box;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .yumia-metric:hover {
      transform: translateY(-2px);
    }

    .yumia-metric[data-variant="primary"] { border-color: var(--yumia-primary); }
    .yumia-metric[data-variant="primary"] .yumia-metric-value { color: var(--yumia-primary); }
    .yumia-metric[data-variant="success"] { border-color: var(--yumia-success); }
    .yumia-metric[data-variant="success"] .yumia-metric-value { color: var(--yumia-success); }
    .yumia-metric[data-variant="accent"] { border-color: var(--yumia-accent); }
    .yumia-metric[data-variant="accent"] .yumia-metric-value { color: var(--yumia-accent); }
    .yumia-metric[data-variant="info"] { border-color: var(--yumia-info); }
    .yumia-metric[data-variant="info"] .yumia-metric-value { color: var(--yumia-info); }
    .yumia-metric[data-variant="warning"] { border-color: var(--yumia-warning); }
    .yumia-metric[data-variant="warning"] .yumia-metric-value { color: var(--yumia-warning); }
    .yumia-metric[data-variant="danger"] { border-color: var(--yumia-danger); }
    .yumia-metric[data-variant="danger"] .yumia-metric-value { color: var(--yumia-danger); }

    .yumia-metric-label {
      font-size: clamp(0.72rem, 1vw, 0.9rem);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--yumia-muted);
    }

    .yumia-metric-value {
      font-family: var(--yumia-font-heading);
      font-size: clamp(2.3rem, 4.2vw, 3.8rem);
      font-weight: 800;
      line-height: 1.05;
      color: var(--yumia-primary);
    }

    .yumia-metric-change {
      font-size: clamp(0.8rem, 1.1vw, 1rem);
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
    }
    .yumia-metric-change.positive { color: var(--yumia-success); }
    .yumia-metric-change.negative { color: var(--yumia-danger); }

    /* Chart Containers */
    .yumia-chart-container {
      width: 100%;
      flex: 1;
      min-height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 14px;
      padding: clamp(1rem, 2vw, 1.6rem);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .yumia-chart-title {
      font-family: var(--yumia-font-heading);
      font-size: clamp(1.1rem, 1.5vw, 1.35rem);
      font-weight: 700;
      color: var(--yumia-primary);
      margin-bottom: 0.6rem;
      text-align: center;
    }

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
      gap: 10px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      padding: 6px 14px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 2500;
      font-size: 13px;
      color: #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    .yumia-btn {
      background: none;
      border: none;
      color: #f8fafc;
      cursor: pointer;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, transform 0.1s ease;
    }

    .yumia-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    .yumia-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: var(--yumia-primary);
      transition: width 0.25s ease;
    }

    /* Badge Directive */
    .yumia-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.1);
      color: var(--yumia-text);
      border: 1px solid var(--yumia-border);
      margin-bottom: 0.5rem;
    }
    .yumia-badge.variant-primary { background: rgba(0, 240, 255, 0.15); color: var(--yumia-primary); border-color: var(--yumia-primary); }
    .yumia-badge.variant-success { background: rgba(16, 185, 129, 0.15); color: var(--yumia-success); border-color: var(--yumia-success); }
    .yumia-badge.variant-warning { background: rgba(245, 158, 11, 0.15); color: var(--yumia-warning); border-color: var(--yumia-warning); }
    .yumia-badge.variant-danger { background: rgba(239, 68, 68, 0.15); color: var(--yumia-danger); border-color: var(--yumia-danger); }
    .yumia-badge.variant-info { background: rgba(59, 130, 246, 0.15); color: var(--yumia-info); border-color: var(--yumia-info); }
    .yumia-badge.variant-accent { background: rgba(255, 46, 136, 0.15); color: var(--yumia-accent); border-color: var(--yumia-accent); }

    /* Timeline Directive */
    .yumia-timeline {
      display: flex;
      gap: 16px;
      margin: 1.2rem 0;
      width: 100%;
    }
    .yumia-timeline.layout-horizontal {
      flex-direction: row;
      justify-content: space-between;
      position: relative;
    }
    .yumia-timeline.layout-horizontal::before {
      content: '';
      position: absolute;
      top: 18px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: var(--yumia-border);
      z-index: 0;
    }
    .yumia-timeline-item {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      flex: 1;
    }
    .yumia-timeline-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--yumia-primary);
      border: 3px solid var(--yumia-bg);
      box-shadow: 0 0 10px var(--yumia-primary);
      margin-bottom: 10px;
    }
    .yumia-timeline-date {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--yumia-accent);
      margin-bottom: 4px;
      font-family: var(--yumia-font-code);
    }
    .yumia-timeline-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--yumia-text);
      margin-bottom: 4px;
    }
    .yumia-timeline-desc {
      font-size: 0.85rem;
      color: var(--yumia-muted);
      line-height: 1.4;
    }

    /* Compare Directive */
    .yumia-compare {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: stretch;
      margin: 1.2rem 0;
    }
    .yumia-compare-col {
      background: var(--yumia-surface);
      border: 1px solid var(--yumia-border);
      border-radius: var(--yumia-radius-card);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .yumia-compare-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--yumia-primary);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--yumia-divider);
    }
    .yumia-compare-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--yumia-muted);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      align-self: center;
      border: 1px solid var(--yumia-border);
    }

    /* Native SVG Chart Container */
    .yumia-chart-container {
      background: var(--yumia-surface);
      border: 1px solid var(--yumia-border);
      border-radius: var(--yumia-radius-card);
      padding: 1.25rem;
      margin: 1rem 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .yumia-chart-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--yumia-text);
      margin-bottom: 0.75rem;
      align-self: flex-start;
    }

    /* Mermaid Container */
    .mermaid-container {
      background: rgba(10, 10, 18, 0.6);
      border: 1.5px solid var(--yumia-border);
      border-radius: var(--yumia-radius-card);
      padding: 1.5rem;
      margin: 1rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
      width: 100%;
      min-height: 240px;
    }

    .mermaid-container pre.mermaid,
    .mermaid-container .mermaid {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      font-size: 1rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .mermaid-container svg {
      max-width: 100%;
      height: auto;
      max-height: 420px;
    }

    /* Math Equation Container */
    .yumia-math-container {
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-left: 4px solid var(--yumia-primary);
      border-radius: var(--yumia-radius-card);
      padding: 0.75rem 1.4rem;
      margin: 0.7rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
      overflow-x: auto;
      max-width: 100%;
    }

    .yumia-math-equation {
      font-size: clamp(1.1rem, 1.8vw, 1.45rem);
      color: var(--yumia-text);
      letter-spacing: 0.03em;
    }

    /* Watermark Branding */
    .yumia-watermark {
      position: absolute;
      bottom: 12px;
      left: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--yumia-muted);
      opacity: 0.35;
      pointer-events: none;
      user-select: none;
      z-index: 10;
      transition: opacity 0.2s ease;
    }
    .yumia-slide-wrapper:hover .yumia-watermark {
      opacity: 0.65;
    }

    /* Slide Transitions */
    .yumia-slide-wrapper.transition-fade.active {
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .yumia-slide-wrapper.transition-push.active {
      animation: pushIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .yumia-slide-wrapper.transition-wipe.active {
      animation: wipeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .yumia-slide-wrapper.transition-zoom.active {
      animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes pushIn {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes wipeIn {
      from { clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%); }
      to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Code Block Line Highlighting & Numbers */
    .yumia-code-block {
      display: block;
      padding: 0.75rem 0;
      font-family: var(--yumia-font-code);
      font-size: 0.95rem;
      line-height: 1.6;
      overflow-x: auto;
      border-radius: var(--yumia-radius-card);
      background: rgba(10, 15, 30, 0.88);
      border: 1.5px solid var(--yumia-border);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
      margin: 0.8rem 0;
    }
    .yumia-code-block code {
      display: block;
      padding: 0;
      background: transparent;
      border: none;
    }
    .yumia-code-line {
      display: flex;
      align-items: center;
      min-height: 1.6em;
      padding: 0 1rem;
      transition: background 0.15s ease, opacity 0.15s ease;
    }
    .yumia-code-line.dimmed {
      opacity: 0.35;
    }
    .yumia-code-line.highlighted {
      background: rgba(0, 240, 255, 0.16);
      border-left: 3.5px solid var(--yumia-primary);
      opacity: 1;
      font-weight: 600;
    }
    .yumia-code-line .line-num {
      user-select: none;
      width: 28px;
      margin-right: 14px;
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.8rem;
      text-align: right;
    }
    .yumia-code-line .line-text {
      flex: 1;
    }

    /* Section Divider Card */
    .yumia-section-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 2rem;
      margin: auto 0;
      background: radial-gradient(circle at center, rgba(0, 240, 255, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1.5px solid var(--yumia-primary);
      border-radius: var(--yumia-radius-card);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.2);
      width: 100%;
    }
    .yumia-section-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 14px;
      border-radius: 999px;
      background: var(--yumia-primary);
      color: #000;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 1.2rem;
    }
    .yumia-section-title {
      font-size: clamp(2rem, 3.5vw, 3rem);
      font-weight: 800;
      color: var(--yumia-text);
      margin-bottom: 0.8rem;
      line-height: 1.2;
    }
    .yumia-section-subtitle {
      font-size: 1.15rem;
      color: var(--yumia-muted);
      max-width: 650px;
    }

    /* Table of Contents Grid */
    .yumia-toc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      width: 100%;
      margin: 1.2rem 0;
    }
    .yumia-toc-item {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--yumia-surface);
      border: 1.5px solid var(--yumia-border);
      border-radius: 10px;
      padding: 14px 18px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .yumia-toc-item:hover {
      transform: translateX(4px);
      border-color: var(--yumia-primary);
    }
    .yumia-toc-num {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(0, 240, 255, 0.15);
      color: var(--yumia-primary);
      font-weight: 800;
      font-size: 0.95rem;
    }
    .yumia-toc-title {
      font-weight: 600;
      font-size: 1.05rem;
      color: var(--yumia-text);
    }

    /* Print & Export Media Styles */
    @media print {
      @page {
        size: landscape;
        margin: 0;
      }
      body {
        background: #0f172a !important;
        color: #f8fafc !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #deck-container {
        display: block !important;
        width: 100% !important;
        height: auto !important;
      }
      #yumia-deck {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
      }
      .yumia-slide-wrapper {
        display: flex !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        position: relative !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        margin: 0 !important;
        box-shadow: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }
      .yumia-controls, .yumia-notes-drawer, .yumia-overview-modal, .yumia-progress-bar {
        display: none !important;
      }
    }

    /* Notes Drawer */
    .yumia-notes-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 260px;
      background: rgba(10, 10, 18, 0.96);
      backdrop-filter: blur(16px);
      border-top: 2px solid var(--yumia-primary);
      padding: 14px 24px 18px 24px;
      overflow-y: auto;
      display: none;
      z-index: 2000;
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
    }

    .yumia-notes-drawer.open {
      display: block;
    }

    .yumia-notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 700;
      font-size: 14px;
      color: var(--yumia-primary);
    }

    .yumia-notes-content {
      padding-right: 200px;
    }

    /* Slide Overview Modal */
    .yumia-overview-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 5, 10, 0.94);
      backdrop-filter: blur(20px);
      z-index: 3000;
      display: none;
      flex-direction: column;
      padding: 40px;
      overflow-y: auto;
    }

    .yumia-overview-modal.open {
      display: flex;
    }

    .yumia-overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      color: #fff;
    }

    .yumia-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      width: 100%;
    }

    .yumia-overview-card {
      aspect-ratio: var(--yumia-ratio);
      background-color: var(--yumia-bg);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transform-origin: center;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    .yumia-overview-card:hover {
      transform: scale(1.04);
      border-color: var(--yumia-primary);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px var(--yumia-primary);
    }

    .yumia-overview-card.current {
      border-color: var(--yumia-accent);
      box-shadow: 0 0 0 2px var(--yumia-accent);
    }

    .yumia-overview-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }

    /* Speaker View Layout (When loaded in speaker mode ?speaker=true) */
    .speaker-layout {
      display: grid;
      grid-template-rows: 60px 1fr;
      width: 100vw;
      height: 100vh;
      background: #09090f;
      color: #f8fafc;
      overflow: hidden;
    }

    .speaker-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      background: #11111b;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .speaker-timer-group {
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: var(--yumia-font-code);
      font-size: 18px;
    }

    .speaker-timer-btn {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .speaker-timer-btn:hover {
      background: var(--yumia-primary);
    }

    .speaker-main-grid {
      display: grid;
      grid-template-columns: 55% 45%;
      gap: 20px;
      padding: 20px;
      height: calc(100vh - 60px);
      box-sizing: border-box;
    }

    .speaker-pane {
      background: #151522;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .speaker-pane-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--yumia-muted);
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }

    .speaker-preview-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
    }

    .speaker-preview-box .yumia-slide-wrapper {
      display: flex !important;
      transform: scale(0.6);
      width: 160% !important;
      height: 160% !important;
    }

    /* Visual Inspector Overlay */
    body.yumia-inspect-active * {
      cursor: crosshair !important;
    }
    .yumia-inspect-highlight {
      outline: 2px dashed var(--yumia-accent) !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 15px var(--yumia-accent) !important;
    }
    .yumia-inspector-popup {
      position: fixed;
      bottom: 60px;
      right: 20px;
      z-index: 9999;
      background: rgba(10, 15, 30, 0.95);
      backdrop-filter: blur(16px);
      border: 1.5px solid var(--yumia-primary);
      border-radius: 10px;
      padding: 12px 18px;
      color: #fff;
      font-size: 13px;
      font-family: var(--yumia-font-code);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.25);
      display: none;
      max-width: 380px;
      line-height: 1.5;
    }
    .yumia-inspector-popup.open {
      display: block;
    }
  </style>
</head>
<body>
  <div id="deck-container">
    <div id="yumia-deck">
      ${slidesHtml}
    </div>

    <div class="yumia-controls" id="deck-controls">
      <button class="yumia-btn" id="btn-prev" title="Previous Slide (←)">◀</button>
      <span id="slide-indicator">1 / ${presentation.slides.length}</span>
      <button class="yumia-btn" id="btn-next" title="Next Slide (→)">▶</button>
      <button class="yumia-btn" id="btn-overview" title="Slide Overview (ESC / O)">▦</button>
      <button class="yumia-btn" id="btn-speaker" title="Speaker View (S)">🎤</button>
      <button class="yumia-btn" id="btn-inspect" title="Visual Inspector (I / Alt+Click)">🔍</button>
      <button class="yumia-btn" id="btn-print" title="Stampa / Salva PDF (Ctrl+P)">🖨️</button>
      <button class="yumia-btn" id="btn-notes" title="Toggle Notes (N)">📝</button>
      <button class="yumia-btn" id="btn-fs" title="Fullscreen (F)">⛶</button>
    </div>
    <div id="inspector-popup" class="yumia-inspector-popup"></div>

    <div id="notes-drawer" class="yumia-notes-drawer">
      <div class="yumia-notes-header">
        <span>📝 Speaker Notes</span>
        <button class="yumia-btn" id="btn-close-notes" title="Close Notes (N / ESC)" style="font-size: 13px; padding: 2px 8px; border: 1px solid rgba(255,255,255,0.2);">✕ Close</button>
      </div>
      <div id="notes-drawer-content" class="yumia-notes-content"></div>
    </div>

    <div id="overview-modal" class="yumia-overview-modal">
      <div class="yumia-overview-header">
        <h2>Slide Overview</h2>
        <button class="yumia-btn" id="btn-close-overview" style="font-size: 18px;">✕ Close (ESC)</button>
      </div>
      <div class="yumia-overview-grid" id="overview-grid"></div>
    </div>
  </div>

  <script>
    (function() {
      const isSpeakerMode = new URLSearchParams(window.location.search).get('speaker') === 'true';
      const slides = Array.from(document.querySelectorAll('.yumia-slide-wrapper'));
      const indicator = document.getElementById('slide-indicator');
      const notesDrawer = document.getElementById('notes-drawer');
      const overviewModal = document.getElementById('overview-modal');
      const overviewGrid = document.getElementById('overview-grid');
      let currentIdx = 0;

      // Real-time synchronization channel
      let syncChannel = null;
      try {
        syncChannel = new BroadcastChannel('yumia_presentation_sync');
        syncChannel.onmessage = function(e) {
          if (e.data && typeof e.data.index === 'number') {
            goToSlide(e.data.index, false);
          }
        };
      } catch (err) {
        // Fallback if BroadcastChannel unavailable
      }

      function buildOverviewGrid() {
        if (!overviewGrid) return;
        overviewGrid.innerHTML = '';
        slides.forEach((slide, idx) => {
          const card = document.createElement('div');
          card.className = 'yumia-overview-card' + (idx === currentIdx ? ' current' : '');
          const badge = document.createElement('span');
          badge.className = 'yumia-overview-badge';
          badge.textContent = (idx + 1);
          
          const heading = slide.querySelector('h1, h2, h3');
          const titleText = heading ? heading.textContent : 'Slide ' + (idx + 1);
          
          const titleDiv = document.createElement('div');
          titleDiv.style.fontWeight = '600';
          titleDiv.style.fontSize = '14px';
          titleDiv.style.color = 'var(--yumia-primary)';
          titleDiv.textContent = titleText;

          card.appendChild(badge);
          card.appendChild(titleDiv);

          card.addEventListener('click', () => {
            goToSlide(idx);
            toggleOverview(false);
          });
          overviewGrid.appendChild(card);
        });
      }

      function toggleOverview(force) {
        if (!overviewModal) return;
        const isOpen = force !== undefined ? force : !overviewModal.classList.contains('open');
        if (isOpen) {
          buildOverviewGrid();
          overviewModal.classList.add('open');
        } else {
          overviewModal.classList.remove('open');
        }
      }

      function goToSlide(newIdx, broadcast = true) {
        if (newIdx < 0 || newIdx >= slides.length) return;
        slides[currentIdx]?.classList.remove('active');
        currentIdx = newIdx;
        slides[currentIdx]?.classList.add('active');

        if (indicator) {
          indicator.textContent = (currentIdx + 1) + ' / ' + slides.length;
        }

        const currentSlide = slides[currentIdx];
        const notes = currentSlide ? currentSlide.getAttribute('data-notes') : '';
        const notesContent = document.getElementById('notes-drawer-content');
        if (notesContent) {
          notesContent.innerHTML = notes ? notes : '<em>No speaker notes for this slide.</em>';
        }

        window.location.hash = '#' + (currentIdx + 1);

        if (broadcast && syncChannel) {
          syncChannel.postMessage({ index: currentIdx });
        }

        setTimeout(() => {
          if (window.renderMermaidInSlide && slides[currentIdx]) {
            window.renderMermaidInSlide(slides[currentIdx]);
          }
          if (slides[currentIdx]) {
            renderMathInSlide(slides[currentIdx]);
          }
        }, 50);
      }

      function renderMathInSlide(slideEl) {
        if (!slideEl) return;
        if (window.renderMathInElement) {
          try {
            window.renderMathInElement(slideEl, {
              delimiters: [
                { left: '$$', right: '$$', display: true }
              ],
              throwOnError: false
            });
          } catch (e) {
            console.warn('KaTeX auto-render notice:', e);
          }
        }
        if (window.katex) {
          slideEl.querySelectorAll('.yumia-math-equation:not([data-katex="true"])').forEach(function(el) {
            try {
              const rawExpr =
                el.getAttribute('data-expr') || el.textContent.replace(/^[$]{2}|[$]{2}$/g, '').trim();
              window.katex.render(rawExpr, el, { displayMode: true, throwOnError: false });
              el.setAttribute('data-katex', 'true');
            } catch (err) {
              console.warn('KaTeX equation render notice:', err);
            }
          });
        }
      }

      function openSpeakerWindow() {
        const url = new URL(window.location.href);
        url.searchParams.set('speaker', 'true');
        window.open(url.toString(), 'yumia_speaker_' + Date.now(), 'width=1180,height=760,menubar=no,toolbar=no');
      }

      function initSpeakerLayout() {
        document.body.innerHTML = \`
          <div class="speaker-layout">
            <div class="speaker-topbar">
              <div style="font-weight:700; color:var(--yumia-primary); display:flex; align-items:center; gap:8px;">
                <span>🎙️ YumiaMD Speaker View</span>
              </div>
              <div class="speaker-timer-group">
                <span id="speaker-clock">00:00:00</span>
                <span style="color:var(--yumia-muted);">|</span>
                <span id="speaker-timer" style="color:var(--yumia-accent);">00:00</span>
                <button class="speaker-timer-btn" id="btn-timer-toggle">Pause</button>
                <button class="speaker-timer-btn" id="btn-timer-reset">Reset</button>
              </div>
              <div>
                <span id="speaker-slide-num" style="font-weight:600;">1 / \${slides.length}</span>
              </div>
            </div>
            <div class="speaker-main-grid">
              <div class="speaker-pane">
                <div class="speaker-pane-title">Current Slide</div>
                <div class="speaker-preview-box" id="speaker-current-box"></div>
              </div>
              <div style="display:grid; grid-template-rows: 45% 55%; gap:20px;">
                <div class="speaker-pane">
                  <div class="speaker-pane-title">Next Slide Preview</div>
                  <div class="speaker-preview-box" id="speaker-next-box"></div>
                </div>
                <div class="speaker-pane">
                  <div class="speaker-pane-title">Speaker Notes</div>
                  <div class="speaker-notes-box" id="speaker-notes-content"></div>
                </div>
              </div>
            </div>
          </div>
        \`;

        // Live Clock
        setInterval(() => {
          const now = new Date();
          const clockEl = document.getElementById('speaker-clock');
          if (clockEl) clockEl.textContent = now.toLocaleTimeString();
        }, 1000);

        // Elapsed Timer
        let elapsedSeconds = 0;
        let timerRunning = true;
        let timerInterval = setInterval(() => {
          if (!timerRunning) return;
          elapsedSeconds++;
          const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
          const secs = String(elapsedSeconds % 60).padStart(2, '0');
          const timerEl = document.getElementById('speaker-timer');
          if (timerEl) timerEl.textContent = \`\${mins}:\${secs}\`;
        }, 1000);

        document.getElementById('btn-timer-toggle')?.addEventListener('click', (e) => {
          timerRunning = !timerRunning;
          e.target.textContent = timerRunning ? 'Pause' : 'Start';
        });

        document.getElementById('btn-timer-reset')?.addEventListener('click', () => {
          elapsedSeconds = 0;
          const timerEl = document.getElementById('speaker-timer');
          if (timerEl) timerEl.textContent = '00:00';
        });

        function updateSpeakerView(idx) {
          currentIdx = idx;
          const numEl = document.getElementById('speaker-slide-num');
          if (numEl) numEl.textContent = (currentIdx + 1) + ' / ' + slides.length;

          // Render current slide
          const curBox = document.getElementById('speaker-current-box');
          if (curBox && slides[currentIdx]) {
            curBox.innerHTML = slides[currentIdx].outerHTML;
            curBox.firstElementChild?.classList.add('active');
          }

          // Render next slide
          const nextBox = document.getElementById('speaker-next-box');
          if (nextBox) {
            if (slides[currentIdx + 1]) {
              nextBox.innerHTML = slides[currentIdx + 1].outerHTML;
              nextBox.firstElementChild?.classList.add('active');
            } else {
              nextBox.innerHTML = '<div style="color:var(--yumia-muted); font-size:14px;">End of presentation</div>';
            }
          }

          // Render notes
          const notesBox = document.getElementById('speaker-notes-content');
          if (notesBox && slides[currentIdx]) {
            const rawNotes = slides[currentIdx].getAttribute('data-notes');
            notesBox.innerHTML = rawNotes ? rawNotes : '<em style="color:var(--yumia-muted);">No notes provided for this slide.</em>';
          }

          setTimeout(() => {
            if (window.renderMermaidInSlide) {
              if (curBox) window.renderMermaidInSlide(curBox);
              if (nextBox) window.renderMermaidInSlide(nextBox);
            }
          }, 50);
        }

        window.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            if (currentIdx < slides.length - 1) {
              goToSlide(currentIdx + 1);
              updateSpeakerView(currentIdx);
            }
          } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
            e.preventDefault();
            if (currentIdx > 0) {
              goToSlide(currentIdx - 1);
              updateSpeakerView(currentIdx);
            }
          }
        });

        if (syncChannel) {
          syncChannel.onmessage = (e) => {
            if (e.data && typeof e.data.index === 'number') {
              updateSpeakerView(e.data.index);
            }
          };
        }

        const initialHash = parseInt(window.location.hash.replace('#', ''), 10) - 1;
        updateSpeakerView(isNaN(initialHash) ? 0 : initialHash);
      }

      function init() {
        if (isSpeakerMode) {
          initSpeakerLayout();
          return;
        }

        const hash = window.location.hash.replace('#', '');
        const initialIdx = parseInt(hash, 10) - 1;
        goToSlide(isNaN(initialIdx) ? 0 : initialIdx, false);
        setTimeout(() => {
          slides.forEach(renderMathInSlide);
        }, 100);
      }

      window.addEventListener('load', () => {
        slides.forEach(renderMathInSlide);
      });

      window.deckController = {
        init: init,
        next: function() { goToSlide(currentIdx + 1); },
        prev: function() { goToSlide(currentIdx - 1); },
        toggleNotes: function() { notesDrawer?.classList.toggle('open'); },
        toggleOverview: function() { toggleOverview(); },
        toggleInspect: function() {
          const isActive = document.body.classList.toggle('yumia-inspect-active');
          const popup = document.getElementById('inspector-popup');
          if (!isActive && popup) {
            popup.classList.remove('open');
            document.querySelectorAll('.yumia-inspect-highlight').forEach((el) => el.classList.remove('yumia-inspect-highlight'));
          }
        },
        openSpeaker: openSpeakerWindow,
        print: function() { window.print(); },
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
      document.getElementById('btn-inspect')?.addEventListener('click', window.deckController.toggleInspect);
      document.getElementById('btn-close-notes')?.addEventListener('click', () => {
        notesDrawer?.classList.remove('open');
      });
      document.getElementById('btn-overview')?.addEventListener('click', window.deckController.toggleOverview);
      document.getElementById('btn-close-overview')?.addEventListener('click', () => toggleOverview(false));
      document.getElementById('btn-speaker')?.addEventListener('click', window.deckController.openSpeaker);
      document.getElementById('btn-print')?.addEventListener('click', window.deckController.print);
      document.getElementById('btn-fs')?.addEventListener('click', window.deckController.toggleFs);

      // Interactive Element Inspector Hover & Click
      document.addEventListener('mouseover', function(e) {
        if (!document.body.classList.contains('yumia-inspect-active')) return;
        const target = e.target.closest('[data-yumia-role], .yumia-card, .yumia-metric, .yumia-hero, .yumia-callout, .yumia-grid, .yumia-stack, h1, h2, h3, p, img, pre');
        if (!target || target.closest('#deck-controls') || target.closest('#inspector-popup')) return;

        document.querySelectorAll('.yumia-inspect-highlight').forEach((el) => el.classList.remove('yumia-inspect-highlight'));
        target.classList.add('yumia-inspect-highlight');

        const popup = document.getElementById('inspector-popup');
        if (popup) {
          const role = target.getAttribute('data-yumia-role') || target.tagName.toLowerCase();
          const variant = target.getAttribute('data-variant') || target.getAttribute('data-severity') || 'default';
          const loc = target.getAttribute('data-yumia-loc') || 'slide ' + (currentIdx + 1);
          popup.innerHTML = \`
            <div style="color:var(--yumia-primary); font-weight:800; font-size:14px; margin-bottom:4px;">🔍 \${role.toUpperCase()}</div>
            <div><strong>Variant:</strong> <span style="color:var(--yumia-accent);">\${variant}</span></div>
            <div><strong>Location:</strong> \${loc}</div>
            <div style="margin-top:6px; font-size:11px; color:var(--yumia-muted);">Press 'I' to exit inspector</div>
          \`;
          popup.classList.add('open');
        }
      });

      window.addEventListener('keydown', function(e) {
        if (overviewModal && overviewModal.classList.contains('open')) {
          if (e.key === 'Escape' || e.key.toLowerCase() === 'o') {
            toggleOverview(false);
          }
          return;
        }

        if (e.key === 'Escape') {
          if (notesDrawer && notesDrawer.classList.contains('open')) {
            notesDrawer.classList.remove('open');
            return;
          }
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
          // let default browser print work or call print explicitly
          return;
        }

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key.toLowerCase() === 'l') {
          e.preventDefault();
          window.deckController.next();
        } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp' || e.key.toLowerCase() === 'h') {
          e.preventDefault();
          window.deckController.prev();
        } else if (e.key.toLowerCase() === 'f') {
          window.deckController.toggleFs();
        } else if (e.key.toLowerCase() === 's') {
          window.deckController.openSpeaker();
        } else if (e.key.toLowerCase() === 'p') {
          window.deckController.print();
        } else if (e.key.toLowerCase() === 'n') {
          window.deckController.toggleNotes();
        } else if (e.key.toLowerCase() === 'i') {
          window.deckController.toggleInspect();
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'o') {
          window.deckController.toggleOverview();
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
    theme: YumiaTheme,
    watermarkOpt?: boolean | string,
    presentation?: Presentation
  ): string {
    const activeClass = slideNum === 1 ? 'active' : '';
    const notesAttr = slide.notes ? this.escapeHtml(slide.notes.replace(/\n/g, '<br>')) : '';
    const progressPercent = Math.round((slideNum / totalSlides) * 100);

    const transition = slide.transition || 'fade';
    const transType = typeof transition === 'string' ? transition : transition.type;
    const transClass = `transition-${transType || 'fade'}`;

    const isWatermarkEnabled =
      watermarkOpt !== undefined &&
      watermarkOpt !== false &&
      watermarkOpt !== 'none' &&
      watermarkOpt !== 'false' &&
      watermarkOpt !== 'off';
    const watermarkText =
      typeof watermarkOpt === 'string' &&
      watermarkOpt.trim().length > 0 &&
      watermarkOpt !== 'true' &&
      watermarkOpt !== 'yes' &&
      watermarkOpt !== 'on'
        ? watermarkOpt
        : 'Yumia';
    const watermarkHtml = isWatermarkEnabled
      ? `<div class="yumia-watermark">${this.escapeHtml(watermarkText)}</div>`
      : '';

    const elementsHtml = slide.elements
      .map((el) => this.renderElement(el, theme, presentation))
      .join('\n');

    return `
    <div class="yumia-slide-wrapper ${activeClass} ${transClass}" id="slide-${slideNum}" data-notes="${notesAttr}">
      ${elementsHtml}
      ${watermarkHtml}
      <div class="yumia-progress-bar" style="width: ${progressPercent}%;"></div>
    </div>`;
  }

  private renderElement(
    element: SlideElement,
    theme: YumiaTheme,
    presentation?: Presentation
  ): string {
    switch (element.type) {
      case 'hero': {
        const hero = element as HeroElement;
        const align = hero.align || 'center';
        const tagHtml = hero.tagline
          ? `<div class="yumia-hero-tagline" style="display:inline-flex; align-items:center; padding:4px 14px; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid var(--yumia-primary); color:var(--yumia-primary); font-size:0.85rem; font-weight:700; margin-bottom:1rem; letter-spacing:0.06em; text-transform:uppercase;">${this.formatInline(hero.tagline)}</div>`
          : '';
        const titleHtml = `<h1 class="yumia-hero-title" style="font-size:clamp(2.4rem, 4.5vw, 4rem); font-weight:800; line-height:1.1; color:var(--yumia-text); margin-bottom:0.8rem;">${this.formatInline(hero.title)}</h1>`;
        const subHtml = hero.subtitle
          ? `<p class="yumia-hero-subtitle" style="font-size:clamp(1.1rem, 1.8vw, 1.5rem); color:var(--yumia-muted); max-width:800px; margin-bottom:1.5rem; line-height:1.5;">${this.formatInline(hero.subtitle)}</p>`
          : '';
        const innerHtml = hero.elements
          ? hero.elements.map((child) => this.renderElement(child, theme, presentation)).join('\n')
          : '';

        return `
        <div class="yumia-hero" data-align="${align}" data-yumia-role="hero" style="display:flex; flex-direction:column; align-items:${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}; text-align:${align}; justify-content:center; flex:1; width:100%; margin:auto 0;">
          ${tagHtml}
          ${titleHtml}
          ${subHtml}
          ${innerHtml ? `<div style="width:100%; margin-top:1rem;">${innerHtml}</div>` : ''}
        </div>`;
      }

      case 'callout': {
        const c = element as CalloutElement;
        const sev = c.severity || 'info';
        const colorVar =
          sev === 'warning'
            ? 'var(--yumia-warning)'
            : sev === 'danger'
              ? 'var(--yumia-danger)'
              : sev === 'success'
                ? 'var(--yumia-success)'
                : 'var(--yumia-info)';
        const titleHtml = c.title
          ? `<div style="font-weight:700; font-size:1.05rem; color:${colorVar}; margin-bottom:4px;">${this.formatInline(c.title)}</div>`
          : '';

        return `
        <div class="yumia-callout" data-severity="${sev}" data-yumia-role="callout" style="background:var(--yumia-surface); border-left:4px solid ${colorVar}; border-radius:var(--yumia-radius-card); padding:1rem 1.4rem; margin:0.8rem 0; width:100%;">
          ${titleHtml}
          <div style="font-size:0.95rem; color:var(--yumia-text); line-height:1.5;">${this.formatInline(c.text)}</div>
        </div>`;
      }

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
        const lines = c.code.split('\n');
        if (c.highlight) {
          const highlightSet = new Set<number>();
          const parts = c.highlight.split(',');
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            if (trimmed.includes('-')) {
              const [startStr, endStr] = trimmed.split('-');
              const start = parseInt(startStr || '0', 10);
              const end = parseInt(endStr || '0', 10);
              if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let n = start; n <= end; n++) highlightSet.add(n);
              }
            } else {
              const num = parseInt(trimmed, 10);
              if (!isNaN(num)) highlightSet.add(num);
            }
          }
          const linesHtml = lines
            .map((line, idx) => {
              const lineNum = idx + 1;
              const isHl = highlightSet.has(lineNum);
              const hlClass = isHl ? 'highlighted' : 'dimmed';
              return `<div class="yumia-code-line ${hlClass}"><span class="line-num">${lineNum}</span><span class="line-text">${this.escapeHtml(line) || '&nbsp;'}</span></div>`;
            })
            .join('');
          return `<pre class="yumia-code-block"><code ${langClass}>${linesHtml}</code></pre>`;
        }
        return `<pre><code ${langClass}>${this.escapeHtml(c.code)}</code></pre>`;
      }
      case 'section': {
        const s = element as SectionElement;
        const numStr =
          s.number !== undefined
            ? `<div class="yumia-section-pill">SECTION ${this.escapeHtml(String(s.number))}</div>`
            : '';
        const subStr = s.subtitle
          ? `<div class="yumia-section-subtitle">${this.formatInline(s.subtitle)}</div>`
          : '';
        return `
        <div class="yumia-section-card">
          ${numStr}
          <div class="yumia-section-title">${this.formatInline(s.title)}</div>
          ${subStr}
        </div>`;
      }
      case 'toc': {
        const t = element as TocElement;
        const items = t.items ? [...t.items] : [];
        if (items.length === 0 && presentation) {
          let autoSecIdx = 1;
          for (const s of presentation.slides) {
            for (const el of s.elements) {
              if (el.type === 'section') {
                const sec = el as SectionElement;
                items.push({
                  number: sec.number !== undefined ? String(sec.number) : String(autoSecIdx++),
                  title: sec.title,
                  description: sec.subtitle,
                });
              }
            }
          }
          if (items.length === 0) {
            presentation.slides.forEach((s, idx) => {
              const heading = s.elements.find((el) => el.type === 'heading') as
                HeadingElement | undefined;
              if (heading) {
                items.push({
                  number: String(idx + 1),
                  title: heading.text,
                });
              }
            });
          }
        }
        const titleHtml = t.title
          ? `<h2 style="margin-bottom:1.5rem;">${this.escapeHtml(t.title)}</h2>`
          : '';
        const itemsHtml = items
          .map((it, idx) => {
            const num = it.number !== undefined ? String(it.number) : String(idx + 1);
            const descText = it.description || it.subtitle;
            const desc = descText
              ? `<div style="font-size:0.85rem; color:var(--yumia-muted); margin-top:2px;">${this.formatInline(descText)}</div>`
              : '';
            return `
          <div class="yumia-toc-item">
            <div class="yumia-toc-num">${this.escapeHtml(num)}</div>
            <div>
              <div class="yumia-toc-title">${this.formatInline(it.title)}</div>
              ${desc}
            </div>
          </div>`;
          })
          .join('\n');
        return `
        <div class="yumia-toc-container">
          ${titleHtml}
          <div class="yumia-toc-grid">
            ${itemsHtml}
          </div>
        </div>`;
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
        const width = img.width
          ? typeof img.width === 'number'
            ? `${img.width}px`
            : img.width
          : '100%';
        const height = img.height
          ? typeof img.height === 'number'
            ? `${img.height}px`
            : img.height
          : 'auto';
        const fit = img.fit || 'cover';
        const radius =
          img.radius !== undefined
            ? typeof img.radius === 'number'
              ? `${img.radius}px`
              : img.radius
            : 'var(--yumia-radius-card)';
        const shadowStyle = img.shadow ? 'box-shadow: 0 12px 30px rgba(0,0,0,0.45);' : '';
        const aspect = img.aspectRatio ? `aspect-ratio: ${img.aspectRatio};` : '';
        const cap = img.caption
          ? `<figcaption style="margin-top: 6px; font-size: 0.85rem; color: var(--yumia-muted); text-align: center;">${this.formatInline(img.caption)}</figcaption>`
          : '';

        return `
        <figure class="yumia-image-wrapper" style="margin: 0.4rem 0; width: ${width}; max-width: 100%; display: flex; flex-direction: column; align-items: center;">
          <img src="${this.escapeHtml(img.src)}" ${alt} style="width: 100%; height: ${height}; object-fit: ${fit}; border-radius: ${radius}; ${aspect} ${shadowStyle} border: 1.5px solid var(--yumia-border);">
          ${cap}
        </figure>`;
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
      case 'badge': {
        return this.renderBadge(element as BadgeElement);
      }
      case 'mermaid': {
        const m = element as MermaidElement;
        return `
        <div class="mermaid-container">
          <pre class="mermaid">${this.escapeHtml(m.code)}</pre>
        </div>`;
      }
      case 'math': {
        const mathEl = element as MathElement;
        const expr = mathEl.expression;
        return `
        <div class="yumia-math-container">
          <div class="yumia-math-equation" data-expr="${this.escapeHtml(expr)}">$$${this.escapeHtml(expr)}$$</div>
        </div>`;
      }
      case 'chart': {
        return this.renderChart(element as ChartElement, theme);
      }
      case 'timeline': {
        return this.renderTimeline(element as TimelineElement);
      }
      case 'icon': {
        const ic = element as IconElement;
        const iconSvg = defaultIconResolver.toSvg(
          ic.name,
          ic.size || 28,
          ic.color || 'currentColor',
          'yumia-icon'
        );
        return `<span class="yumia-icon-wrapper" style="display:inline-flex; align-items:center; vertical-align:middle;">${iconSvg}</span>`;
      }
      case 'grid': {
        const g = element as GridElement;
        const cols =
          typeof g.columns === 'number' ? `repeat(${g.columns}, minmax(0, 1fr))` : g.columns;
        const gap =
          g.gap !== undefined ? (typeof g.gap === 'number' ? `${g.gap}px` : g.gap) : '1.5rem';
        const inner = g.elements
          .map((child) => this.renderElement(child, theme, presentation))
          .join('\n');
        return `<div class="yumia-grid" style="grid-template-columns:${cols}; gap:${gap};">${inner}</div>`;
      }
      case 'stack': {
        const st = element as StackElement;
        const isHoriz = st.direction === 'horizontal';
        const dir = isHoriz ? 'row' : 'column';
        const gap =
          st.gap !== undefined ? (typeof st.gap === 'number' ? `${st.gap}px` : st.gap) : '1.5rem';
        const align = st.align ? `align-items:${st.align};` : '';
        const justify = st.justify ? `justify-content:${st.justify};` : '';
        const inner = st.elements
          .map((child) => this.renderElement(child, theme, presentation))
          .join('\n');
        return `<div class="yumia-stack ${isHoriz ? 'stack-horizontal' : 'stack-vertical'}" style="flex-direction:${dir}; gap:${gap}; ${align} ${justify}">${inner}</div>`;
      }
      case 'compare': {
        return this.renderCompare(element as CompareElement, theme);
      }
      default:
        return '';
    }
  }

  private renderBadge(b: BadgeElement): string {
    const variant = b.variant || 'default';
    return `<span class="yumia-badge variant-${variant}">${this.escapeHtml(b.text)}</span>`;
  }

  private renderTimeline(t: TimelineElement): string {
    const layout = t.layout || 'horizontal';
    const itemsHtml = t.items
      .map((item) => {
        const dateHtml = item.date
          ? `<div class="yumia-timeline-date">${this.escapeHtml(item.date)}</div>`
          : '';
        const descHtml = item.description
          ? `<div class="yumia-timeline-desc">${this.formatInline(item.description)}</div>`
          : '';
        return `
        <div class="yumia-timeline-item">
          <div class="yumia-timeline-dot"></div>
          ${dateHtml}
          <div class="yumia-timeline-title">${this.formatInline(item.title)}</div>
          ${descHtml}
        </div>`;
      })
      .join('\n');

    return `<div class="yumia-timeline layout-${layout}">${itemsHtml}</div>`;
  }

  private renderCompare(c: CompareElement, theme: YumiaTheme): string {
    const leftTitle = c.leftTitle
      ? `<div class="yumia-compare-title">${this.escapeHtml(c.leftTitle)}</div>`
      : '';
    const rightTitle = c.rightTitle
      ? `<div class="yumia-compare-title">${this.escapeHtml(c.rightTitle)}</div>`
      : '';
    const leftInner = c.left.map((el) => this.renderElement(el, theme)).join('\n');
    const rightInner = c.right.map((el) => this.renderElement(el, theme)).join('\n');

    return `
    <div class="yumia-compare">
      <div class="yumia-compare-col left">
        ${leftTitle}
        ${leftInner}
      </div>
      <div class="yumia-compare-divider">VS</div>
      <div class="yumia-compare-col right">
        ${rightTitle}
        ${rightInner}
      </div>
    </div>`;
  }

  private renderChart(c: ChartElement, theme: YumiaTheme): string {
    const titleHtml = c.title
      ? `<div class="yumia-chart-title">${this.escapeHtml(c.title)}</div>`
      : '';
    const labels = c.labels || [];
    const series = c.series || [];
    const colors = [
      theme.colors.primary || '#00F0FF',
      theme.colors.accent || '#FF2E88',
      theme.colors.secondary || '#7B2CBF',
      theme.colors.success || '#10B981',
      theme.colors.warning || '#F59E0B',
    ];

    if (c.chartType === 'line') {
      const allValues = series.flatMap((s) => s.values);
      const maxVal = Math.max(...allValues, 1);
      const width = 640;
      const height = 240;
      const padding = 45;
      const plotW = width - padding * 2;
      const plotH = height - padding * 2;

      const gridLines = [0.25, 0.5, 0.75, 1.0]
        .map((ratio) => {
          const y = height - padding - ratio * plotH;
          const valLabel = Math.round(ratio * maxVal);
          return `
          <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4" />
          <text x="${padding - 8}" y="${y + 4}" text-anchor="end" fill="${theme.colors.muted || '#64748b'}" font-size="10" font-family="sans-serif">${valLabel}</text>`;
        })
        .join('');

      let pathsHtml = '';
      series.forEach((s, sIdx) => {
        const sColor = s.color || colors[sIdx % colors.length]!;
        const pts = s.values.map((v, i) => {
          const x = padding + (i / Math.max(s.values.length - 1, 1)) * plotW;
          const y = height - padding - (v / maxVal) * plotH;
          return `${x},${y}`;
        });
        const pointsStr = pts.join(' ');
        const circles = pts
          .map(
            (pt) =>
              `<circle cx="${pt.split(',')[0]}" cy="${pt.split(',')[1]}" r="5" fill="${sColor}" stroke="var(--yumia-surface)" stroke-width="2" />`
          )
          .join('');
        pathsHtml += `
        <polyline fill="none" stroke="${sColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr}" />
        ${circles}`;
      });

      const labelTexts = labels
        .map((l, i) => {
          const x = padding + (i / Math.max(labels.length - 1, 1)) * plotW;
          return `<text x="${x}" y="${height - 12}" text-anchor="middle" fill="${theme.colors.muted || '#94a3b8'}" font-size="11" font-weight="600" font-family="sans-serif">${this.escapeHtml(l)}</text>`;
        })
        .join('');

      return `
      <div class="yumia-chart-container">
        ${titleHtml}
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; max-height:280px;">
          ${gridLines}
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
          ${pathsHtml}
          ${labelTexts}
        </svg>
      </div>`;
    }

    if (c.chartType === 'pie' || c.chartType === 'doughnut') {
      const values = series[0]?.values || [];
      const total = values.reduce((a, b) => a + b, 0) || 1;
      let cumulativePercent = 0;
      const radius = 65;
      const cx = 110;
      const cy = 110;
      const strokeWidth = c.chartType === 'doughnut' ? 26 : 65;
      const circ = 2 * Math.PI * radius;

      const slices = values
        .map((val, i) => {
          const percent = val / total;
          const strokeDasharray = `${percent * circ} ${circ}`;
          const strokeDashoffset = -cumulativePercent * circ;
          cumulativePercent += percent;
          const sColor = colors[i % colors.length]!;
          return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${sColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" />`;
        })
        .join('');

      const legend = labels
        .map((l, i) => {
          const sColor = colors[i % colors.length]!;
          const pct = Math.round(((values[i] || 0) / total) * 100);
          return `<div style="display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; margin:6px 0;"><span style="width:12px; height:12px; border-radius:50%; background:${sColor}; box-shadow:0 0 6px ${sColor};"></span><span style="color:var(--yumia-text);">${this.escapeHtml(l)} <strong style="color:var(--yumia-primary);">(${pct}%)</strong></span></div>`;
        })
        .join('');

      return `
      <div class="yumia-chart-container">
        ${titleHtml}
        <div style="display:flex; align-items:center; justify-content:center; gap:36px; width:100%; padding:10px 0;">
          <svg viewBox="0 0 220 220" style="width:180px; height:180px; transform: rotate(-90deg);">
            ${slices}
          </svg>
          <div style="display:flex; flex-direction:column; justify-content:center;">${legend}</div>
        </div>
      </div>`;
    }

    // Default: High-Res Bar Chart
    const values = series[0]?.values || [];
    const maxVal = Math.max(...values, 1);
    const width = 640;
    const height = 240;
    const padding = 45;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;
    const barWidth = Math.min(56, Math.max(20, (plotW / Math.max(values.length, 1)) * 0.55));

    const gridLines = [0.25, 0.5, 0.75, 1.0]
      .map((ratio) => {
        const y = height - padding - ratio * plotH;
        const valLabel = Math.round(ratio * maxVal);
        return `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4" />
        <text x="${padding - 8}" y="${y + 4}" text-anchor="end" fill="${theme.colors.muted || '#64748b'}" font-size="10" font-family="sans-serif">${valLabel}</text>`;
      })
      .join('');

    const bars = values
      .map((val, i) => {
        const x = padding + (i + 0.5) * (plotW / Math.max(values.length, 1)) - barWidth / 2;
        const barH = (val / maxVal) * plotH;
        const y = height - padding - barH;
        const color = colors[i % colors.length]!;
        const label = labels[i] || '';
        return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${color}" opacity="0.95" />
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="${color}" font-size="12" font-weight="700" font-family="sans-serif">${val}</text>
        <text x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle" fill="${theme.colors.text || '#f8fafc'}" font-size="11" font-weight="600" font-family="sans-serif">${this.escapeHtml(label)}</text>`;
      })
      .join('');

    return `
    <div class="yumia-chart-container">
      ${titleHtml}
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; max-height:280px;">
        ${gridLines}
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
        ${bars}
      </svg>
    </div>`;
  }

  private formatInline(text: string): string {
    return this.escapeHtml(text)
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
