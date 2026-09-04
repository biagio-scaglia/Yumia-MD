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
