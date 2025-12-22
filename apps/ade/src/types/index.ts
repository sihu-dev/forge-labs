/**
 * ADE - 프리랜서/1인 사업자 정산 자동화
 *
 * 문서 플로우: 견적서 → 계약서 → 인보이스 → 세금계산서
 */

// ============================================
// 기본 타입
// ============================================

export type DocumentType = 'quote' | 'contract' | 'invoice' | 'tax_invoice';

export type DocumentStatus =
  | 'draft'      // 초안
  | 'sent'       // 발송됨
  | 'viewed'     // 열람됨
  | 'approved'   // 승인됨
  | 'rejected'   // 거절됨
  | 'paid'       // 결제됨
  | 'completed'  // 완료
  | 'cancelled'; // 취소됨

export type PaymentMethod =
  | 'bank_transfer'  // 계좌이체
  | 'card'           // 카드
  | 'cash'           // 현금
  | 'other';         // 기타

export type PaymentStatus =
  | 'pending'    // 대기
  | 'partial'    // 부분결제
  | 'paid'       // 완료
  | 'overdue';   // 연체

// ============================================
// 고객 (Client)
// ============================================

export interface Client {
  id: string;

  // 기본 정보
  type: 'individual' | 'business';
  name: string;                    // 상호명 또는 개인명
  businessNumber?: string;         // 사업자등록번호 (xxx-xx-xxxxx)
  representativeName?: string;     // 대표자명

  // 연락처
  email: string;
  phone?: string;

  // 주소
  address?: string;

  // 업태/종목 (세금계산서용)
  businessType?: string;           // 업태
  businessCategory?: string;       // 종목

  // 메타
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;

  // 통계
  stats: {
    totalQuotes: number;
    totalContracts: number;
    totalInvoices: number;
    totalRevenue: number;          // 총 거래액
    lastTransactionAt?: string;
  };
}

// ============================================
// 문서 아이템 (공통)
// ============================================

export interface DocumentItem {
  id: string;
  name: string;                    // 품목명
  description?: string;            // 상세 설명
  quantity: number;                // 수량
  unitPrice: number;               // 단가
  amount: number;                  // 금액 (수량 × 단가)

  // 선택적 필드
  unit?: string;                   // 단위 (개, 시간, 일, 페이지 등)
  discount?: number;               // 할인 (금액)
  discountRate?: number;           // 할인율 (%)
  taxRate?: number;                // 세율 (기본 10%)
  taxAmount?: number;              // 세액
}

// ============================================
// 견적서 (Quote)
// ============================================

export interface Quote {
  id: string;
  type: 'quote';
  documentNumber: string;          // 견적번호 (Q-2024-0001)
  status: DocumentStatus;

  // 당사자
  clientId: string;
  client: Client;

  // 내용
  title: string;                   // 견적 제목
  items: DocumentItem[];

  // 금액
  subtotal: number;                // 공급가액
  taxAmount: number;               // 세액
  totalAmount: number;             // 합계

  // 유효기간
  validUntil: string;              // 견적 유효일

  // 조건
  paymentTerms?: string;           // 결제 조건
  deliveryTerms?: string;          // 납품 조건
  notes?: string;                  // 비고

  // 메타
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;

  // 연결된 문서
  linkedContractId?: string;
}

// ============================================
// 계약서 (Contract)
// ============================================

export interface ContractClause {
  id: string;
  order: number;
  title: string;
  content: string;
}

export interface Contract {
  id: string;
  type: 'contract';
  documentNumber: string;          // 계약번호 (C-2024-0001)
  status: DocumentStatus;

  // 당사자
  clientId: string;
  client: Client;

  // 연결된 견적서
  quoteId?: string;
  quote?: Quote;

  // 계약 내용
  title: string;                   // 계약 제목
  projectName: string;             // 프로젝트명
  projectDescription?: string;     // 프로젝트 설명

  // 금액
  items: DocumentItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  // 기간
  startDate: string;               // 계약 시작일
  endDate: string;                 // 계약 종료일

  // 결제 조건
  paymentSchedule: PaymentSchedule[];

  // 계약 조항
  clauses: ContractClause[];

  // 서명
  signatures: {
    provider?: SignatureInfo;
    client?: SignatureInfo;
  };

  // 메타
  createdAt: string;
  updatedAt: string;
  signedAt?: string;

  // 연결된 문서
  linkedInvoiceIds: string[];
}

