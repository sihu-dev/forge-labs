/**
 * Legal Compliance Service
 * QRY-023: 법률 준수 시스템
 *
 * 금융 규제 준수 요구사항:
 * - 투자 조언 금지 (자본시장법)
 * - 면책조항 필수 표시
 * - 사용자 동의 관리
 * - 위험 고지 의무
 *
 * ⚠️ 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 * 과거 성과는 미래 수익을 보장하지 않습니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'

// ═══════════════════════════════════════════════════════════════
// 법률 준수 상수
// ═══════════════════════════════════════════════════════════════

/**
 * 필수 면책조항 (한국어)
 */
export const DISCLAIMERS = {
  // 일반 면책조항
  GENERAL: `본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.
투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.`,

  // 백테스트 결과
  BACKTEST: `백테스트 결과는 과거 데이터를 기반으로 한 시뮬레이션이며,
과거 성과는 미래 수익을 보장하지 않습니다.
실제 거래 시 슬리피지, 수수료, 시장 충격 등으로 인해 결과가 다를 수 있습니다.`,

  // AI 분석
  AI_ANALYSIS: `AI 분석 결과는 참고용 정보이며, 투자 조언이 아닙니다.
모든 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
AI는 오류가 있을 수 있으며, 분석 결과를 그대로 따르지 마십시오.`,

  // 자동매매
  AUTO_TRADING: `자동매매 시스템은 기술적 오류, 네트워크 장애, 시장 급변 등으로 인해
예상과 다른 결과를 초래할 수 있습니다.
자동매매 사용에 따른 모든 손실은 사용자 본인의 책임입니다.`,

  // 셀럽 미러링
  MIRRORING: `셀럽 트레이더의 거래를 따라하는 것은 투자 조언이 아닙니다.
과거 성과가 뛰어난 트레이더도 미래에는 손실을 볼 수 있습니다.
미러링 거래의 모든 결과는 사용자 본인의 책임입니다.`,

  // 위험 고지
  RISK_WARNING: `투자에는 원금 손실의 위험이 있습니다.
레버리지 거래 시 원금을 초과하는 손실이 발생할 수 있습니다.
투자하기 전에 투자 목적, 경험 수준, 위험 감수 능력을 신중하게 고려하십시오.`,

  // 크레딧/실계좌
  REAL_TRADING: `실계좌 연동 시 실제 자금으로 거래가 실행됩니다.
모든 거래 결과에 대한 책임은 전적으로 사용자에게 있습니다.
본 플랫폼은 거래 결과에 대해 어떠한 책임도 지지 않습니다.`,
} as const

/**
 * 동의 유형
 */
export type ConsentType =
  | 'terms_of_service'     // 서비스 이용약관
  | 'privacy_policy'       // 개인정보 처리방침
  | 'risk_disclosure'      // 투자 위험 고지
  | 'auto_trading'         // 자동매매 동의
  | 'real_account'         // 실계좌 연동 동의
  | 'mirroring'            // 미러링 거래 동의
  | 'marketing'            // 마케팅 수신 동의

/**
 * 동의 기록
 */
export interface ConsentRecord {
  id: string
  userId: string
  consentType: ConsentType
  version: string
  agreedAt: string
  ipAddress: string | null
  userAgent: string | null
  expiresAt: string | null
  revokedAt: string | null
}

/**
 * 동의 요구사항
 */
export interface ConsentRequirement {
  type: ConsentType
  required: boolean
  version: string
  title: string
  description: string
  fullText: string
  expiryDays: number | null // null = 만료 없음
}

/**
 * 위험 레벨
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme'

/**
 * 위험 경고
 */
export interface RiskWarning {
  level: RiskLevel
  title: string
  message: string
  actions: string[]
  requiresAcknowledgment: boolean
}

// ═══════════════════════════════════════════════════════════════
// 동의 요구사항 정의
// ═══════════════════════════════════════════════════════════════

