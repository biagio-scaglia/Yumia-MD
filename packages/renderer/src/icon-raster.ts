import { Resvg } from '@resvg/resvg-js';
import { defaultIconResolver } from './icons.js';

export interface RasterizedIcon {
  png: Buffer;
  size: number;
}

const iconPngCache = new Map<string, RasterizedIcon>();

/**
 * Rasterize a registry icon to PNG for PPTX/PDF embedding.
 * Falls back to a monogram circle when the SVG cannot be rasterized.
 */
export function rasterizeIcon(
  name: string,
  size: number = 48,
  color: string = '#2563eb'
): RasterizedIcon {
  const px = Math.max(12, Math.min(256, Math.round(size)));
  const cacheKey = `${name}|${px}|${color.toLowerCase()}`;
  const cached = iconPngCache.get(cacheKey);
  if (cached) return cached;

  const svg = defaultIconResolver.toSvg(name, px, color, 'yumia-icon-raster');
  // Ensure stroke/fill use an absolute color (currentColor can fail in headless SVG).
  const absoluteSvg = svg
    .replace(/currentColor/g, color)
    .replace(/\scolor="[^"]*"/g, '');

  try {
    const resvg = new Resvg(absoluteSvg, {
      fitTo: { mode: 'width', value: px },
      background: 'rgba(0,0,0,0)',
    });
    const png = Buffer.from(resvg.render().asPng());
    const result = { png, size: px };
    iconPngCache.set(cacheKey, result);
    return result;
  } catch {
    // Minimal 1x1 transparent PNG fallback — callers may draw a text stub.
    const empty = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    return { png: empty, size: px };
  }
}

export function clearIconRasterCache(): void {
  iconPngCache.clear();
}
