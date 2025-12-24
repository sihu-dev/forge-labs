/**
 * @forge/types - Marketing Automation Domain Types (L0)
 *
 * Sales/Marketing 자동화 시스템을 위한 타입 정의
 */

import { UUID, Timestamp } from '../index.js';

// ============================================
// 기본 타입
// ============================================

/**
 * 리드 상태
 */
export type LeadStatus =
  | 'new'           // 신규
  | 'contacted'     // 접촉 완료
  | 'qualified'     // 검증 완료
  | 'nurturing'     // 육성 중
  | 'opportunity'   // 기회
  | 'converted'     // 전환 완료
  | 'lost'          // 손실
  | 'unsubscribed'; // 구독 취소

/**
 * 리드 소스
 */
export type LeadSource =
  | 'website'       // 웹사이트
  | 'landing_page'  // 랜딩 페이지
  | 'social_media'  // 소셜 미디어
  | 'email'         // 이메일
  | 'referral'      // 추천
  | 'webinar'       // 웨비나
  | 'event'         // 이벤트
  | 'cold_outreach' // 콜드 아웃리치
  | 'paid_ad'       // 유료 광고
  | 'organic'       // 오가닉
  | 'partnership'   // 파트너십
  | 'other';        // 기타

/**
 * 캠페인 타입
 */
export type CampaignType =
  | 'email'         // 이메일
  | 'social'        // 소셜 미디어
  | 'content'       // 콘텐츠
  | 'webinar'       // 웨비나
  | 'event'         // 이벤트
  | 'paid_ad'       // 유료 광고
  | 'nurture'       // 너처링
  | 'retargeting';  // 리타겟팅

/**
 * 시퀀스 상태
 */
export type SequenceStatus =
  | 'draft'         // 초안
  | 'active'        // 활성
  | 'paused'        // 일시 정지
  | 'completed'     // 완료
  | 'archived';     // 보관됨

/**
 * 이메일 전송 상태
 */
export type EmailStatus =
  | 'scheduled'     // 예약됨
  | 'sent'          // 전송됨
  | 'delivered'     // 전달됨
  | 'opened'        // 열림
  | 'clicked'       // 클릭됨
  | 'replied'       // 답장됨
  | 'bounced'       // 반송됨
  | 'failed'        // 실패
  | 'unsubscribed'; // 구독 취소

/**
 * 알림 채널
 */
export type NotificationChannel =
  | 'email'
  | 'slack'
  | 'webhook'
  | 'sms';

/**
 * 알림 우선순위
 */
export type NotificationPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// ============================================
// 리드 (Lead)
// ============================================

/**
 * 리드 정보
 */
export interface ILead {
  id: UUID;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  phone?: string;
  linkedin_url?: string;

  /** 리드 스코어 (0-100) */
  score: number;

  /** 현재 상태 */
  status: LeadStatus;

  /** 리드 소스 */
  source: LeadSource;

  /** 태그 */
  tags: string[];

  /** 커스텀 필드 */
  custom_fields: Record<string, unknown>;

  /** 생성일 */
  created_at: Timestamp;

  /** 최종 접촉일 */
  last_contacted_at?: Timestamp;

  /** 전환일 */
  converted_at?: Timestamp;

  /** 담당자 ID */
  owner_id?: UUID;
}

/**
 * 리드 활동
 */
export interface ILeadActivity {
  id: UUID;
  lead_id: UUID;
  type: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' |
        'page_visited' | 'form_submitted' | 'meeting_booked' | 'call_made' |
        'note_added' | 'status_changed' | 'score_changed';
  description: string;
  metadata?: Record<string, unknown>;
  created_at: Timestamp;
  created_by?: UUID;
}

// ============================================
// 캠페인 (Campaign)
// ============================================

/**
 * 캠페인
 */
export interface ICampaign {
  id: UUID;
  name: string;
  description?: string;
  type: CampaignType;
  status: 'draft' | 'active' | 'paused' | 'completed';

