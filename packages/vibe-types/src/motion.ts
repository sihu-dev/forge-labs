/**
 * Motion/Animation Types - Framer Motion 기반 애니메이션
 */

import type { BoundingBox } from './detection';

/** 애니메이션 타입 */
export type AnimationType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'spring'
  | 'stagger'
  | 'parallax'
  | 'morph'
  | 'path'
  | 'flip'
  | 'shake'
  | 'pulse'
  | 'glow';

/** 애니메이션 트리거 */
export type AnimationTrigger =
  | 'mount'       // 마운트 시
  | 'hover'       // 호버 시
  | 'click'       // 클릭 시
  | 'focus'       // 포커스 시
  | 'scroll'      // 스크롤 시
  | 'inView'      // 뷰포트 진입 시
  | 'drag'        // 드래그 시
  | 'exit';       // 언마운트 시

/** 애니메이션 방향 */
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

/** 이징 함수 */
export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'circIn'
  | 'circOut'
  | 'circInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'anticipate'
  | [number, number, number, number]; // cubic-bezier

/** 스프링 설정 */
export interface SpringConfig {
  stiffness?: number;  // 강성 (기본: 100)
  damping?: number;    // 감쇠 (기본: 10)
  mass?: number;       // 질량 (기본: 1)
  velocity?: number;   // 초기 속도
}

/** 트윈 설정 */
export interface TweenConfig {
  duration?: number;   // 지속 시간 (초)
  ease?: EasingFunction;
  delay?: number;      // 지연 시간 (초)
  repeat?: number;     // 반복 횟수 (-1: 무한)
  repeatType?: 'loop' | 'reverse' | 'mirror';
  repeatDelay?: number;
}

/** 애니메이션 설정 */
export interface MotionConfig {
  type?: 'spring' | 'tween' | 'inertia';
  spring?: SpringConfig;
  tween?: TweenConfig;
}

/** 변환 값 */
export interface TransformValues {
  x?: number | string;
  y?: number | string;
  z?: number | string;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  skew?: number;
  skewX?: number;
  skewY?: number;
}

/** 스타일 값 */
export interface StyleValues extends TransformValues {
  opacity?: number;
  backgroundColor?: string;
  color?: string;
  borderRadius?: number | string;
  boxShadow?: string;
  filter?: string;
  clipPath?: string;
}

/** 애니메이션 키프레임 */
export interface AnimationKeyframes {
  initial: StyleValues;
  animate: StyleValues;
  exit?: StyleValues;
  hover?: StyleValues;
  tap?: StyleValues;
  focus?: StyleValues;
  drag?: StyleValues;
}

/** 애니메이션 제안 */
export interface AnimationSuggestion {
  /** 요소 위치 */
  element: BoundingBox;
  /** 요소 ID */
  elementId: string;
  /** 애니메이션 타입 */
  type: AnimationType;
  /** 트리거 */
  trigger: AnimationTrigger;
  /** 방향 */
  direction?: AnimationDirection;
  /** 설정 */
  config: MotionConfig;
  /** 키프레임 */
  keyframes: AnimationKeyframes;
  /** 생성된 Motion 코드 */
  motionCode: string;
  /** Lottie JSON (선택적) */
  lottieJson?: string;
  /** CSS 애니메이션 (대체) */
  cssAnimation?: string;
  /** 신뢰도 */
  confidence: number;
}

/** Motion 코드 생성 옵션 */
export interface MotionCodeOptions {
  /** 라이브러리 */
  library: 'motion' | 'framer-motion' | 'css';
  /** Variants 사용 */
  useVariants?: boolean;
  /** AnimatePresence 포함 */
  includePresence?: boolean;
  /** 레이아웃 애니메이션 */
  layoutAnimation?: boolean;
  /** 제스처 포함 */
  includeGestures?: boolean;
}

/** 프리셋 애니메이션 */
export interface AnimationPreset {
  name: string;
  description: string;
  type: AnimationType;
  trigger: AnimationTrigger;
  keyframes: AnimationKeyframes;
  config: MotionConfig;
  code: string;
}

/** 내장 프리셋 */
export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  fadeIn: {
    name: 'Fade In',
    description: '부드러운 페이드 인',
    type: 'fade',
    trigger: 'mount',
    keyframes: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    config: { type: 'tween', tween: { duration: 0.3 } },
    code: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`,
  },
  slideUp: {
    name: 'Slide Up',
    description: '아래에서 위로 슬라이드',
    type: 'slide',
    trigger: 'mount',
    keyframes: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
    },
    config: { type: 'spring', spring: { stiffness: 300, damping: 24 } },
    code: `initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`,
  },
  scaleIn: {
    name: 'Scale In',
    description: '작은 크기에서 커지며 나타남',
    type: 'scale',
    trigger: 'mount',
    keyframes: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
    },
    config: { type: 'spring', spring: { stiffness: 300, damping: 20 } },
    code: `initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}`,
  },
  hoverScale: {
    name: 'Hover Scale',
    description: '호버 시 살짝 확대',
    type: 'scale',
    trigger: 'hover',
    keyframes: {
      initial: { scale: 1 },
      animate: { scale: 1 },
      hover: { scale: 1.05 },
    },
    config: { type: 'spring', spring: { stiffness: 400, damping: 17 } },
    code: `whileHover={{ scale: 1.05 }}`,
  },
  tapScale: {
    name: 'Tap Scale',
    description: '탭/클릭 시 살짝 축소',
    type: 'scale',
    trigger: 'click',
    keyframes: {
      initial: { scale: 1 },
      animate: { scale: 1 },
      tap: { scale: 0.95 },
    },
    config: { type: 'spring', spring: { stiffness: 400, damping: 17 } },
    code: `whileTap={{ scale: 0.95 }}`,
  },
  staggerChildren: {
    name: 'Stagger Children',
    description: '자식 요소 순차 애니메이션',
    type: 'stagger',
    trigger: 'mount',
    keyframes: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
    config: { type: 'tween', tween: { duration: 0.3 } },
    code: `variants={{ container: { animate: { transition: { staggerChildren: 0.1 } } }, item: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } } }}`,
  },
};
