/**
 * Design Token Types - W3C Design Tokens 2025.10 호환
 */

/** 색상 토큰 */
export interface ColorTokens {
  /** 원시 색상 (gray-100, blue-500 등) */
  primitive: Record<string, string>;
  /** 시맨틱 색상 (primary, secondary 등) */
  semantic: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    // 상태 색상
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  /** 다크모드 색상 */
  dark?: Record<string, string>;
}

/** 타이포그래피 토큰 */
export interface TypographyTokens {
  /** 폰트 패밀리 */
  fontFamilies: {
    sans: string;
    serif?: string;
    mono?: string;
  };
  /** 폰트 크기 스케일 (px) */
  fontSizes: {
    xs: number;    // 12
    sm: number;    // 14
    base: number;  // 16
    lg: number;    // 18
    xl: number;    // 20
    '2xl': number; // 24
    '3xl': number; // 30
    '4xl': number; // 36
    '5xl': number; // 48
  };
  /** 폰트 두께 */
  fontWeights: {
    normal: number;  // 400
    medium: number;  // 500
    semibold: number; // 600
    bold: number;    // 700
  };
  /** 행간 */
  lineHeights: {
    tight: number;   // 1.25
    normal: number;  // 1.5
    relaxed: number; // 1.75
  };
  /** 자간 */
  letterSpacing: {
    tight: string;   // -0.025em
    normal: string;  // 0em
    wide: string;    // 0.025em
  };
}

/** 스페이싱 토큰 */
export interface SpacingTokens {
  /** 기본 단위 (px) */
  base: number;
  /** 스페이싱 스케일 */
  scale: {
    '0': number;   // 0
    '1': number;   // 4
    '2': number;   // 8
    '3': number;   // 12
    '4': number;   // 16
    '5': number;   // 20
    '6': number;   // 24
    '8': number;   // 32
    '10': number;  // 40
    '12': number;  // 48
    '16': number;  // 64
    '20': number;  // 80
    '24': number;  // 96
  };
}

/** 보더 토큰 */
export interface BorderTokens {
  /** 보더 반경 */
  radius: {
    none: number;  // 0
    sm: number;    // 2
    md: number;    // 6
    lg: number;    // 8
    xl: number;    // 12
    '2xl': number; // 16
    full: number;  // 9999
  };
  /** 보더 두께 */
  width: {
    none: number;  // 0
    thin: number;  // 1
    medium: number; // 2
    thick: number; // 4
  };
}

/** 그림자 토큰 */
export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/** 애니메이션 토큰 */
export interface AnimationTokens {
  /** 지속 시간 */
  durations: {
    fast: string;    // 150ms
    normal: string;  // 300ms
    slow: string;    // 500ms
  };
  /** 이징 함수 */
  easings: {
    linear: string;
    in: string;
    out: string;
    inOut: string;
    bounce: string;
  };
}

/** 통합 디자인 토큰 */
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
  shadows: ShadowTokens;
  animations: AnimationTokens;
  /** 메타데이터 */
  meta: {
    name: string;
    version: string;
    generatedAt: string;
    source: 'screenshot' | 'url' | 'figma';
  };
}

/** 토큰 추출 결과 */
export interface TokenExtractionResult {
  tokens: DesignTokens;
  /** Tailwind v4 @theme CSS */
  tailwindTheme: string;
  /** CSS 변수 */
  cssVariables: string;
  /** JSON (W3C Design Tokens 형식) */
  json: string;
  /** 추출 신뢰도 */
  confidence: {
    colors: number;
    typography: number;
    spacing: number;
    overall: number;
  };
}

/** 색상 추출 옵션 */
export interface ColorExtractionOptions {
  /** 최대 색상 수 */
  maxColors?: number;
  /** 유사 색상 병합 임계값 */
  mergeThreshold?: number;
  /** 다크모드 감지 */
  detectDarkMode?: boolean;
}

/** 타이포그래피 추출 옵션 */
export interface TypographyExtractionOptions {
  /** 폰트 매칭 활성화 */
  matchFonts?: boolean;
  /** 시스템 폰트 대체 */
  fallbackToSystem?: boolean;
}
