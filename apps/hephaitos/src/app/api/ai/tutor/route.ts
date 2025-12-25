// ============================================
// Tutor API
// QRY-018: AI 트레이딩 튜터
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { tutorQuestionSchema } from '@/lib/validations/ai'
import { safeLogger } from '@/lib/utils/safe-logger'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'
import { tutorService, LEARNING_PATHS } from '@/lib/tutor'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/tutor
 * Get learning paths, progress, recommendations
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

    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'paths'
    const level = searchParams.get('level')

    try {
      switch (type) {
        case 'paths': {
          const paths = tutorService.getLearningPaths(level || undefined)
          return createApiResponse({
            success: true,
            type: 'paths',
            paths,
          })
        }

        case 'progress': {
          if (!user) {
            return createApiResponse({ error: '로그인이 필요합니다' }, { status: 401 })
          }
          const progress = await tutorService.getProgress(user.id)
          return createApiResponse({
            success: true,
            type: 'progress',
            progress,
          })
        }

        case 'recommendations': {
          if (!user) {
            return createApiResponse({ error: '로그인이 필요합니다' }, { status: 401 })
          }
          const recommendations = await tutorService.getRecommendations(user.id)
          return createApiResponse({
            success: true,
            type: 'recommendations',
            recommendations,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown type' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Tutor API] GET error', { error, type })
      return createApiResponse({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/ai/tutor
 * Ask tutor question or update progress
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // 사용자 인증
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
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = user.id

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, { status: 400 })
    }

    const { action = 'ask' } = body

    safeLogger.info('[Tutor API] POST request', { userId, action })

    try {
      switch (action) {
        case 'ask': {
          // Validate question
          const validation = await validateRequestBody(request, tutorQuestionSchema)
          if ('error' in validation) {
            // Use body directly since we already parsed it
            if (!body.question) {
              return createApiResponse({ error: 'question is required' }, { status: 400 })
            }
          }

          const { question, context: questionContext, attachments } = body

          // P-1 CRITICAL: 크레딧 소비 (1 크레딧)
          try {
            await spendCredits({
              userId,
              feature: 'ai_tutor',
              amount: 1,
              metadata: {
                questionLength: question.length,
                hasContext: !!questionContext,
              },
            })
          } catch (error) {
            if (error instanceof InsufficientCreditsError) {
              safeLogger.warn('[Tutor API] Insufficient credits', {
                userId,
                required: error.required,
                current: error.current,
              })
              return createApiResponse(
                {
                  error: 'INSUFFICIENT_CREDITS',
                  message: '크레딧이 부족합니다',
                  required: error.required,
                  current: error.current,
                },
                { status: 402 }
              )
            }
            safeLogger.error('[Tutor API] Credit spend failed', { error })
            return createApiResponse(
              { error: '크레딧 처리 중 오류가 발생했습니다' },
              { status: 500 }
            )
          }

          // Get user level from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('experience_level')
            .eq('id', userId)
            .single()

          const userLevel = profile?.experience_level || 'beginner'

          // Call tutor service
          const response = await tutorService.ask({
            question,
            context: {
              userId,
              userLevel,
              ...questionContext,
            },
            attachments,
          })

          safeLogger.info('[Tutor API] Answer generated', {
            userId,
            confidence: response.confidence,
          })

          return createApiResponse({
            success: true,
            action: 'ask',
            response,
          })
        }

        case 'update_progress': {
          const { topicId, lessonId, timeSpent } = body

          if (!topicId || !lessonId) {
            return createApiResponse(
              { error: 'topicId and lessonId required' },
              { status: 400 }
            )
          }

          await tutorService.updateProgress(userId, topicId, lessonId, timeSpent || 0)

          return createApiResponse({
            success: true,
            action: 'update_progress',
            message: '학습 진행 상태가 업데이트되었습니다',
          })
        }

        case 'submit_quiz': {
          const { topicId, quizId, answer } = body

          if (!topicId || !quizId || answer === undefined) {
            return createApiResponse(
              { error: 'topicId, quizId, and answer required' },
              { status: 400 }
            )
          }

          const result = await tutorService.submitQuiz(userId, topicId, quizId, answer)

          return createApiResponse({
            success: true,
            action: 'submit_quiz',
            result,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown action' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Tutor API] POST error', { error, action })
      return createApiResponse({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)
