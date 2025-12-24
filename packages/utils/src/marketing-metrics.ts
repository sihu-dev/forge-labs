/**
 * @forge/utils - Marketing Metrics Calculations (L1)
 *
 * 마케팅/영업 자동화 지표 계산 유틸리티
 */

import type {
  IPipelineMetrics,
  IOutreachPerformance,
  IRevenueAttribution,
  ILTVAnalysis,
  MARKETING_DEFAULTS,
} from '@forge/types/src/marketing/index.js';

// ============================================
// 파이프라인 지표 계산
// ============================================

/**
 * 전환율 계산
 */
export function calculateConversionRate(
  conversions: number,
  total: number
): number {
  if (total === 0) return 0;
  return (conversions / total) * 100;
}

/**
 * 파이프라인 속도 계산 (평균 전환 소요 일수)
 */
export function calculatePipelineVelocity(
  leads: Array<{
    created_at: string;
    converted_at?: string;
  }>
): number {
  const convertedLeads = leads.filter((lead) => lead.converted_at);

  if (convertedLeads.length === 0) return 0;

  const totalDays = convertedLeads.reduce((sum, lead) => {
    const created = new Date(lead.created_at).getTime();
    const converted = new Date(lead.converted_at!).getTime();
    const days = (converted - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / convertedLeads.length;
}

/**
 * 파이프라인 지표 집계
 */
export function aggregatePipelineMetrics(
  leads: Array<{
    status: string;
    created_at: string;
    converted_at?: string;
  }>,
  period: { start: string; end: string }
): Omit<IPipelineMetrics, 'period'> {
  const periodLeads = leads.filter((lead) => {
    const created = new Date(lead.created_at);
    return created >= new Date(period.start) && created <= new Date(period.end);
  });

  const newLeads = periodLeads.filter((l) => l.status === 'new').length;
  const qualifiedLeads = periodLeads.filter((l) =>
    ['qualified', 'nurturing', 'opportunity', 'converted'].includes(l.status)
  ).length;
  const opportunities = periodLeads.filter((l) =>
    ['opportunity', 'converted'].includes(l.status)
  ).length;
  const conversions = periodLeads.filter((l) => l.status === 'converted').length;

  return {
    new_leads: newLeads,
    qualified_leads: qualifiedLeads,
    opportunities,
    conversions,
    lead_to_qualified_rate: calculateConversionRate(qualifiedLeads, newLeads),
    qualified_to_opportunity_rate: calculateConversionRate(
      opportunities,
      qualifiedLeads
    ),
    opportunity_to_conversion_rate: calculateConversionRate(
      conversions,
      opportunities
    ),
    overall_conversion_rate: calculateConversionRate(conversions, newLeads),
    avg_pipeline_velocity_days: calculatePipelineVelocity(periodLeads),
  };
}

// ============================================
// 이메일 아웃리치 지표
// ============================================

/**
 * 전달률 계산
 */
export function calculateDeliveryRate(
  delivered: number,
  sent: number
): number {
  if (sent === 0) return 0;
  return (delivered / sent) * 100;
}

/**
 * 열람률 계산
 */
export function calculateOpenRate(opened: number, delivered: number): number {
  if (delivered === 0) return 0;
  return (opened / delivered) * 100;
}

/**
 * 클릭률 계산
 */
export function calculateClickRate(clicked: number, delivered: number): number {
  if (delivered === 0) return 0;
  return (clicked / delivered) * 100;
}

/**
 * 답장률 계산
 */
export function calculateReplyRate(replied: number, delivered: number): number {
  if (delivered === 0) return 0;
  return (replied / delivered) * 100;
}

/**
 * 아웃리치 성과 집계
 */
export function aggregateOutreachPerformance(
  emails: Array<{
    status: string;
    sent_at?: string;
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
    replied_at?: string;
  }>,
  period: { start: string; end: string }
): Omit<IOutreachPerformance, 'period' | 'best_send_times'> {
  const periodEmails = emails.filter((email) => {
    if (!email.sent_at) return false;
    const sent = new Date(email.sent_at);
    return sent >= new Date(period.start) && sent <= new Date(period.end);
  });

  const sent = periodEmails.length;
  const delivered = periodEmails.filter((e) => e.delivered_at).length;
  const opened = periodEmails.filter((e) => e.opened_at).length;
  const clicked = periodEmails.filter((e) => e.clicked_at).length;
  const replied = periodEmails.filter((e) => e.replied_at).length;
  const bounced = periodEmails.filter((e) => e.status === 'bounced').length;
  const unsubscribed = periodEmails.filter(
    (e) => e.status === 'unsubscribed'
  ).length;

  // 미팅 예약률은 별도 데이터 소스에서 가져와야 함
  const meetingRate = 0; // TODO: 미팅 데이터와 연동

  return {
    emails_sent: sent,
    delivery_rate: calculateDeliveryRate(delivered, sent),
    open_rate: calculateOpenRate(opened, delivered),
    click_rate: calculateClickRate(clicked, delivered),
    reply_rate: calculateReplyRate(replied, delivered),
    meeting_rate: meetingRate,
    bounce_rate: calculateDeliveryRate(bounced, sent),
    unsubscribe_rate: calculateDeliveryRate(unsubscribed, delivered),
  };
}

/**
 * 최적 발송 시간 분석
 */
export function analyzeBestSendTimes(
  emails: Array<{
    sent_at: string;
    opened_at?: string;
    replied_at?: string;
  }>
): Array<{
  hour: number;
  day_of_week: number;
  open_rate: number;
  reply_rate: number;
}> {
  // 시간대별, 요일별로 그룹화
  const timeSlots = new Map<
    string,
    {
      sent: number;
      opened: number;
      replied: number;
      hour: number;
      day_of_week: number;
    }
  >();

  emails.forEach((email) => {
    const sentDate = new Date(email.sent_at);
    const hour = sentDate.getHours();
    const dayOfWeek = sentDate.getDay();
    const key = `${dayOfWeek}-${hour}`;

    const slot = timeSlots.get(key) || {
      sent: 0,
      opened: 0,
      replied: 0,
      hour,
      day_of_week: dayOfWeek,
    };

    slot.sent++;
    if (email.opened_at) slot.opened++;
    if (email.replied_at) slot.replied++;

    timeSlots.set(key, slot);
  });

  // 통계 계산
  return Array.from(timeSlots.values())
    .map((slot) => ({
      hour: slot.hour,
      day_of_week: slot.day_of_week,
      open_rate: calculateOpenRate(slot.opened, slot.sent),
      reply_rate: calculateReplyRate(slot.replied, slot.sent),
    }))
    .sort((a, b) => b.reply_rate - a.reply_rate);
}

// ============================================
// CAC & LTV 계산
// ============================================

/**
 * CAC (Customer Acquisition Cost) 계산
 */
export function calculateCAC(
  totalMarketingSpend: number,
  totalSalesSpend: number,
  newCustomers: number
): number {
  if (newCustomers === 0) return 0;
  return (totalMarketingSpend + totalSalesSpend) / newCustomers;
}

/**
 * LTV (Lifetime Value) 계산
 */
export function calculateLTV(
  avgMonthlyRevenue: number,
  avgTenureMonths: number,
  profitMargin: number = 0.7
): number {
  return avgMonthlyRevenue * avgTenureMonths * profitMargin;
}

/**
 * LTV:CAC 비율 계산
 */
export function calculateLTVCACRatio(ltv: number, cac: number): number {
  if (cac === 0) return 0;
  return ltv / cac;
}

/**
 * 이탈률 계산
 */
export function calculateChurnRate(
  customersLost: number,
  totalCustomers: number
): number {
  if (totalCustomers === 0) return 0;
  return (customersLost / totalCustomers) * 100;
}

/**
 * LTV 분석
 */
export function analyzeLTV(
  customers: Array<{
    segment: string;
    monthly_revenue: number;
    tenure_months: number;
    acquisition_cost: number;
  }>,
  churned: number
): Record<string, Omit<ILTVAnalysis, 'measured_at'>> {
  const segments = new Map<
    string,
    {
      total_ltv: number;
      total_cac: number;
      total_tenure: number;
      total_revenue: number;
      count: number;
    }
  >();

  customers.forEach((customer) => {
    const segment = segments.get(customer.segment) || {
      total_ltv: 0,
      total_cac: 0,
      total_tenure: 0,
      total_revenue: 0,
      count: 0,
    };

    const ltv = calculateLTV(customer.monthly_revenue, customer.tenure_months);

    segment.total_ltv += ltv;
    segment.total_cac += customer.acquisition_cost;
    segment.total_tenure += customer.tenure_months;
    segment.total_revenue += customer.monthly_revenue;
    segment.count++;

    segments.set(customer.segment, segment);
  });

  const result: Record<string, Omit<ILTVAnalysis, 'measured_at'>> = {};

  segments.forEach((data, segment) => {
    const avgLTV = data.total_ltv / data.count;
    const avgCAC = data.total_cac / data.count;

    result[segment] = {
      segment,
      avg_ltv: avgLTV,
      avg_cac: avgCAC,
      ltv_cac_ratio: calculateLTVCACRatio(avgLTV, avgCAC),
      avg_tenure_months: data.total_tenure / data.count,
      avg_monthly_revenue: data.total_revenue / data.count,
      churn_rate: calculateChurnRate(churned, data.count),
      customer_count: data.count,
    };
  });

  return result;
}

// ============================================
// ROI 계산
// ============================================

/**
 * ROI (Return on Investment) 계산
 */
export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

/**
 * ROAS (Return on Ad Spend) 계산
 */
export function calculateROAS(revenue: number, adSpend: number): number {
  if (adSpend === 0) return 0;
  return revenue / adSpend;
}

// ============================================
// 매출 어트리뷰션
// ============================================

/**
 * First-Touch 어트리뷰션
 */
export function calculateFirstTouchAttribution(
  conversions: Array<{
    channel: string;
    touchpoints: Array<{ channel: string; timestamp: string }>;
    revenue: number;
  }>
): Record<string, number> {
  const attribution: Record<string, number> = {};

  conversions.forEach((conversion) => {
    if (conversion.touchpoints.length === 0) return;

    // 첫 번째 터치포인트에 100% 귀속
    const firstChannel =
      conversion.touchpoints[0]?.channel || conversion.channel;
    attribution[firstChannel] = (attribution[firstChannel] || 0) + conversion.revenue;
  });

  return attribution;
}

/**
 * Last-Touch 어트리뷰션
 */
export function calculateLastTouchAttribution(
  conversions: Array<{
    channel: string;
    touchpoints: Array<{ channel: string; timestamp: string }>;
    revenue: number;
  }>
): Record<string, number> {
  const attribution: Record<string, number> = {};

  conversions.forEach((conversion) => {
    if (conversion.touchpoints.length === 0) return;

    // 마지막 터치포인트에 100% 귀속
    const lastChannel =
      conversion.touchpoints[conversion.touchpoints.length - 1]?.channel ||
      conversion.channel;
    attribution[lastChannel] = (attribution[lastChannel] || 0) + conversion.revenue;
  });

  return attribution;
}

/**
 * Linear 어트리뷰션
 */
export function calculateLinearAttribution(
  conversions: Array<{
    channel: string;
    touchpoints: Array<{ channel: string; timestamp: string }>;
    revenue: number;
  }>
): Record<string, number> {
  const attribution: Record<string, number> = {};

  conversions.forEach((conversion) => {
    if (conversion.touchpoints.length === 0) return;

    // 모든 터치포인트에 균등 분배
    const share = conversion.revenue / conversion.touchpoints.length;

    conversion.touchpoints.forEach((touchpoint) => {
      attribution[touchpoint.channel] =
        (attribution[touchpoint.channel] || 0) + share;
    });
  });

  return attribution;
}

/**
 * Time-Decay 어트리뷰션
 */
export function calculateTimeDecayAttribution(
  conversions: Array<{
    channel: string;
    touchpoints: Array<{ channel: string; timestamp: string }>;
    revenue: number;
    converted_at: string;
  }>,
  halfLifeDays: number = 7
): Record<string, number> {
  const attribution: Record<string, number> = {};

  conversions.forEach((conversion) => {
    if (conversion.touchpoints.length === 0) return;

    const convertedTime = new Date(conversion.converted_at).getTime();

    // 각 터치포인트까지의 시간 가중치 계산
    const weights = conversion.touchpoints.map((touchpoint) => {
      const touchTime = new Date(touchpoint.timestamp).getTime();
      const daysSince =
        (convertedTime - touchTime) / (1000 * 60 * 60 * 24);
      return Math.pow(0.5, daysSince / halfLifeDays);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // 가중치에 따라 매출 분배
    conversion.touchpoints.forEach((touchpoint, idx) => {
      const share = (weights[idx]! / totalWeight) * conversion.revenue;
      attribution[touchpoint.channel] =
        (attribution[touchpoint.channel] || 0) + share;
    });
  });

  return attribution;
}

/**
 * U-Shaped (Position-Based) 어트리뷰션
 */
export function calculateUShapedAttribution(
  conversions: Array<{
    channel: string;
    touchpoints: Array<{ channel: string; timestamp: string }>;
    revenue: number;
  }>,
  firstTouchWeight: number = 0.4,
  lastTouchWeight: number = 0.4
): Record<string, number> {
  const attribution: Record<string, number> = {};
  const middleWeight = 1 - firstTouchWeight - lastTouchWeight;

  conversions.forEach((conversion) => {
    if (conversion.touchpoints.length === 0) return;
    if (conversion.touchpoints.length === 1) {
      // 터치포인트가 1개면 100% 귀속
      const channel = conversion.touchpoints[0]!.channel;
      attribution[channel] = (attribution[channel] || 0) + conversion.revenue;
      return;
    }

    const firstChannel = conversion.touchpoints[0]!.channel;
    const lastChannel =
      conversion.touchpoints[conversion.touchpoints.length - 1]!.channel;

    // 첫 번째 터치포인트
    attribution[firstChannel] =
      (attribution[firstChannel] || 0) + conversion.revenue * firstTouchWeight;

    // 마지막 터치포인트
    attribution[lastChannel] =
      (attribution[lastChannel] || 0) + conversion.revenue * lastTouchWeight;

    // 중간 터치포인트들
    if (conversion.touchpoints.length > 2) {
      const middleShare =
        (conversion.revenue * middleWeight) /
        (conversion.touchpoints.length - 2);

      for (let i = 1; i < conversion.touchpoints.length - 1; i++) {
        const channel = conversion.touchpoints[i]!.channel;
        attribution[channel] = (attribution[channel] || 0) + middleShare;
      }
    }
  });

  return attribution;
}

// ============================================
// 이상 탐지
// ============================================

/**
 * Z-Score 기반 이상 탐지
 */
export function detectAnomalies(
  values: number[],
  threshold: number = 3
): { isAnomaly: boolean; zScore: number; mean: number; stdDev: number } {
  if (values.length < 3) {
    return { isAnomaly: false, zScore: 0, mean: 0, stdDev: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const currentValue = values[values.length - 1]!;
  const zScore = stdDev === 0 ? 0 : (currentValue - mean) / stdDev;

  return {
    isAnomaly: Math.abs(zScore) > threshold,
    zScore,
    mean,
    stdDev,
  };
}

/**
 * 이동 평균 기반 이상 탐지
 */
export function detectAnomaliesMA(
  values: number[],
  windowSize: number = 7,
  deviationThreshold: number = 0.3
): { isAnomaly: boolean; deviation: number; movingAverage: number } {
  if (values.length < windowSize + 1) {
    return { isAnomaly: false, deviation: 0, movingAverage: 0 };
  }

  // 최근 windowSize 개의 평균 계산 (현재 값 제외)
  const recentValues = values.slice(-windowSize - 1, -1);
  const movingAverage =
    recentValues.reduce((sum, v) => sum + v, 0) / windowSize;

  const currentValue = values[values.length - 1]!;
  const deviation =
    movingAverage === 0 ? 0 : (currentValue - movingAverage) / movingAverage;

  return {
    isAnomaly: Math.abs(deviation) > deviationThreshold,
    deviation,
    movingAverage,
  };
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 백분율 포맷팅
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 통화 포맷팅
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * 숫자 압축 표기 (1.5K, 2.3M 등)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * 증감 표시 (+5.2%, -3.1%)
 */
export function formatChange(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * 성과 등급 평가
 */
export function evaluatePerformance(
  metric: 'open_rate' | 'click_rate' | 'reply_rate' | 'ltv_cac_ratio',
  value: number
): 'excellent' | 'good' | 'average' | 'poor' {
  const thresholds = {
    open_rate: { excellent: 35, good: 25, average: 15 },
    click_rate: { excellent: 5, good: 3, average: 1 },
    reply_rate: { excellent: 10, good: 5, average: 2 },
    ltv_cac_ratio: { excellent: 5, good: 3, average: 1 },
  };

  const t = thresholds[metric];
  if (value >= t.excellent) return 'excellent';
  if (value >= t.good) return 'good';
  if (value >= t.average) return 'average';
  return 'poor';
}
