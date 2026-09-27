import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { Resvg } from '@resvg/resvg-js';

// Setup MathJax lite adaptor and handlers
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
  inlineMath: [['$', '$']],
  displayMath: [['$$', '$$']],
});

const svgOutput = new SVG({
  fontCache: 'none',
});

const mathDocument = mathjax.document('', {
  InputJax: texInput,
  OutputJax: svgOutput,
});

export interface MathRenderOptions {
  display?: boolean;
  color?: string;
  em?: number;
  ex?: number;
}

export interface RasterizedMath {
  png: Buffer;
  width: number;
  height: number;
  svg: string;
}

const svgCache = new Map<string, string>();
const pngCache = new Map<string, RasterizedMath>();

/**
 * Render LaTeX formula to pure SVG string.
 */
export function renderLatexToSvg(latex: string, options: MathRenderOptions = {}): string {
  const display = options.display ?? true;
  const color = options.color || 'currentColor';
  const em = options.em || 16;
  const ex = options.ex || 8;
  const cacheKey = `${latex}|${display}|${color}|${em}|${ex}`;

  const cached = svgCache.get(cacheKey);
  if (cached) return cached;

  try {
    const node = mathDocument.convert(latex, {
      display,
      em,
      ex,
      containerWidth: 80 * em,
    });

    const containerHtml = adaptor.outerHTML(node);
    const svgMatch = containerHtml.match(/<svg[\s\S]*<\/svg>/);
    let svg = svgMatch ? svgMatch[0] : containerHtml;

    if (color && color !== 'currentColor') {
      svg = svg.replace(/currentColor/g, color);
      if (!svg.includes('fill="') && !svg.includes('color="')) {
        svg = svg.replace('<svg', `<svg color="${color}" fill="${color}"`);
      }
    }

    svgCache.set(cacheKey, svg);
    return svg;
  } catch {
    // Fallback simple SVG in case of malformed LaTeX
    const safeText = (latex || '').replace(/[<>&"]/g, '');
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60" width="400" height="60"><rect width="100%" height="100%" fill="rgba(255,255,255,0.05)" rx="6"/><text x="50%" y="55%" text-anchor="middle" fill="${color === 'currentColor' ? '#ef4444' : color}" font-family="monospace" font-size="14">${safeText}</text></svg>`;
    svgCache.set(cacheKey, fallbackSvg);
    return fallbackSvg;
  }
}

/**
 * Render LaTeX formula to high-DPI transparent PNG buffer for PDF/PPTX embedding.
 */
export function renderLatexToPng(
  latex: string,
  options: MathRenderOptions & { height?: number; width?: number; scale?: number } = {}
): RasterizedMath {
  const display = options.display ?? true;
  const color = options.color || '#ffffff';
  const reqHeight = options.height || (display ? 80 : 32);
  const scale = options.scale || 2;
  const cacheKey = `${latex}|${display}|${color}|${reqHeight}|${scale}`;

  const cached = pngCache.get(cacheKey);
  if (cached) return cached;

  const svg = renderLatexToSvg(latex, {
    display,
    color,
    em: 18,
    ex: 9,
  });

  try {
    const targetHeight = Math.max(24, Math.round(reqHeight * scale));
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'height', value: targetHeight },
      background: 'rgba(0,0,0,0)',
    });
    const rendered = resvg.render();
    const png = Buffer.from(rendered.asPng());
    const result: RasterizedMath = {
      png,
      width: rendered.width,
      height: rendered.height,
      svg,
    };
    pngCache.set(cacheKey, result);
    return result;
  } catch {
    // Fallback 1x1 transparent PNG
    const empty = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const fallback: RasterizedMath = {
      png: empty,
      width: 1,
      height: 1,
      svg,
    };
    return fallback;
  }
}

export function clearMathCache(): void {
  svgCache.clear();
  pngCache.clear();
}
