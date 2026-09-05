import { describe, expect, it } from 'vitest';
import { createTheme, defaultTheme, resolveTheme } from '../src/index.js';

describe('@yumiamd/theme', () => {
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

  it('should resolve all built-in themes including nord, dracula, tokyo-night, emerald, synthwave', () => {
    const themesToTest = [
      'default',
      'cyberpunk',
      'minimal',
      'corporate',
      'terminal',
      'academic',
      'nord',
      'dracula',
      'tokyo-night',
      'midnight',
      'emerald',
      'forest',
      'synthwave',
      'sunset',
    ];

    for (const name of themesToTest) {
      const theme = resolveTheme(name);
      expect(theme).toBeDefined();
      expect(theme.colors.primary).toBeDefined();
      expect(theme.colors.background).toBeDefined();
      expect(theme.colors.surface).toBeDefined();
      expect(theme.typography.headingFont).toBeDefined();
    }
  });
});
