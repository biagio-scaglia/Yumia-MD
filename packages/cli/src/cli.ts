import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseYumia } from '@biagioscaglia/yumia-parser';
import { DefaultLayoutEngine } from '@biagioscaglia/yumia-layout';
import { Presentation, Slide } from '@biagioscaglia/yumia-ast';

export const VERSION = '0.1.1';

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
  build <file>       Compile a presentation to target formats (planned)

Options:
  --layout           Show computed geometric bounding boxes in 'inspect'
  -h, --help         Show this help message
  -v, --version      Show CLI version
`.trim();
}

export function runCli(argv: string[]): { exitCode: number; output: string } {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    return { exitCode: 0, output: printHelp() };
  }

  if (args.includes('-v') || args.includes('--version')) {
    return { exitCode: 0, output: `yumia v${VERSION}` };
  }

  const command = args[0];
  const target = args[1];

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
---

# ${projectName}
Presentation authoring with YumiaMD.

:::notes
Opening slide introducing the project.
:::

---

# Architecture

:::columns ratios="50:50"

:::column
:::card Philosophy
- Plain Markdown source
- Semantic directives
:::
:::

:::column
:::card Output
- Native editable PPTX
- Clean vector PDF
:::
:::

:::
`.trim();

      writeFileSync(join(projectDir, 'presentation.yumia.md'), sampleContent, 'utf-8');

      return {
        exitCode: 0,
        output: `✓ Created presentation project '${projectName}' at ./${projectName}\n  Edit ./${projectName}/presentation.yumia.md to get started!`,
      };
    } catch (err) {
      return {
        exitCode: 1,
        output: `✗ Initialization failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (command === 'validate') {
    if (!target) {
      return { exitCode: 1, output: 'Error: Please specify a file to validate.' };
    }
    try {
      const source = readFileSync(target, 'utf-8');
      const presentation = parseYumia(source);
      return {
        exitCode: 0,
        output: `✓ Presentation '${target}' is valid. Detected ${presentation.slides.length} slide(s).`,
      };
    } catch (err) {
      return {
        exitCode: 1,
        output: `✗ Validation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (command === 'lint') {
    if (!target) {
      return { exitCode: 1, output: 'Error: Please specify a file to lint.' };
    }
    try {
      const source = readFileSync(target, 'utf-8');
      const presentation = parseYumia(source);
      const engine = new DefaultLayoutEngine();
      const layout = engine.computePresentation(presentation);

      const issues: string[] = [];
      layout.slides.forEach((slideResult, index) => {
        const slideNum = index + 1;
        if (slideResult.overflow) {
          issues.push(
            `⚠ Slide ${slideNum}: Content exceeds slide height by ~${Math.round(slideResult.overflowAmount || 0)}px`
          );
        }

        const slide = presentation.slides[index] as Slide;
        if (slide.elements.length === 0) {
          issues.push(`⚠ Slide ${slideNum}: Slide has no content elements.`);
        }
      });

      if (issues.length === 0) {
        return {
          exitCode: 0,
          output: `✓ Yumia Lint: All ${presentation.slides.length} slide(s) passed with 0 issues.`,
        };
      } else {
        return {
          exitCode: 0,
          output: `Yumia Lint Report for '${target}':\n\n${issues.join('\n')}\n\nFound ${issues.length} warning(s).`,
        };
      }
    } catch (err) {
      return {
        exitCode: 1,
        output: `✗ Linting failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (command === 'inspect') {
    if (!target) {
      return { exitCode: 1, output: 'Error: Please specify a file to inspect.' };
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
      return {
        exitCode: 1,
        output: `✗ Inspection failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (command === 'build') {
    return {
      exitCode: 0,
      output: `[planned] Compiling '${target ?? 'presentation'}' via YumiaCompiler...`,
    };
  }

  return {
    exitCode: 1,
    output: `Unknown command: '${command}'. Run 'yumia --help' for available commands.`,
  };
}
