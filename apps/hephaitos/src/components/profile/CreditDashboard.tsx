/**
 * Credit Dashboard Component
 * 크레딧 잔액 및 거래 내역 표시
 */

'use client'

import { useState } from 'react'
import { useCredits } from '@/hooks/use-credits'
import {
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { CreditPurchaseModal } from '@/components/credits/CreditPurchaseModal'

interface CreditDashboardProps {
  userId: string
  initialBalance: number
}

export function CreditDashboard({
  userId,
  initialBalance,
}: CreditDashboardProps) {
  const { balance, transactions, loading } = useCredits()
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const displayBalance = balance !== null ? balance : initialBalance

  return (
    <>
      <div className="space-y-4">
        {/* Credit Balance Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-300">크레딧 잔액</h3>
            <BanknotesIcon className="w-5 h-5 text-blue-400" />
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-white mb-1">
              {displayBalance.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-400">크레딧</div>
          </div>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            크레딧 구매
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
          <h3 className="text-sm font-medium text-white mb-4">최근 거래 내역</h3>

          {loading ? (
            <div className="text-sm text-zinc-400 text-center py-8">
              로딩 중...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-sm text-zinc-400 text-center py-8">
              거래 내역이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between p-3 bg-white/[0.02] rounded"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {tx.amount > 0 ? (
                        <ArrowUpIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-zinc-300 truncate">
                        {tx.description || getTransactionTypeLabel(tx.type)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(tx.created_at).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div
                    className={
                      'text-sm font-medium flex-shrink-0 ml-2 ' +
                      (tx.amount > 0 ? 'text-emerald-400' : 'text-red-400')
                    }
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {transactions.length > 5 && (
            <button className="w-full mt-4 h-8 px-3 border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 rounded text-xs transition-colors">
              전체 내역 보기
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-1">이번 달 사용</div>
            <div className="text-lg font-bold text-white">
              {calculateMonthlyUsage(transactions)}
            </div>
          </div>

          <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-1">총 구매</div>
            <div className="text-lg font-bold text-white">
              {calculateTotalPurchased(transactions)}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  )
}

function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case 'purchase':
      return '크레딧 구매'
    case 'usage':
      return '크레딧 사용'
    case 'bonus':
      return '보너스 크레딧'
    case 'refund':
      return '환불'
    default:
      return '거래'
  }
}

function calculateMonthlyUsage(transactions: any[]): string {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const usage = transactions
    .filter(
      (tx) =>
        tx.type === 'usage' && new Date(tx.created_at) >= monthStart
    )
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  return usage.toLocaleString()
}

function calculateTotalPurchased(transactions: any[]): string {
  const purchased = transactions
    .filter((tx) => tx.type === 'purchase' || tx.type === 'bonus')
    .reduce((sum, tx) => sum + tx.amount, 0)

  return purchased.toLocaleString()
}
