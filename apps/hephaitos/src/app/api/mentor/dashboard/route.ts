/**
 * Mentor Dashboard API
 * QRY-022: 멘토 대시보드 엔드포인트
 *
 * ⚠️ 면책조항: 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, ApiError } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { mentorService, REVENUE_SHARE } from '@/lib/mentor'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentor/dashboard
 * 멘토 대시보드 데이터 조회
 *
 * Query params:
 * - type: profile | stats | students | courses | earnings
 * - period: 기간 (earnings용)
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    try {
      switch (type) {
        case 'profile': {
          const profile = await mentorService.getProfile(user.id)
          return createApiResponse({
            success: true,
            profile,
          })
        }

        case 'stats': {
          const stats = await mentorService.getStats(user.id)
          return createApiResponse({
            success: true,
            stats,
          })
        }

        case 'students': {
          const status = searchParams.get('status') as 'active' | 'inactive' | 'completed' | null
          const courseId = searchParams.get('courseId')
          const limit = parseInt(searchParams.get('limit') || '20', 10)
          const offset = parseInt(searchParams.get('offset') || '0', 10)

          const { students, total } = await mentorService.getStudents(user.id, {
            status: status || undefined,
            courseId: courseId || undefined,
            limit,
            offset,
          })

          return createApiResponse({
            success: true,
            students,
            total,
            pagination: {
              limit,
              offset,
              hasMore: offset + students.length < total,
            },
          })
        }

        case 'courses': {
          const courses = await mentorService.getCourses(user.id)
          return createApiResponse({
            success: true,
            courses,
          })
        }

        case 'earnings': {
          const period = searchParams.get('period') || 'month'
          const now = new Date()
          let startDate: Date

          switch (period) {
            case 'week':
              startDate = new Date(now.setDate(now.getDate() - 7))
              break
            case 'quarter':
              startDate = new Date(now.setMonth(now.getMonth() - 3))
              break
            case 'year':
              startDate = new Date(now.setFullYear(now.getFullYear() - 1))
              break
            case 'all':
              startDate = new Date('2020-01-01')
              break
            default: // month
              startDate = new Date(now.setMonth(now.getMonth() - 1))
          }

          const earnings = await mentorService.getEarningsReport(
            user.id,
            startDate.toISOString(),
            new Date().toISOString()
          )

          return createApiResponse({
            success: true,
            earnings,
            revenueShare: REVENUE_SHARE,
          })
        }

        case 'payouts': {
          const payouts = await mentorService.getPayoutHistory(user.id, 20)
          return createApiResponse({
            success: true,
            payouts,
          })
        }

        case 'overview':
        default: {
          // 전체 개요 조회
          const [profile, stats, earnings] = await Promise.all([
            mentorService.getProfile(user.id),
            mentorService.getStats(user.id),
            mentorService.getEarningsReport(
              user.id,
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              new Date().toISOString()
            ),
          ])

          return createApiResponse({
            success: true,
            overview: {
              profile,
              stats,
              recentEarnings: earnings,
            },
            revenueShare: REVENUE_SHARE,
          })
        }
      }
    } catch (error) {
      safeLogger.error('[Mentor Dashboard API] Error', { error, type })
      throw new ApiError('데이터 조회에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/mentor/dashboard
 * 멘토 프로필 업데이트 / 정산 요청
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, { status: 400 })
    }

    const { action } = body

    try {
      switch (action) {
        case 'update_profile': {
          const { displayName, bio, socialLinks, specialties, experienceYears } = body

          const success = await mentorService.updateProfile(user.id, {
            displayName,
            bio,
            socialLinks,
            specialties,
            experienceYears,
          })

          if (!success) {
            return createApiResponse({ error: '프로필 업데이트에 실패했습니다' }, { status: 500 })
          }

          const profile = await mentorService.getProfile(user.id)

          return createApiResponse({
            success: true,
            profile,
            message: '프로필이 업데이트되었습니다',
          })
        }

        case 'request_payout': {
          const { amount, currency, method, bankInfo } = body

          if (!amount || !currency || !method) {
            return createApiResponse(
              { error: 'amount, currency, method are required' },
              { status: 400 }
            )
          }

          if (method === 'bank_transfer' && !bankInfo) {
            return createApiResponse(
              { error: 'bankInfo is required for bank transfer' },
              { status: 400 }
            )
          }

          const result = await mentorService.requestPayout(
            user.id,
            amount,
            currency,
            method,
            bankInfo
          )

          if (!result.success) {
            return createApiResponse({ error: result.error }, { status: 400 })
          }

          return createApiResponse({
            success: true,
            payoutId: result.payoutId,
            message: '정산 요청이 접수되었습니다',
          })
        }

        default:
          return createApiResponse({ error: 'Unknown action' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Mentor Dashboard API] POST error', { error, action })
      throw new ApiError('요청 처리에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)