  /** 예산 (USD) */
  budget?: number;

  /** 지출 (USD) */
  spent?: number;

  /** 시작일 */
  start_date?: Timestamp;

  /** 종료일 */
  end_date?: Timestamp;

  /** 목표 설정 */
  goals: {
    leads?: number;
    conversions?: number;
    revenue?: number;
  };

  /** UTM 파라미터 */
  utm_params?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  created_at: Timestamp;
  created_by: UUID;
  updated_at: Timestamp;
}

/**
 * 캠페인 성과
 */
export interface ICampaignPerformance {
  campaign_id: UUID;

  /** 노출수 */
  impressions: number;

  /** 클릭수 */
  clicks: number;

  /** CTR (Click-Through Rate) */
  ctr: number;

  /** 리드수 */
  leads: number;

  /** 전환수 */
  conversions: number;

  /** 전환율 */
  conversion_rate: number;

  /** 매출 */
  revenue: number;

  /** ROI */
  roi: number;

  /** CAC (Customer Acquisition Cost) */
  cac: number;

  /** 측정 시점 */
  measured_at: Timestamp;
}

// ============================================
// 이메일 시퀀스 (Email Sequence)
// ============================================

/**
 * 이메일 시퀀스
 */
export interface IEmailSequence {
  id: UUID;
  name: string;
  description?: string;
  status: SequenceStatus;

  /** 시퀀스 스텝 */
  steps: ISequenceStep[];

  /** 총 구독자수 */
  total_subscribers: number;

  /** 활성 구독자수 */
  active_subscribers: number;

  /** 완료 구독자수 */
  completed_subscribers: number;

  created_at: Timestamp;
  created_by: UUID;
  updated_at: Timestamp;
}

/**
 * 시퀀스 스텝
 */
export interface ISequenceStep {
  id: UUID;
  sequence_id: UUID;
  order: number;

  /** 이전 스텝 이후 대기 시간 (시간) */
  delay_hours: number;

  /** 이메일 제목 */
  subject: string;

  /** 이메일 본문 (HTML) */
  body_html: string;

  /** 이메일 본문 (Plain Text) */
  body_text: string;

  /** 성과 지표 */
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
  };
}

/**
 * 이메일 전송 기록
 */
export interface IEmailLog {
  id: UUID;
  lead_id: UUID;
  sequence_id?: UUID;
  step_id?: UUID;
  campaign_id?: UUID;

  /** 발신자 */
  from_email: string;

  /** 수신자 */
  to_email: string;

  /** 제목 */
  subject: string;

  /** 상태 */
  status: EmailStatus;

  /** 전송일 */
  sent_at?: Timestamp;

  /** 전달일 */
  delivered_at?: Timestamp;

  /** 열람일 */
  opened_at?: Timestamp;

  /** 클릭일 */
  clicked_at?: Timestamp;

  /** 답장일 */
  replied_at?: Timestamp;

  /** 에러 메시지 */
  error_message?: string;

  /** 메타데이터 */
  metadata?: {
    provider?: string;
    message_id?: string;
    opens_count?: number;
    clicks_count?: number;
  };

  created_at: Timestamp;
}

// ============================================
// 분석 및 리포트
// ============================================

/**
 * 파이프라인 지표
 */
export interface IPipelineMetrics {
  /** 기간 */
  period: {
    start: Timestamp;
    end: Timestamp;
  };

  /** 신규 리드 */
  new_leads: number;

  /** 검증된 리드 */
  qualified_leads: number;

  /** 기회 */
  opportunities: number;

  /** 전환 */
  conversions: number;

  /** 리드 → 검증 전환율 */
  lead_to_qualified_rate: number;

  /** 검증 → 기회 전환율 */
  qualified_to_opportunity_rate: number;

  /** 기회 → 전환 전환율 */
  opportunity_to_conversion_rate: number;

  /** 전체 전환율 */
  overall_conversion_rate: number;

