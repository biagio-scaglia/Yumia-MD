# Known Limitations

Honest capability matrix for the current Yumia compiler (`yumiamd`).
Features listed as limited below are intentionally not claimed as production-complete.

## Rendering targets

| Capability | HTML | PPTX | PDF |
| --- | --- | --- | --- |
| Shared layout engine geometry | CSS flex | Yes (`@yumiamd/layout`) | **Independent cursor layout** |
| Theme colors | Yes | Yes | Yes |
| Theme typography scale | CSS tokens | Scaled to PPTX points (`×0.72`) | Scaled to PDF points (`×0.55`) |
| Local raster images (PNG/JPEG) | Yes | Yes | Yes (fit, aspect preserved) |
| Remote image URLs | Browser fetch | **Not embedded** (placeholder) | **Not embedded** (placeholder) |
| SVG diagrams / icons | Yes (`IconResolver`) | Text stub (`★ NAME`) | Text stub (`★ NAME`) |
| Mermaid | Client-rendered | Source box | Source box |
| Speaker notes | Speaker view | Native notes | Not shown on page |
| `16:9` / `4:3` / `16:10` | CSS aspect | Shared geometry helper | Shared geometry helper |
| Font embedding (`embedFonts`) | N/A (web fonts) | **Not implemented** | System TTF when found (Segoe/Arial/DejaVu); else PDF core fonts |
| POTX templates (`--template`) | N/A | **Not implemented** | N/A |
| Emoji / broad Unicode | Yes | Depends on Office fonts | Preserved when system Unicode TTF registers; otherwise stripped for WinAnsi safety |

## Layout & overflow

- Overflow is **detected** by the layout engine and reported by the design linter.
- Renderers do **not** auto-split overflowing slides or shrink-to-fit content.
- PDF disables PDFKit mid-slide auto page-breaks so page count always equals slide count; dense content may clip at the footer band instead of spawning extra pages.
- PPTX may visually overflow text boxes when layout height heuristics underestimate wrapped text.
- Flow diagrams with branching (`A -> B`, `B -> C`, `B -> D`) can leave cramped or truncated node labels in PDF/PPTX when many nodes share a rank — layout is heuristic, not a full graph engine.
- PDF/PPTX still use independent paint paths; pixel parity is not guaranteed.
## Security

- Local asset paths are resolved under the process working directory.
- Relative path traversal (`../`) outside the base directory is rejected.
- `http(s):`, `file:`, and other URL schemes are not fetched by PPTX/PDF renderers.

## Visual regression

- Automated tests assert compile smoke, OpenXML package integrity, PDF magic bytes, and selected structural regressions.
- Pixel-perfect golden image comparison is environment-sensitive (font rasterization) and is performed via optional local scripts, not CI gate by default.
