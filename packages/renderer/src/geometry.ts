/**
 * Shared slide/page geometry for PPTX and PDF renderers.
 * Keeps aspect-ratio handling consistent across binary targets.
 */

export interface SlideGeometry {
  /** Logical layout viewport in CSS pixels (used by @yumiamd/layout). */
  pixelViewport: { width: number; height: number };
  /** PPTX slide size in inches. */
  inches: { width: number; height: number };
  /** PDF page size in PDF points (1/72"). */
  points: { width: number; height: number };
  layoutName: string;
}

const GEOMETRIES: Record<string, SlideGeometry> = {
  '16:9': {
    pixelViewport: { width: 1920, height: 1080 },
    inches: { width: 13.333, height: 7.5 },
    points: { width: 960, height: 540 },
    layoutName: 'YUMIA_16_9',
  },
  '4:3': {
    pixelViewport: { width: 1440, height: 1080 },
    inches: { width: 10.0, height: 7.5 },
    points: { width: 720, height: 540 },
    layoutName: 'YUMIA_4_3',
  },
  '16:10': {
    pixelViewport: { width: 1920, height: 1200 },
    inches: { width: 13.333, height: 8.333 },
    points: { width: 960, height: 600 },
    layoutName: 'YUMIA_16_10',
  },
};

export function resolveSlideGeometry(aspectRatio?: string): SlideGeometry {
  const key = (aspectRatio || '16:9').trim();
  return GEOMETRIES[key] || GEOMETRIES['16:9']!;
}

/**
 * Map theme CSS-pixel typography sizes to PPTX point sizes.
 * Theme tokens are authored for ~1920px HTML slides; PPTX pts need a
 * modest downscale so dense slides remain readable without overflow.
 */
export function themeSizeToPptxPoints(themeSize: number | undefined, fallback: number): number {
  const size = themeSize ?? fallback;
  return Math.max(10, Math.round(size * 0.72));
}

/**
 * Map theme CSS-pixel typography sizes to PDFKit point sizes
 * for the half-scale 960×540 page canvas.
 */
export function themeSizeToPdfPoints(themeSize: number | undefined, fallback: number): number {
  const size = themeSize ?? fallback;
  return Math.max(9, Math.round(size * 0.55));
}
