/**
 * Catalyst Component Mapper
 * 감지된 UI 요소를 Catalyst 컴포넌트로 매핑
 */

import type {
  UIComponentType,
  DetectedElement,
  ComponentMapping,
} from '@forge-labs/vibe-types';

/** Catalyst 컴포넌트 정보 */
export interface CatalystComponentInfo {
  /** 컴포넌트 이름 */
  name: string;
  /** 임포트 경로 */
  import: string;
  /** 기본 Props */
  defaultProps?: Record<string, unknown>;
  /** 지원 variants */
  variants?: string[];
  /** 자식 컴포넌트 */
  subComponents?: string[];
}

/**
 * Catalyst 컴포넌트 매핑 테이블
 * packages/ui/src/catalyst/ 기준
 */
export const CATALYST_COMPONENTS: Record<UIComponentType, CatalystComponentInfo | null> = {
  // 기본 요소
  button: {
    name: 'Button',
    import: '@forge-labs/ui/catalyst',
    defaultProps: { color: 'dark' },
    variants: ['solid', 'outline', 'plain'],
  },
  input: {
    name: 'Input',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  textarea: {
    name: 'Textarea',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  select: {
    name: 'Select',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  checkbox: {
    name: 'Checkbox',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  radio: {
    name: 'Radio',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  switch: {
    name: 'Switch',
    import: '@forge-labs/ui/catalyst',
    defaultProps: {},
  },
  slider: null, // Catalyst에 없음, HTML range 사용

  // 컨테이너
  card: null, // 기본 div + 스타일
  modal: {
    name: 'Dialog',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['DialogTitle', 'DialogDescription', 'DialogBody', 'DialogActions'],
  },
  dialog: {
    name: 'Dialog',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['DialogTitle', 'DialogDescription', 'DialogBody', 'DialogActions'],
  },
  dropdown: {
    name: 'Dropdown',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['DropdownButton', 'DropdownMenu', 'DropdownItem'],
  },
  popover: null, // Headless UI Popover 직접 사용
  tooltip: null, // 별도 구현 필요

  // 네비게이션
  navbar: {
    name: 'Navbar',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['NavbarItem', 'NavbarSection', 'NavbarSpacer', 'NavbarLabel'],
  },
  sidebar: {
    name: 'Sidebar',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['SidebarItem', 'SidebarSection', 'SidebarHeader', 'SidebarBody', 'SidebarFooter'],
  },
  tabs: null, // Headless UI Tabs 직접 사용
  breadcrumb: null, // 별도 구현
  pagination: {
    name: 'Pagination',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['PaginationPrevious', 'PaginationNext', 'PaginationList', 'PaginationPage', 'PaginationGap'],
  },

  // 데이터 표시
  table: {
    name: 'Table',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['TableHead', 'TableBody', 'TableRow', 'TableHeader', 'TableCell'],
  },
  list: null, // 기본 ul/li
  grid: null, // CSS Grid
  avatar: {
    name: 'Avatar',
    import: '@forge-labs/ui/catalyst',
    variants: ['square', 'rounded'],
  },
  badge: {
    name: 'Badge',
    import: '@forge-labs/ui/catalyst',
    variants: ['solid', 'outline'],
  },
  tag: {
    name: 'Badge',
    import: '@forge-labs/ui/catalyst',
  },

  // 피드백
  alert: {
    name: 'Alert',
    import: '@forge-labs/ui/catalyst',
    subComponents: ['AlertTitle', 'AlertDescription', 'AlertActions'],
  },
  toast: null, // 별도 Toast 시스템
  progress: null, // HTML progress
  spinner: null, // 별도 Spinner

  // 미디어
  image: null, // HTML img
  icon: null, // Lucide/Heroicons
  video: null, // HTML video

  // 레이아웃
  header: null, // HTML header
  footer: null, // HTML footer
  section: null, // HTML section
  divider: {
    name: 'Divider',
    import: '@forge-labs/ui/catalyst',
  },

  // 차트
  'chart-bar': null, // Recharts
  'chart-line': null, // Recharts
  'chart-pie': null, // Recharts
  'chart-area': null, // Recharts

  // 텍스트
  heading: {
    name: 'Heading',
    import: '@forge-labs/ui/catalyst',
    defaultProps: { level: 2 },
  },
  paragraph: {
    name: 'Text',
    import: '@forge-labs/ui/catalyst',
  },
  link: {
    name: 'Link',
    import: '@forge-labs/ui/catalyst',
  },
  label: null, // HTML label

  // 기타
  unknown: null,
};

/**
 * 감지된 요소를 Catalyst 컴포넌트로 매핑
 */
export class CatalystMapper {
  /**
   * 단일 요소 매핑
   */
  map(element: DetectedElement): ComponentMapping {
    const catalyst = CATALYST_COMPONENTS[element.type];

    return {
      type: element.type,
      catalyst: catalyst
        ? {
            component: catalyst.name,
            import: catalyst.import,
            props: this.inferProps(element, catalyst),
          }
        : undefined,
      html: this.getHTMLFallback(element),
    };
  }

  /**
   * 여러 요소 매핑
   */
  mapAll(elements: DetectedElement[]): ComponentMapping[] {
    return elements.map((el) => this.map(el));
  }

  /**
   * Props 추론
   */
  private inferProps(
    element: DetectedElement,
    catalyst: CatalystComponentInfo
  ): Record<string, string> {
    const props: Record<string, string> = {};

    // 기본 Props 적용
    if (catalyst.defaultProps) {
      Object.assign(props, catalyst.defaultProps);
    }

    // 텍스트 추출
    if (element.text) {
      if (element.type === 'button') {
        props['children'] = element.text;
      }
    }

    // 상태 기반 Props
    if (element.state?.disabled) {
      props['disabled'] = 'true';
    }

    // 스타일 기반 Props
    if (element.style) {
      // 배경색으로 variant 추론
      if (element.style.backgroundColor) {
        const color = this.inferColorVariant(element.style.backgroundColor);
        if (color) props['color'] = color;
      }

      // 보더로 outline variant 추론
      if (element.style.borderColor && !element.style.backgroundColor) {
        props['outline'] = 'true';
      }
    }

    return props;
  }

  /**
   * 색상 variant 추론
   */
  private inferColorVariant(color: string): string | null {
    const colorLower = color.toLowerCase();

    if (colorLower.includes('blue') || colorLower === '#3b82f6') return 'blue';
    if (colorLower.includes('red') || colorLower === '#ef4444') return 'red';
    if (colorLower.includes('green') || colorLower === '#22c55e') return 'green';
    if (colorLower.includes('yellow') || colorLower === '#eab308') return 'yellow';
    if (colorLower.includes('purple') || colorLower === '#8b5cf6') return 'purple';
    if (colorLower.includes('pink') || colorLower === '#ec4899') return 'pink';
    if (colorLower.includes('indigo') || colorLower === '#6366f1') return 'indigo';
    if (colorLower.includes('cyan') || colorLower === '#06b6d4') return 'cyan';

    return null;
  }

  /**
   * HTML fallback 생성
   */
  private getHTMLFallback(element: DetectedElement): { element: string; className?: string } {
    const fallbacks: Record<UIComponentType, { element: string; className?: string }> = {
      button: { element: 'button', className: 'btn' },
      input: { element: 'input', className: 'input' },
      textarea: { element: 'textarea', className: 'textarea' },
      select: { element: 'select', className: 'select' },
      checkbox: { element: 'input', className: 'checkbox' },
      radio: { element: 'input', className: 'radio' },
      switch: { element: 'input', className: 'switch' },
      slider: { element: 'input', className: 'slider' },
      card: { element: 'div', className: 'card' },
      modal: { element: 'dialog', className: 'modal' },
      dialog: { element: 'dialog', className: 'dialog' },
      dropdown: { element: 'div', className: 'dropdown' },
      popover: { element: 'div', className: 'popover' },
      tooltip: { element: 'div', className: 'tooltip' },
      navbar: { element: 'nav', className: 'navbar' },
      sidebar: { element: 'aside', className: 'sidebar' },
      tabs: { element: 'div', className: 'tabs' },
      breadcrumb: { element: 'nav', className: 'breadcrumb' },
      pagination: { element: 'nav', className: 'pagination' },
      table: { element: 'table', className: 'table' },
      list: { element: 'ul', className: 'list' },
      grid: { element: 'div', className: 'grid' },
      avatar: { element: 'img', className: 'avatar' },
      badge: { element: 'span', className: 'badge' },
      tag: { element: 'span', className: 'tag' },
      alert: { element: 'div', className: 'alert' },
      toast: { element: 'div', className: 'toast' },
      progress: { element: 'progress', className: 'progress' },
      spinner: { element: 'div', className: 'spinner' },
      image: { element: 'img' },
      icon: { element: 'svg', className: 'icon' },
      video: { element: 'video' },
      header: { element: 'header' },
      footer: { element: 'footer' },
      section: { element: 'section' },
      divider: { element: 'hr', className: 'divider' },
      'chart-bar': { element: 'div', className: 'chart chart-bar' },
      'chart-line': { element: 'div', className: 'chart chart-line' },
      'chart-pie': { element: 'div', className: 'chart chart-pie' },
      'chart-area': { element: 'div', className: 'chart chart-area' },
      heading: { element: 'h2' },
      paragraph: { element: 'p' },
      link: { element: 'a' },
      label: { element: 'label' },
      unknown: { element: 'div' },
    };

    return fallbacks[element.type] || { element: 'div' };
  }

  /**
   * 컴포넌트 코드 생성
   */
  generateCode(mapping: ComponentMapping, element: DetectedElement): string {
    if (mapping.catalyst) {
      return this.generateCatalystCode(mapping.catalyst, element);
    }

    return this.generateHTMLCode(mapping.html, element);
  }

  /**
   * Catalyst 컴포넌트 코드 생성
   */
  private generateCatalystCode(
    catalyst: NonNullable<ComponentMapping['catalyst']>,
    element: DetectedElement
  ): string {
    const { component, props } = catalyst;
    const propsStr = Object.entries(props || {})
      .map(([key, value]) => {
        if (key === 'children') return null;
        if (value === 'true') return key;
        if (value === 'false') return null;
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(' ');

    const children = props?.children || element.text || '';

    if (propsStr) {
      return `<${component} ${propsStr}>${children}</${component}>`;
    }

    return `<${component}>${children}</${component}>`;
  }

  /**
   * HTML 코드 생성
   */
  private generateHTMLCode(
    html: ComponentMapping['html'],
    element: DetectedElement
  ): string {
    const { element: tag, className } = html;
    const classAttr = className ? ` className="${className}"` : '';
    const content = element.text || '';

    const selfClosing = ['input', 'img', 'hr', 'br'].includes(tag);

    if (selfClosing) {
      return `<${tag}${classAttr} />`;
    }

    return `<${tag}${classAttr}>${content}</${tag}>`;
  }
}

/**
 * 기본 Catalyst Mapper 인스턴스
 */
export const catalystMapper = new CatalystMapper();
