/**
 * Code Generation Types - 코드 생성 관련 타입
 */

import type { DetectedElement, LayoutAnalysis, UIComponentType } from './detection';
import type { DesignTokens } from './tokens';

/** 지원 프레임워크 */
export type Framework = 'react' | 'vue' | 'svelte' | 'html' | 'react-native';

/** 스타일 시스템 */
export type StylingSystem = 'tailwind-v4' | 'tailwind-v3' | 'css-modules' | 'styled-components' | 'emotion';

/** 컴포넌트 라이브러리 */
export type ComponentLibrary = 'catalyst' | 'shadcn' | 'radix' | 'headless-ui' | 'none';

/** 코드 생성 설정 */
export interface GenerationConfig {
  /** 타겟 프레임워크 */
  framework: Framework;
  /** 스타일 시스템 */
  styling: StylingSystem;
  /** 컴포넌트 라이브러리 */
  componentLib: ComponentLibrary;
  /** TypeScript 사용 여부 */
  typescript: boolean;
  /** 반응형 생성 (Container Queries) */
  responsive: boolean;
  /** 접근성 속성 자동 추가 */
  accessibility: boolean;
  /** 다크모드 지원 */
  darkMode: boolean;
  /** 애니메이션 추가 */
  animation: boolean;
  /** 인라인 스타일 vs 클래스 */
  inlineStyles: boolean;
}

/** 기본 생성 설정 */
export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  framework: 'react',
  styling: 'tailwind-v4',
  componentLib: 'catalyst',
  typescript: true,
  responsive: true,
  accessibility: true,
  darkMode: true,
  animation: false,
  inlineStyles: false,
};

/** 생성된 컴포넌트 */
export interface GeneratedComponent {
  /** 컴포넌트 이름 (PascalCase) */
  name: string;
  /** 파일 경로 */
  path: string;
  /** 소스 코드 */
  code: string;
  /** 임포트 구문 */
  imports: string[];
  /** Props 정의 */
  props?: PropDefinition[];
  /** 의존하는 컴포넌트 */
  dependencies?: string[];
  /** 원본 요소 ID */
  sourceElementId?: string;
}

/** Props 정의 */
export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

/** 생성된 스타일 */
export interface GeneratedStyles {
  /** Tailwind @theme CSS */
  theme?: string;
  /** 글로벌 CSS */
  global?: string;
  /** 컴포넌트별 CSS */
  components?: Record<string, string>;
  /** CSS 변수 */
  variables?: string;
}

/** 생성된 에셋 */
export interface GeneratedAssets {
  /** 아이콘 (Lucide 매핑) */
  icons: IconMapping[];
  /** 이미지 플레이스홀더 */
  images: ImagePlaceholder[];
  /** 폰트 */
  fonts: FontAsset[];
}

/** 아이콘 매핑 */
export interface IconMapping {
  /** 원본 감지 ID */
  sourceId: string;
  /** 시맨틱 이름 */
  semantic: string;
  /** Lucide 아이콘 이름 */
  lucide: string;
  /** Heroicons 아이콘 이름 */
  heroicons?: string;
  /** 임포트 구문 */
  import: string;
}

/** 이미지 플레이스홀더 */
export interface ImagePlaceholder {
  sourceId: string;
  width: number;
  height: number;
  alt: string;
  suggestedQuery?: string;
  placeholderUrl: string;
}

/** 폰트 에셋 */
export interface FontAsset {
  family: string;
  weights: number[];
  source: 'google' | 'local' | 'system';
  url?: string;
}

/** 생성된 프로젝트 */
export interface GeneratedProject {
  /** 컴포넌트 목록 */
  components: GeneratedComponent[];
  /** 스타일 */
  styles: GeneratedStyles;
  /** 에셋 */
  assets: GeneratedAssets;
  /** 디자인 토큰 */
  tokens?: DesignTokens;
  /** 레이아웃 분석 */
  layout?: LayoutAnalysis;
  /** 메타데이터 */
  meta: {
    generatedAt: string;
    config: GenerationConfig;
    processingTime: number;
    elementCount: number;
  };
}

/** 컴포넌트 매핑 */
export interface ComponentMapping {
  /** UI 타입 → 라이브러리 컴포넌트 */
  type: UIComponentType;
  /** Catalyst 컴포넌트 */
  catalyst?: {
    component: string;
    import: string;
    props?: Record<string, string>;
  };
  /** shadcn 컴포넌트 */
  shadcn?: {
    component: string;
    import: string;
    props?: Record<string, string>;
  };
  /** 기본 HTML */
  html: {
    element: string;
    className?: string;
  };
}

/** 스트리밍 생성 이벤트 */
export type GenerationEvent =
  | { type: 'start'; total: number }
  | { type: 'progress'; current: number; total: number; component: string }
  | { type: 'component'; component: GeneratedComponent }
  | { type: 'styles'; styles: GeneratedStyles }
  | { type: 'assets'; assets: GeneratedAssets }
  | { type: 'complete'; project: GeneratedProject }
  | { type: 'error'; error: string };

/** 생성 콜백 */
export type GenerationCallback = (event: GenerationEvent) => void;
