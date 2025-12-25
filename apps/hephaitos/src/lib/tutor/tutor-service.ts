/**
 * AI Tutor Service
 * QRY-018: 트레이딩 교육 AI 튜터
 *
 * COPY → LEARN → BUILD 워크플로우의 LEARN 단계 지원
 */

import { createClient } from '@/lib/supabase/server'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface TutorContext {
  userId: string
  currentTopic?: string
  strategyId?: string
  backtestId?: string
  celebrityId?: string
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  learningPath?: string[]
  recentQuestions?: string[]
}

export interface TutorQuestion {
  question: string
  context?: TutorContext
  attachments?: {
    type: 'strategy' | 'backtest' | 'chart' | 'trade'
    data: Record<string, unknown>
  }[]
}

export interface TutorResponse {
  answer: string
  explanation?: string
  sources?: TutorSource[]
  relatedTopics?: string[]
  nextSteps?: string[]
  quiz?: TutorQuiz
  confidence: number
}

export interface TutorSource {
  title: string
  type: 'article' | 'video' | 'documentation' | 'example'
  url?: string
  relevance: number
}

export interface TutorQuiz {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface LearningProgress {
  userId: string
  topicId: string
  topicName: string
  progress: number // 0-100
  completedLessons: string[]
  quizScores: { quizId: string; score: number; date: Date }[]
  lastStudied: Date
  totalTimeSpent: number // minutes
}

export interface LearningPath {
  id: string
  name: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  topics: LearningTopic[]
  estimatedHours: number
}

export interface LearningTopic {
  id: string
  name: string
  description: string
  order: number
  lessons: string[]
  prerequisites?: string[]
}

// ============================================
// Learning Paths
// ============================================

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'trading_basics',
    name: '트레이딩 기초',
    description: '주식/암호화폐 트레이딩의 기본 개념 이해',
    level: 'beginner',
    estimatedHours: 8,
    topics: [
      { id: 'market_basics', name: '시장 기초', description: '주식/암호화폐 시장의 구조', order: 1, lessons: ['lesson_1_1', 'lesson_1_2', 'lesson_1_3'] },
      { id: 'order_types', name: '주문 유형', description: '시장가, 지정가, 스탑 주문', order: 2, lessons: ['lesson_2_1', 'lesson_2_2'], prerequisites: ['market_basics'] },
      { id: 'risk_basics', name: '리스크 관리 기초', description: '손절, 포지션 사이징', order: 3, lessons: ['lesson_3_1', 'lesson_3_2'], prerequisites: ['order_types'] },
    ],
  },
  {
    id: 'technical_analysis',
    name: '기술적 분석',
    description: '차트 패턴과 기술 지표 활용법',
    level: 'intermediate',
    estimatedHours: 15,
    topics: [
      { id: 'chart_patterns', name: '차트 패턴', description: '캔들, 추세선, 지지/저항', order: 1, lessons: ['lesson_4_1', 'lesson_4_2', 'lesson_4_3'] },
      { id: 'indicators', name: '기술 지표', description: 'RSI, MACD, 볼린저 밴드', order: 2, lessons: ['lesson_5_1', 'lesson_5_2', 'lesson_5_3'], prerequisites: ['chart_patterns'] },
      { id: 'strategy_building', name: '전략 구축', description: '지표 조합과 백테스팅', order: 3, lessons: ['lesson_6_1', 'lesson_6_2'], prerequisites: ['indicators'] },
    ],
  },
  {
    id: 'quant_trading',
    name: '퀀트 트레이딩',
    description: '시스템 트레이딩과 자동화',
    level: 'advanced',
    estimatedHours: 20,
    topics: [
      { id: 'backtest_deep', name: '백테스팅 심화', description: '과최적화 방지, 워크포워드', order: 1, lessons: ['lesson_7_1', 'lesson_7_2'] },
      { id: 'algo_strategies', name: '알고리즘 전략', description: '모멘텀, 평균회귀, 차익거래', order: 2, lessons: ['lesson_8_1', 'lesson_8_2', 'lesson_8_3'], prerequisites: ['backtest_deep'] },
      { id: 'risk_advanced', name: '고급 리스크 관리', description: 'VaR, 포트폴리오 최적화', order: 3, lessons: ['lesson_9_1', 'lesson_9_2'], prerequisites: ['algo_strategies'] },
    ],
  },
]

