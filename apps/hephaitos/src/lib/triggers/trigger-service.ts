/**
 * Trigger Service
 * 트리거 관리 및 Supabase 연동 서비스
 */

import { createClient } from '@/lib/supabase/server'
import {
  getTriggerLoopEngine,
  type Trigger,
  type TriggerCondition,
  type TriggerAction,
  type TriggerType,
  type TriggerStatus,
} from './trigger-loop-engine'

// ============================================
// Types
// ============================================

export interface CreateTriggerInput {
  name: string
  userId: string
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  cooldown?: number
  maxExecutions?: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface UpdateTriggerInput {
  name?: string
  status?: TriggerStatus
  conditions?: TriggerCondition[]
  actions?: TriggerAction[]
  cooldown?: number
  maxExecutions?: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface TriggerFilter {
  userId?: string
  status?: TriggerStatus
  type?: TriggerType
}

// ============================================
// Service
// ============================================

export class TriggerService {
  private engine = getTriggerLoopEngine()

  /**
   * 트리거 생성
   */
  async createTrigger(input: CreateTriggerInput): Promise<Trigger> {
    const supabase = await createClient()

    const trigger: Trigger = {
      id: crypto.randomUUID(),
      name: input.name,
      userId: input.userId,
      status: 'active',
      conditions: input.conditions,
      actions: input.actions,
      cooldown: input.cooldown,
      maxExecutions: input.maxExecutions,
      executionCount: 0,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // DB에 저장
    const { error } = await supabase.from('triggers' as any).insert({
      id: trigger.id,
      user_id: trigger.userId,
      name: trigger.name,
      status: trigger.status,
      conditions: trigger.conditions,
      actions: trigger.actions,
      cooldown: trigger.cooldown,
      max_executions: trigger.maxExecutions,
      execution_count: trigger.executionCount,
      expires_at: trigger.expiresAt?.toISOString(),
      metadata: trigger.metadata,
      created_at: trigger.createdAt.toISOString(),
      updated_at: trigger.updatedAt.toISOString(),
    } as any)

    if (error) {
      throw new Error(`Failed to create trigger: ${error.message}`)
    }

    // 엔진에 등록
    this.engine.registerTrigger(trigger)

    return trigger
  }

  /**
   * 트리거 조회
   */
  async getTrigger(triggerId: string): Promise<Trigger | null> {
    // 먼저 메모리에서 확인
    const cached = this.engine.getTrigger(triggerId)
    if (cached) return cached

    // DB에서 로드
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('triggers' as any)
      .select('*')
      .eq('id', triggerId)
      .single()

    if (error || !data) return null

    return this.mapDbToTrigger(data)
  }

  /**
   * 트리거 목록 조회
   */
  async listTriggers(filter: TriggerFilter = {}): Promise<Trigger[]> {
    const supabase = await createClient()

    let query = supabase.from('triggers' as any).select('*')

    if (filter.userId) {
      query = query.eq('user_id', filter.userId)
    }

    if (filter.status) {
      query = query.eq('status', filter.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list triggers: ${error.message}`)
    }

    return (data || []).map((d: any) => this.mapDbToTrigger(d))
  }

  /**
   * 트리거 업데이트
   */
  async updateTrigger(triggerId: string, input: UpdateTriggerInput): Promise<Trigger> {
    const supabase = await createClient()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) updates.name = input.name
    if (input.status !== undefined) updates.status = input.status
    if (input.conditions !== undefined) updates.conditions = input.conditions
    if (input.actions !== undefined) updates.actions = input.actions
    if (input.cooldown !== undefined) updates.cooldown = input.cooldown
    if (input.maxExecutions !== undefined) updates.max_executions = input.maxExecutions
    if (input.expiresAt !== undefined) updates.expires_at = input.expiresAt?.toISOString()
    if (input.metadata !== undefined) updates.metadata = input.metadata

    const { data, error } = await supabase
      .from('triggers' as any)
      .update(updates as any)
      .eq('id', triggerId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update trigger: ${error.message}`)
    }

    const trigger = this.mapDbToTrigger(data)

    // 엔진 업데이트
    if (input.status === 'active') {
      this.engine.registerTrigger(trigger)
    } else if (input.status === 'paused' || input.status === 'expired') {
      this.engine.unregisterTrigger(triggerId)
    } else {
      this.engine.updateTrigger(triggerId, input)
    }

    return trigger
  }

  /**
   * 트리거 삭제
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('triggers' as any)
      .delete()
      .eq('id', triggerId)

    if (error) {
      throw new Error(`Failed to delete trigger: ${error.message}`)
    }

    this.engine.unregisterTrigger(triggerId)
  }

  /**
   * 트리거 활성화
   */
  async activateTrigger(triggerId: string): Promise<Trigger> {
    return this.updateTrigger(triggerId, { status: 'active' })
  }

  /**
   * 트리거 일시정지
   */
  async pauseTrigger(triggerId: string): Promise<Trigger> {
    return this.updateTrigger(triggerId, { status: 'paused' })
  }

  /**
   * 사용자의 모든 활성 트리거 로드
   */
  async loadUserTriggers(userId: string): Promise<void> {
    const triggers = await this.listTriggers({ userId, status: 'active' })

    for (const trigger of triggers) {
      this.engine.registerTrigger(trigger)
    }

    console.log(`[TriggerService] Loaded ${triggers.length} triggers for user ${userId}`)
  }

  /**
   * 엔진 시작
   */
  startEngine(): void {
    this.engine.start()
  }

  /**
   * 엔진 정지
   */
  stopEngine(): void {
    this.engine.stop()
  }

  /**
   * 엔진 상태 조회
   */
  getEngineStats() {
    return this.engine.getStats()
  }

  /**
   * DB 데이터를 Trigger 객체로 변환
   */
  private mapDbToTrigger(data: any): Trigger {
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      status: data.status,
      conditions: data.conditions || [],
      actions: data.actions || [],
      cooldown: data.cooldown,
      maxExecutions: data.max_executions,
      executionCount: data.execution_count || 0,
      lastTriggeredAt: data.last_triggered_at ? new Date(data.last_triggered_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// ============================================
// Singleton
// ============================================

let serviceInstance: TriggerService | null = null

export function getTriggerService(): TriggerService {
  if (!serviceInstance) {
    serviceInstance = new TriggerService()
  }
  return serviceInstance
}
