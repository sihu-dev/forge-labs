/**
 * React Code Generator
 * 감지된 요소를 React + Tailwind 코드로 변환
 */

import type {
  DetectedElement,
  GeneratedComponent,
  GenerationConfig,
  LayoutAnalysis,
  PropDefinition,
  UIComponentType,
} from '@forge-labs/vibe-types';
import { catalystMapper, CATALYST_COMPONENTS } from '../matchers/catalyst-mapper';
import { iconMatcher } from '../matchers/icon-matcher';

/** 생성 컨텍스트 */
interface GenerationContext {
  config: GenerationConfig;
  layout: LayoutAnalysis;
  imports: Set<string>;
  componentNames: Set<string>;
}

/**
 * React Code Generator
 */
export class ReactGenerator {
  /**
   * 여러 요소를 React 컴포넌트로 생성
   */
  generateComponents(
    elements: DetectedElement[],
    layout: LayoutAnalysis,
    config: GenerationConfig
  ): GeneratedComponent[] {
    const context: GenerationContext = {
      config,
      layout,
      imports: new Set(),
      componentNames: new Set(),
    };

    const components: GeneratedComponent[] = [];

    // 1. 루트 레이아웃 컴포넌트 생성
    const rootComponent = this.generateRootLayout(elements, layout, context);
    components.push(rootComponent);

    // 2. 개별 컴포넌트 생성 (재사용 가능한 것들)
    const reusableElements = this.findReusableElements(elements);
    for (const element of reusableElements) {
      const component = this.generateComponent(element, context);
      components.push(component);
    }

    return components;
  }

  /**
   * 루트 레이아웃 컴포넌트 생성
   */
  private generateRootLayout(
    elements: DetectedElement[],
    layout: LayoutAnalysis,
    context: GenerationContext
  ): GeneratedComponent {
    const { config } = context;
    const layoutComponent = this.getLayoutComponent(layout.type);

    // 임포트 수집
    const imports = this.collectImports(elements, config);

    // JSX 생성
    const jsx = this.generateJSX(elements, context, 0);

    // 컴포넌트 코드 생성
    const code = this.wrapInComponent('Page', jsx, imports, context);

    return {
      name: 'Page',
      path: 'components/Page.tsx',
      code,
      imports: Array.from(imports),
      sourceElementId: 'root',
    };
  }

  /**
   * 개별 컴포넌트 생성
   */
  private generateComponent(
    element: DetectedElement,
    context: GenerationContext
  ): GeneratedComponent {
    const name = this.generateComponentName(element, context);
    const imports = new Set<string>();

    // 요소 매핑
    const mapping = catalystMapper.map(element);

    // JSX 생성
    let jsx: string;
    if (mapping.catalyst && context.config.componentLib === 'catalyst') {
      imports.add(mapping.catalyst.import);
      jsx = this.generateCatalystJSX(element, mapping.catalyst, context);
    } else {
      jsx = this.generateHTMLJSX(element, context);
    }

    // Props 정의
    const props = this.inferProps(element);

    // 컴포넌트 코드
    const code = this.wrapInComponent(name, jsx, imports, context, props);

    return {
      name,
      path: `components/${name}.tsx`,
      code,
      imports: Array.from(imports),
      props,
      sourceElementId: element.id,
    };
  }

  /**
   * JSX 생성 (재귀)
   */
  private generateJSX(
    elements: DetectedElement[],
    context: GenerationContext,
    depth: number
  ): string {
    const indent = '  '.repeat(depth + 2);
    const lines: string[] = [];

    for (const element of elements) {
      const jsx = this.generateElementJSX(element, context, depth);
      lines.push(jsx);
    }

    return lines.join('\n');
  }

  /**
   * 단일 요소 JSX 생성
   */
  private generateElementJSX(
    element: DetectedElement,
    context: GenerationContext,
    depth: number
  ): string {
    const indent = '  '.repeat(depth + 2);
    const mapping = catalystMapper.map(element);

    // Catalyst 컴포넌트 사용
    if (mapping.catalyst && context.config.componentLib === 'catalyst') {
      context.imports.add(`import { ${mapping.catalyst.component} } from '@forge-labs/ui/catalyst'`);
      return this.generateCatalystJSX(element, mapping.catalyst, context, indent);
    }

    // HTML 요소 사용
    return this.generateHTMLJSX(element, context, indent);
  }

