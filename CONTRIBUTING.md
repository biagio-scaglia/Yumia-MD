# Contributing to Yumia

Thank you for your interest in contributing to Yumia!

---

## 1. Monorepo Architecture

Yumia is organized as a pnpm workspace monorepo:

- `packages/ast` — Core semantic AST interfaces and factories
- `packages/theme` — Design tokens and color resolver
- `packages/layout` — 2D box-model geometry computation
- `packages/parser` — Native Yumia & Markdown parsers
- `packages/renderer` — Universal renderer interfaces & multi-provider icon resolver
- `packages/renderer-html` — Interactive HTML5 renderer
- `packages/renderer-pptx` — Native OpenXML PowerPoint generator
- `packages/renderer-pdf` — Vector PDF generator
- `packages/core` — Compiler orchestration & linter
- `packages/cli` — CLI binary and live dev server

---

## 2. Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

```bash
# Clone the repository
git clone https://github.com/biagio-scaglia/Yumia-MD.git
cd Yumia-MD

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run test suite
pnpm test
```

---

## 3. Code Standards & Scripts

- **Build**: `pnpm build`
- **Test**: `pnpm test`
- **Format**: `pnpm format`
- **Format Check**: `pnpm format:check`
- **Lint**: `pnpm lint`

Before opening a pull request, ensure that all tests and lint checks pass cleanly:

```bash
pnpm format
pnpm lint
pnpm test
pnpm build
```

---

## 4. Submitting a Pull Request

1. Fork the repository and create a feature branch (`git checkout -b feat/my-feature`).
2. Implement your changes with accompanying tests in `tests/` or the corresponding package `tests/` directory.
3. Verify that `pnpm test` passes with 100% success.
4. Commit your changes with conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`).
5. Open a Pull Request on GitHub.
