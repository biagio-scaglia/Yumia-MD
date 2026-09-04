import { execSync } from 'node:child_process';

const packages = [
  '@biagioscaglia/yumia-ast',
  '@biagioscaglia/yumia-parser',
  '@biagioscaglia/yumia-theme',
  '@biagioscaglia/yumia-layout',
  '@biagioscaglia/yumia-renderer',
  '@biagioscaglia/yumia-renderer-pptx',
  '@biagioscaglia/yumia-renderer-pdf',
  '@biagioscaglia/yumia-renderer-html',
  '@biagioscaglia/yumia-core',
];

console.log('🗑️  Unpublishing old packages from NPM...\n');

for (const pkg of packages) {
  console.log(`Unpublishing ${pkg}...`);
  try {
    execSync(`npm unpublish ${pkg} --force`, { stdio: 'inherit' });
    console.log(`✓ Removed ${pkg}\n`);
  } catch {
    console.warn(`⚠️  Could not unpublish ${pkg} (may already be unpublished or require auth)\n`);
  }
}

console.log('🎉 Done!');
