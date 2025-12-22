/**
 * Accessibility Types - WCAG 2.2 접근성 검사
 */

import type { BoundingBox } from './detection';

/** WCAG 준수 레벨 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/** 접근성 이슈 심각도 */
export type A11ySeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/** 접근성 이슈 타입 */
export type A11yIssueType =
  | 'contrast'           // 색상 대비
  | 'touch-target'       // 터치 타겟 크기
  | 'focus-order'        // 포커스 순서
  | 'focus-visible'      // 포커스 표시
  | 'alt-text'           // 대체 텍스트
  | 'heading-order'      // 제목 순서
  | 'heading-empty'      // 빈 제목
  | 'link-text'          // 링크 텍스트
  | 'form-label'         // 폼 레이블
  | 'color-only'         // 색상만으로 정보 전달
  | 'motion'             // 모션 감소
  | 'text-spacing'       // 텍스트 간격
  | 'reflow'             // 리플로우
  | 'target-size';       // 타겟 크기

/** 접근성 이슈 */
export interface A11yIssue {
  /** 이슈 ID */
  id: string;
  /** 이슈 타입 */
  type: A11yIssueType;
  /** 심각도 */
  severity: A11ySeverity;
  /** 관련 요소 위치 */
  element: BoundingBox;
  /** 요소 ID */
  elementId?: string;
  /** WCAG 규칙 */
  wcagRule: string;
  /** WCAG 성공 기준 */
  wcagCriteria: string;
  /** 이슈 설명 */
  message: string;
  /** 수정 제안 */
  suggestion: string;
  /** 자동 수정 가능 여부 */
  autoFixable: boolean;
  /** 자동 수정 코드 */
  autoFix?: string;
  /** 추가 정보 */
  details?: Record<string, unknown>;
}

/** 대비 검사 결과 */
export interface ContrastCheckResult {
  /** 전경색 */
  foreground: string;
  /** 배경색 */
  background: string;
  /** 대비율 */
  ratio: number;
  /** AA 통과 여부 (일반 텍스트) */
  passesAA: boolean;
  /** AA 통과 여부 (큰 텍스트) */
  passesAALarge: boolean;
  /** AAA 통과 여부 (일반 텍스트) */
  passesAAA: boolean;
  /** AAA 통과 여부 (큰 텍스트) */
  passesAAALarge: boolean;
  /** 권장 전경색 */
  suggestedForeground?: string;
  /** 권장 배경색 */
  suggestedBackground?: string;
}

/** 색맹 시뮬레이션 타입 */
export type VisionSimulationType =
  | 'protanopia'      // 적색맹
  | 'deuteranopia'    // 녹색맹
  | 'tritanopia'      // 청색맹
  | 'achromatopsia'   // 전색맹
  | 'protanomaly'     // 적색약
  | 'deuteranomaly'   // 녹색약
  | 'tritanomaly'     // 청색약
  | 'blurred'         // 저시력
  | 'low-contrast'    // 저대비
  | 'cataracts'       // 백내장
  | 'glaucoma';       // 녹내장

/** 색맹 시뮬레이션 결과 */
export interface VisionSimulation {
  type: VisionSimulationType;
  /** 시뮬레이션된 이미지 (base64) */
  image: string;
  /** 설명 */
  description: string;
  /** 영향받는 사용자 비율 */
  prevalence: string;
}

/** 접근성 점수 */
export interface A11yScore {
  /** 전체 점수 (0-100) */
  overall: number;
  /** 카테고리별 점수 */
  categories: {
    perceivable: number;    // 인식 가능
    operable: number;       // 운용 가능
    understandable: number; // 이해 가능
    robust: number;         // 견고함
  };
  /** 레벨별 통과율 */
  compliance: {
    A: number;
    AA: number;
    AAA: number;
  };
}

/** 접근성 분석 결과 */
export interface A11yReport {
  /** 접근성 점수 */
  score: A11yScore;
  /** 발견된 이슈 */
  issues: A11yIssue[];
  /** 색맹 시뮬레이션 */
  simulations?: VisionSimulation[];
  /** 통과한 검사 */
  passed: string[];
  /** 자동 수정 */
  fixes: A11yAutoFix[];
  /** 분석 메타데이터 */
  meta: {
    analyzedAt: string;
    targetLevel: WCAGLevel;
    processingTime: number;
  };
}

/** 자동 수정 */
export interface A11yAutoFix {
  issueId: string;
  type: A11yIssueType;
  description: string;
  /** 수정 전 */
  before: string;
  /** 수정 후 */
  after: string;
  /** 수정 코드 (CSS 또는 속성) */
  code: string;
}

/** 접근성 검사 옵션 */
export interface A11yCheckOptions {
  /** 목표 준수 레벨 */
  level: WCAGLevel;
  /** 색맹 시뮬레이션 포함 */
  includeSimulations?: boolean;
  /** 자동 수정 제안 */
  suggestFixes?: boolean;
  /** 특정 규칙만 검사 */
  rules?: A11yIssueType[];
  /** 무시할 규칙 */
  ignoreRules?: A11yIssueType[];
}
