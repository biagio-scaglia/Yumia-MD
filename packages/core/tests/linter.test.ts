import { describe, expect, it } from 'vitest';
import { YumiaCompiler } from '../src/index.js';

describe('YumiaLinter', () => {
  const compiler = new YumiaCompiler();

  it('detects empty slide (YUM006)', () => {
    const source = `---
title: Test Deck
---

# Intro
Hello world

---

---

# Conclusion
Final thoughts
`;
    const report = compiler.lint(source);
    expect(report.passed).toBe(true); // Non-strict passes warnings
    const emptyIssue = report.warnings.find((w) => w.code === 'YUM006');
    expect(emptyIssue).toBeDefined();
    expect(emptyIssue?.slide).toBe(2);
  });

  it('detects missing slide heading (YUM003)', () => {
    const source = `---
title: Test Deck
---

Just a paragraph without any heading or card title.
`;
    const report = compiler.lint(source);
    const noHeading = report.warnings.find((w) => w.code === 'YUM003');
    expect(noHeading).toBeDefined();
    expect(noHeading?.slide).toBe(1);
  });

  it('detects high list density (YUM004)', () => {
    const source = `---
title: Dense Deck
---

# Overloaded Slide
- Item 1
- Item 2
- Item 3
- Item 4
- Item 5
- Item 6
- Item 7
- Item 8
`;
    const report = compiler.lint(source);
    const densityIssue = report.warnings.find((w) => w.code === 'YUM004');
    expect(densityIssue).toBeDefined();
    expect(densityIssue?.message).toContain('8 list items');
  });

  it('detects missing image alt text (YUM007)', () => {
    const source = `---
title: Images Deck
---

# Visuals
![](https://example.com/logo.png)
`;
    const report = compiler.lint(source);
    const altIssue = report.warnings.find((w) => w.code === 'YUM007');
    expect(altIssue).toBeDefined();
    expect(altIssue?.message).toContain('missing descriptive alt text');
  });

  it('explains document composition, metrics, and design intelligence', () => {
    const source = `---
title: System Architecture
theme: corporate
aspectRatio: "16:9"
---

:::hero title="Next Cloud" subtitle="Distributed compute" align="center"
:::

---

# Metrics Overview
:::metric value="99.99%" label="Uptime" variant="success"
:::

---

# Growth Comparison
:::compare left="Old Way" right="New Way"
- Slow
:::vs
- Fast
:::
`;
    const explanation = compiler.explain(source);
    expect(explanation.slidesCount).toBe(3);
    expect(explanation.theme).toBe('corporate');
    expect(explanation.composition.heroSlides).toBe(1);
    expect(explanation.composition.metricSlides).toBe(1);
    expect(explanation.composition.comparisonSlides).toBe(1);
    expect(explanation.design.typographyScale).toBeDefined();
    expect(explanation.design.densityScore).toBeGreaterThan(0);
    expect(explanation.design.visualHierarchyScore).toBeGreaterThan(0);
  });

  it('enforces strict mode (fails with exit code / passed=false on warning)', () => {
    const source = `---
title: Strict Deck
---

No heading here
`;
    const report = compiler.lint(source, { strict: true });
    expect(report.passed).toBe(false);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('detects low contrast custom color palette (YUM010)', () => {
    const source = `---
title: Bad Contrast Deck
colors:
  background: "#111111"
  text: "#222222"
---

# Title
Sample text with nearly invisible contrast
`;
    const report = compiler.lint(source);
    const contrastIssue = report.warnings.find((w) => w.code === 'YUM010');
    expect(contrastIssue).toBeDefined();
    expect(contrastIssue?.message).toContain('Insufficient color contrast');
  });

  it('detects excessive table columns (YUM011)', () => {
    const source = `---
title: Table Deck
---

# Data Matrix

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 |
| --- | --- | --- | --- | --- | --- | --- |
| A | B | C | D | E | F | G |
`;
    const report = compiler.lint(source);
    const tableIssue = report.warnings.find((w) => w.code === 'YUM011');
    expect(tableIssue).toBeDefined();
    expect(tableIssue?.message).toContain('7 columns');
  });

  it('detects very long lines in code blocks (YUM012)', () => {
    const longLine =
      'const veryLongIdentifierThatExceedsEightyCharactersAndMightCauseOverflowInSlides = 1234567890;';
    const source = `---
title: Code Deck
---

# Code Snippet

\`\`\`typescript
${longLine}
\`\`\`
`;
    const report = compiler.lint(source);
    const codeIssue = report.infos.find((i) => i.code === 'YUM012');
    expect(codeIssue).toBeDefined();
  });

  it('passes a well-structured presentation without warnings', () => {
    const source = `---
title: Perfect Deck
theme: cyberpunk
---

# Overview
This is a well-formatted slide with clean content.

:::metric value="99.99%" label="Availability" change="+0.02%" variant="success"
`;
    const report = compiler.lint(source, { strict: true });
    expect(report.passed).toBe(true);
    expect(report.issueCount).toBe(0);
  });
});
