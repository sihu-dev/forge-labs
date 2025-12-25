/**
 * Mentor Dashboard Service
 * QRY-022: 멘토 대시보드 - 수강생 관리, 수익 정산
 *
 * HEPHAITOS 비즈니스 모델:
 * - 수강료: 멘토 70% / 플랫폼 30%
 * - 크레딧: 멘토 30% / 플랫폼 70%
 * - 브로커 CPA: 50% / 50%
 *
 * ⚠️ 면책조항: 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/**
 * 멘토 프로필
 */
export interface MentorProfile {
  id: string
  userId: string
  displayName: string
  bio: string
  avatarUrl: string | null
  socialLinks: {
    youtube?: string
    twitter?: string
    telegram?: string
  }
  specialties: string[]
  experienceYears: number
  totalStudents: number
  rating: number
  reviewCount: number
  verified: boolean
  createdAt: string
}

/**
 * 수강생 정보
 */
export interface StudentInfo {
  id: string
  userId: string
  name: string
  email: string
  enrolledAt: string
  lastActiveAt: string
  progress: number // 0-100
  coursesEnrolled: string[]
  strategiesCreated: number
  backtestsRun: number
  creditsUsed: number
  status: 'active' | 'inactive' | 'completed'
}

/**
 * 코스 정보
 */
export interface CourseInfo {
  id: string
  title: string
  description: string
  price: number
  currency: 'KRW' | 'USD'
  enrollmentCount: number
  completionRate: number
  rating: number
  createdAt: string
  status: 'draft' | 'published' | 'archived'
}

/**
 * 수익 정산
 */
export interface EarningsReport {
  period: {
    start: string
    end: string
  }
  courseRevenue: {
    gross: number
    platformFee: number // 30%
    net: number // 70%
    breakdown: Array<{
      courseId: string
      courseTitle: string
      enrollments: number
      revenue: number
    }>
  }
  creditRevenue: {
    gross: number
    platformFee: number // 70%
    net: number // 30%
    usage: number // 총 크레딧 사용량
  }
  referralRevenue: {
    gross: number
    platformFee: number // 50%
    net: number // 50%
    referrals: number
  }
  total: {
    gross: number
    net: number
    pending: number
    paid: number
  }
}

/**
 * 멘토 통계
 */
export interface MentorStats {
  totalStudents: number
  activeStudents: number
  completedStudents: number
  totalCourses: number
  publishedCourses: number
  totalRevenue: number
  pendingPayout: number
  averageRating: number
  totalReviews: number
  strategyViews: number
  strategyClones: number
  leaderboardRank: number | null
}

/**
 * 정산 요청
 */
export interface PayoutRequest {
  id: string
  mentorId: string
  amount: number
  currency: 'KRW' | 'USD'
  method: 'bank_transfer' | 'paypal'
  bankInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  processedAt: string | null
  transactionId: string | null
}

// ═══════════════════════════════════════════════════════════════
// Revenue Share Constants
// ═══════════════════════════════════════════════════════════════

export const REVENUE_SHARE = {
  COURSE: { mentor: 0.7, platform: 0.3 },
  CREDIT: { mentor: 0.3, platform: 0.7 },
  REFERRAL: { mentor: 0.5, platform: 0.5 },
} as const

export const MINIMUM_PAYOUT = {
  KRW: 50000,
  USD: 50,
} as const

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
// Mentor Service
// ═══════════════════════════════════════════════════════════════

