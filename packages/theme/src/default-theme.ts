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
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
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

export const cyberpunkTheme: YumiaTheme = {
  name: 'cyberpunk',
  description: 'High-energy dark cyberpunk theme with neon pink and cyan accents',
  colors: {
    primary: '#FF2E88',
    secondary: '#00F0FF',
    background: '#0B0B12',
    surface: '#151522',
    text: '#FFFFFF',
    muted: '#A7A7B5',
    accent: '#7B61FF',
    border: '#2E2E48',
    success: '#00FF9F',
    warning: '#FFE600',
    danger: '#FF0055',
    info: '#00F0FF',
  },
  typography: {
    headingFont: 'Outfit, Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    codeFont: 'JetBrains Mono, monospace',
    sizes: {
      h1: 46,
      h2: 38,
      h3: 28,
      h4: 22,
      body: 18,
      small: 14,
      code: 16,
    },
  },
  spacing: {
    unit: 8,
    slidePadding: 48,
    elementGap: 28,
  },
  radius: {
    default: 12,
    sm: 6,
    md: 12,
    lg: 20,
    full: 9999,
  },
  components: {
    card: {
      background: '#151522',
      borderColor: '#FF2E88',
      borderRadius: 16,
      padding: 28,
    },
    code: {
      background: '#07070D',
      textColor: '#00F0FF',
      borderRadius: 8,
    },
  },
};

export const minimalTheme: YumiaTheme = {
  name: 'minimal',
  description: 'Monochrome Swiss-style design with maximum clarity and contrast',
  colors: {
    primary: '#111111',
    secondary: '#333333',
    background: '#FFFFFF',
    surface: '#F5F5F7',
    text: '#111111',
    muted: '#777777',
    accent: '#000000',
    border: '#E5E5E5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  typography: {
    headingFont: 'Helvetica Neue, Arial, sans-serif',
    bodyFont: 'Helvetica Neue, Arial, sans-serif',
    codeFont: 'Menlo, Monaco, monospace',
    sizes: {
      h1: 44,
      h2: 34,
      h3: 26,
      h4: 20,
      body: 18,
      small: 14,
      code: 15,
    },
  },
  spacing: {
    unit: 8,
    slidePadding: 56,
    elementGap: 24,
  },
  radius: {
    default: 4,
    sm: 2,
    md: 4,
    lg: 8,
    full: 9999,
  },
  components: {
    card: {
      background: '#F5F5F7',
      borderColor: '#E5E5E5',
      borderRadius: 6,
      padding: 24,
    },
  },
};

export const corporateTheme: YumiaTheme = {
  name: 'corporate',
  description: 'Executive navy blue palette tailored for business and enterprise decks',
  colors: {
    primary: '#0A2540',
    secondary: '#635BFF',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1A1F36',
    muted: '#4F566B',
    accent: '#00D4B2',
    border: '#E3E8EE',
    success: '#00D4B2',
    warning: '#FFC043',
    danger: '#DF1B41',
    info: '#635BFF',
  },
  typography: {
    headingFont: 'Inter, Segoe UI, sans-serif',
    bodyFont: 'Inter, Segoe UI, sans-serif',
    codeFont: 'Consolas, monospace',
    sizes: {
      h1: 42,
      h2: 34,
      h3: 26,
      h4: 20,
      body: 18,
      small: 14,
      code: 15,
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
    lg: 12,
    full: 9999,
  },
  components: {
    card: {
      background: '#F8FAFC',
      borderColor: '#0A2540',
      borderRadius: 8,
      padding: 24,
    },
  },
};

export const terminalTheme: YumiaTheme = {
  name: 'terminal',
  description: 'Retro hacker green-on-dark theme with pure monospace aesthetic',
  colors: {
    primary: '#00FF66',
    secondary: '#33FF88',
    background: '#0C100C',
    surface: '#141A14',
    text: '#E0FFE0',
    muted: '#4E7A4E',
    accent: '#FFB000',
    border: '#1F331F',
    success: '#00FF66',
    warning: '#FFB000',
    danger: '#FF3333',
    info: '#00E5FF',
  },
  typography: {
    headingFont: 'JetBrains Mono, Courier New, monospace',
    bodyFont: 'JetBrains Mono, Courier New, monospace',
    codeFont: 'JetBrains Mono, Courier New, monospace',
    sizes: {
      h1: 40,
      h2: 32,
      h3: 26,
      h4: 20,
      body: 17,
      small: 13,
      code: 15,
    },
  },
  spacing: {
    unit: 8,
    slidePadding: 48,
    elementGap: 24,
  },
  radius: {
    default: 0,
    sm: 0,
    md: 0,
    lg: 0,
    full: 0,
  },
  components: {
    card: {
      background: '#141A14',
      borderColor: '#00FF66',
      borderRadius: 0,
      padding: 24,
    },
  },
};

export const academicTheme: YumiaTheme = {
  name: 'academic',
  description: 'Scholarly paper theme with serif typography and crimson accents',
  colors: {
    primary: '#8B0000',
    secondary: '#1C3F60',
    background: '#FCFBF7',
    surface: '#F5F2EB',
    text: '#2C2B29',
    muted: '#6B6862',
    accent: '#C29B38',
    border: '#E0DACD',
    success: '#2E7D32',
    warning: '#E65100',
    danger: '#C62828',
    info: '#1565C0',
  },
  typography: {
    headingFont: 'Georgia, Times New Roman, serif',
    bodyFont: 'Georgia, Times New Roman, serif',
    codeFont: 'Courier New, monospace',
    sizes: {
      h1: 42,
      h2: 34,
      h3: 26,
      h4: 20,
      body: 18,
      small: 14,
      code: 15,
    },
  },
  spacing: {
    unit: 8,
    slidePadding: 52,
    elementGap: 24,
  },
  radius: {
    default: 4,
    sm: 2,
    md: 4,
    lg: 6,
    full: 9999,
  },
  components: {
    card: {
      background: '#F5F2EB',
      borderColor: '#8B0000',
      borderRadius: 4,
      padding: 24,
    },
  },
};

export const THEME_REGISTRY: Record<string, YumiaTheme> = {
  default: defaultTheme,
  cyberpunk: cyberpunkTheme,
  minimal: minimalTheme,
  corporate: corporateTheme,
  terminal: terminalTheme,
  academic: academicTheme,
};

export function resolveTheme(
  themeNameOrRef?: string | { name: string; overrides?: Partial<YumiaTheme> },
  explicitOverrides?: Partial<YumiaTheme>
): YumiaTheme {
  const name =
    typeof themeNameOrRef === 'string'
      ? themeNameOrRef
      : themeNameOrRef?.name || 'default';

  const baseTheme = THEME_REGISTRY[name.toLowerCase()] || defaultTheme;
  const refOverrides = typeof themeNameOrRef === 'object' ? themeNameOrRef.overrides : undefined;

  const mergedOverrides: Partial<YumiaTheme> = {
    ...refOverrides,
    ...explicitOverrides,
    colors: { ...baseTheme.colors, ...refOverrides?.colors, ...explicitOverrides?.colors },
    typography: {
      ...baseTheme.typography,
      ...refOverrides?.typography,
      ...explicitOverrides?.typography,
    },
    components: {
      ...baseTheme.components,
      ...refOverrides?.components,
      ...explicitOverrides?.components,
    },
  };

  return {
    ...baseTheme,
    ...mergedOverrides,
  };
}

export function createTheme(overrides: Partial<YumiaTheme> & { name: string }): YumiaTheme {
  return resolveTheme(overrides.name, overrides);
}
