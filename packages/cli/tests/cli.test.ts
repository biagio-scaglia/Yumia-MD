import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import { runCli } from '../src/index.js';

describe('yumia CLI', () => {
  const samplePath = path.resolve(__dirname, '../../../examples/basic/presentation.yumia.md');
  const tempOutPath = path.resolve(__dirname, '../../../examples/basic/dist/test-deck.pptx');

  it('should return help output with --help', async () => {
    const res = await runCli(['node', 'yumia', '--help']);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('YumiaMD — Markdown-based presentation compiler');
    expect(res.output).toContain('validate');
    expect(res.output).toContain('lint');
    expect(res.output).toContain('inspect');
    expect(res.output).toContain('build');
  });

  it('should validate a correct presentation file', async () => {
    const res = await runCli(['node', 'yumia', 'validate', samplePath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('is valid');
    expect(res.output).toContain('3 slide(s)');
  });

  it('should lint a presentation file and check for issues', async () => {
    const res = await runCli(['node', 'yumia', 'lint', samplePath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('Yumia Lint');
  });

  it('should inspect presentation AST and layout', async () => {
    const astRes = await runCli(['node', 'yumia', 'inspect', samplePath]);
    expect(astRes.exitCode).toBe(0);
    const parsedAst = JSON.parse(astRes.output);
    expect(parsedAst.metadata.title).toBe('HomuraJS');

    const layoutRes = await runCli(['node', 'yumia', 'inspect', samplePath, '--layout']);
    expect(layoutRes.exitCode).toBe(0);
    const parsedLayout = JSON.parse(layoutRes.output);
    expect(parsedLayout.viewport.width).toBe(1920);
    expect(parsedLayout.slides).toHaveLength(3);
  });

  it('should build a presentation to a real native editable .pptx file', async () => {
    const buildRes = await runCli(['node', 'yumia', 'build', samplePath, '--out', tempOutPath]);

    expect(buildRes.exitCode).toBe(0);
    expect(buildRes.output).toContain('Successfully compiled');
    expect(buildRes.output).toContain('3 native editable slides');
    expect(existsSync(tempOutPath)).toBe(true);

    // Clean up temporary artifact
    unlinkSync(tempOutPath);
  });

  it('should export and prepare cloud deployment with yumia deploy', async () => {
    const deployDir = path.resolve(__dirname, '../../../examples/basic/dist-test-deploy');
    const deployRes = await runCli(['node', 'yumia', 'deploy', samplePath, '--provider', 'vercel', '--out', deployDir]);

    expect(deployRes.exitCode).toBe(0);
    expect(deployRes.output).toContain('Presentation Deployment Ready');
    expect(existsSync(path.join(deployDir, 'index.html'))).toBe(true);
    expect(existsSync(path.join(deployDir, 'vercel.json'))).toBe(true);
  });
});

