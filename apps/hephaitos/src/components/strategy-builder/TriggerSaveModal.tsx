/**
 * Trigger Save Modal
 * 전략을 트리거로 저장하는 모달
 */

'use client'

import { useState, useMemo } from 'react'
import { type Node, type Edge } from 'reactflow'
import { XMarkIcon, BoltIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTriggers } from '@/hooks/use-triggers'
import type { TriggerCondition, TriggerAction } from '@/lib/triggers'

interface TriggerSaveModalProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  strategyName: string
}

export function TriggerSaveModal({
  isOpen,
  onClose,
  nodes,
  edges,
  strategyName,
}: TriggerSaveModalProps) {
  const { createTrigger, loading } = useTriggers()
  const [name, setName] = useState(strategyName + ' 트리거')
  const [cooldownMinutes, setCooldownMinutes] = useState(5)
  const [maxExecutions, setMaxExecutions] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 노드를 트리거 조건/액션으로 변환
  const { conditions, actions } = useMemo(() => {
    const conditions: TriggerCondition[] = []
    const actions: TriggerAction[] = []

    nodes.forEach(node => {
      const config = node.data?.config || {}

      switch (node.type) {
        case 'trigger':
          // 트리거 노드 → 조건으로 변환
          const triggerType = config.type as string
          if (triggerType === 'price_cross' || triggerType === 'price_above') {
            conditions.push({
              type: 'price_cross',
              params: {
                symbol: config.symbol || 'BTCUSDT',
                threshold: config.price || 0,
                direction: 'above',
              },
            })
          } else if (triggerType === 'price_below') {
            conditions.push({
              type: 'price_cross',
              params: {
                symbol: config.symbol || 'BTCUSDT',
                threshold: config.price || 0,
                direction: 'below',
              },
            })
          } else if (triggerType === 'time') {
            conditions.push({
              type: 'time_based',
              params: {
                schedule: config.schedule || '09:00',
              },
            })
          } else if (triggerType === 'volume') {
            conditions.push({
              type: 'volume_spike',
              params: {
                multiplier: config.multiplier || 2,
                baseline: config.baseline || 1000000,
              },
            })
          }
          break

        case 'indicator':
          // 인디케이터 노드 → 조건으로 변환
          const indicator = config.indicator as string
          if (indicator && config.value !== undefined) {
            conditions.push({
              type: 'indicator_signal',
              params: {
                indicator: indicator,
                value: config.value,
                operator: config.operator || '>',
              },
            })
          }
          break

        case 'condition':
          // 조건 노드 → 조건으로 변환
          if (config.type === 'portfolio') {
            conditions.push({
              type: 'portfolio_change',
              params: {
                metric: config.metric || 'pnl',
                threshold: config.threshold || 0,
                direction: config.direction || 'above',
              },
            })
          }
          break

        case 'action':
          // 액션 노드 → 액션으로 변환
          const actionType = config.type as string
          if (actionType === 'buy' || actionType === 'sell') {
            actions.push({
              type: 'place_order',
              params: {
                symbol: config.symbol || 'BTCUSDT',
                side: actionType,
                quantity: config.quantity || 0.01,
                orderType: config.orderType || 'market',
              },
            })
          } else if (actionType === 'notify') {
            actions.push({
              type: 'send_notification',
              params: {
                type: 'push',
                title: config.title || '전략 알림',
                message: config.message || '조건이 충족되었습니다',
              },
            })
          }
          break

        case 'risk':
          // 리스크 노드 → 조건으로 변환
          if (config.maxDrawdown) {
            conditions.push({
              type: 'risk_threshold',
              params: {
                riskMetric: 'drawdown',
                maxValue: config.maxDrawdown,
              },
            })
          }
          break
      }
    })

    // 기본 알림 액션 추가 (액션이 없는 경우)
    if (actions.length === 0) {
      actions.push({
        type: 'send_notification',
        params: {
          type: 'push',
          title: name,
          message: '트리거 조건이 충족되었습니다',
        },
      })
    }

    return { conditions, actions }
  }, [nodes, name])

  const handleSave = async () => {
    setError(null)

    if (!name.trim()) {
      setError('트리거 이름을 입력해주세요')
      return
    }

    if (conditions.length === 0) {
      setError('최소 하나의 트리거 조건이 필요합니다. 트리거 또는 인디케이터 노드를 추가해주세요.')
      return
    }

    const result = await createTrigger({
      name: name.trim(),
      conditions,
      actions,
      cooldown: cooldownMinutes * 60 * 1000, // ms로 변환
      maxExecutions: maxExecutions,
      metadata: {
        sourceStrategy: strategyName,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    })

    if (result) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)
    } else {
      setError('트리거 저장에 실패했습니다')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <BoltIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">트리거로 저장</h3>
              <p className="text-xs text-zinc-500">전략을 자동 실행 트리거로 변환</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.04] rounded transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <PlayIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-white font-medium">트리거가 저장되었습니다!</p>
              <p className="text-sm text-zinc-400 mt-1">자동으로 활성화되었습니다</p>
            </div>
          ) : (
            <>
              {/* 트리거 이름 */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">트리거 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                  placeholder="예: BTC 10만불 돌파 알림"
                />
              </div>

              {/* 변환 결과 미리보기 */}
              <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/[0.04]">
                <h4 className="text-xs font-medium text-zinc-400 mb-3">변환 결과</h4>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">조건 ({conditions.length}개)</p>
                    {conditions.length > 0 ? (
                      <ul className="space-y-1">
                        {conditions.map((c, i) => (
                          <li key={i} className="text-xs text-zinc-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            {c.type} - {JSON.stringify(c.params).slice(0, 50)}...
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-zinc-600">조건 없음</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500 mb-1">액션 ({actions.length}개)</p>
                    <ul className="space-y-1">
                      {actions.map((a, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {a.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 쿨다운 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    <ClockIcon className="w-3 h-3 inline mr-1" />
                    재실행 대기 (분)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">최대 실행 횟수</label>
                  <input
                    type="number"
                    min={1}
                    value={maxExecutions || ''}
                    onChange={(e) => setMaxExecutions(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="무제한"
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={loading || conditions.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <BoltIcon className="w-4 h-4" />
                  트리거 저장
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
