# Known Limitations

Honest capability matrix for the current Yumia compiler (`yumiamd` **v0.1.31+**).
Features listed as limited below are intentionally not claimed as production-complete.

> **Tip:** Prefer the workspace CLI (`pnpm yumia` / `node packages/cli/dist/bin.js`) or a freshly installed `yumiamd@latest`. An older global `yumia` on your PATH can produce stale PPTX/PDF output (extra blank PDF pages, outdated layout).

## Rendering targets

| Capability | HTML | PPTX | PDF |
| --- | --- | --- | --- |
| Shared layout engine geometry | CSS flex | Yes (`@yumiamd/layout` roots + nested children) | Yes (`@yumiamd/layout` roots + nested card/grid/columns/compare paint) |
| Theme colors | Yes | Yes | Yes |
| Theme typography scale | CSS tokens | Scaled to PPTX points (`×0.72`) | Scaled to PDF points (`×0.55`) |
| Local raster images (PNG/JPEG) | Yes | Yes (`contain` fit) | Yes (aspect preserved) |
| Remote image URLs | Browser fetch | **Not embedded** (placeholder) | **Not embedded** (placeholder) |
| SVG diagrams / icons | Yes (`IconResolver`) | Rasterized PNG via `@resvg/resvg-js` | Rasterized PNG via `@resvg/resvg-js` |
| Native flow `diagram` | SVG | Orthogonal connectors + layered layout | Orthogonal connectors + layered layout |
| Mermaid | Client-rendered | Source box | Source box |
| Speaker notes | Speaker view | Native notes | Not shown on page |
| `16:9` / `4:3` / `16:10` | CSS aspect | Shared geometry helper | Shared geometry helper |
| Font embedding (`embedFonts`) | N/A (web fonts) | **Not implemented** | System TTF when found (Segoe/Arial/DejaVu); else PDF core fonts |
| POTX templates (`--template`) | N/A | **Not implemented** | N/A |
| Emoji / broad Unicode | Yes | Depends on Office fonts | Preserved when system Unicode TTF registers; otherwise stripped for WinAnsi safety |
| Cyclic flow diagrams | Guarded | Guarded (visit budget) | Guarded (visit budget) |
| Hero `badge` attribute | Yes | Yes (compact when sharing a slide) | Yes (compact when sharing a slide) |

## Layout & overflow

- Overflow is **detected** by the layout engine and reported by the design linter.
- Renderers do **not** auto-split overflowing slides or shrink-to-fit content.
- PDF disables PDFKit mid-slide auto page-breaks so **page count equals slide count**; dense content may clip at the footer band instead of spawning extra pages.
- PPTX height heuristics were tightened for headings, paragraphs, cards, and wrapped code lines; extreme density can still overflow visually.
- Flow diagrams use longest-path ranking with orthogonal elbows. Branching can still produce crossings on reverse-rank edges — layout is heuristic, not a full commercial graph engine.
- `node [Full Label] variant="…"` updates the existing edge-declared node (bracket labels must be matched whole). Orphan alias nodes without edges are ignored by the layout pass.
- Mermaid remains a source box in PPTX/PDF.

## Security

- Local asset paths are resolved under the process working directory.
- Relative path traversal (`../`) outside the base directory is rejected.
- `http(s):`, `file:`, and other URL schemes are not fetched by PPTX/PDF renderers.

## Visual regression

- Automated tests assert compile smoke, OpenXML package integrity, PDF magic bytes, diagram alias safety, code-block sizing, and selected structural regressions.
- Pixel-perfect golden image comparison is environment-sensitive (font rasterization) and is performed via optional local scripts, not a CI gate by default.
