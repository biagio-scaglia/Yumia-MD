import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { runCli } from '../src/index.js';

describe('yumia CLI', () => {
  const samplePath = path.resolve(__dirname, '../../../examples/basic/presentation.yumia.md');

  it('should return help output with --help', () => {
    const res = runCli(['node', 'yumia', '--help']);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('YumiaMD — Markdown-based presentation compiler');
    expect(res.output).toContain('validate');
    expect(res.output).toContain('lint');
    expect(res.output).toContain('inspect');
  });

  it('should validate a correct presentation file', () => {
    const res = runCli(['node', 'yumia', 'validate', samplePath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('is valid');
    expect(res.output).toContain('3 slide(s)');
  });

  it('should lint a presentation file and check for issues', () => {
    const res = runCli(['node', 'yumia', 'lint', samplePath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('Yumia Lint');
  });

  it('should inspect presentation AST and layout', () => {
    const astRes = runCli(['node', 'yumia', 'inspect', samplePath]);
    expect(astRes.exitCode).toBe(0);
    const parsedAst = JSON.parse(astRes.output);
    expect(parsedAst.metadata.title).toBe('HomuraJS');

    const layoutRes = runCli(['node', 'yumia', 'inspect', samplePath, '--layout']);
    expect(layoutRes.exitCode).toBe(0);
    const parsedLayout = JSON.parse(layoutRes.output);
    expect(parsedLayout.viewport.width).toBe(1920);
    expect(parsedLayout.slides).toHaveLength(3);
  });
});
