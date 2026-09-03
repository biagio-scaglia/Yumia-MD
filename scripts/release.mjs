#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ORDERED_PACKAGES = [
  'ast',
  'theme',
  'parser',
  'layout',
  'renderer',
  'renderer-html',
  'renderer-pdf',
  'renderer-pptx',
  'core',
  'cli',
];

function runCommand(command, description, cwd = rootDir) {
  console.log(`\n⚙️  ${description}...`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log(`✓ ${description} completed.`);
  } catch (err) {
    console.error(`\n❌ Error during ${description}:`, err.message);
    throw err;
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
  const pkgPaths = [join(rootDir, 'package.json')];
  for (const pkg of ORDERED_PACKAGES) {
    pkgPaths.push(join(rootDir, 'packages', pkg, 'package.json'));
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

function publishAllPackages(targetVersion) {
  console.log(
    `\n📦 Publishing ${ORDERED_PACKAGES.length} packages sequentially to NPM (v${targetVersion})...`
  );

  for (const pkgDir of ORDERED_PACKAGES) {
    const fullPath = join(rootDir, 'packages', pkgDir);
    const pkgJson = JSON.parse(readFileSync(join(fullPath, 'package.json'), 'utf-8'));
    const pkgName = pkgJson.name;

    console.log(`\n🚀 [${pkgDir}] Publishing ${pkgName}@${targetVersion}...`);
    try {
      execSync('pnpm publish --access public --no-git-checks', {
        cwd: fullPath,
        stdio: 'inherit',
      });
      console.log(`✓ Published ${pkgName}@${targetVersion}`);
    } catch (err) {
      const errStr = err.message || '';
      if (errStr.includes('previously published') || errStr.includes('403 Forbidden')) {
        console.log(
          `ℹ️  ${pkgName}@${targetVersion} is already published on NPM. Skipping to next package.`
        );
      } else {
        console.warn(`⚠️  Retrying publication for ${pkgName} in 2s...`);
        try {
          execSync('node -e "setTimeout(()=>{}, 2000)"');
          execSync('pnpm publish --access public --no-git-checks', {
            cwd: fullPath,
            stdio: 'inherit',
          });
          console.log(`✓ Published ${pkgName}@${targetVersion}`);
        } catch (retryErr) {
          const retryStr = retryErr.message || '';
          if (retryStr.includes('previously published') || retryStr.includes('403 Forbidden')) {
            console.log(`ℹ️  ${pkgName}@${targetVersion} was already published. Skipping.`);
          } else {
            console.error(`❌ Could not publish ${pkgName}:`, retryErr.message);
            throw retryErr;
          }
        }
      }
    }
  }
}

function gitCommitAndTag(version) {
  console.log(`\n🐙 Syncing git release commit & tag for v${version}...`);
  try {
    execSync('git add .', { cwd: rootDir, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf-8' });
    if (status.trim()) {
      execSync(`git commit -m "chore(release): v${version}"`, { cwd: rootDir, stdio: 'inherit' });
    }
    try {
      execSync(`git tag -a v${version} -m "Release v${version}"`, {
        cwd: rootDir,
        stdio: 'inherit',
      });
    } catch {
      // tag may exist
    }
    execSync('git push origin main --tags', { cwd: rootDir, stdio: 'inherit' });
    console.log(`✓ Git commit, tag v${version}, and push completed.`);
  } catch (err) {
    console.warn(`⚠️ Git push note: ${err.message}`);
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
    console.log(`\n🚀 Releasing YumiaMD v${targetVersion} to NPM...`);
  }

  // 1. Build fresh dist/ bundles
  runCommand('pnpm build', 'Building all workspace packages');

  // 2. Run automated tests
  runCommand('pnpm test', 'Running test suite');

  // 3. Publish to NPM
  publishAllPackages(targetVersion);

  // 4. Git commit, tag and push to GitHub
  gitCommitAndTag(targetVersion);

  console.log(`\n🎉 All packages for YumiaMD v${targetVersion} are now live on NPM & GitHub!`);
}

main();
