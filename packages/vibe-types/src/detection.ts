/**
 * UI Detection Types - YOLO v12 기반 UI 요소 감지
 */

/** 바운딩 박스 좌표 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** UI 컴포넌트 타입 */
export type UIComponentType =
  // 기본 요소
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  // 컨테이너
  | 'card'
  | 'modal'
  | 'dialog'
  | 'dropdown'
  | 'popover'
  | 'tooltip'
  // 네비게이션
  | 'navbar'
  | 'sidebar'
  | 'tabs'
  | 'breadcrumb'
  | 'pagination'
  // 데이터 표시
  | 'table'
  | 'list'
  | 'grid'
  | 'avatar'
  | 'badge'
  | 'tag'
  // 피드백
  | 'alert'
  | 'toast'
  | 'progress'
  | 'spinner'
  // 미디어
  | 'image'
  | 'icon'
  | 'video'
  // 레이아웃
  | 'header'
  | 'footer'
  | 'section'
  | 'divider'
  // 차트
  | 'chart-bar'
  | 'chart-line'
  | 'chart-pie'
  | 'chart-area'
  // 텍스트
  | 'heading'
  | 'paragraph'
  | 'link'
  | 'label'
  // 기타
  | 'unknown';

/** 감지된 UI 요소 */
export interface DetectedElement {
  /** 고유 ID */
  id: string;
  /** 컴포넌트 타입 */
  type: UIComponentType;
  /** 바운딩 박스 */
  bbox: BoundingBox;
  /** 감지 신뢰도 (0-1) */
  confidence: number;
  /** 추출된 텍스트 */
  text?: string;
  /** 자식 요소 */
  children?: DetectedElement[];
  /** 부모 요소 ID */
  parentId?: string;
  /** 시맨틱 역할 */
  role?: string;
  /** 상태 */
  state?: ElementState;
  /** 스타일 속성 */
  style?: DetectedStyle;
}

/** 요소 상태 */
export interface ElementState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  expanded?: boolean;
  focused?: boolean;
  hovered?: boolean;
  active?: boolean;
}

/** 감지된 스타일 */
export interface DetectedStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: number;
  padding?: number[];
  margin?: number[];
  shadow?: boolean;
}

/** UI 감지 결과 */
export interface UIDetectionResult {
  /** 감지된 요소 목록 */
  elements: DetectedElement[];
  /** 레이아웃 트리 */
  hierarchy: LayoutNode;
  /** 전체 이미지 크기 */
  imageSize: { width: number; height: number };
  /** 처리 시간 (ms) */
  processingTime: number;
  /** 모델 버전 */
  modelVersion: string;
}

/** 레이아웃 노드 */
export interface LayoutNode {
  id: string;
  type: 'root' | 'row' | 'column' | 'stack' | 'grid';
  children: (LayoutNode | string)[]; // string은 element ID
  gap?: number;
  padding?: number[];
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  justification?: 'start' | 'center' | 'end' | 'between' | 'around';
}

/** 레이아웃 타입 */
export type LayoutType =
  | 'sidebar-layout'
  | 'stacked-layout'
  | 'auth-layout'
  | 'dashboard-layout'
  | 'landing-layout'
  | 'form-layout'
  | 'list-layout'
  | 'grid-layout';

/** 레이아웃 분석 결과 */
export interface LayoutAnalysis {
  /** 감지된 레이아웃 타입 */
  type: LayoutType;
  /** 그리드 설정 */
  grid?: {
    columns: number;
    rows?: number;
    gap: number;
  };
  /** 반응형 설정 */
  responsive?: {
    breakpoints: number[];
    behavior: 'stack' | 'hide' | 'collapse' | 'reorder';
  };
  /** 신뢰도 */
  confidence: number;
}