  /**
   * Catalyst JSX 생성
   */
  private generateCatalystJSX(
    element: DetectedElement,
    catalyst: NonNullable<ReturnType<typeof catalystMapper.map>['catalyst']>,
    context: GenerationContext,
    indent: string = ''
  ): string {
    const { component, props } = catalyst;
    const className = this.generateTailwindClasses(element, context);

    // Props 문자열 생성
    const propsEntries = Object.entries(props || {});
    const propsStr = propsEntries
      .filter(([key]) => key !== 'children')
      .map(([key, value]) => {
        if (value === 'true') return key;
        if (value === 'false') return null;
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(' ');

    // 클래스명 추가
    const classAttr = className ? ` className="${className}"` : '';

    // 자식 요소
    const children = element.text || props?.children || '';

    // 자식 요소가 있는 경우
    if (element.children && element.children.length > 0) {
      const childrenJSX = element.children
        .map((child: DetectedElement) => this.generateElementJSX(child, context, 0))
        .join('\n');

      return `${indent}<${component}${propsStr ? ' ' + propsStr : ''}${classAttr}>
${childrenJSX}
${indent}</${component}>`;
    }

    // 텍스트만 있는 경우
    if (children) {
      return `${indent}<${component}${propsStr ? ' ' + propsStr : ''}${classAttr}>${children}</${component}>`;
    }

    // Self-closing
    return `${indent}<${component}${propsStr ? ' ' + propsStr : ''}${classAttr} />`;
  }

  /**
   * HTML JSX 생성
   */
  private generateHTMLJSX(
    element: DetectedElement,
    context: GenerationContext,
    indent: string = ''
  ): string {
    const mapping = catalystMapper.map(element);
    const { element: tag } = mapping.html;
    const className = this.generateTailwindClasses(element, context);
    const classAttr = className ? ` className="${className}"` : '';

    // 아이콘 처리
    if (element.type === 'icon' && element.text) {
      const iconInfo = iconMatcher.findBySemantic(element.text);
      if (iconInfo) {
        context.imports.add(`import { ${iconInfo.lucide} } from 'lucide-react'`);
        return `${indent}<${iconInfo.lucide} className="w-5 h-5" />`;
      }
    }

    // 이미지 처리
    if (element.type === 'image') {
      return `${indent}<img${classAttr} src="/placeholder.svg" alt="${element.text || 'Image'}" />`;
    }

    // 입력 요소 처리
    if (['input', 'checkbox', 'radio'].includes(element.type)) {
      const type = element.type === 'input' ? 'text' : element.type;
      return `${indent}<input type="${type}"${classAttr} />`;
    }

    // Self-closing 태그
    const selfClosing = ['input', 'img', 'hr', 'br'].includes(tag);
    if (selfClosing) {
      return `${indent}<${tag}${classAttr} />`;
    }

    // 자식 요소가 있는 경우
    if (element.children && element.children.length > 0) {
      const childrenJSX = element.children
        .map((child: DetectedElement) => this.generateElementJSX(child, context, 0))
        .join('\n');

      return `${indent}<${tag}${classAttr}>
${childrenJSX}
${indent}</${tag}>`;
    }

    // 텍스트만 있는 경우
    const content = element.text || '';
    return `${indent}<${tag}${classAttr}>${content}</${tag}>`;
  }

  /**
   * Tailwind 클래스 생성
   */
  private generateTailwindClasses(
    element: DetectedElement,
    context: GenerationContext
  ): string {
    const classes: string[] = [];

    // 레이아웃 클래스
    if (element.children && element.children.length > 0) {
      classes.push('flex', 'flex-col', 'gap-4');
    }

    // 스타일 기반 클래스
    if (element.style) {
      const { style } = element;

      // 배경색
      if (style.backgroundColor) {
        const colorClass = this.colorToTailwind(style.backgroundColor, 'bg');
        if (colorClass) classes.push(colorClass);
      }

      // 텍스트 색상
      if (style.textColor) {
        const colorClass = this.colorToTailwind(style.textColor, 'text');
        if (colorClass) classes.push(colorClass);
      }

      // 보더 반경
      if (style.borderRadius !== undefined) {
        classes.push(this.radiusToTailwind(style.borderRadius));
      }

      // 폰트 크기
      if (style.fontSize) {
        classes.push(this.fontSizeToTailwind(style.fontSize));
      }

      // 폰트 두께
      if (style.fontWeight) {
        classes.push(this.fontWeightToTailwind(style.fontWeight));
      }

      // 패딩
      if (style.padding && style.padding.length > 0) {
        classes.push(this.spacingToTailwind(style.padding, 'p'));
      }

      // 그림자
      if (style.shadow) {
        classes.push('shadow-md');
      }
    }

    // 타입별 기본 클래스
    const typeClasses = this.getTypeClasses(element.type);
    classes.push(...typeClasses);

    // Container Query (반응형)
    if (context.config.responsive) {
      // 필요시 @container 클래스 추가
    }

    return classes.filter(Boolean).join(' ');
  }

  /**
   * 타입별 기본 클래스
   */
  private getTypeClasses(type: UIComponentType): string[] {
    const typeClassMap: Partial<Record<UIComponentType, string[]>> = {
      button: ['px-4', 'py-2', 'rounded-md', 'font-medium'],
      input: ['px-3', 'py-2', 'border', 'rounded-md'],
      card: ['p-6', 'rounded-lg', 'border', 'bg-white'],
      badge: ['px-2', 'py-1', 'text-xs', 'rounded-full'],
      heading: ['font-bold'],
      paragraph: ['text-base'],
      divider: ['border-t', 'my-4'],
    };

    return typeClassMap[type] || [];
  }

  /**
   * 색상을 Tailwind 클래스로 변환
   */
  private colorToTailwind(color: string, prefix: 'bg' | 'text' | 'border'): string | null {
    // 시맨틱 색상 매핑
    const colorMap: Record<string, string> = {
      '#3b82f6': 'blue-500',
      '#ef4444': 'red-500',
      '#22c55e': 'green-500',
      '#f59e0b': 'amber-500',
      '#8b5cf6': 'purple-500',
      '#6366f1': 'indigo-500',
      '#ffffff': 'white',
      '#000000': 'black',
      '#0f172a': 'slate-900',
      '#f8fafc': 'slate-50',
    };

    const mapped = colorMap[color.toLowerCase()];
    if (mapped) {
      return `${prefix}-${mapped}`;
    }

    // Arbitrary value
    return `${prefix}-[${color}]`;
  }

  /**
   * 반경을 Tailwind 클래스로 변환
   */
  private radiusToTailwind(radius: number): string {
    if (radius === 0) return 'rounded-none';
    if (radius <= 2) return 'rounded-sm';
    if (radius <= 6) return 'rounded-md';
    if (radius <= 8) return 'rounded-lg';
    if (radius <= 12) return 'rounded-xl';
    if (radius <= 16) return 'rounded-2xl';
    if (radius >= 9999) return 'rounded-full';
    return `rounded-[${radius}px]`;
  }

  /**
   * 폰트 크기를 Tailwind 클래스로 변환
   */
  private fontSizeToTailwind(size: number): string {
    if (size <= 12) return 'text-xs';
    if (size <= 14) return 'text-sm';
    if (size <= 16) return 'text-base';
    if (size <= 18) return 'text-lg';
    if (size <= 20) return 'text-xl';
    if (size <= 24) return 'text-2xl';
    if (size <= 30) return 'text-3xl';
    if (size <= 36) return 'text-4xl';
    return 'text-5xl';
  }

  /**
   * 폰트 두께를 Tailwind 클래스로 변환
   */
  private fontWeightToTailwind(weight: number): string {
    if (weight <= 400) return 'font-normal';
    if (weight <= 500) return 'font-medium';
    if (weight <= 600) return 'font-semibold';
    return 'font-bold';
  }

  /**
   * 스페이싱을 Tailwind 클래스로 변환
   */
  private spacingToTailwind(spacing: number[], prefix: 'p' | 'm'): string {
    if (spacing.length === 1) {
      return `${prefix}-${this.spacingValueToTailwind(spacing[0])}`;
    }
    if (spacing.length === 2) {
      return `${prefix}y-${this.spacingValueToTailwind(spacing[0])} ${prefix}x-${this.spacingValueToTailwind(spacing[1])}`;
    }
    if (spacing.length === 4) {
      return [
        `${prefix}t-${this.spacingValueToTailwind(spacing[0])}`,
        `${prefix}r-${this.spacingValueToTailwind(spacing[1])}`,
        `${prefix}b-${this.spacingValueToTailwind(spacing[2])}`,
        `${prefix}l-${this.spacingValueToTailwind(spacing[3])}`,
      ].join(' ');
    }
    return '';
  }

  /**
   * 스페이싱 값을 Tailwind 스케일로 변환
   */
  private spacingValueToTailwind(value: number): string {
    const scale: Record<number, string> = {
      0: '0',
      4: '1',
      8: '2',
      12: '3',
      16: '4',
      20: '5',
      24: '6',
      32: '8',
      40: '10',
      48: '12',
      64: '16',
      80: '20',
      96: '24',
    };

    return scale[value] || `[${value}px]`;
  }

  /**
   * 임포트 수집
   */
  private collectImports(elements: DetectedElement[], config: GenerationConfig): Set<string> {
    const imports = new Set<string>();

    // React
    imports.add("import * as React from 'react'");

    // Catalyst 컴포넌트
    if (config.componentLib === 'catalyst') {
      const catalystComponents = new Set<string>();

      const collectFromElement = (el: DetectedElement) => {
        const component = CATALYST_COMPONENTS[el.type];
        if (component) {
          catalystComponents.add(component.name);
          component.subComponents?.forEach((sub) => catalystComponents.add(sub));
        }
        el.children?.forEach(collectFromElement);
      };

      elements.forEach(collectFromElement);

      if (catalystComponents.size > 0) {
        imports.add(
          `import { ${Array.from(catalystComponents).join(', ')} } from '@forge-labs/ui/catalyst'`
        );
      }
    }

    // 아이콘
    const iconComponents = new Set<string>();
    const collectIcons = (el: DetectedElement) => {
      if (el.type === 'icon' && el.text) {
        const iconInfo = iconMatcher.findBySemantic(el.text);
        if (iconInfo) {
          iconComponents.add(iconInfo.lucide);
        }
      }
      el.children?.forEach(collectIcons);
    };
    elements.forEach(collectIcons);

    if (iconComponents.size > 0) {
      imports.add(`import { ${Array.from(iconComponents).join(', ')} } from 'lucide-react'`);
    }

    return imports;
  }

  /**
   * 컴포넌트로 래핑
   */
  private wrapInComponent(
    name: string,
    jsx: string,
    imports: Set<string>,
    context: GenerationContext,
    props?: PropDefinition[]
  ): string {
    const { config } = context;
    const importsStr = Array.from(imports).join('\n');

    // Props 타입 정의
    let propsType = '';
    let propsParam = '';
    if (props && props.length > 0 && config.typescript) {
      const propsTypeDef = props
        .map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`)
        .join('\n');
      propsType = `\ninterface ${name}Props {\n${propsTypeDef}\n}\n`;
      propsParam = `{ ${props.map((p) => p.name).join(', ')} }: ${name}Props`;
    }

    // 파일 확장자
    const ext = config.typescript ? 'tsx' : 'jsx';

    return `${importsStr}
${propsType}
export function ${name}(${propsParam}) {
  return (
    <div className="min-h-screen bg-background">
${jsx}
    </div>
  )
}
`;
  }

  /**
   * 레이아웃 컴포넌트 결정
   */
  private getLayoutComponent(type: string): string {
    const layoutMap: Record<string, string> = {
      'sidebar-layout': 'SidebarLayout',
      'stacked-layout': 'StackedLayout',
      'auth-layout': 'AuthLayout',
      'dashboard-layout': 'div',
      'landing-layout': 'div',
    };

    return layoutMap[type] || 'div';
  }

  /**
   * 재사용 가능한 요소 찾기
   */
  private findReusableElements(elements: DetectedElement[]): DetectedElement[] {
    // 여러 번 등장하는 패턴 찾기
    const typeCount = new Map<UIComponentType, number>();

    const countTypes = (el: DetectedElement) => {
      typeCount.set(el.type, (typeCount.get(el.type) || 0) + 1);
      el.children?.forEach(countTypes);
    };

    elements.forEach(countTypes);

    // 2번 이상 등장하는 타입의 요소 추출
    const reusable: DetectedElement[] = [];
    const collectReusable = (el: DetectedElement) => {
      if ((typeCount.get(el.type) || 0) >= 2) {
        reusable.push(el);
      }
      // 자식은 재귀적으로 검사하지 않음 (중복 방지)
    };

    elements.forEach(collectReusable);

    return reusable;
  }

  /**
   * 컴포넌트 이름 생성
   */
  private generateComponentName(
    element: DetectedElement,
    context: GenerationContext
  ): string {
    // 타입 기반 이름
    const baseName = element.type
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    // 중복 방지
    let name = baseName;
    let counter = 1;
    while (context.componentNames.has(name)) {
      name = `${baseName}${counter}`;
      counter++;
    }

    context.componentNames.add(name);
    return name;
  }

  /**
   * Props 추론
   */
  private inferProps(element: DetectedElement): PropDefinition[] {
    const props: PropDefinition[] = [];

    // 텍스트가 있으면 children prop
    if (element.text) {
      props.push({
        name: 'children',
        type: 'React.ReactNode',
        required: false,
        defaultValue: `"${element.text}"`,
      });
    }

    // 상태에 따른 props
    if (element.state?.disabled !== undefined) {
      props.push({
        name: 'disabled',
        type: 'boolean',
        required: false,
        defaultValue: String(element.state.disabled),
      });
    }

    return props;
  }
}

/**
 * 기본 ReactGenerator 인스턴스
 */
export const reactGenerator = new ReactGenerator();