export const CONSENT_REQUIREMENTS: ConsentRequirement[] = [
  {
    type: 'terms_of_service',
    required: true,
    version: '2.0',
    title: '서비스 이용약관',
    description: 'HEPHAITOS 서비스 이용에 관한 약관입니다.',
    fullText: `제1조 (목적)
이 약관은 HEPHAITOS(이하 "플랫폼")가 제공하는 트레이딩 교육 서비스의 이용에 관한 사항을 규정함을 목적으로 합니다.

제2조 (서비스의 성격)
1. 본 플랫폼은 트레이딩 교육 및 도구를 제공하며, 투자 자문 서비스가 아닙니다.
2. 본 플랫폼에서 제공하는 모든 정보는 교육 목적이며, 투자 조언으로 해석되어서는 안 됩니다.
3. 모든 투자 결정은 이용자 본인의 판단과 책임하에 이루어져야 합니다.

제3조 (면책)
1. 플랫폼은 이용자의 투자 결정 및 그로 인한 손실에 대해 책임지지 않습니다.
2. 백테스트 결과는 과거 데이터 기반 시뮬레이션이며, 미래 수익을 보장하지 않습니다.
3. AI 분석 결과는 참고용이며, 오류가 있을 수 있습니다.`,
    expiryDays: null,
  },
  {
    type: 'privacy_policy',
    required: true,
    version: '2.0',
    title: '개인정보 처리방침',
    description: '개인정보의 수집, 이용, 보관에 관한 방침입니다.',
    fullText: `1. 수집하는 개인정보
- 이메일, 이름, 프로필 정보
- 거래 내역, 전략 데이터
- 서비스 이용 기록

2. 개인정보의 이용 목적
- 서비스 제공 및 개선
- 고객 지원
- 법적 의무 준수

3. 개인정보의 보관
- 회원 탈퇴 시까지 보관
- 법적 의무가 있는 경우 해당 기간 보관`,
    expiryDays: null,
  },
  {
    type: 'risk_disclosure',
    required: true,
    version: '1.0',
    title: '투자 위험 고지',
    description: '투자에 수반되는 위험에 대한 고지입니다.',
    fullText: DISCLAIMERS.RISK_WARNING + '\n\n' + DISCLAIMERS.GENERAL,
    expiryDays: 365, // 1년마다 재동의
  },
  {
    type: 'auto_trading',
    required: false,
    version: '1.0',
    title: '자동매매 동의',
    description: '자동매매 기능 사용에 대한 동의입니다.',
    fullText: DISCLAIMERS.AUTO_TRADING + '\n\n' + DISCLAIMERS.RISK_WARNING,
    expiryDays: 180, // 6개월마다 재동의
  },
  {
    type: 'real_account',
    required: false,
    version: '1.0',
    title: '실계좌 연동 동의',
    description: '실계좌 연동 및 실거래에 대한 동의입니다.',
    fullText: DISCLAIMERS.REAL_TRADING + '\n\n' + DISCLAIMERS.RISK_WARNING,
    expiryDays: 90, // 3개월마다 재동의
  },
  {
    type: 'mirroring',
    required: false,
    version: '1.0',
    title: '미러링 거래 동의',
    description: '셀럽 트레이더 미러링에 대한 동의입니다.',
    fullText: DISCLAIMERS.MIRRORING + '\n\n' + DISCLAIMERS.RISK_WARNING,
    expiryDays: 180,
  },
  {
    type: 'marketing',
    required: false,
    version: '1.0',
    title: '마케팅 수신 동의',
    description: '프로모션 및 마케팅 정보 수신에 대한 동의입니다.',
    fullText: '프로모션, 이벤트, 교육 콘텐츠 등의 마케팅 정보를 이메일 및 앱 알림으로 수신하는 것에 동의합니다.',
    expiryDays: null,
  },
]

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// ═══════════════════════════════════════════════════════════════
// Compliance Service
// ═══════════════════════════════════════════════════════════════