  /** 평균 파이프라인 속도 (일) */
  avg_pipeline_velocity_days: number;
}

/**
 * 아웃리치 성과
 */
export interface IOutreachPerformance {
  /** 기간 */
  period: {
    start: Timestamp;
    end: Timestamp;
  };

  /** 전송된 이메일 */
  emails_sent: number;

  /** 전달률 */
  delivery_rate: number;

  /** 열람률 */
  open_rate: number;

  /** 클릭률 */
  click_rate: number;

  /** 답장률 */
  reply_rate: number;

  /** 미팅 예약률 */
  meeting_rate: number;

  /** 반송률 */
  bounce_rate: number;

  /** 구독 취소율 */
  unsubscribe_rate: number;

  /** 최적 발송 시간대 */
  best_send_times: {
    hour: number;
    day_of_week: number;
    open_rate: number;
    reply_rate: number;
  }[];
}

/**
 * 콘텐츠 성과
 */
export interface IContentPerformance {
  content_id: UUID;
  title: string;
  type: 'blog' | 'whitepaper' | 'ebook' | 'video' | 'webinar' | 'case_study';
  url: string;

  /** 조회수 */
  views: number;

  /** 고유 방문자수 */
  unique_visitors: number;

  /** 평균 체류 시간 (초) */
  avg_time_on_page: number;

  /** 생성된 리드수 */
  leads_generated: number;

  /** 전환수 */
  conversions: number;

  /** 전환율 */
  conversion_rate: number;

  /** 공유 수 */
  social_shares: number;

  /** 백링크 수 */
  backlinks: number;

  published_at: Timestamp;
  measured_at: Timestamp;
}

/**
 * 매출 어트리뷰션
 */
export interface IRevenueAttribution {
  /** 어트리뷰션 모델 */
  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shaped';

  /** 채널별 기여도 */
  channel_attribution: {
    channel: LeadSource;
    leads: number;
    conversions: number;
    revenue: number;
    percentage: number;
  }[];

  /** 캠페인별 기여도 */
  campaign_attribution: {
    campaign_id: UUID;
    campaign_name: string;
    leads: number;
    conversions: number;
    revenue: number;
    percentage: number;
  }[];

  /** 콘텐츠별 기여도 */
  content_attribution: {
    content_id: UUID;
    content_title: string;
    leads: number;
    conversions: number;
    revenue: number;
    percentage: number;
  }[];

  /** 측정 기간 */
  period: {
    start: Timestamp;
    end: Timestamp;
  };

  /** 총 매출 */
  total_revenue: number;
}

/**
 * LTV (Lifetime Value) 분석
 */
export interface ILTVAnalysis {
  /** 고객 세그먼트 */
  segment: string;

  /** 평균 LTV */
  avg_ltv: number;

  /** 평균 CAC */
  avg_cac: number;

  /** LTV:CAC 비율 */
  ltv_cac_ratio: number;

  /** 평균 계약 기간 (개월) */
  avg_tenure_months: number;

  /** 평균 월간 매출 */
  avg_monthly_revenue: number;

  /** 이탈률 */
  churn_rate: number;

  /** 고객 수 */
  customer_count: number;

  measured_at: Timestamp;
}

// ============================================
// 실시간 모니터링
// ============================================

/**
 * 시스템 헬스 상태
 */
export interface ISystemHealth {
  /** 전체 상태 */
  overall_status: 'healthy' | 'degraded' | 'down';

  /** 이메일 전송 상태 */
  email_delivery: {
    status: 'healthy' | 'degraded' | 'down';
    current_rate: number; // 초당 전송수
    error_rate: number;   // 에러율
    queue_size: number;   // 대기열 크기
  };

  /** API 상태 */
  api_status: {
    status: 'healthy' | 'degraded' | 'down';
    response_time_ms: number;
    error_rate: number;
    rate_limit_remaining: number;
  };

  /** 데이터베이스 상태 */
  database: {
    status: 'healthy' | 'degraded' | 'down';
    query_time_ms: number;
    connections: number;
    max_connections: number;
  };

