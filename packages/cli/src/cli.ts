import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseYumia } from '@yumiamd/parser';
import { DefaultLayoutEngine } from '@yumiamd/layout';
import { Presentation, Slide } from '@yumiamd/ast';
import { YumiaCompiler } from '@yumiamd/core';
import { PptxRenderer } from '@yumiamd/renderer-pptx';

export const VERSION = '0.1.6';

export function printHelp(): string {
  return `
YumiaMD — Markdown-based presentation compiler (v${VERSION})

Usage:
  yumia <command> [options] [file]

Commands:
  init [name]        Scaffold a new YumiaMD presentation project
  validate <file>    Validate a .yumia.md presentation syntax and structure
  lint <file>        Analyze presentation for layout overflows and accessibility
  inspect <file>     Inspect the AST and geometric layout tree
  schema             Output machine-readable JSON schema for AI agents
  build <file>       Compile a presentation to editable PowerPoint (.pptx)

Options:
  --out, -o <file>   Specify output file path (default: dist/<name>.pptx)
  --format, -f <fmt> Target output format: pptx (default)
  --json             Output results formatted as JSON for CI/CD and AI tools
  --layout           Show computed geometric bounding boxes in 'inspect'
  -h, --help         Show this help message
  -v, --version      Show CLI version
`.trim();
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
  const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
  const command = nonFlagArgs[0];
  const target = nonFlagArgs[1];

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

      const sampleContent = `---
title: ${projectName}
theme: default
aspectRatio: "16:9"
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
:::card Core Pipeline
- Semantic AST model
- Markdown + Directive parser
- 100% Deterministic layout
:::
:::

:::column
:::card Native Output
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
            },
            null,
            2
          ),
        };
      }

      return {
        exitCode: 0,
        output: `✓ Created presentation project '${projectName}' at ./${projectName}\n  Edit ./${projectName}/presentation.yumia.md to get started!\n  Then compile with: yumia build ./${projectName}/presentation.yumia.md`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isJson) {
        return { exitCode: 1, output: JSON.stringify({ success: false, error: msg }, null, 2) };
      }
      return {
        exitCode: 1,
        output: `✗ Initialization failed: ${msg}`,
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
      const presentation = parseYumia(source);
      const engine = new DefaultLayoutEngine();
      const layout = engine.computePresentation(presentation);

      const issues: Array<{ slide: number; type: string; message: string }> = [];
      layout.slides.forEach((slideResult, index) => {
        const slideNum = index + 1;
        if (slideResult.overflow) {
          issues.push({
            slide: slideNum,
            type: 'overflow',
            message: `Content exceeds slide height by ~${Math.round(slideResult.overflowAmount || 0)}px`,
          });
        }

        const slide = presentation.slides[index] as Slide;
        if (slide.elements.length === 0) {
          issues.push({
            slide: slideNum,
            type: 'empty',
            message: 'Slide has no content elements.',
          });
        }
      });

      if (isJson) {
        return {
          exitCode: 0,
          output: JSON.stringify(
            {
              target,
              passed: issues.length === 0,
              slideCount: presentation.slides.length,
              issues,
            },
            null,
            2
          ),
        };
      }

      if (issues.length === 0) {
        return {
          exitCode: 0,
          output: `✓ Yumia Lint: All ${presentation.slides.length} slide(s) passed with 0 issues.`,
        };
      } else {
        const formatted = issues.map((i) => `⚠ Slide ${i.slide}: ${i.message}`).join('\n');
        return {
          exitCode: 0,
          output: `Yumia Lint Report for '${target}':\n\n${formatted}\n\nFound ${issues.length} warning(s).`,
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

  if (command === 'build') {
    if (!target) {
      const msg = 'Error: Please specify a presentation file to build.';
      return { exitCode: 1, output: isJson ? JSON.stringify({ error: msg }) : msg };
    }

    try {
      const resolvedInput = resolve(process.cwd(), target);
      const source = readFileSync(resolvedInput, 'utf-8');

      // Determine output path
      let outputPath = '';
      const outFlagIndex = args.findIndex((a) => a === '--out' || a === '-o');
      if (outFlagIndex !== -1 && args[outFlagIndex + 1]) {
        outputPath = resolve(process.cwd(), args[outFlagIndex + 1]!);
      } else {
        const fileBase = basename(resolvedInput, extname(resolvedInput)).replace(/\.yumia$/, '');
        outputPath = join(dirname(resolvedInput), 'dist', `${fileBase}.pptx`);
      }

      mkdirSync(dirname(outputPath), { recursive: true });

      const compiler = new YumiaCompiler();
      const renderer = new PptxRenderer();

      const result = await compiler.compile(source, renderer);
      const buffer =
        result.data instanceof Uint8Array
          ? Buffer.from(result.data)
          : Buffer.from(new Uint8Array(result.data));
      writeFileSync(outputPath, buffer);

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
            },
            null,
            2
          ),
        };
      }

      return {
        exitCode: 0,
        output: `✓ Successfully compiled '${target}' ➔ '${outputPath}' (${result.slideCount} native editable slides)`,
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