export class MentorService {
  /**
   * 멘토 프로필 조회
   */
  async getProfile(userId: string): Promise<MentorProfile | null> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // 프로필이 없으면 기본 프로필 생성
      if (error?.code === 'PGRST116') {
        return this.createProfile(userId)
      }
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      bio: data.bio || '',
      avatarUrl: data.avatar_url,
      socialLinks: data.social_links || {},
      specialties: data.specialties || [],
      experienceYears: data.experience_years || 0,
      totalStudents: data.total_students || 0,
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      verified: data.verified || false,
      createdAt: data.created_at,
    }
  }

  /**
   * 멘토 프로필 생성
   */
  async createProfile(userId: string): Promise<MentorProfile | null> {
    const supabase = await getSupabase()

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('mentor_profiles')
      .insert({
        user_id: userId,
        display_name: user?.full_name || 'Mentor',
        avatar_url: user?.avatar_url,
        bio: '',
        social_links: {},
        specialties: [],
        experience_years: 0,
        total_students: 0,
        rating: 0,
        review_count: 0,
        verified: false,
      })
      .select()
      .single()

    if (error) {
      safeLogger.error('[MentorService] Failed to create profile', { error, userId })
      return null
    }

    return this.getProfile(userId)
  }

  /**
   * 멘토 프로필 업데이트
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<MentorProfile, 'displayName' | 'bio' | 'socialLinks' | 'specialties' | 'experienceYears'>>
  ): Promise<boolean> {
    const supabase = await getSupabase()

    const { error } = await supabase
      .from('mentor_profiles')
      .update({
        display_name: updates.displayName,
        bio: updates.bio,
        social_links: updates.socialLinks,
        specialties: updates.specialties,
        experience_years: updates.experienceYears,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      safeLogger.error('[MentorService] Failed to update profile', { error, userId })
      return false
    }

    return true
  }

  /**
   * 수강생 목록 조회
   */
  async getStudents(
    mentorId: string,
    options: {
      status?: 'active' | 'inactive' | 'completed'
      courseId?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ students: StudentInfo[]; total: number }> {
    const supabase = await getSupabase()

    let query = supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        enrolled_at,
        progress,
        status,
        course_id,
        profiles!inner(full_name, email, last_sign_in_at)
      `, { count: 'exact' })
      .eq('mentor_id', mentorId)

    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.courseId) {
      query = query.eq('course_id', options.courseId)
    }

    query = query
      .order('enrolled_at', { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1)

    const { data, error, count } = await query

    if (error) {
      safeLogger.error('[MentorService] Failed to get students', { error, mentorId })
      return { students: [], total: 0 }
    }

    const students: StudentInfo[] = (data || []).map((enrollment: {
      id: string
      user_id: string
      enrolled_at: string
      progress: number
      status: 'active' | 'inactive' | 'completed'
      course_id: string
      profiles: {
        full_name: string | null
        email: string
        last_sign_in_at: string | null
      }
    }) => ({
      id: enrollment.id,
      userId: enrollment.user_id,
      name: enrollment.profiles.full_name || 'Unknown',
      email: enrollment.profiles.email,
      enrolledAt: enrollment.enrolled_at,
      lastActiveAt: enrollment.profiles.last_sign_in_at || enrollment.enrolled_at,
      progress: enrollment.progress || 0,
      coursesEnrolled: [enrollment.course_id],
      strategiesCreated: 0, // TODO: 조회 필요
      backtestsRun: 0,
      creditsUsed: 0,
      status: enrollment.status || 'active',
    }))

    return { students, total: count || 0 }
  }

  /**
   * 멘토 통계 조회
   */
  async getStats(mentorId: string): Promise<MentorStats> {
    const supabase = await getSupabase()

    // 여러 통계 동시 조회
    const [enrollmentsResult, coursesResult, revenueResult, reviewsResult] = await Promise.all([
      // 수강생 통계
      supabase
        .from('enrollments')
        .select('status', { count: 'exact' })
        .eq('mentor_id', mentorId),

      // 코스 통계
      supabase
        .from('courses')
        .select('id, status', { count: 'exact' })
        .eq('mentor_id', mentorId),

      // 수익 통계 (간단 버전)
      supabase
        .from('transactions')
        .select('amount, status')
        .eq('recipient_id', mentorId)
        .eq('type', 'mentor_payout'),

      // 리뷰 통계
      supabase
        .from('reviews')
        .select('rating')
        .eq('mentor_id', mentorId),
    ])

    const enrollments = enrollmentsResult.data || []
    const courses = coursesResult.data || []
    const transactions = revenueResult.data || []
    const reviews = reviewsResult.data || []

    const activeStudents = enrollments.filter(e => e.status === 'active').length
    const completedStudents = enrollments.filter(e => e.status === 'completed').length
    const publishedCourses = courses.filter(c => c.status === 'published').length

    const totalRevenue = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const pendingPayout = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const ratings = reviews.map(r => r.rating).filter((r): r is number => r != null)
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0

    return {
      totalStudents: enrollmentsResult.count || 0,
      activeStudents,
      completedStudents,
      totalCourses: coursesResult.count || 0,
      publishedCourses,
      totalRevenue,
      pendingPayout,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      strategyViews: 0, // TODO: 구현
      strategyClones: 0,
      leaderboardRank: null,
    }
  }

  /**
   * 수익 리포트 생성
   */
  async getEarningsReport(
    mentorId: string,
    startDate: string,
    endDate: string
  ): Promise<EarningsReport> {
    const supabase = await getSupabase()

    // 코스 수익 조회
    const { data: coursePayments } = await supabase
      .from('payments')
      .select(`
        amount,
        course_id,
        created_at,
        courses!inner(title)
      `)
      .eq('type', 'course_enrollment')
      .eq('mentor_id', mentorId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // 크레딧 사용 수익 조회
    const { data: creditUsage } = await supabase
      .from('credit_transactions')
      .select('amount, feature')
      .eq('mentor_id', mentorId)
      .eq('type', 'usage')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // 추천 수익 조회
    const { data: referrals } = await supabase
      .from('referral_commissions')
      .select('amount')
      .eq('mentor_id', mentorId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // 정산 내역
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status')
      .eq('mentor_id', mentorId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // 코스별 수익 집계
    const courseBreakdown = new Map<string, {
      courseId: string
      courseTitle: string
      enrollments: number
      revenue: number
    }>()

    for (const payment of (coursePayments || [])) {
      const courseId = payment.course_id
      const existing = courseBreakdown.get(courseId) || {
        courseId,
        courseTitle: (payment as { courses: { title: string } }).courses?.title || 'Unknown',
        enrollments: 0,
        revenue: 0,
      }
      existing.enrollments++
      existing.revenue += payment.amount || 0
      courseBreakdown.set(courseId, existing)
    }

    const grossCourseRevenue = (coursePayments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    const grossCreditRevenue = (creditUsage || []).reduce((sum, c) => sum + (c.amount || 0), 0)
    const grossReferralRevenue = (referrals || []).reduce((sum, r) => sum + (r.amount || 0), 0)

    const paidAmount = (payouts || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const pendingAmount = (payouts || [])
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      period: { start: startDate, end: endDate },
      courseRevenue: {
        gross: grossCourseRevenue,
        platformFee: grossCourseRevenue * REVENUE_SHARE.COURSE.platform,
        net: grossCourseRevenue * REVENUE_SHARE.COURSE.mentor,
        breakdown: Array.from(courseBreakdown.values()),
      },
      creditRevenue: {
        gross: grossCreditRevenue,
        platformFee: grossCreditRevenue * REVENUE_SHARE.CREDIT.platform,
        net: grossCreditRevenue * REVENUE_SHARE.CREDIT.mentor,
        usage: creditUsage?.length || 0,
      },
      referralRevenue: {
        gross: grossReferralRevenue,
        platformFee: grossReferralRevenue * REVENUE_SHARE.REFERRAL.platform,
        net: grossReferralRevenue * REVENUE_SHARE.REFERRAL.mentor,
        referrals: referrals?.length || 0,
      },
      total: {
        gross: grossCourseRevenue + grossCreditRevenue + grossReferralRevenue,
        net:
          grossCourseRevenue * REVENUE_SHARE.COURSE.mentor +
          grossCreditRevenue * REVENUE_SHARE.CREDIT.mentor +
          grossReferralRevenue * REVENUE_SHARE.REFERRAL.mentor,
        pending: pendingAmount,
        paid: paidAmount,
      },
    }
  }

  /**
   * 정산 요청
   */
  async requestPayout(
    mentorId: string,
    amount: number,
    currency: 'KRW' | 'USD',
    method: 'bank_transfer' | 'paypal',
    bankInfo?: PayoutRequest['bankInfo']
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    const supabase = await getSupabase()

    // 최소 정산 금액 확인
    if (amount < MINIMUM_PAYOUT[currency]) {
      return {
        success: false,
        error: `최소 정산 금액은 ${MINIMUM_PAYOUT[currency].toLocaleString()} ${currency}입니다`,
      }
    }

    // 가용 잔액 확인
    const stats = await this.getStats(mentorId)
    if (amount > stats.pendingPayout) {
      return {
        success: false,
        error: '정산 가능 금액을 초과했습니다',
      }
    }

    // 정산 요청 생성
    const { data, error } = await supabase
      .from('payouts')
      .insert({
        mentor_id: mentorId,
        amount,
        currency,
        method,
        bank_info: bankInfo,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      safeLogger.error('[MentorService] Payout request failed', { error, mentorId })
      return { success: false, error: '정산 요청에 실패했습니다' }
    }

    safeLogger.info('[MentorService] Payout requested', {
      mentorId,
      payoutId: data.id,
      amount,
      currency,
    })

    return { success: true, payoutId: data.id }
  }

  /**
   * 정산 내역 조회
   */
  async getPayoutHistory(
    mentorId: string,
    limit = 10
  ): Promise<PayoutRequest[]> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (error) {
      safeLogger.error('[MentorService] Failed to get payout history', { error, mentorId })
      return []
    }

    return (data || []).map((p: {
      id: string
      mentor_id: string
      amount: number
      currency: 'KRW' | 'USD'
      method: 'bank_transfer' | 'paypal'
      bank_info: PayoutRequest['bankInfo']
      status: 'pending' | 'processing' | 'completed' | 'failed'
      requested_at: string
      processed_at: string | null
      transaction_id: string | null
    }) => ({
      id: p.id,
      mentorId: p.mentor_id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      bankInfo: p.bank_info,
      status: p.status,
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
      transactionId: p.transaction_id,
    }))
  }

  /**
   * 코스 목록 조회
   */
  async getCourses(mentorId: string): Promise<CourseInfo[]> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        price,
        currency,
        status,
        created_at,
        enrollments(count),
        reviews(rating)
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false })

    if (error) {
      safeLogger.error('[MentorService] Failed to get courses', { error, mentorId })
      return []
    }

    return (data || []).map((course: {
      id: string
      title: string
      description: string | null
      price: number
      currency: 'KRW' | 'USD'
      status: 'draft' | 'published' | 'archived'
      created_at: string
      enrollments: Array<{ count: number }>
      reviews: Array<{ rating: number }>
    }) => {
      const ratings = course.reviews?.map(r => r.rating) || []
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0

      return {
        id: course.id,
        title: course.title,
        description: course.description || '',
        price: course.price,
        currency: course.currency,
        enrollmentCount: course.enrollments?.[0]?.count || 0,
        completionRate: 0, // TODO: 계산 필요
        rating: Math.round(avgRating * 10) / 10,
        createdAt: course.created_at,
        status: course.status,
      }
    })
  }
}

// 싱글톤 인스턴스
export const mentorService = new MentorService()