export interface PaymentSchedule {
  id: string;
  name: string;                    // 계약금, 중도금, 잔금
  percentage: number;              // 비율 (%)
  amount: number;                  // 금액
  dueDate: string;                 // 예정일
  status: PaymentStatus;
  paidAt?: string;
  invoiceId?: string;              // 연결된 인보이스
}

export interface SignatureInfo {
  name: string;
  signedAt: string;
  signatureImage?: string;         // Base64 서명 이미지
  ipAddress?: string;
}

// ============================================
// 인보이스 (Invoice)
// ============================================

export interface Invoice {
  id: string;
  type: 'invoice';
  documentNumber: string;          // 청구번호 (I-2024-0001)
  status: DocumentStatus;

  // 당사자
  clientId: string;
  client: Client;

  // 연결된 문서
  quoteId?: string;
  contractId?: string;
  paymentScheduleId?: string;      // 계약서의 어떤 회차인지

  // 내용
  title: string;
  items: DocumentItem[];

  // 금액
  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  // 결제
  dueDate: string;                 // 결제 기한
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;              // 결제된 금액
  paidAt?: string;

  // 결제 정보
  paymentInfo: {
    bankName: string;              // 은행명
    accountNumber: string;         // 계좌번호
    accountHolder: string;         // 예금주
  };

  // 메타
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;

  // 연결된 문서
  linkedTaxInvoiceId?: string;
}

// ============================================
// 세금계산서 (Tax Invoice)
// ============================================

export interface TaxInvoice {
  id: string;
  type: 'tax_invoice';
  documentNumber: string;          // 세금계산서 번호
  status: DocumentStatus;

  // 공급자 (나)
  provider: {
    businessNumber: string;        // 사업자등록번호
    name: string;                  // 상호
    representativeName: string;    // 대표자
    address: string;               // 사업장 주소
    businessType: string;          // 업태
    businessCategory: string;      // 종목
    email: string;
  };

  // 공급받는자 (고객)
  clientId: string;
  client: Client;

  // 연결된 문서
  invoiceId?: string;

  // 내용
  items: TaxInvoiceItem[];

  // 금액
  subtotal: number;                // 공급가액
  taxAmount: number;               // 세액
  totalAmount: number;             // 합계금액

  // 발행 정보
  issueDate: string;               // 작성일자
  issueType: 'regular' | 'modified'; // 정발행/수정발행

  // 국세청 전송
  ntsSubmission?: {
    submittedAt?: string;
    approvalNumber?: string;       // 국세청 승인번호
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
  };

  // 메타
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoiceItem {
  id: string;
  date: string;                    // 거래일자
  name: string;                    // 품목
  specification?: string;          // 규격
  quantity: number;                // 수량
  unitPrice: number;               // 단가
  supplyAmount: number;            // 공급가액
  taxAmount: number;               // 세액
  notes?: string;                  // 비고
}

// ============================================
// 문서 체인 (Document Chain)
// ============================================

export interface DocumentChain {
  id: string;
  clientId: string;
  projectName: string;

  // 연결된 문서들
  quoteId?: string;
  contractId?: string;
  invoiceIds: string[];
  taxInvoiceIds: string[];

  // 진행 상태
  currentStage: 'quote' | 'contract' | 'invoice' | 'tax_invoice' | 'completed';

  // 금액 요약
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  // 타임라인
  timeline: DocumentEvent[];

  createdAt: string;
  updatedAt: string;
}

export interface DocumentEvent {
  id: string;
  type: 'created' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'paid' | 'completed';
  documentType: DocumentType;
  documentId: string;
  description: string;
  occurredAt: string;
}

// ============================================
// 내 사업자 정보 (Settings)
// ============================================

export interface BusinessProfile {
  // 기본 정보
  businessNumber: string;          // 사업자등록번호
  name: string;                    // 상호
  representativeName: string;      // 대표자명

  // 연락처
  email: string;
  phone: string;

  // 주소
  address: string;

  // 업종
  businessType: string;            // 업태
  businessCategory: string;        // 종목

  // 결제 정보
  defaultPaymentInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };

  // 문서 설정
  documentSettings: {
    quotePrefix: string;           // 견적서 번호 접두사 (기본: Q)
    contractPrefix: string;        // 계약서 번호 접두사 (기본: C)
    invoicePrefix: string;         // 인보이스 번호 접두사 (기본: I)
    defaultValidDays: number;      // 견적서 기본 유효기간 (일)
    defaultPaymentDays: number;    // 인보이스 기본 결제기한 (일)
    defaultTaxRate: number;        // 기본 세율 (10%)
  };

  // 기본 계약 조항
  defaultContractClauses: ContractClause[];

