/**
 * Profile Editor Component
 * 사용자 프로필 편집
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { UserCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface ProfileEditorProps {
  user: User
  profile: any
}

export function ProfileEditor({ user, profile }: ProfileEditorProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || '프로필 업데이트 실패')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
      <h2 className="text-lg font-medium text-white mb-6">계정 정보</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email (Read-only) */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">
            <EnvelopeIcon className="w-4 h-4 inline mr-1" />
            이메일
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full h-10 px-3 bg-white/[0.02] border border-white/[0.06] rounded text-sm text-zinc-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-zinc-500">
            이메일은 변경할 수 없습니다
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">
            <UserCircleIcon className="w-4 h-4 inline mr-1" />
            이름
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            placeholder="홍길동"
          />
        </div>

        {/* User ID */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">사용자 ID</label>
          <input
            type="text"
            value={user.id}
            disabled
            className="w-full h-10 px-3 bg-white/[0.02] border border-white/[0.06] rounded text-xs text-zinc-500 font-mono cursor-not-allowed"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">역할</label>
          <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-[#7C8AEA]">
            {profile?.role === 'admin' && '관리자'}
            {profile?.role === 'mentor' && '멘토'}
            {profile?.role === 'user' && '일반 사용자'}
            {!profile?.role && '사용자'}
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm text-emerald-400">
            프로필이 업데이트되었습니다
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 bg-[#5E6AD2] hover:bg-[#6E7AE2] text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