// ============================================
// Topic Knowledge Base
// ============================================

const TOPIC_KNOWLEDGE: Record<string, { keywords: string[]; systemPrompt: string }> = {
  rsi: {
    keywords: ['rsi', '상대강도', '과매수', '과매도', '70', '30'],
    systemPrompt: `RSI(상대강도지수) 전문가로서 답변합니다.
- RSI는 0-100 사이의 값으로, 70 이상은 과매수, 30 이하는 과매도를 나타냅니다.
- 기본 기간은 14이며, 단기 트레이딩에는 9, 장기에는 21을 사용하기도 합니다.
- RSI 다이버전스는 강력한 반전 신호입니다.
- 항상 면책조항을 포함하고, 투자 조언이 아닌 교육 목적임을 명시하세요.`,
  },
  macd: {
    keywords: ['macd', '이동평균', '수렴', '발산', '히스토그램', '시그널'],
    systemPrompt: `MACD(이동평균수렴발산) 전문가로서 답변합니다.
- MACD = 12일 EMA - 26일 EMA
- 시그널선은 MACD의 9일 EMA입니다.
- MACD가 시그널선 위로 교차하면 매수 신호, 아래로 교차하면 매도 신호입니다.
- 항상 면책조항을 포함하세요.`,
  },
  bollinger: {
    keywords: ['볼린저', 'bollinger', '밴드', '표준편차', '스퀴즈'],
    systemPrompt: `볼린저 밴드 전문가로서 답변합니다.
- 중심선은 20일 이동평균, 상/하단은 ±2 표준편차입니다.
- 밴드 수축(스퀴즈)은 변동성 증가 신호입니다.
- 가격이 상단을 터치하면 과매수, 하단을 터치하면 과매도입니다.
- 면책조항을 포함하세요.`,
  },
  risk: {
    keywords: ['리스크', '손절', '스탑로스', '포지션', '자금관리', 'risk'],
    systemPrompt: `리스크 관리 전문가로서 답변합니다.
- 1% 규칙: 단일 거래에서 계좌의 1% 이상 손실하지 않습니다.
- 손절가는 진입 전에 설정해야 합니다.
- 리스크/리워드 비율은 최소 1:2를 권장합니다.
- 교육 목적임을 명시하세요.`,
  },
  backtest: {
    keywords: ['백테스트', 'backtest', '시뮬레이션', '과최적화', '샤프'],
    systemPrompt: `백테스팅 전문가로서 답변합니다.
- 백테스트는 과거 데이터로 전략을 검증하는 방법입니다.
- 과최적화(overfitting)를 주의해야 합니다.
- 슬리피지와 수수료를 반드시 고려해야 합니다.
- 과거 성과가 미래 수익을 보장하지 않습니다.`,
  },
}

// ============================================
// Tutor Service
// ============================================

export class TutorService {
  /**
   * Process tutor question and generate response
   */
  async ask(question: TutorQuestion): Promise<TutorResponse> {
    const { question: text, context, attachments } = question

    // Detect topic from question
    const detectedTopic = this.detectTopic(text)

    // Build context-aware prompt
    const systemPrompt = this.buildSystemPrompt(detectedTopic, context)
    const userPrompt = this.buildUserPrompt(text, attachments)

    try {
      // Call Claude API
      const response = await this.callClaude(systemPrompt, userPrompt)

      // Parse and structure response
      const structured = this.parseResponse(response, detectedTopic)

      // Save to history
      if (context?.userId) {
        await this.saveToHistory(context.userId, text, structured)
      }

      return structured
    } catch (error) {
      safeLogger.error('[TutorService] Failed to generate response', { error })
      return this.getFallbackResponse(text, detectedTopic)
    }
  }

  /**
   * Get learning paths for user level
   */
  getLearningPaths(level?: string): LearningPath[] {
    if (!level) return LEARNING_PATHS
    return LEARNING_PATHS.filter(p => p.level === level)
  }