  /** 외부 통합 상태 */
  integrations: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    last_checked_at: Timestamp;
    error_message?: string;
  }[];

  checked_at: Timestamp;
}

/**
 * 이상 탐지 알림
 */
export interface IAnomalyAlert {
  id: UUID;
  type: 'spike' | 'drop' | 'anomaly';
  severity: NotificationPriority;

  /** 지표 이름 */
  metric_name: string;

  /** 현재 값 */
  current_value: number;

  /** 예상 값 */
  expected_value: number;

  /** 편차 (%) */
  deviation_percent: number;

  /** 설명 */
  description: string;

  /** 추천 액션 */
  recommended_action?: string;

  /** AI 분석 */
  ai_analysis?: string;

  detected_at: Timestamp;
  acknowledged: boolean;
  acknowledged_at?: Timestamp;
  acknowledged_by?: UUID;
}

/**
 * 알림 설정
 */
export interface INotificationRule {
  id: UUID;
  name: string;
  enabled: boolean;

  /** 트리거 조건 */
  trigger: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    time_window_minutes?: number;
  };

  /** 알림 채널 */
  channels: NotificationChannel[];

  /** 우선순위 */
  priority: NotificationPriority;

  /** 수신자 */
  recipients: {
    email?: string[];
    slack_channel?: string;
    webhook_url?: string;
    phone_numbers?: string[];
  };

  /** 쿨다운 기간 (분) */
  cooldown_minutes: number;

  created_at: Timestamp;
  created_by: UUID;
  updated_at: Timestamp;
}

// ============================================
// 대시보드 설정
// ============================================

/**
 * 대시보드 위젯
 */
export interface IDashboardWidget {
  id: UUID;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'map' | 'list';
  title: string;

  /** 위치 및 크기 */
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  /** 위젯 설정 */
  config: {
    metric?: string;
    chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    time_range?: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
    filters?: Record<string, unknown>;
    refresh_interval_seconds?: number;
  };

  /** 데이터 쿼리 */
  query?: string;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * 대시보드
 */
export interface IDashboard {
  id: UUID;
  name: string;
  description?: string;

  /** 위젯 목록 */
  widgets: IDashboardWidget[];

  /** 공유 설정 */
  is_public: boolean;
  shared_with?: UUID[];

  /** 즐겨찾기 */
  is_favorite: boolean;

  created_at: Timestamp;
  created_by: UUID;
  updated_at: Timestamp;
}

// ============================================
// 상수
// ============================================

/**
 * 기본 설정
 */
export const MARKETING_DEFAULTS = {
  /** 기본 시퀀스 스텝 간격 (시간) */
  DEFAULT_STEP_DELAY_HOURS: 48,

  /** 기본 리드 스코어 */
  DEFAULT_LEAD_SCORE: 0,

  /** 최대 리드 스코어 */
  MAX_LEAD_SCORE: 100,

  /** 양호한 열람률 (%) */
  GOOD_OPEN_RATE: 25,

  /** 양호한 클릭률 (%) */
  GOOD_CLICK_RATE: 3,

  /** 양호한 답장률 (%) */
  GOOD_REPLY_RATE: 5,

  /** 양호한 LTV:CAC 비율 */
  GOOD_LTV_CAC_RATIO: 3,

  /** 알림 쿨다운 기간 (분) */
  DEFAULT_COOLDOWN_MINUTES: 60,

  /** 이상 탐지 임계값 (%) */
  ANOMALY_THRESHOLD_PERCENT: 30,
} as const;

/**
 * 이메일 발송 시간 권장사항
 */
export const BEST_SEND_TIMES = {
  B2B: {
    days: [2, 3, 4], // 화수목
    hours: [9, 10, 14], // 9am, 10am, 2pm
  },
  B2C: {
    days: [0, 6], // 일요일, 토요일
    hours: [20, 21], // 8pm, 9pm
  },
} as const;
