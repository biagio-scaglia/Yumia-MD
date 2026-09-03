import { YumiaTheme } from './types.js';

export const defaultTheme: YumiaTheme = {
  name: 'default',
  description: 'Default modern theme with high contrast and clean typography',
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#06b6d4',
    border: '#e2e8f0',
  },
  typography: {
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
    codeFont: 'JetBrains Mono, Fira Code, monospace',
    sizes: {
      h1: 44,
      h2: 36,
      h3: 28,
      h4: 22,
      body: 18,
      small: 14,
      code: 16,
    },
    weights: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    unit: 8,
    slidePadding: 48,
    elementGap: 24,
  },
  radius: {
    default: 8,
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  components: {
    card: {
      background: '#f8fafc',
      borderColor: '#e2e8f0',
      borderRadius: 12,
      padding: 24,
    },
    code: {
      background: '#0f172a',
      textColor: '#f8fafc',
      borderRadius: 8,
    },
    table: {
      headerBackground: '#f1f5f9',
      rowAlternateBackground: '#f8fafc',
      borderColor: '#e2e8f0',
    },
  },
};

export function createTheme(overrides: Partial<YumiaTheme> & { name: string }): YumiaTheme {
  return {
    ...defaultTheme,
    ...overrides,
    colors: { ...defaultTheme.colors, ...overrides.colors },
    typography: { ...defaultTheme.typography, ...overrides.typography },
    spacing: { ...defaultTheme.spacing, ...overrides.spacing },
    radius: { ...defaultTheme.radius, ...overrides.radius },
    shadows: { ...defaultTheme.shadows, ...overrides.shadows },
    components: { ...defaultTheme.components, ...overrides.components },
  };
}
