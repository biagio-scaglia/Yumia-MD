import { mkdirSync, readFileSync, watch as fsWatch, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseYumia } from '@yumiamd/parser';
import { DefaultLayoutEngine } from '@yumiamd/layout';
import { Presentation } from '@yumiamd/ast';
import { YumiaCompiler } from '@yumiamd/core';
import { resolveTheme } from '@yumiamd/theme';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { startDevServer } from './dev-server.js';

export const VERSION = '0.1.10';

export function printHelp(): string {
  return `
YumiaMD — Markdown-based presentation compiler (v${VERSION})

Usage:
  yumia <command> [options] [file]

Commands:
  init [name]        Scaffold a new YumiaMD presentation project
  dev <file>         Start live-reload dev server with instant HTML preview
  watch <file>       Watch presentation file and recompile automatically on save
  validate <file>    Validate a .yumia.md presentation syntax and structure
  lint <file>        Analyze presentation for layout overflows and accessibility
  inspect <file>     Inspect the AST and geometric layout tree
  schema             Output machine-readable JSON schema for AI agents
  build <file>       Compile a presentation to PowerPoint (.pptx) or HTML (.html)

Theming & Color Options:
  --theme, -t <name> Base theme: default | cyberpunk | minimal | corporate | terminal | academic
  --bg, --background Hex background color (e.g. "#0B0B12" or "#FFFFFF")
  --primary, -p      Hex primary accent color (e.g. "#FF2E88" or "#2563EB")
  --secondary        Hex secondary color (e.g. "#00F0FF")
  --text             Hex text color (e.g. "#FFFFFF" or "#0F172A")
  --accent           Hex accent bar & highlight color

Server & Compiler Options:
  --port <num>       Port for live dev server (default: 3000)
  --open             Open default browser automatically in dev mode
  --watch, -w        Watch for file changes during compilation
  --out, -o <file>   Specify output file path (default: dist/<name>.<format>)
  --format, -f <fmt> Target output format: pptx (default) | html
  --strict           Enforce zero warnings in 'lint' (exits with code 1 on warning)
  --json             Output results formatted as JSON for CI/CD and AI tools
  --layout           Show computed geometric bounding boxes in 'inspect'
  -h, --help         Show this help message
  -v, --version      Show CLI version
`.trim();
}

function getFlagValue(args: string[], flagNames: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    for (const flag of flagNames) {
      if (arg === flag && args[i + 1] && !args[i + 1]!.startsWith('-')) {
        return args[i + 1];
      }
      if (arg.startsWith(`${flag}=`)) {
        return arg.slice(flag.length + 1);
      }
    }
  }
  return undefined;
}

