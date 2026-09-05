# Changelog

All notable changes to the Yumia project will be documented in this file.

---

## [0.1.20] - 2026-09-05

### Added

- **Proprietary Native Yumia Language (`.yumia`)**:
  - Indentation-based declarative syntax for structured visual documents and presentation decks.
  - Primitives: `document`, `slide`, `grid`, `stack`, `card`, `metric`, `icon`, `badge`, `code`, `quote`, `section`, `toc`, `notes`.
- **Multi-Provider Icon Abstraction (`IconResolver`)**:
  - Decoupled icon registry supporting Lucide (`lucide:*`), Material Symbols (`material:*`), Font Awesome (`fa:*`), Tabler (`tabler:*`), Heroicons (`heroicons:*`), and custom SVG paths.
  - Offline bundling with graceful fallback and monogram glyph rendering.
- **Unified Semantic AST**:
  - Added `IconElement`, `GridElement`, `StackElement`, `ComponentElement`, `SlotElement`, `ResolvedStyle` interfaces.
  - Zero-dependency factory methods in `@yumiamd/ast`.
- **Migration Tool**:
  - `migrateMarkdownToNative()` utility in `@yumiamd/parser` for converting legacy `.yumia.md` files to Native Yumia `.yumia`.
- **Multi-Target Rendering**:
  - HTML5 renderer CSS grid and flex stack integration with inline SVG icons.
  - PowerPoint generator layout support for grid children and native vector icon shapes.
  - Vector PDF coordinate layout engine for grids and stacks.
- **Golden Showcase**:
  - Added `examples/showcase.yumia` demonstrating full native language capabilities.
- **Comprehensive Documentation Suite**:
  - Complete overhaul of `README.md`, `docs/language.md`, `docs/architecture.md`, `docs/icons.md`, `docs/ai-guidelines.md`, and `docs/migration.md`.

---

## [0.1.19] - 2026-09-04

### Added

- Code block syntax highlighting with focused line emphasis (`highlight="2,4-6"`).
- Automatic Section Dividers (`:::section`) and Table of Contents (`:::toc`).
- PDF direct printing and `@media print` layout optimizations in the HTML5 deck controller.
- Fuzzing test suite and 250-slide stress benchmarks.
