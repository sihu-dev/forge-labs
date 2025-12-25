/**
 * Exchange Settings Page
 * /dashboard/settings/exchange
 * 거래소 API 키 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExchangeKeyManager } from '@/components/settings/ExchangeKeyManager'

export const dynamic = 'force-dynamic'

export default async function ExchangeSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">거래소 연동 설정</h1>
          <p className="text-sm text-zinc-400">
            거래소 API 키를 등록하여 실시간 데이터를 활용하세요
          </p>
        </div>

        {/* Exchange Key Manager */}
        <ExchangeKeyManager userId={user.id} />

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-400 mb-2">
            🔒 보안 안내
          </h3>
          <ul className="text-xs text-yellow-300/80 space-y-1">
            <li>• API 키는 암호화되어 안전하게 저장됩니다</li>
            <li>• 읽기 전용 권한만 있는 API 키를 사용하세요</li>
            <li>• 출금 권한이 있는 API 키는 절대 사용하지 마세요</li>
            <li>• API 키가 노출된 경우 즉시 거래소에서 삭제하세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
