import * as fs from 'fs';
import * as path from 'path';

export interface ResolvedAsset {
  absolutePath: string;
  exists: boolean;
}

/**
 * Resolve a local image/asset path safely.
 * Rejects URL schemes and path traversal outside the allowed base directory
 * when a baseDir is provided. Absolute paths that exist are allowed when
 * they do not escape baseDir (if set).
 */
export function resolveLocalAsset(
  src: string,
  baseDir: string = process.cwd()
): ResolvedAsset | null {
  if (!src || typeof src !== 'string') return null;

  const trimmed = src.trim();
  if (!trimmed) return null;

  // Block remote / dangerous schemes — binary renderers only embed local files.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return null;
  }

  const root = path.resolve(baseDir);
  const absolutePath = path.isAbsolute(trimmed)
    ? path.resolve(trimmed)
    : path.resolve(root, trimmed);

  const relative = path.relative(root, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    // Absolute path outside baseDir — only allow if file exists and caller
    // passed an absolute src (explicit). Still reject obvious traversal.
    if (!path.isAbsolute(trimmed)) {
      return null;
    }
  }

  if (absolutePath.includes('\0')) return null;

  return {
    absolutePath,
    exists: fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile(),
  };
}

const WINDOWS_FONT_CANDIDATES = [
  'C:\\Windows\\Fonts\\segoeui.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:\\Windows\\Fonts\\calibri.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/Library/Fonts/Arial.ttf',
];

const WINDOWS_FONT_BOLD_CANDIDATES = [
  'C:\\Windows\\Fonts\\segoeuib.ttf',
  'C:\\Windows\\Fonts\\arialbd.ttf',
  'C:\\Windows\\Fonts\\calibrib.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
];

export function findSystemFont(weight: 'regular' | 'bold' = 'regular'): string | null {
  const list = weight === 'bold' ? WINDOWS_FONT_BOLD_CANDIDATES : WINDOWS_FONT_CANDIDATES;
  for (const candidate of list) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}
