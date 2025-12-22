/**
 * Token Extractor
 * 스크린샷에서 디자인 토큰 자동 추출
 */

import type {
  DesignTokens,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  BorderTokens,
  ShadowTokens,
  AnimationTokens,
  TokenExtractionResult,
  ColorExtractionOptions,
  TypographyExtractionOptions,
} from '@forge-labs/vibe-types';

/** RGB 색상 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/** HSL 색상 */
interface HSL {
  h: number;
  s: number;
  l: number;
}

/** 추출된 색상 */
interface ExtractedColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  count: number;
  percentage: number;
}

/**
 * Token Extractor
 * AI 비전을 사용하여 디자인 토큰 추출
 */
export class TokenExtractor {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  /**
   * 스크린샷에서 전체 토큰 추출
   */
  async extract(
    imageSource: string,
    options?: {
      color?: ColorExtractionOptions;
      typography?: TypographyExtractionOptions;
    }
  ): Promise<TokenExtractionResult> {
    // 1. 색상 추출
    const colors = await this.extractColors(imageSource, options?.color);

    // 2. 타이포그래피 추출
    const typography = await this.extractTypography(imageSource, options?.typography);

    // 3. 스페이싱 추출
    const spacing = this.inferSpacing();

    // 4. 보더 추출
    const borders = this.inferBorders();

    // 5. 그림자 추출
    const shadows = this.inferShadows();

    // 6. 애니메이션 토큰
    const animations = this.getDefaultAnimations();

    const tokens: DesignTokens = {
      colors,
      typography,
      spacing,
      borders,
      shadows,
      animations,
      meta: {
        name: 'Extracted Theme',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        source: 'screenshot',
      },
    };

    return {
      tokens,
      tailwindTheme: this.generateTailwindTheme(tokens),
      cssVariables: this.generateCSSVariables(tokens),
      json: this.generateJSON(tokens),
      confidence: {
        colors: 0.85,
        typography: 0.8,
        spacing: 0.75,
        overall: 0.8,
      },
    };
  }

