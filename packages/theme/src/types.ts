export interface ColorPalette {
  primary: string;
  secondary?: string;
  background: string;
  surface: string;
  text: string;
  muted?: string;
  accent?: string;
  border?: string;
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  sizes?: {
    h1?: number;
    h2?: number;
    h3?: number;
    h4?: number;
    body?: number;
    small?: number;
    code?: number;
  };
  weights?: {
    normal?: number;
    medium?: number;
    bold?: number;
  };
}

export interface SpacingConfig {
  unit: number;
  slidePadding?: number;
  elementGap?: number;
}

export interface RadiusConfig {
  default: number;
  sm?: number;
  md?: number;
  lg?: number;
  full?: number;
}

export interface ShadowConfig {
  sm?: string;
  md?: string;
  lg?: string;
}

export interface ComponentThemeDefaults {
  card?: {
    background?: string;
    borderColor?: string;
    borderRadius?: number;
    padding?: number;
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
