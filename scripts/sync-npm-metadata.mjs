#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const REPO_URL = 'git+https://github.com/biagio-scaglia/Yumia-MD.git';
const HOMEPAGE_URL = 'https://github.com/biagio-scaglia/Yumia-MD#readme';
const BUGS_URL = 'https://github.com/biagio-scaglia/Yumia-MD/issues';

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

function syncNpmMetadata() {
  const pkgPaths = getAllPackageJsonPaths();

  for (const pkgPath of pkgPaths) {
    const raw = readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw);

    json.author = 'Biagio Scaglia';
    json.license = 'MIT';
    json.repository = {
      type: 'git',
      url: REPO_URL,
    };
    json.homepage = HOMEPAGE_URL;
    json.bugs = {
      url: BUGS_URL,
    };

    if (pkgPath !== join(rootDir, 'package.json')) {
      json.publishConfig = {
        access: 'public',
      };
      json.files = ['dist', 'README.md', 'LICENSE'];
    }

    writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    const relativePath = pkgPath.replace(rootDir, '').replace(/^[/\\]/, '');
    console.log(`✓ Synchronized NPM metadata for ${relativePath}`);
  }
}

syncNpmMetadata();
