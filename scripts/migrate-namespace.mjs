import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const NAME_MAP = {
  '@yumiamd/ast': '@yumiamd/ast',
  '@yumiamd/parser': '@yumiamd/parser',
  '@yumiamd/theme': '@yumiamd/theme',
  '@yumiamd/layout': '@yumiamd/layout',
  '@yumiamd/renderer': '@yumiamd/renderer',
  '@yumiamd/renderer-pptx': '@yumiamd/renderer-pptx',
  '@yumiamd/renderer-pdf': '@yumiamd/renderer-pdf',
  '@yumiamd/renderer-html': '@yumiamd/renderer-html',
  '@yumiamd/core': '@yumiamd/core',
};

function replaceInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [oldName, newName] of Object.entries(NAME_MAP)) {
    if (content.includes(oldName)) {
      content = content.replaceAll(oldName, newName);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated names in ${filePath.replace(rootDir, '')}`);
  }
}

function traverse(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (
      entry.endsWith('.ts') ||
      entry.endsWith('.js') ||
      entry.endsWith('.mjs') ||
      entry.endsWith('.json') ||
      entry.endsWith('.md')
    ) {
      replaceInFile(fullPath);
    }
  }
}

traverse(rootDir);
console.log('🎉 Namespace migration to @biagioscaglia/yumia-* completed.');
