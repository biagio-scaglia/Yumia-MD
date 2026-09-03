#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

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
        // Ignored if package.json does not exist
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
      // Direct version string passed
      parseSemVer(bumpType); // validate syntax
      return bumpType;
  }
}

function updateCliVersionConstant(newVersion) {
  const cliFilePath = join(rootDir, 'packages', 'cli', 'src', 'cli.ts');
  try {
    const content = readFileSync(cliFilePath, 'utf-8');
    const updated = content.replace(
      /export const VERSION = ['"][^'"]+['"];/,
      `export const VERSION = '${newVersion}';`
    );
    if (content !== updated) {
      writeFileSync(cliFilePath, updated, 'utf-8');
      console.log(`✓ Updated CLI constant in packages/cli/src/cli.ts -> ${newVersion}`);
    }
  } catch (err) {
    console.warn(`Could not update CLI version constant: ${err.message}`);
  }
}

function main() {
  const arg = process.argv[2];
  const { data: rootPkg } = getRootPackageJson();
  const currentVersion = rootPkg.version || '0.1.0';

  if (!arg || arg === '--help' || arg === '-h') {
    console.log(`
YumiaMD Version Bumper

Current version: ${currentVersion}

Usage:
  node scripts/bump-version.mjs <patch | minor | major | X.Y.Z>

Examples:
  pnpm version:bump patch    # 0.1.0 -> 0.1.1
  pnpm version:bump minor    # 0.1.0 -> 0.2.0
  pnpm version:bump major    # 0.1.0 -> 1.0.0
  pnpm version:bump 0.2.5    # Set explicit version
`);
    process.exit(0);
  }

  const nextVersion = calculateNextVersion(currentVersion, arg);
  console.log(`Bumping YumiaMD workspace version: ${currentVersion} ➔ ${nextVersion}`);

  const pkgPaths = getAllPackageJsonPaths();
  let updatedCount = 0;

  for (const pkgPath of pkgPaths) {
    const raw = readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw);
    json.version = nextVersion;
    writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    const relativePath = pkgPath.replace(rootDir, '').replace(/^[/\\]/, '');
    console.log(`✓ Updated ${relativePath} -> ${nextVersion}`);
    updatedCount++;
  }

  updateCliVersionConstant(nextVersion);

  console.log(`\n🎉 Successfully bumped ${updatedCount} package(s) to v${nextVersion}`);
}

main();