  /**
   * Get user's learning progress
   */
  async getProgress(userId: string): Promise<LearningProgress[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)

    if (error || !data) return []

    return data.map(this.mapProgress)
  }

  /**
   * Update learning progress
   */
  async updateProgress(
    userId: string,
    topicId: string,
    lessonId: string,
    timeSpent: number
  ): Promise<void> {
    const supabase = await createClient()

    // Get current progress
    const { data: current } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single()

    const completedLessons = current?.completed_lessons || []
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }

    // Calculate progress percentage
    const topic = this.findTopic(topicId)
    const totalLessons = topic?.lessons.length || 1
    const progress = Math.round((completedLessons.length / totalLessons) * 100)

    await supabase.from('learning_progress').upsert({
      user_id: userId,
      topic_id: topicId,
      topic_name: topic?.name || topicId,
      progress,
      completed_lessons: completedLessons,
      total_time_spent: (current?.total_time_spent || 0) + timeSpent,
      last_studied: new Date().toISOString(),
    })

    // Record analytics
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'learning_progress',
      metadata: { topicId, lessonId, progress, timeSpent },
    })
  }

  /**
   * Submit quiz answer and get feedback
   */
  async submitQuiz(
    userId: string,
    topicId: string,
    quizId: string,
    answer: number
  ): Promise<{ correct: boolean; explanation: string; score: number }> {
    // For now, generate a quiz response
    // In production, this would fetch from a quiz database
    const correct = answer === 0 // Placeholder

    const supabase = await createClient()

    // Update quiz scores
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('quiz_scores')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single()

    const quizScores = progress?.quiz_scores || []
    quizScores.push({
      quiz_id: quizId,
      score: correct ? 100 : 0,
      date: new Date().toISOString(),
    })

    await supabase
      .from('learning_progress')
      .update({ quiz_scores: quizScores })
      .eq('user_id', userId)
      .eq('topic_id', topicId)

    return {
      correct,
      explanation: correct
        ? '정답입니다! 잘 이해하고 계시네요.'
        : '아쉽지만 틀렸습니다. 위 설명을 다시 읽어보세요.',
      score: correct ? 100 : 0,
    }
  }

  /**
   * Get recommended next topics based on progress
   */
  async getRecommendations(userId: string): Promise<LearningTopic[]> {
    const progress = await this.getProgress(userId)
    const completedTopics = new Set(progress.filter(p => p.progress >= 80).map(p => p.topicId))

    const recommendations: LearningTopic[] = []

    for (const path of LEARNING_PATHS) {
      for (const topic of path.topics) {
        // Skip completed topics
        if (completedTopics.has(topic.id)) continue

        // Check prerequisites
        const prereqsMet = !topic.prerequisites ||
          topic.prerequisites.every(p => completedTopics.has(p))

        if (prereqsMet) {
          recommendations.push(topic)
        }
      }
    }

    return recommendations.slice(0, 5)
  }

  // ============================================
  // Private Methods
  // ============================================

  private detectTopic(text: string): string {
    const lower = text.toLowerCase()

    for (const [topic, config] of Object.entries(TOPIC_KNOWLEDGE)) {
      if (config.keywords.some(kw => lower.includes(kw))) {
        return topic
      }
    }

    return 'general'
  }

  private buildSystemPrompt(topic: string, context?: TutorContext): string {
    const basePrompt = `당신은 HEPHAITOS의 AI 트레이딩 튜터입니다.

## 역할
- 트레이딩과 투자에 대해 교육하는 전문 튜터
- COPY → LEARN → BUILD 워크플로우의 LEARN 단계 지원
- 친절하고 명확하게 설명하며, 예시를 활용

## 중요 규칙
1. 절대 투자 조언을 하지 마세요. "~하세요" 같은 권유형 표현 금지
2. 항상 교육 목적임을 명시하세요
3. "~할 수 있습니다", "~한 특징이 있습니다" 같은 설명형 사용
4. 모든 응답 끝에 면책조항 포함

## 면책조항
*이 정보는 교육 목적으로만 제공되며, 투자 조언이 아닙니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.*`

    const topicPrompt = TOPIC_KNOWLEDGE[topic]?.systemPrompt || ''

    const contextPrompt = context ? `

## 사용자 컨텍스트
- 레벨: ${context.userLevel}
- 현재 주제: ${context.currentTopic || '일반'}` : ''

    return `${basePrompt}\n\n${topicPrompt}${contextPrompt}`
  }

  private buildUserPrompt(
    question: string,
    attachments?: TutorQuestion['attachments']
  ): string {
    let prompt = question

    if (attachments?.length) {
      prompt += '\n\n## 첨부 정보:\n'
      for (const att of attachments) {
        prompt += `\n### ${att.type}:\n${JSON.stringify(att.data, null, 2)}`
      }
    }

    return prompt
  }

  private async callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    // Use Anthropic SDK or Vercel AI SDK
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error('Claude API call failed')
    }

    const data = await response.json()
    return data.content || data.text || ''
  }

  private parseResponse(response: string, topic: string): TutorResponse {
    // Extract structured data from response
    const relatedTopics = this.extractRelatedTopics(response, topic)
    const nextSteps = this.extractNextSteps(response)

    return {
      answer: response,
      relatedTopics,
      nextSteps,
      sources: this.getSources(topic),
      confidence: 0.85,
    }
  }

  private extractRelatedTopics(response: string, currentTopic: string): string[] {
    const topics: string[] = []

    for (const [topic, config] of Object.entries(TOPIC_KNOWLEDGE)) {
      if (topic === currentTopic) continue
      if (config.keywords.some(kw => response.toLowerCase().includes(kw))) {
        topics.push(topic)
      }
    }

    return topics.slice(0, 3)
  }

  private extractNextSteps(_response: string): string[] {
    return [
      '이 개념을 실제 차트에서 확인해보세요',
      '데모 계좌에서 연습해보세요',
      '관련 퀴즈를 풀어보세요',
    ]
  }

  private getSources(topic: string): TutorSource[] {
    const sources: TutorSource[] = [
      { title: 'HEPHAITOS 기술 분석 가이드', type: 'documentation', relevance: 0.9 },
    ]

    if (topic === 'rsi' || topic === 'macd' || topic === 'bollinger') {
      sources.push({
        title: '기술 지표 완벽 가이드',
        type: 'article',
        relevance: 0.85,
      })
    }

    return sources
  }

  private getFallbackResponse(question: string, topic: string): TutorResponse {
    return {
      answer: `질문을 처리하는 중 문제가 발생했습니다.

${topic !== 'general' ? `${topic.toUpperCase()}에 대해 알고 싶으시다면, 다음을 참고해보세요:` : '다음을 참고해보세요:'}

1. HEPHAITOS 학습 센터에서 관련 강의를 찾아보세요
2. 전략 빌더에서 직접 지표를 테스트해보세요
3. 백테스트를 통해 전략을 검증해보세요

*이 정보는 교육 목적으로만 제공되며, 투자 조언이 아닙니다.*`,
      confidence: 0.5,
      relatedTopics: [topic],
      nextSteps: ['학습 센터 방문', '전략 빌더 사용'],
    }
  }

  private async saveToHistory(userId: string, question: string, response: TutorResponse): Promise<void> {
    const supabase = await createClient()

    await supabase.from('tutor_history').insert({
      user_id: userId,
      question,
      answer: response.answer,
      related_topics: response.relatedTopics,
      confidence: response.confidence,
    }).catch(() => {})
  }

  private findTopic(topicId: string): LearningTopic | undefined {
    for (const path of LEARNING_PATHS) {
      const topic = path.topics.find(t => t.id === topicId)
      if (topic) return topic
    }
    return undefined
  }

  private mapProgress(data: Record<string, unknown>): LearningProgress {
    return {
      userId: data.user_id as string,
      topicId: data.topic_id as string,
      topicName: data.topic_name as string,
      progress: data.progress as number,
      completedLessons: (data.completed_lessons as string[]) || [],
      quizScores: (data.quiz_scores as LearningProgress['quizScores']) || [],
      lastStudied: new Date(data.last_studied as string),
      totalTimeSpent: data.total_time_spent as number,
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const tutorService = new TutorService()
