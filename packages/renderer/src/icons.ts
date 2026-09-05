/**
 * Multi-Provider Icon Resolution System for Yumia Presentations.
 * Supports Lucide, Font Awesome, Material Symbols, Tabler, Heroicons, and Custom SVGs.
 */

export interface IconDefinition {
  name: string;
  provider: string;
  viewBox: string;
  path: string; // SVG path data or inner SVG content
}

export interface IconResolverOptions {
  strict?: boolean;
  defaultProvider?: string;
  defaultSize?: number | string;
  defaultColor?: string;
}

// Built-in standard vector icon database for instant offline compilation
const BUILTIN_ICONS: Record<string, IconDefinition> = {
  // Lucide & General
  rocket: {
    name: 'rocket',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  },
  code: {
    name: 'code',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  },
  terminal: {
    name: 'terminal',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  },
  cpu: {
    name: 'cpu',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  },
  database: {
    name: 'database',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
  zap: {
    name: 'zap',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
  shield: {
    name: 'shield',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  },
  activity: {
    name: 'activity',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  },
  palette: {
    name: 'palette',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  },
  chart: {
    name: 'chart',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  },
  layers: {
    name: 'layers',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  },
  users: {
    name: 'users',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  check: {
    name: 'check',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<polyline points="20 6 9 17 4 12"/>',
  },
  'git-branch': {
    name: 'git-branch',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  },
  globe: {
    name: 'globe',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  },
  sparkles: {
    name: 'sparkles',
    provider: 'lucide',
    viewBox: '0 0 24 24',
    path: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  },
};

export class IconResolver {
  private cache = new Map<string, IconDefinition>();
  private customProviders = new Map<string, (name: string) => IconDefinition | undefined>();

  constructor() {
    // Populate built-in cache
    for (const [key, def] of Object.entries(BUILTIN_ICONS)) {
      this.cache.set(key, def);
      this.cache.set(`lucide:${key}`, def);
      this.cache.set(`material:${key}`, { ...def, provider: 'material' });
      this.cache.set(`fa:${key}`, { ...def, provider: 'fa' });
      this.cache.set(`tabler:${key}`, { ...def, provider: 'tabler' });
      this.cache.set(`heroicons:${key}`, { ...def, provider: 'heroicons' });
    }
  }

  public registerProvider(
    name: string,
    resolver: (iconName: string) => IconDefinition | undefined
  ): void {
    this.customProviders.set(name.toLowerCase(), resolver);
  }

  public resolve(rawName: string, options: IconResolverOptions = {}): IconDefinition {
    const trimmed = rawName.trim();
    if (!trimmed) {
      return this.getFallback('unknown');
    }

    // Check direct cache
    if (this.cache.has(trimmed.toLowerCase())) {
      return this.cache.get(trimmed.toLowerCase())!;
    }

    let provider = options.defaultProvider || 'lucide';
    let iconName = trimmed;

    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      provider = parts[0]!.toLowerCase();
      iconName = parts.slice(1).join(':').toLowerCase();
    }

    // Check custom provider
    if (this.customProviders.has(provider)) {
      const customDef = this.customProviders.get(provider)!(iconName);
      if (customDef) {
        this.cache.set(trimmed.toLowerCase(), customDef);
        return customDef;
      }
    }

    // Check base name without prefix
    if (this.cache.has(iconName)) {
      const def = { ...this.cache.get(iconName)!, provider };
      this.cache.set(trimmed.toLowerCase(), def);
      return def;
    }

    if (options.strict) {
      throw new Error(`Icon '${trimmed}' not found in registry (provider: ${provider})`);
    }

    // Lenient fallback: generate clean glyph representation
    const fallback = this.getFallback(iconName, provider);
    this.cache.set(trimmed.toLowerCase(), fallback);
    return fallback;
  }

  private getFallback(iconName: string, provider: string = 'lucide'): IconDefinition {
    // Elegant fallback icon (circle with stylized initial glyph)
    const initial = iconName.charAt(0).toUpperCase() || '★';
    return {
      name: iconName,
      provider,
      viewBox: '0 0 24 24',
      path: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor" font-family="sans-serif">${initial}</text>`,
    };
  }

  public toSvg(
    rawName: string,
    size: number | string = 24,
    color?: string,
    className: string = 'yumia-icon'
  ): string {
    const icon = this.resolve(rawName);
    const fill = color ? `color="${color}"` : '';
    const style = color
      ? `style="color:${color}; fill:none; stroke:currentColor;"`
      : 'style="fill:none; stroke:currentColor;"';
    return `<svg class="${className}" width="${size}" height="${size}" viewBox="${icon.viewBox}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${fill} ${style}>${icon.path}</svg>`;
  }
}

export const defaultIconResolver = new IconResolver();