export async function runCli(argv: string[]): Promise<{ exitCode: number; output: string }> {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    return { exitCode: 0, output: printHelp() };
  }

  if (args.includes('-v') || args.includes('--version')) {
    return { exitCode: 0, output: `yumia v${VERSION}` };
  }

  const isJson = args.includes('--json');
  const isStrict = args.includes('--strict');
  const isWatch = args.includes('--watch') || args.includes('-w');
  const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
  const command = nonFlagArgs[0];
  const target = nonFlagArgs[1];

  // Color & Theme CLI Flags
  const cliTheme = getFlagValue(args, ['--theme', '-t']);
  const cliBg = getFlagValue(args, ['--bg', '--background']);
  const cliPrimary = getFlagValue(args, ['--primary', '-p']);
  const cliSecondary = getFlagValue(args, ['--secondary']);
  const cliText = getFlagValue(args, ['--text']);
  const cliAccent = getFlagValue(args, ['--accent']);
  const cliFormat = (getFlagValue(args, ['--format', '-f']) || 'pptx').toLowerCase();

  if (command === 'schema') {
    const compiler = new YumiaCompiler();
    return {
      exitCode: 0,
      output: JSON.stringify(compiler.getSchema(), null, 2),
    };
  }

  if (command === 'init') {
    const projectName = target || 'yumia-deck';
    const projectDir = join(process.cwd(), projectName);

    try {
      mkdirSync(projectDir, { recursive: true });
      mkdirSync(join(projectDir, 'assets'), { recursive: true });
      mkdirSync(join(projectDir, 'themes'), { recursive: true });

      const chosenTheme = cliTheme || 'default';
      const colorLines: string[] = [];
      if (cliBg) colorLines.push(`background: "${cliBg}"`);
      if (cliPrimary) colorLines.push(`primary: "${cliPrimary}"`);
      if (cliSecondary) colorLines.push(`secondary: "${cliSecondary}"`);
      if (cliText) colorLines.push(`text: "${cliText}"`);
      if (cliAccent) colorLines.push(`accent: "${cliAccent}"`);

      const colorsYaml = colorLines.length > 0 ? `\n${colorLines.join('\n')}` : '';

      const sampleContent = `---
title: ${projectName}
theme: ${chosenTheme}
aspectRatio: "16:9"${colorsYaml}
---

# ${projectName}
Presentation authoring designed for humans and AI.

:::notes
Opening slide introducing the presentation deck.
:::

---

# Architecture & Modularity

:::columns ratios="50:50"

:::column
:::card Core Pipeline variant="primary"
- Semantic AST model
- Markdown + Directive parser
- 100% Deterministic layout
:::
:::

:::column
:::card Native Output variant="warning"
- Fully editable PowerPoint objects
- Vector PDF documents
- Interactive HTML decks
:::
:::

:::
`.trim();

      writeFileSync(join(projectDir, 'presentation.yumia.md'), sampleContent, 'utf-8');

      if (isJson) {
        return {
          exitCode: 0,
          output: JSON.stringify(
            {
              success: true,
              project: projectName,
              path: projectDir,
              entry: join(projectDir, 'presentation.yumia.md'),
              theme: chosenTheme,
            },
            null,
            2
          ),
        };
      }

      return {
        exitCode: 0,
        output: `✓ Created presentation project '${projectName}' at ./${projectName}\n  Theme: ${chosenTheme}${colorsYaml ? ` (with custom colors)` : ''}\n  Edit ./${projectName}/presentation.yumia.md to get started!\n  Then compile with: yumia build ./${projectName}/presentation.yumia.md`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ success: false, error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Initialization failed: ${msg}`,
      };
    }
  }

  if (command === 'dev') {
    if (!target) {
      const msg = 'Error: Please specify a presentation file to preview in dev server.';
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }
    try {
      const resolvedInput = resolve(process.cwd(), target);
      const portStr = getFlagValue(args, ['--port']);
      const port = portStr ? parseInt(portStr, 10) : 3000;
      const open = args.includes('--open');

      const devInstance = await startDevServer(resolvedInput, { port, open });

      if (isJson) {
        return {
          exitCode: 0,
          output: JSON.stringify(
            {
              success: true,
              url: devInstance.url,
              port: devInstance.port,
              file: resolvedInput,
            },
            null,
            2
          ),
        };
      }

      return {
        exitCode: 0,
        output: `🚀 YumiaMD Live Dev Server running at: ${devInstance.url}\n  Watching: ${target}\n  Hot-reloading active via SSE. Press Ctrl+C to stop.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ success: false, error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Dev server failed: ${msg}`,
      };
    }
  }

  if (command === 'validate') {
    if (!target) {
      const msg = 'Error: Please specify a file to validate.';
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }
    try {
      const source = readFileSync(target, 'utf-8');
      const compiler = new YumiaCompiler();
      const validation = compiler.validate(source);

      if (isJson) {
        return {
          exitCode: validation.valid ? 0 : 1,
          output: JSON.stringify(validation, null, 2),
        };
      }

      if (validation.valid) {
        const warnInfo =
          validation.warnings.length > 0 ? ` (${validation.warnings.length} warning(s))` : '';
        return {
          exitCode: 0,
          output: `✓ Presentation '${target}' is valid. Detected ${validation.slideCount} slide(s)${warnInfo}.`,
        };
      } else {
        const errorLines = validation.errors.map(
          (e) => `  - [Line ${e.loc?.start.line || '?'}] ${e.message}`
        );
        return {
          exitCode: 1,
          output: `✗ Validation failed with ${validation.errors.length} error(s):\n${errorLines.join('\n')}`,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ valid: false, error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Validation failed: ${msg}`,
      };
    }
  }

  if (command === 'lint') {
    if (!target) {
      const msg = 'Error: Please specify a file to lint.';
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }
    try {
      const source = readFileSync(target, 'utf-8');
      const compiler = new YumiaCompiler();
      const report = compiler.lint(source, { strict: isStrict });

      if (isJson) {
        return {
          exitCode: report.passed ? 0 : 1,
          output: JSON.stringify(
            {
              target,
              ...report,
            },
            null,
            2
          ),
        };
      }

      if (report.issueCount === 0) {
        return {
          exitCode: 0,
          output: `✓ Yumia Lint: All ${report.totalSlides} slide(s) passed with 0 issues.`,
        };
      } else {
        const issueLines: string[] = [];
        for (const e of report.errors) {
          issueLines.push(`  ✗ [${e.code}] Slide ${e.slide}: ${e.message}`);
        }
        for (const w of report.warnings) {
          issueLines.push(`  ⚠ [${w.code}] Slide ${w.slide}: ${w.message}`);
        }
        for (const info of report.infos) {
          issueLines.push(`  ℹ [${info.code}] Slide ${info.slide}: ${info.message}`);
        }

        const summary = `Found ${report.errors.length} error(s), ${report.warnings.length} warning(s).`;
        const exitCode = report.passed ? 0 : 1;

        return {
          exitCode,
          output: `Yumia Lint Report for '${target}':\n\n${issueLines.join('\n')}\n\n${summary}${isStrict && report.warnings.length > 0 ? ' (failed due to --strict)' : ''}`,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Linting failed: ${msg}`,
      };
    }
  }

  if (command === 'inspect') {
    if (!target) {
      const msg = 'Error: Please specify a file to inspect.';
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }
    try {
      const source = readFileSync(target, 'utf-8');
      const presentation: Presentation = parseYumia(source);

      if (args.includes('--layout')) {
        const engine = new DefaultLayoutEngine();
        const layout = engine.computePresentation(presentation);
        return {
          exitCode: 0,
          output: JSON.stringify(layout, null, 2),
        };
      }

      return {
        exitCode: 0,
        output: JSON.stringify(presentation, null, 2),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Inspection failed: ${msg}`,
      };
    }
  }

  if (command === 'build' || command === 'watch') {
    if (!target) {
      const msg = `Error: Please specify a presentation file to ${command}.`;
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }

    try {
      const resolvedInput = resolve(process.cwd(), target);
      const isHtml = cliFormat === 'html';
      const targetExtension = isHtml ? '.html' : '.pptx';

      // Determine output path
      let outputPath = '';
      const outFlagIndex = args.findIndex((a) => a === '--out' || a === '-o');
      if (outFlagIndex !== -1 && args[outFlagIndex + 1]) {
        outputPath = resolve(process.cwd(), args[outFlagIndex + 1]!);
      } else {
        const fileBase = basename(resolvedInput, extname(resolvedInput)).replace(/\.yumia$/, '');
        outputPath = join(dirname(resolvedInput), 'dist', `${fileBase}${targetExtension}`);
      }

      mkdirSync(dirname(outputPath), { recursive: true });

      const compiler = new YumiaCompiler();

      // Assemble CLI color / theme overrides
      const cliColorOverrides: Record<string, string> = {};
      if (cliBg) cliColorOverrides.background = cliBg;
      if (cliPrimary) cliColorOverrides.primary = cliPrimary;
      if (cliSecondary) cliColorOverrides.secondary = cliSecondary;
      if (cliText) cliColorOverrides.text = cliText;
      if (cliAccent) cliColorOverrides.accent = cliAccent;

      const renderTheme =
        cliTheme || Object.keys(cliColorOverrides).length > 0
          ? resolveTheme(cliTheme || 'default', {
              ...(Object.keys(cliColorOverrides).length > 0 ? { colors: cliColorOverrides } : {}),
            })
          : undefined;

      const compileFile = async () => {
        const source = readFileSync(resolvedInput, 'utf-8');
        if (isHtml) {
          const htmlRenderer = new HtmlRenderer();
          const result = await compiler.compile(source, htmlRenderer, {
            ...(renderTheme ? { renderContext: { theme: renderTheme } } : {}),
          });
          writeFileSync(outputPath, result.html, 'utf-8');
          return { slideCount: result.slideCount, format: result.format };
        } else {
          const pptxRenderer = new PptxRenderer();
          const result = await compiler.compile(source, pptxRenderer, {
            ...(renderTheme ? { renderContext: { theme: renderTheme } } : {}),
          });
          const buffer =
            result.data instanceof Uint8Array
              ? Buffer.from(result.data)
              : Buffer.from(new Uint8Array(result.data));
          writeFileSync(outputPath, buffer);
          return { slideCount: result.slideCount, format: result.format };
        }
      };

      const result = await compileFile();

      if (command === 'watch' || isWatch) {
        fsWatch(resolvedInput, async () => {
          try {
            await compileFile();
          } catch {
            // Keep watching on transient error
          }
        });
      }

      if (isJson) {
        return {
          exitCode: 0,
          output: JSON.stringify(
            {
              success: true,
              source: target,
              output: outputPath,
              slideCount: result.slideCount,
              format: result.format,
              watching: command === 'watch' || isWatch,
            },
            null,
            2
          ),
        };
      }

      const watchMsg = command === 'watch' || isWatch ? ' [Watching for changes...]' : '';
      return {
        exitCode: 0,
        output: `✓ Successfully compiled '${target}' ➔ '${outputPath}' (${result.slideCount} ${isHtml ? 'interactive HTML slides' : 'native editable slides'})${watchMsg}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ success: false, error: msg }) };
      }
      return {
        exitCode: 1,
        output: `✗ Build failed: ${msg}`,
      };
    }
  }

  return {
    exitCode: 1,
    output: `Unknown command: '${command}'. Run 'yumia --help' for available commands.`,
  };
}
