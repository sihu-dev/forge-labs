/**
 * Credit Purchase Modal
 * 크레딧 구매 모달 (Toss Payments 연동)
 */

'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { useAuth } from '@/lib/auth/context'
import { calculatePrice } from '@/lib/credits/utils'

interface CreditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

const CREDIT_PACKAGES = [
  { credits: 100, bonus: 0, popular: false },
  { credits: 500, bonus: 50, popular: true },
  { credits: 1000, bonus: 150, popular: false },
  { credits: 3000, bonus: 500, popular: false },
]

export function CreditPurchaseModal({ isOpen, onClose }: CreditPurchaseModalProps) {
  const { user } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const totalCredits = selectedPackage.credits + selectedPackage.bonus
  const price = calculatePrice(selectedPackage.credits)

  const handlePurchase = async () => {
    if (!user) {
      setError('로그인이 필요합니다')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 주문 생성
      const checkoutResponse = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: totalCredits }),
      })

      const checkoutData = await checkoutResponse.json()

      if (!checkoutData.success) {
        throw new Error(checkoutData.error)
      }

      // Toss Payments SDK 로드
      const tossPayments = await loadTossPayments(checkoutData.clientKey)

      // 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: checkoutData.amount,
        orderId: checkoutData.orderId,
        orderName: '크레딧 ' + totalCredits + '개',
        successUrl: window.location.origin + '/api/payments/success',
        failUrl: window.location.origin + '/api/payments/fail',
      })
    } catch (err: any) {
      setError(err.message || '결제 요청 실패')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-medium text-white">크레딧 구매</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/[0.04] rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Package Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => setSelectedPackage(pkg)}
                className={'relative p-4 border rounded-lg transition-all ' +
                  (selectedPackage === pkg
                    ? 'border-[#5E6AD2] bg-[#5E6AD2]/10'
                    : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]')
                }
              >
                {pkg.popular && (
                  <div className="absolute -top-2 right-3 px-2 py-0.5 bg-[#5E6AD2] text-xs text-white rounded-full">
                    인기
                  </div>
                )}
                
                <div className="text-2xl font-bold text-white mb-1">
                  {pkg.credits + pkg.bonus}
                </div>
                <div className="text-sm text-zinc-400">
                  {pkg.credits}크레딧
                  {pkg.bonus > 0 && (
                    <span className="text-emerald-400"> +{pkg.bonus} 보너스</span>
                  )}
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  ₩{calculatePrice(pkg.credits).toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  크레딧당 ₩{Math.round(calculatePrice(pkg.credits) / pkg.credits)}
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-400">선택한 패키지</span>
              <span className="text-sm text-white font-medium">
                {selectedPackage.credits}크레딧
                {selectedPackage.bonus > 0 && ' + ' + selectedPackage.bonus + ' 보너스'}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-400">받는 크레딧</span>
              <span className="text-sm text-emerald-400 font-medium">
                {totalCredits}크레딧
              </span>
            </div>
            <div className="pt-2 border-t border-white/[0.06] flex justify-between">
              <span className="text-base text-white font-medium">결제 금액</span>
              <span className="text-lg text-white font-bold">
                ₩{price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="mb-6 p-3 bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 rounded text-xs text-[#9AA5EF]">
            • 결제는 토스페이먼츠를 통해 안전하게 처리됩니다
            <br />
            • 구매한 크레딧은 즉시 계정에 충전됩니다
            <br />
            • 크레딧은 백테스트 실행 등 다양한 기능에 사용됩니다
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 px-4 border border-white/[0.06] hover:bg-white/[0.04] text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="flex-1 h-10 px-4 bg-[#5E6AD2] hover:bg-[#6E7AE2] text-white rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '결제 준비 중...' : '구매하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
