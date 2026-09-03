#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function runCommand(command, description) {
  console.log(`\n⚙️  ${description}...`);
  try {
    execSync(command, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✓ ${description} completed successfully.`);
  } catch (err) {
    console.error(`\n❌ Error during ${description}:`, err.message);
    process.exit(1);
  }
}

function getRootPackageJson() {
  const rootPkgPath = join(rootDir, 'package.json');
  return {
    path: rootPkgPath,
    data: JSON.parse(readFileSync(rootPkgPath, 'utf-8')),
  };
}

function getAllPackageJsonPaths() {
  const packagesDir = join(rootDir, 'packages');
  const entries = readdirSync(packagesDir);
  const pkgPaths = [join(rootDir, 'package.json')];

  for (const entry of entries) {
    const fullPath = join(packagesDir, entry);
    if (statSync(fullPath).isDirectory()) {
      const pkgJsonPath = join(fullPath, 'package.json');
      try {
        if (statSync(pkgJsonPath).isFile()) {
          pkgPaths.push(pkgJsonPath);
        }
      } catch {
        // Ignored
      }
    }
  }

  return pkgPaths;
}

function parseSemVer(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
  };
}

function calculateNextVersion(currentVersion, bumpType) {
  const semver = parseSemVer(currentVersion);
  switch (bumpType) {
    case 'major':
      return `${semver.major + 1}.0.0`;
    case 'minor':
      return `${semver.major}.${semver.minor + 1}.0`;
    case 'patch':
      return `${semver.major}.${semver.minor}.${semver.patch + 1}`;
    default:
      parseSemVer(bumpType);
      return bumpType;
  }
}

function updateVersions(newVersion) {
  const pkgPaths = getAllPackageJsonPaths();
  for (const pkgPath of pkgPaths) {
    const raw = readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw);
    json.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  }

  const cliFilePath = join(rootDir, 'packages', 'cli', 'src', 'cli.ts');
  try {
    const content = readFileSync(cliFilePath, 'utf-8');
    const updated = content.replace(
      /export const VERSION = ['"][^'"]+['"];/,
      `export const VERSION = '${newVersion}';`
    );
    if (content !== updated) {
      writeFileSync(cliFilePath, updated, 'utf-8');
    }
  } catch (err) {
    console.warn(`Could not update CLI version constant: ${err.message}`);
  }
}

function main() {
  const arg = process.argv[2];
  const { data: rootPkg } = getRootPackageJson();
  let targetVersion = rootPkg.version || '0.1.0';

  if (arg && arg !== '--current') {
    targetVersion = calculateNextVersion(targetVersion, arg);
    console.log(`\n🚀 Preparing release for YumiaMD v${targetVersion}...`);
    updateVersions(targetVersion);
  } else {
    console.log(`\n🚀 Publishing current version YumiaMD v${targetVersion} to NPM...`);
  }

  // 1. Build fresh dist/ bundles
  runCommand('pnpm build', 'Building all workspace packages');

  // 2. Run automated tests
  runCommand('pnpm test', 'Running test suite');

  // 3. Publish to NPM
  runCommand(
    'pnpm -r publish --access public --no-git-checks',
    `Publishing packages to NPM registry (v${targetVersion})`
  );

  console.log(`\n🎉 Successfully published YumiaMD v${targetVersion} to NPM!`);
}

main();
