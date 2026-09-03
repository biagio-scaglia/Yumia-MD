import { readFileSync } from 'node:fs';
import { parseYumia } from '@yumia/parser';

export const VERSION = '0.1.0';

export interface CliOptions {
  help?: boolean;
  version?: boolean;
  command?: string;
  args?: string[];
}

export function printHelp(): string {
  return `
YumiaMD — Markdown-based presentation compiler (v${VERSION})

Usage:
  yumia <command> [options] [file]

Commands:
  validate <file>    Validate a .yumia.md presentation file
  inspect <file>     Inspect the AST and slide structure of a presentation
  build <file>       Compile a presentation (planned)

Options:
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

  const [command, filePath] = args;

  if (command === 'validate') {
    if (!filePath) {
      return { exitCode: 1, output: 'Error: Please specify a file to validate.' };
    }
    try {
      const source = readFileSync(filePath, 'utf-8');
      const presentation = parseYumia(source);
      return {
        exitCode: 0,
        output: `✓ Presentation '${filePath}' is valid. Detected ${presentation.slides.length} slide(s).`,
      };
    } catch (err) {
      return {
        exitCode: 1,
        output: `✗ Validation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (command === 'inspect') {
    if (!filePath) {
      return { exitCode: 1, output: 'Error: Please specify a file to inspect.' };
    }
    try {
      const source = readFileSync(filePath, 'utf-8');
      const presentation = parseYumia(source);
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
      output: `[planned] Build command for '${filePath ?? 'presentation'}' is not yet implemented.`,
    };
  }

  return {
    exitCode: 1,
    output: `Unknown command: '${command}'. Run 'yumia --help' for available commands.`,
  };
}
