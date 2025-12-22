/**
 * ADE - AI Design Engine
 * IO 통합 버전 타입 시스템
 */

// ============================================
// 프로젝트 타입
// ============================================

export type ProjectType = 'card' | 'invoice' | 'portfolio' | 'quote' | 'landing';

export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface Project {
  id: string;
  userId: string;
  type: ProjectType;
  name: string;
  slug: string; // URL용 (username/slug)
  data: ProjectData;
  theme: Theme;
  status: ProjectStatus;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 프로젝트별 데이터 타입
// ============================================

export type ProjectData =
  | CardData
  | InvoiceData
  | PortfolioData
  | QuoteData
  | LandingData;

// 명함 데이터
export interface CardData {
  type: 'card';
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  photo?: string;
  logo?: string;
  socials?: SocialLink[];
}

// 인보이스 데이터
export interface InvoiceData {
  type: 'invoice';
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  from: BusinessInfo;
  to: BusinessInfo;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  paymentInfo?: PaymentInfo;
}

// 포트폴리오 데이터
export interface PortfolioData {
  type: 'portfolio';
  name: string;
  title: string;
  bio?: string;
  photo?: string;
  skills?: string[];
  projects: PortfolioProject[];
  experience?: Experience[];
  socials?: SocialLink[];
  contact?: ContactInfo;
}

// 견적서 데이터
export interface QuoteData {
  type: 'quote';
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  from: BusinessInfo;
  to: BusinessInfo;
  projectName: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  terms?: string;
  timeline?: string;
}

// 랜딩페이지 데이터
export interface LandingData {
  type: 'landing';
  businessName: string;
  tagline: string;
  description?: string;
  logo?: string;
  heroImage?: string;
  services?: Service[];
  features?: Feature[];
  testimonials?: Testimonial[];
  pricing?: PricingPlan[];
  cta?: CTAConfig;
  contact?: ContactInfo;
}

// ============================================
// 공통 서브 타입
// ============================================

export interface SocialLink {
  platform: 'linkedin' | 'github' | 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'other';
  url: string;
  label?: string;
}

export interface BusinessInfo {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string; // 사업자등록번호
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface QuoteItem {
  id: string;
  category?: string;
  description: string;
  details?: string;
  amount: number;
}

export interface PaymentInfo {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  // 온라인 결제 연동
  enableOnlinePayment?: boolean;
  paymentMethods?: ('card' | 'bank' | 'kakao' | 'toss')[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  tags?: string[];
  date?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  period: string;
  description?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  formEnabled?: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  price?: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  title?: string;
  company?: string;
  content: string;
  photo?: string;
  rating?: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
}

export interface CTAConfig {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink?: string;
  showContactForm?: boolean;
}

// ============================================
// 테마 타입
// ============================================

export interface Theme {
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  style?: 'minimal' | 'modern' | 'classic' | 'bold';
}

export const DEFAULT_THEME: Theme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  accentColor: '#10B981',
  fontFamily: 'Geist Sans',
  borderRadius: 'md',
  style: 'modern',
};

// ============================================
// 이미지 처리 타입
// ============================================

export interface ImageAnalysisResult {
  type: 'business_card' | 'logo' | 'photo' | 'product' | 'unknown';
  extractedText?: ExtractedBusinessCard;
  colors?: ExtractedColors;
  confidence: number;
}

export interface ExtractedBusinessCard {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface ExtractedColors {
  primary: string;
  secondary?: string;
  accent?: string;
  palette: string[];
}

// ============================================
// API 응답 타입
// ============================================

export interface GeneratePageResponse {
  success: boolean;
  project?: Project;
  previewUrl?: string;
  error?: string;
}

export interface PublishResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  analysis?: ImageAnalysisResult;
  error?: string;
}
