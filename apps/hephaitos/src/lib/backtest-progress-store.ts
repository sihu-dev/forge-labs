/**
 * 백테스트 진행 상황 저장소
 * 인메모리 저장소로 백테스트 실행 중 진행 상황을 추적
 *
 * NOTE: 프로덕션 환경에서는 Redis 또는 다른 영속적 저장소 사용 권장
 */

export interface BacktestProgressData {
  backtestId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number // 0-100
  message: string
  currentStep?: string
  totalSteps?: number
  currentStepIndex?: number
  estimatedTimeRemaining?: number // seconds
  startedAt: number // timestamp
  lastUpdatedAt: number // timestamp
  error?: string
}

class BacktestProgressStore {
  private store = new Map<string, BacktestProgressData>()
  private readonly TTL = 1000 * 60 * 30 // 30 minutes

  /**
   * 새로운 백테스트 진행 상황 초기화
   */
  initialize(backtestId: string): void {
    this.store.set(backtestId, {
      backtestId,
      status: 'pending',
      progress: 0,
      message: '백테스트 시작 중...',
      totalSteps: 5,
      currentStepIndex: 0,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    })
  }

  /**
   * 진행 상황 업데이트
   */
  update(
    backtestId: string,
    updates: Partial<Omit<BacktestProgressData, 'backtestId' | 'startedAt'>>
  ): void {
    const existing = this.store.get(backtestId)
    if (!existing) {
      console.warn(`[BacktestProgressStore] Backtest ${backtestId} not found`)
      return
    }

    this.store.set(backtestId, {
      ...existing,
      ...updates,
      lastUpdatedAt: Date.now(),
    })
  }

  /**
   * 진행 상황 조회
   */
  get(backtestId: string): BacktestProgressData | null {
    const data = this.store.get(backtestId)
    if (!data) return null

    // TTL 체크
    if (Date.now() - data.lastUpdatedAt > this.TTL) {
      this.store.delete(backtestId)
      return null
    }

    return data
  }

  /**
   * 완료 처리
   */
  markCompleted(backtestId: string, message = '백테스트가 완료되었습니다'): void {
    this.update(backtestId, {
      status: 'completed',
      progress: 100,
      message,
      currentStepIndex: 5,
    })
  }

  /**
   * 실패 처리
   */
  markFailed(backtestId: string, error: string): void {
    this.update(backtestId, {
      status: 'failed',
      message: '백테스트 실행 중 오류가 발생했습니다',
      error,
    })
  }

  /**
   * 삭제
   */
  delete(backtestId: string): void {
    this.store.delete(backtestId)
  }

  /**
   * 오래된 항목 정리
   */
  cleanup(): void {
    const now = Date.now()
    for (const [backtestId, data] of this.store.entries()) {
      if (now - data.lastUpdatedAt > this.TTL) {
        this.store.delete(backtestId)
      }
    }
  }
}

// 싱글톤 인스턴스
export const backtestProgressStore = new BacktestProgressStore()

// 주기적으로 오래된 항목 정리 (5분마다)
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  setInterval(() => {
    backtestProgressStore.cleanup()
  }, 1000 * 60 * 5)
}