export class ComplianceService {
  /**
   * 사용자의 동의 상태 조회
   */
  async getConsentStatus(userId: string): Promise<{
    consents: ConsentRecord[]
    pendingConsents: ConsentRequirement[]
    allRequiredConsented: boolean
  }> {
    const supabase = await getSupabase()

    const { data: consents, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)

    if (error) {
      safeLogger.error('[ComplianceService] Failed to get consents', { error, userId })
      return {
        consents: [],
        pendingConsents: CONSENT_REQUIREMENTS.filter(r => r.required),
        allRequiredConsented: false,
      }
    }

    const consentRecords: ConsentRecord[] = (consents || []).map((c: {
      id: string
      user_id: string
      consent_type: ConsentType
      version: string
      agreed_at: string
      ip_address: string | null
      user_agent: string | null
      expires_at: string | null
      revoked_at: string | null
    }) => ({
      id: c.id,
      userId: c.user_id,
      consentType: c.consent_type,
      version: c.version,
      agreedAt: c.agreed_at,
      ipAddress: c.ip_address,
      userAgent: c.user_agent,
      expiresAt: c.expires_at,
      revokedAt: c.revoked_at,
    }))

    // 만료되지 않은 유효한 동의만 필터
    const validConsents = consentRecords.filter(c => {
      if (!c.expiresAt) return true
      return new Date(c.expiresAt) > new Date()
    })

    // 미동의 또는 만료된 동의 확인
    const pendingConsents = CONSENT_REQUIREMENTS.filter(req => {
      const consent = validConsents.find(
        c => c.consentType === req.type && c.version === req.version
      )
      return !consent
    })

    const allRequiredConsented = pendingConsents
      .filter(p => p.required)
      .length === 0

    return {
      consents: validConsents,
      pendingConsents,
      allRequiredConsented,
    }
  }

  /**
   * 동의 기록
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabase()

    const requirement = CONSENT_REQUIREMENTS.find(r => r.type === consentType)
    if (!requirement) {
      return { success: false, error: 'Invalid consent type' }
    }

    // 만료일 계산
    let expiresAt: string | null = null
    if (requirement.expiryDays) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + requirement.expiryDays)
      expiresAt = expiry.toISOString()
    }

    // 기존 동의 철회
    await supabase
      .from('user_consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .is('revoked_at', null)

    // 새 동의 기록
    const { error } = await supabase.from('user_consents').insert({
      user_id: userId,
      consent_type: consentType,
      version: requirement.version,
      agreed_at: new Date().toISOString(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: expiresAt,
    })

    if (error) {
      safeLogger.error('[ComplianceService] Failed to record consent', { error, userId, consentType })
      return { success: false, error: 'Failed to record consent' }
    }

    safeLogger.info('[ComplianceService] Consent recorded', { userId, consentType })
    return { success: true }
  }

  /**
   * 동의 철회
   */
  async revokeConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabase()

    // 필수 동의는 철회 불가
    const requirement = CONSENT_REQUIREMENTS.find(r => r.type === consentType)
    if (requirement?.required) {
      return { success: false, error: '필수 동의는 철회할 수 없습니다' }
    }

    const { error } = await supabase
      .from('user_consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .is('revoked_at', null)

    if (error) {
      safeLogger.error('[ComplianceService] Failed to revoke consent', { error, userId, consentType })
      return { success: false, error: 'Failed to revoke consent' }
    }

    safeLogger.info('[ComplianceService] Consent revoked', { userId, consentType })
    return { success: true }
  }

  /**
   * 특정 기능 사용 가능 여부 확인
   */
  async canUseFeature(
    userId: string,
    feature: 'auto_trading' | 'real_account' | 'mirroring'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const { consents } = await this.getConsentStatus(userId)

    // 필수 동의 확인
    const hasTerms = consents.some(c => c.consentType === 'terms_of_service')
    const hasPrivacy = consents.some(c => c.consentType === 'privacy_policy')
    const hasRisk = consents.some(c => c.consentType === 'risk_disclosure')

    if (!hasTerms || !hasPrivacy || !hasRisk) {
      return { allowed: false, reason: '필수 동의가 필요합니다' }
    }

    // 기능별 동의 확인
    const hasFeatureConsent = consents.some(c => c.consentType === feature)
    if (!hasFeatureConsent) {
      const requirement = CONSENT_REQUIREMENTS.find(r => r.type === feature)
      return { allowed: false, reason: `${requirement?.title || feature} 동의가 필요합니다` }
    }

    return { allowed: true }
  }