  /**
   * 색상 추출
   */
  async extractColors(
    imageSource: string,
    options?: ColorExtractionOptions
  ): Promise<ColorTokens> {
    // TODO: 실제 이미지 분석 구현
    // 현재는 Claude Vision API 사용 예정

    // 기본 시맨틱 색상 반환
    return {
      primitive: {
        'gray-50': '#f9fafb',
        'gray-100': '#f3f4f6',
        'gray-200': '#e5e7eb',
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-500': '#6b7280',
        'gray-600': '#4b5563',
        'gray-700': '#374151',
        'gray-800': '#1f2937',
        'gray-900': '#111827',
        'blue-500': '#3b82f6',
        'blue-600': '#2563eb',
        'indigo-500': '#6366f1',
        'purple-500': '#8b5cf6',
        'green-500': '#22c55e',
        'yellow-500': '#eab308',
        'red-500': '#ef4444',
      },
      semantic: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#8b5cf6',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#3b82f6',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    };
  }

  /**
   * 타이포그래피 추출
   */
  async extractTypography(
    imageSource: string,
    options?: TypographyExtractionOptions
  ): Promise<TypographyTokens> {
    // TODO: OCR + 폰트 매칭 구현

    return {
      fontFamilies: {
        sans: 'Inter',
        serif: 'Georgia',
        mono: 'JetBrains Mono',
      },
      fontSizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
      },
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
      },
    };
  }

  /**
   * 스페이싱 추론
   */
  private inferSpacing(): SpacingTokens {
    return {
      base: 4,
      scale: {
        '0': 0,
        '1': 4,
        '2': 8,
        '3': 12,
        '4': 16,
        '5': 20,
        '6': 24,
        '8': 32,
        '10': 40,
        '12': 48,
        '16': 64,
        '20': 80,
        '24': 96,
      },
    };
  }

  /**
   * 보더 추론
   */
  private inferBorders(): BorderTokens {
    return {
      radius: {
        none: 0,
        sm: 2,
        md: 6,
        lg: 8,
        xl: 12,
        '2xl': 16,
        full: 9999,
      },
      width: {
        none: 0,
        thin: 1,
        medium: 2,
        thick: 4,
      },
    };
  }

  /**
   * 그림자 추론
   */
  private inferShadows(): ShadowTokens {
    return {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    };
  }

  /**
   * 기본 애니메이션 토큰
   */
  private getDefaultAnimations(): AnimationTokens {
    return {
      durations: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easings: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    };
  }

  /**
   * Tailwind v4 @theme 생성
   */
  generateTailwindTheme(tokens: DesignTokens): string {
    const { colors, typography, borders, spacing } = tokens;

    return `@theme {
  /* ===== Colors ===== */
  --color-primary: ${colors.semantic.primary};
  --color-secondary: ${colors.semantic.secondary};
  --color-accent: ${colors.semantic.accent};
  --color-background: ${colors.semantic.background};
  --color-foreground: ${colors.semantic.foreground};
  --color-muted: ${colors.semantic.muted};
  --color-muted-foreground: ${colors.semantic.mutedForeground};
  --color-border: ${colors.semantic.border};
  --color-input: ${colors.semantic.input};
  --color-ring: ${colors.semantic.ring};
  --color-success: ${colors.semantic.success};
  --color-warning: ${colors.semantic.warning};
  --color-error: ${colors.semantic.error};
  --color-info: ${colors.semantic.info};

  /* ===== Typography ===== */
  --font-sans: "${typography.fontFamilies.sans}", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "${typography.fontFamilies.serif || 'Georgia'}", ui-serif, serif;
  --font-mono: "${typography.fontFamilies.mono || 'monospace'}", ui-monospace, monospace;

  /* Font Sizes */
  --text-xs: ${typography.fontSizes.xs}px;
  --text-sm: ${typography.fontSizes.sm}px;
  --text-base: ${typography.fontSizes.base}px;
  --text-lg: ${typography.fontSizes.lg}px;
  --text-xl: ${typography.fontSizes.xl}px;
  --text-2xl: ${typography.fontSizes['2xl']}px;
  --text-3xl: ${typography.fontSizes['3xl']}px;
  --text-4xl: ${typography.fontSizes['4xl']}px;
  --text-5xl: ${typography.fontSizes['5xl']}px;

  /* ===== Border Radius ===== */
  --radius-none: ${borders.radius.none}px;
  --radius-sm: ${borders.radius.sm}px;
  --radius-md: ${borders.radius.md}px;
  --radius-lg: ${borders.radius.lg}px;
  --radius-xl: ${borders.radius.xl}px;
  --radius-2xl: ${borders.radius['2xl']}px;
  --radius-full: ${borders.radius.full}px;

  /* ===== Spacing ===== */
  --spacing: ${spacing.base}px;
}`;
  }

  /**
   * CSS 변수 생성
   */
  generateCSSVariables(tokens: DesignTokens): string {
    const { colors, typography, borders, shadows, spacing } = tokens;

    return `:root {
  /* ===== Colors ===== */
  --primary: ${colors.semantic.primary};
  --secondary: ${colors.semantic.secondary};
  --accent: ${colors.semantic.accent};
  --background: ${colors.semantic.background};
  --foreground: ${colors.semantic.foreground};
  --muted: ${colors.semantic.muted};
  --muted-foreground: ${colors.semantic.mutedForeground};
  --border: ${colors.semantic.border};
  --input: ${colors.semantic.input};
  --ring: ${colors.semantic.ring};
  --success: ${colors.semantic.success};
  --warning: ${colors.semantic.warning};
  --error: ${colors.semantic.error};
  --info: ${colors.semantic.info};

  /* ===== Typography ===== */
  --font-sans: "${typography.fontFamilies.sans}", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "${typography.fontFamilies.serif || 'Georgia'}", ui-serif, serif;
  --font-mono: "${typography.fontFamilies.mono || 'monospace'}", ui-monospace, monospace;

  /* Font Sizes */
  --text-xs: ${typography.fontSizes.xs}px;
  --text-sm: ${typography.fontSizes.sm}px;
  --text-base: ${typography.fontSizes.base}px;
  --text-lg: ${typography.fontSizes.lg}px;
  --text-xl: ${typography.fontSizes.xl}px;
  --text-2xl: ${typography.fontSizes['2xl']}px;
  --text-3xl: ${typography.fontSizes['3xl']}px;
  --text-4xl: ${typography.fontSizes['4xl']}px;
  --text-5xl: ${typography.fontSizes['5xl']}px;

  /* ===== Border Radius ===== */
  --radius-none: ${borders.radius.none}px;
  --radius-sm: ${borders.radius.sm}px;
  --radius-md: ${borders.radius.md}px;
  --radius-lg: ${borders.radius.lg}px;
  --radius-xl: ${borders.radius.xl}px;
  --radius-2xl: ${borders.radius['2xl']}px;
  --radius-full: ${borders.radius.full}px;

  /* ===== Shadows ===== */
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
  --shadow-2xl: ${shadows['2xl']};
  --shadow-inner: ${shadows.inner};

  /* ===== Spacing ===== */
  --spacing-unit: ${spacing.base}px;
}

/* Dark Mode */
.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --border: #334155;
  --input: #334155;
}`;
  }

  /**
   * JSON (W3C Design Tokens 형식) 생성
   */
  generateJSON(tokens: DesignTokens): string {
    const w3cTokens = {
      $schema: 'https://www.w3.org/TR/design-tokens/',
      color: {
        primary: { $value: tokens.colors.semantic.primary, $type: 'color' },
        secondary: { $value: tokens.colors.semantic.secondary, $type: 'color' },
        accent: { $value: tokens.colors.semantic.accent, $type: 'color' },
        background: { $value: tokens.colors.semantic.background, $type: 'color' },
        foreground: { $value: tokens.colors.semantic.foreground, $type: 'color' },
        muted: { $value: tokens.colors.semantic.muted, $type: 'color' },
        border: { $value: tokens.colors.semantic.border, $type: 'color' },
        success: { $value: tokens.colors.semantic.success, $type: 'color' },
        warning: { $value: tokens.colors.semantic.warning, $type: 'color' },
        error: { $value: tokens.colors.semantic.error, $type: 'color' },
      },
      typography: {
        fontFamily: {
          sans: { $value: tokens.typography.fontFamilies.sans, $type: 'fontFamily' },
          serif: { $value: tokens.typography.fontFamilies.serif, $type: 'fontFamily' },
          mono: { $value: tokens.typography.fontFamilies.mono, $type: 'fontFamily' },
        },
        fontSize: Object.fromEntries(
          Object.entries(tokens.typography.fontSizes).map(([key, value]) => [
            key,
            { $value: `${value}px`, $type: 'dimension' },
          ])
        ),
      },
      spacing: {
        base: { $value: `${tokens.spacing.base}px`, $type: 'dimension' },
        ...Object.fromEntries(
          Object.entries(tokens.spacing.scale).map(([key, value]) => [
            key,
            { $value: `${value}px`, $type: 'dimension' },
          ])
        ),
      },
      borderRadius: Object.fromEntries(
        Object.entries(tokens.borders.radius).map(([key, value]) => [
          key,
          { $value: `${value}px`, $type: 'dimension' },
        ])
      ),
      shadow: Object.fromEntries(
        Object.entries(tokens.shadows).map(([key, value]) => [
          key,
          { $value: value, $type: 'shadow' },
        ])
      ),
    };

    return JSON.stringify(w3cTokens, null, 2);
  }

  /**
   * HEX to RGB 변환
   */
  private hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  /**
   * RGB to HSL 변환
   */
  private rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }

    return { h: h * 360, s, l };
  }

  /**
   * 색상 유사도 계산 (Delta E)
   */
  private colorDistance(c1: RGB, c2: RGB): number {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  }
}

/**
 * 기본 TokenExtractor 인스턴스
 */
export const tokenExtractor = new TokenExtractor();
