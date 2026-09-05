/**
 * Yumia Documentation Application Logic
 * Router, Search, Interactive Playground, Theme Switcher & Table of Contents
 * Uses Font Awesome 6 icons (Zero Emojis).
 */

import { DOCS_SECTIONS, PLAYGROUND_EXAMPLES } from './docs-data.js';

class YumiaDocsApp {
  constructor() {
    this.currentSectionId = 'overview';
    this.initTheme();
    this.initRouter();
    this.initSearch();
    this.initMobileNav();
    this.initPlayground();
  }

  /* --------------------------------------------------------------------------
     Theme Management (Dark & Light Mode)
     -------------------------------------------------------------------------- */
  initTheme() {
    const savedTheme =
      localStorage.getItem('yumia-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    this.setTheme(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const nextTheme =
          document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
      });
    }

    // Keyboard shortcut 'T' for theme toggle
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 't' && !this.isEditing(e.target)) {
        e.preventDefault();
        const nextTheme =
          document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
      }
    });
  }

  setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('yumia-theme', theme);
    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.className = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }

  /* --------------------------------------------------------------------------
     Router & Navigation
     -------------------------------------------------------------------------- */
  initRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'overview';
    this.currentSectionId = hash;
    this.renderSidebar();
    this.renderContent(hash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSidebar() {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    // Group sections by category
    const categories = {};
    DOCS_SECTIONS.forEach((sec) => {
      if (!categories[sec.category]) categories[sec.category] = [];
      categories[sec.category].push(sec);
    });

    let html = '';
    for (const [catName, sections] of Object.entries(categories)) {
      html += `
        <div class="sidebar-section">
          <div class="sidebar-title">${catName}</div>
          <ul class="sidebar-nav">
            ${sections
              .map(
                (s) => `
              <li>
                <a href="#${s.id}" class="sidebar-link ${s.id === this.currentSectionId ? 'active' : ''}">
                  ${s.title}
                </a>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `;
    }

    // Add Interactive Playground in sidebar with Font Awesome bolt icon
    html += `
      <div class="sidebar-section">
        <div class="sidebar-title">Interactive</div>
        <ul class="sidebar-nav">
          <li>
            <a href="#playground" class="sidebar-link ${this.currentSectionId === 'playground' ? 'active' : ''}">
              <i class="fa-solid fa-bolt" style="color: var(--yumia-primary); margin-right: 0.3rem;"></i> Live Playground
            </a>
          </li>
        </ul>
      </div>
    `;

    sidebarNav.innerHTML = html;
  }

  renderContent(sectionId) {
    const mainContent = document.getElementById('docsContent');
    if (!mainContent) return;

    if (sectionId === 'playground') {
      this.renderPlaygroundSection(mainContent);
      this.generateToc();
      return;
    }

    const section = DOCS_SECTIONS.find((s) => s.id === sectionId) || DOCS_SECTIONS[0];
    mainContent.innerHTML = `
      <h1>${section.title}</h1>
      <p class="docs-lead">${section.lead}</p>
      ${section.content}
    `;

    this.generateToc();
  }

  renderPlaygroundSection(container) {
    container.innerHTML = `
      <h1>Interactive Playground</h1>
      <p class="docs-lead">Experiment with Yumia visual intent primitives and inspect live compiled outputs.</p>

      <div class="playground-container">
        <div class="playground-header">
          <div class="playground-title"><i class="fa-solid fa-bolt" style="color: var(--yumia-primary); margin-right: 0.3rem;"></i> Yumia Live Design Compiler</div>
          <div class="playground-controls">
            <label style="font-size: 0.8rem; color: var(--yumia-text-muted);">Template:</label>
            <select id="playgroundTemplateSelect" class="playground-select">
              <option value="corporate">Corporate (Financial Growth)</option>
              <option value="cyberpunk">Cyberpunk (Tech Deck)</option>
              <option value="terminal">Terminal (System Audit)</option>
            </select>
          </div>
        </div>
        <div class="playground-body">
          <div class="playground-editor-pane">
            <textarea id="playgroundEditor" class="playground-textarea" spellcheck="false"></textarea>
          </div>
          <div class="playground-preview-pane">
            <div id="playgroundSlideFrame" class="playground-slide-frame">
              <!-- Live Compiled Preview -->
            </div>
          </div>
        </div>
        <div class="playground-status-bar">
          <span id="playgroundSlideCount">Slide: 1 of 1</span>
          <span id="playgroundQualityScore" style="color: var(--yumia-success); font-weight: 600;"><i class="fa-solid fa-check" style="margin-right: 0.3rem;"></i> Visual Quality Score: 98/100 (AAA)</span>
        </div>
      </div>
    `;

    this.bindPlaygroundEvents();
  }

  /* --------------------------------------------------------------------------
     Table of Contents & ScrollSpy
     -------------------------------------------------------------------------- */
  generateToc() {
    const tocList = document.getElementById('tocList');
    const content = document.getElementById('docsContent');
    if (!tocList || !content) return;

    const headings = content.querySelectorAll('h2, h3');
    if (headings.length === 0) {
      tocList.innerHTML =
        '<li><span style="color: var(--yumia-text-dim);">No subheadings</span></li>';
      return;
    }

    let tocHtml = '';
    headings.forEach((h, index) => {
      if (!h.id) h.id = `heading-${index}`;
      const depth = h.tagName.toLowerCase() === 'h3' ? 'depth-3' : 'depth-2';
      tocHtml += `
        <li>
          <a href="#${h.id}" class="toc-link ${depth}" onclick="event.preventDefault(); document.getElementById('${h.id}').scrollIntoView({behavior: 'smooth'});">
            ${h.textContent}
          </a>
        </li>
      `;
    });

    tocList.innerHTML = tocHtml;
  }

  /* --------------------------------------------------------------------------
     Live Search Modal
     -------------------------------------------------------------------------- */
  initSearch() {
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchTrigger = document.getElementById('searchTrigger');

    const openSearch = () => {
      if (searchModal) {
        searchModal.classList.add('open');
        searchInput?.focus();
        this.performSearch('', searchResults);
      }
    };

    const closeSearch = () => {
      searchModal?.classList.remove('open');
      if (searchInput) searchInput.value = '';
    };

    searchTrigger?.addEventListener('click', openSearch);
    searchModal?.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    window.addEventListener('keydown', (e) => {
      if (
        (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) &&
        !this.isEditing(e.target)
      ) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && searchModal?.classList.contains('open')) {
        closeSearch();
      }
    });

    searchInput?.addEventListener('input', (e) => {
      this.performSearch(e.target.value, searchResults);
    });
  }

  performSearch(query, resultsContainer) {
    if (!resultsContainer) return;
    const q = query.toLowerCase().trim();

    const matches = DOCS_SECTIONS.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.lead.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
      );
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML =
        '<li style="padding: 1rem; color: var(--yumia-text-dim);">No matching documentation pages found.</li>';
      return;
    }

    resultsContainer.innerHTML = matches
      .map(
        (m) => `
        <li class="search-item" onclick="window.location.hash = '${m.id}'; document.getElementById('searchModal').classList.remove('open');">
          <span class="search-item-category">${m.category}</span>
          <span class="search-item-title">${m.title}</span>
          <span class="search-item-snippet">${m.lead}</span>
        </li>
      `
      )
      .join('');
  }

  /* --------------------------------------------------------------------------
     Mobile Navigation
     -------------------------------------------------------------------------- */
  initMobileNav() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('docsSidebar');

    toggleBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });

    // Close sidebar on link click
    sidebar?.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        sidebar.classList.remove('open');
      }
    });
  }

  /* --------------------------------------------------------------------------
     Interactive Playground Compiler Simulator
     -------------------------------------------------------------------------- */
  initPlayground() {
    if (this.currentSectionId === 'playground') {
      this.bindPlaygroundEvents();
    }
  }

  bindPlaygroundEvents() {
    const editor = document.getElementById('playgroundEditor');
    const templateSelect = document.getElementById('playgroundTemplateSelect');
    const slideFrame = document.getElementById('playgroundSlideFrame');

    if (!editor || !templateSelect || !slideFrame) return;

    editor.value = PLAYGROUND_EXAMPLES.corporate;
    this.updatePlaygroundPreview(editor.value, slideFrame);

    editor.addEventListener('input', () => {
      this.updatePlaygroundPreview(editor.value, slideFrame);
    });

    templateSelect.addEventListener('change', (e) => {
      const t = e.target.value;
      if (PLAYGROUND_EXAMPLES[t]) {
        editor.value = PLAYGROUND_EXAMPLES[t];
        this.updatePlaygroundPreview(editor.value, slideFrame);
      }
    });
  }

  updatePlaygroundPreview(source, frame) {
    const hasHero = source.includes('hero');
    const hasMetric = source.includes('metric');
    const hasGrid = source.includes('grid');
    const isCyberpunk = source.includes('cyberpunk');
    const isTerminal = source.includes('terminal');

    const primaryColor = isCyberpunk ? '#00F0FF' : isTerminal ? '#10B981' : '#FF2E88';
    const bgColor = isTerminal ? '#050508' : '#0B0B12';

    frame.style.background = bgColor;
    frame.style.borderColor = primaryColor;

    let innerHtml = '';

    if (hasHero) {
      innerHtml += `
        <div style="text-align: center; margin-top: 1rem;">
          <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255,46,136,0.15); color: ${primaryColor}; border: 1px solid ${primaryColor}; padding: 0.2rem 0.5rem; border-radius: 9999px;">Q4 Release</span>
          <h2 style="font-size: 1.3rem; margin: 0.5rem 0 0.2rem 0; color: #FFFFFF; font-weight: 800;">Hyper-Growth Execution</h2>
          <p style="font-size: 0.75rem; color: #94A3B8;">ARR beats quarterly projection by 42%</p>
        </div>
      `;
    } else {
      innerHtml += `
        <div style="margin-bottom: 0.5rem;">
          <h2 style="font-size: 1.1rem; color: #FFFFFF; font-weight: 700;">System Overview</h2>
        </div>
      `;
    }

    if (hasMetric || hasGrid) {
      innerHtml += `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0.75rem 0;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.6rem; text-align: center;">
            <div style="font-size: 1.1rem; font-weight: 800; color: ${primaryColor};">$24.8M</div>
            <div style="font-size: 0.65rem; color: #94A3B8;">ARR Run-Rate</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.6rem; text-align: center;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #10B981;">118%</div>
            <div style="font-size: 0.65rem; color: #94A3B8;">Net Retention</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.6rem; text-align: center;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #00F0FF;">9.2x</div>
            <div style="font-size: 0.65rem; color: #94A3B8;">LTV / CAC</div>
          </div>
        </div>
      `;
    }

    innerHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.3rem; font-size: 0.6rem; color: #64748B;">
        <span>Yumia Native Compiler</span>
        <span>1920 × 1080 (16:9)</span>
      </div>
    `;

    frame.innerHTML = innerHtml;
  }

  isEditing(target) {
    return (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    );
  }
}

// Global copy helper using Font Awesome check icon
window.copyCode = function (btn) {
  const code = btn.closest('.code-block').querySelector('pre code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    btn.style.color = 'var(--yumia-success)';
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.style.color = '';
    }, 1500);
  });
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  window.yumiaApp = new YumiaDocsApp();
});
