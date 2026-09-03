import { describe, expect, it } from 'vitest';
import { createTheme, defaultTheme } from '../src/index.js';

describe('@biagioscaglia/yumia-theme', () => {
  it('should have valid default theme structure and tokens', () => {
    expect(defaultTheme.name).toBe('default');
    expect(defaultTheme.colors.primary).toBeDefined();
    expect(defaultTheme.colors.background).toBe('#ffffff');
    expect(defaultTheme.typography.headingFont).toBeDefined();
    expect(defaultTheme.spacing.unit).toBe(8);
    expect(defaultTheme.radius.default).toBe(8);
  });

  it('should create customized themes by overriding defaults', () => {
    const darkTheme = createTheme({
      name: 'dark',
      colors: {
        ...defaultTheme.colors,
        background: '#0f172a',
        text: '#f8fafc',
      },
    });

    expect(darkTheme.name).toBe('dark');
    expect(darkTheme.colors.background).toBe('#0f172a');
    expect(darkTheme.colors.text).toBe('#f8fafc');
    expect(darkTheme.colors.primary).toBe(defaultTheme.colors.primary);
  });
});
