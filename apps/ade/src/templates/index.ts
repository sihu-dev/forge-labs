/**
 * ADE - 템플릿 내보내기
 * IO 통합 버전 5종 템플릿
 */

export { CardTemplate } from './CardTemplate';
export { InvoiceTemplate } from './InvoiceTemplate';
export { PortfolioTemplate } from './PortfolioTemplate';
export { QuoteTemplate } from './QuoteTemplate';
export { LandingTemplate } from './LandingTemplate';

// 템플릿 메타데이터
export const TEMPLATE_META = {
  card: {
    id: 'card',
    name: '디지털 명함',
    description: '명함 사진을 업로드하면 디지털 명함 페이지를 자동 생성합니다',
    icon: '💳',
    color: '#3B82F6',
  },
  invoice: {
    id: 'invoice',
    name: '인보이스',
    description: '결제 가능한 인보이스 페이지를 생성합니다',
    icon: '📄',
    color: '#10B981',
  },
  portfolio: {
    id: 'portfolio',
    name: '포트폴리오',
    description: '프로젝트 이력을 기반으로 포트폴리오 페이지를 생성합니다',
    icon: '🎨',
    color: '#8B5CF6',
  },
  quote: {
    id: 'quote',
    name: '견적서',
    description: '승인 가능한 견적서 페이지를 생성합니다',
    icon: '📋',
    color: '#F59E0B',
  },
  landing: {
    id: 'landing',
    name: '서비스 소개',
    description: '서비스 소개 랜딩페이지를 생성합니다',
    icon: '🚀',
    color: '#EF4444',
  },
} as const;

export type TemplateType = keyof typeof TEMPLATE_META;