  /**
   * 위험 레벨 평가
   */
  evaluateRiskLevel(params: {
    leverage?: number
    portfolioPercent?: number
    volatility?: number
    isMargin?: boolean
  }): RiskWarning {
    const { leverage = 1, portfolioPercent = 0, volatility = 0, isMargin = false } = params

    let level: RiskLevel = 'low'
    const actions: string[] = []

    // 레버리지 기반 평가
    if (leverage > 10) {
      level = 'extreme'
      actions.push('레버리지를 낮추는 것을 고려하세요')
    } else if (leverage > 5) {
      level = 'high'
      actions.push('높은 레버리지는 큰 손실을 초래할 수 있습니다')
    } else if (leverage > 2) {
      level = 'medium'
    }

    // 포트폴리오 비중 평가
    if (portfolioPercent > 50) {
      level = level === 'extreme' ? 'extreme' : 'high'
      actions.push('단일 포지션 비중을 줄이는 것을 고려하세요')
    } else if (portfolioPercent > 25) {
      level = level === 'low' ? 'medium' : level
    }

    // 변동성 평가
    if (volatility > 0.5) {
      level = level === 'low' ? 'medium' : level
      actions.push('높은 변동성 자산입니다')
    }

    // 마진 거래
    if (isMargin) {
      level = level === 'low' ? 'medium' : level
      actions.push('마진 거래는 원금 이상의 손실이 발생할 수 있습니다')
    }

    const warnings: Record<RiskLevel, { title: string; message: string }> = {
      low: {
        title: '낮은 위험',
        message: '상대적으로 안전한 거래입니다.',
      },
      medium: {
        title: '중간 위험',
        message: '적절한 위험 관리가 필요합니다.',
      },
      high: {
        title: '높은 위험',
        message: '신중한 판단이 필요합니다. 손실 가능성이 높습니다.',
      },
      extreme: {
        title: '극도로 높은 위험',
        message: '원금 전체 또는 그 이상의 손실이 발생할 수 있습니다.',
      },
    }

    return {
      level,
      title: warnings[level].title,
      message: warnings[level].message,
      actions,
      requiresAcknowledgment: level === 'high' || level === 'extreme',
    }
  }

  /**
   * 금지 표현 검사
   */
  checkProhibitedPhrases(text: string): {
    isCompliant: boolean
    violations: string[]
  } {
    const prohibitedPatterns = [
      { pattern: /수익\s*보장/gi, description: '"수익 보장" 표현' },
      { pattern: /확실한\s*수익/gi, description: '"확실한 수익" 표현' },
      { pattern: /원금\s*보장/gi, description: '"원금 보장" 표현' },
      { pattern: /투자\s*하세요/gi, description: '투자 권유 표현' },
      { pattern: /매수\s*하세요/gi, description: '매수 권유 표현' },
      { pattern: /매도\s*하세요/gi, description: '매도 권유 표현' },
      { pattern: /반드시\s*(오|상승|하락)/gi, description: '확정적 예측 표현' },
      { pattern: /틀림없이/gi, description: '확정적 표현' },
      { pattern: /무조건/gi, description: '확정적 표현' },
    ]

    const violations: string[] = []

    for (const { pattern, description } of prohibitedPatterns) {
      if (pattern.test(text)) {
        violations.push(description)
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
    }
  }

  /**
   * 면책조항 포함 여부 확인
   */
  hasRequiredDisclaimer(
    text: string,
    type: 'general' | 'backtest' | 'ai' | 'trading'
  ): boolean {
    const keywords: Record<string, string[]> = {
      general: ['투자 조언이 아닙니다', '본인의 책임', '교육 목적'],
      backtest: ['과거 성과', '미래 수익을 보장하지 않습니다'],
      ai: ['참고용', 'AI', '오류'],
      trading: ['손실', '책임', '위험'],
    }

    const required = keywords[type] || keywords.general
    return required.every(kw => text.includes(kw))
  }
}

// 싱글톤 인스턴스
export const complianceService = new ComplianceService()
