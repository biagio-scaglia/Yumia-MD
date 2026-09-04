import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('CLI Lint Command', () => {
  const tmpFile = join(process.cwd(), 'temp_lint_test.yumia.md');

  it('runs lint command and produces formatted report', async () => {
    const content = `---
title: Test
---

# Slide 1
Valid content here.
`;
    writeFileSync(tmpFile, content, 'utf-8');

    const result = await runCli(['node', 'yumia', 'lint', tmpFile]);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('passed with 0 issues');

    unlinkSync(tmpFile);
  });

  it('runs lint with --json flag', async () => {
    const content = `---
title: JSON Test
---

# Hello
World
`;
    writeFileSync(tmpFile, content, 'utf-8');

    const result = await runCli(['node', 'yumia', 'lint', tmpFile, '--json']);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.output);
    expect(parsed.passed).toBe(true);
    expect(parsed.totalSlides).toBe(1);

    unlinkSync(tmpFile);
  });

  it('fails with exit code 1 when --strict is passed on a slide with warnings', async () => {
    const content = `---
title: Strict Warning Test
---

Just a paragraph without heading.
`;
    writeFileSync(tmpFile, content, 'utf-8');

    const result = await runCli(['node', 'yumia', 'lint', tmpFile, '--strict']);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('failed due to --strict');

    unlinkSync(tmpFile);
  });
});
