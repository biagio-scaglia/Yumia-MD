export interface ColorPalette {
  primary: string;
  secondary?: string;
  background: string;
  surface: string;
  elevatedSurface?: string;
  text: string;
  muted?: string;
  accent?: string;
  border?: string;
  divider?: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  sizes?: {
    display?: number;
    h1?: number;
    h2?: number;
    h3?: number;
    h4?: number;
    body?: number;
    small?: number;
    caption?: number;
    code?: number;
    quote?: number;
    metadata?: number;
  };
  weights?: {
    normal?: number;
    medium?: number;
    bold?: number;
  };
  lineHeights?: {
    tight?: number;
    snug?: number;
    normal?: number;
    relaxed?: number;
  };
  letterSpacing?: {
    tight?: string;
    normal?: string;
    wide?: string;
  };
}

export interface SpacingConfig {
  unit: number;
  scale?: number[];
  slidePadding?: number;
  elementGap?: number;
  safeArea?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

export interface RadiusConfig {
  default: number;
  none?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  full?: number;
}

export interface ShadowConfig {
  none?: string;
  sm?: string;
  md?: string;
  lg?: string;
  glow?: string;
}

export interface ComponentThemeDefaults {
  card?: {
    background?: string;
    borderColor?: string;
    borderRadius?: number;
    padding?: number;
  };
  metric?: {
    valueColor?: string;
    labelColor?: string;
    borderRadius?: number;
  };
  code?: {
    background?: string;
    textColor?: string;
    borderRadius?: number;
  };
  table?: {
    headerBackground?: string;
    rowAlternateBackground?: string;
    borderColor?: string;
  };
}

export interface YumiaTheme {
  name: string;
  description?: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  radius: RadiusConfig;
  shadows?: ShadowConfig;
  components?: ComponentThemeDefaults;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ThemeOverrides = DeepPartial<YumiaTheme>;