  // 로고/브랜딩
  logo?: string;
  primaryColor?: string;
}

// ============================================
// 통계 및 대시보드
// ============================================

export interface DashboardStats {
  // 이번 달
  thisMonth: {
    quotes: number;
    contracts: number;
    invoices: number;
    revenue: number;
    pendingAmount: number;
  };

  // 미결 현황
  pending: {
    quotesToApprove: number;       // 승인 대기 견적
    contractsToSign: number;       // 서명 대기 계약
    invoicesToPay: number;         // 결제 대기 인보이스
    overdueInvoices: number;       // 연체 인보이스
  };

  // 총계
  total: {
    clients: number;
    revenue: number;
    receivables: number;           // 미수금
  };
}

// ============================================
// 템플릿 메타데이터
// ============================================

export const DOCUMENT_META = {
  quote: {
    id: 'quote',
    name: '견적서',
    icon: '📋',
    color: '#3B82F6',
    description: '프로젝트 견적을 작성하고 고객에게 발송합니다',
  },
  contract: {
    id: 'contract',
    name: '계약서',
    icon: '📝',
    color: '#8B5CF6',
    description: '승인된 견적을 기반으로 계약서를 생성합니다',
  },
  invoice: {
    id: 'invoice',
    name: '인보이스',
    icon: '💳',
    color: '#10B981',
    description: '결제 요청 인보이스를 발행합니다',
  },
  tax_invoice: {
    id: 'tax_invoice',
    name: '세금계산서',
    icon: '🧾',
    color: '#F59E0B',
    description: '세금계산서를 발행하고 국세청에 전송합니다',
  },
} as const;

// ============================================
// 유틸리티 타입
// ============================================

export type DocumentUnion = Quote | Contract | Invoice | TaxInvoice;

export function isQuote(doc: DocumentUnion): doc is Quote {
  return doc.type === 'quote';
}

export function isContract(doc: DocumentUnion): doc is Contract {
  return doc.type === 'contract';
}

export function isInvoice(doc: DocumentUnion): doc is Invoice {
  return doc.type === 'invoice';
}

export function isTaxInvoice(doc: DocumentUnion): doc is TaxInvoice {
  return doc.type === 'tax_invoice';
}

// ============================================
// 기본값
// ============================================

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'clause-1',
    order: 1,
    title: '계약의 목적',
    content: '본 계약은 "갑"이 "을"에게 의뢰하는 프로젝트의 수행에 관한 제반 사항을 정함을 목적으로 한다.',
  },
  {
    id: 'clause-2',
    order: 2,
    title: '계약 기간',
    content: '본 계약의 기간은 계약 체결일로부터 프로젝트 완료일까지로 한다.',
  },
  {
    id: 'clause-3',
    order: 3,
    title: '대금 지급',
    content: '"갑"은 "을"에게 본 계약에 명시된 대금을 약정된 일정에 따라 지급한다.',
  },
  {
    id: 'clause-4',
    order: 4,
    title: '비밀 유지',
    content: '양 당사자는 본 계약 수행 중 알게 된 상대방의 영업비밀을 제3자에게 누설하거나 본 계약 이외의 목적으로 사용하지 않는다.',
  },
  {
    id: 'clause-5',
    order: 5,
    title: '계약의 해지',
    content: '일방 당사자가 본 계약상의 의무를 위반하고 상당한 기간 내에 이를 시정하지 않을 경우, 상대방은 본 계약을 해지할 수 있다.',
  },
  {
    id: 'clause-6',
    order: 6,
    title: '분쟁 해결',
    content: '본 계약과 관련하여 발생하는 분쟁은 상호 협의하여 해결하되, 협의가 이루어지지 않을 경우 관할 법원에서 해결한다.',
  },
];

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessNumber: '',
  name: '',
  representativeName: '',
  email: '',
  phone: '',
  address: '',
  businessType: '',
  businessCategory: '',
  defaultPaymentInfo: {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  },
  documentSettings: {
    quotePrefix: 'Q',
    contractPrefix: 'C',
    invoicePrefix: 'I',
    defaultValidDays: 14,
    defaultPaymentDays: 30,
    defaultTaxRate: 10,
  },
  defaultContractClauses: DEFAULT_CONTRACT_CLAUSES,
};

// ============================================
// 테마 (문서용)
// ============================================

export interface DocumentTheme {
  primaryColor: string;
  logo?: string;
  fontFamily?: string;
}

export const DEFAULT_DOCUMENT_THEME: DocumentTheme = {
  primaryColor: '#3B82F6',
  fontFamily: 'Pretendard',
};
