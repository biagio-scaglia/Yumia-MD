import { describe, it, expect } from 'vitest';
import { DefaultYumiaParser, NativeYumiaParser } from '@yumiamd/parser';
import { HtmlRenderer } from '@yumiamd/renderer-html';
import { PdfRenderer } from '@yumiamd/renderer-pdf';
import { PptxRenderer } from '@yumiamd/renderer-pptx';
import { MathElement } from '@yumiamd/ast';
import { renderLatexToSvg, renderLatexToPng } from '@yumiamd/renderer';

describe('Feature: Math & LaTeX Support across HTML, PDF, and PPTX', () => {
  it('should render LaTeX formula to pure SVG', () => {
    const svg = renderLatexToSvg('E = mc^2', { display: true, color: '#2563eb' });
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg.length).toBeGreaterThan(100);
  });

  it('should render LaTeX formula to high-DPI transparent PNG', () => {
    const raster = renderLatexToPng('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', {
      display: true,
      color: '#ffffff',
      height: 60,
      scale: 2,
    });
    expect(raster).toBeDefined();
    expect(raster.png).toBeInstanceOf(Buffer);
    expect(raster.png.length).toBeGreaterThan(500);
    expect(raster.width).toBeGreaterThan(0);
    expect(raster.height).toBeGreaterThan(0);
  });

  it('should parse math from markdown fenced code blocks, directives, and $$ blocks', () => {
    const markdown = `
# Slide 1

\`\`\`math
\\nabla \\times \\mathbf{B} = \\mu_0\\mathbf{J} + \\mu_0\\epsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
\`\`\`

:::math caption="Mass-Energy Equivalence"
E = mc^2
:::

:::math latex="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" caption="Summation Formula"

$$
\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1
$$
`;

    const parser = new DefaultYumiaParser();
    const presentation = parser.parse(markdown);
    expect(presentation.slides.length).toBe(1);
    const elements = presentation.slides[0]!.elements;

    const mathElements = elements.filter((el) => el.type === 'math') as MathElement[];
    expect(mathElements.length).toBe(4);

    expect(mathElements[0]!.expression).toContain('\\nabla \\times \\mathbf{B}');
    expect(mathElements[1]!.expression).toBe('E = mc^2');
    expect(mathElements[1]!.caption).toBe('Mass-Energy Equivalence');
    expect(mathElements[2]!.expression).toContain('\\sum_{i=1}^{n}');
    expect(mathElements[2]!.caption).toBe('Summation Formula');
    expect(mathElements[3]!.expression).toContain('\\lim_{x \\to 0}');
  });

  it('should parse math in native Yumia DSL', () => {
    const nativeSource = `
document "Math Showcase"
  theme "corporate"

slide "Physics & Calculus"
  math "E = mc^2" caption="Special Relativity"
  math caption="Gaussian Integral"
    \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
`;

    const parser = new NativeYumiaParser();
    const presentation = parser.parse(nativeSource);
    expect(presentation.slides.length).toBe(1);
    const elements = presentation.slides[0]!.elements;

    const mathElements = elements.filter((el) => el.type === 'math') as MathElement[];
    expect(mathElements.length).toBe(2);
    expect(mathElements[0]!.expression).toBe('E = mc^2');
    expect(mathElements[0]!.caption).toBe('Special Relativity');
    expect(mathElements[1]!.expression).toContain('\\int_{-\\infty}^{\\infty}');
    expect(mathElements[1]!.caption).toBe('Gaussian Integral');
  });

  it('should compile presentation with Math to HTML with embedded SVGs and inline formulas', async () => {
    const markdown = `
# Quantum Mechanics

The energy of a photon is given by $E = h\\nu$ where $\\nu$ is the frequency.

\`\`\`math
i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)
\`\`\`
`;

    const parser = new DefaultYumiaParser();
    const presentation = parser.parse(markdown);
    const renderer = new HtmlRenderer();
    const output = await renderer.render(presentation);

    expect(output.html).toContain('yumia-math-container');
    expect(output.html).toContain('yumia-inline-math');
    expect(output.html).toContain('<svg');
  });

  it('should compile presentation with Math to Vector PDF', async () => {
    const markdown = `
# Statistical Mechanics

:::math caption="Boltzmann Distribution"
P(E) = \\frac{e^{-\\beta E}}{Z}
:::
`;

    const parser = new DefaultYumiaParser();
    const presentation = parser.parse(markdown);
    const renderer = new PdfRenderer();
    const result = await renderer.render(presentation);

    expect(result.format).toBe('pdf');
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(1000);
    // PDF signature
    expect(Buffer.from(result.data.slice(0, 5)).toString('ascii')).toBe('%PDF-');
  });

  it('should compile presentation with Math to native editable PPTX', async () => {
    const markdown = `
# Advanced Mathematics

\`\`\`math
e^{i\\pi} + 1 = 0
\`\`\`

:::math latex="A = \\pi r^2" caption="Area of a Circle"
`;

    const parser = new DefaultYumiaParser();
    const presentation = parser.parse(markdown);
    const renderer = new PptxRenderer();
    const result = await renderer.render(presentation);

    expect(result.format).toBe('pptx');
    expect(result.data).toBeDefined();
    expect(result.data.byteLength).toBeGreaterThan(5000);
  });
});
