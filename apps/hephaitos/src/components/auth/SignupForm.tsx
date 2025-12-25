/**
 * Signup Form Component
 * 회원가입 폼 (이메일/비밀번호 + 소셜)
 * Design System 적용: Linear-inspired Dark Theme
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

export function SignupForm() {
  const router = useRouter()
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGithubSignup = async () => {
    setLoading(true)
    setError(null)
    const { error } = await signInWithGithub()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F] p-4 relative overflow-hidden">
        {/* Aurora Background Effect */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5E6AD2]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/3 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          {/* Card - Glass Morphism */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white mb-2">
              회원가입 완료!
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              이메일로 전송된 인증 링크를 클릭하여 계정을 활성화해주세요.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-4 py-2.5 bg-[#5E6AD2] hover:bg-[#6E7AE2] text-white rounded-lg text-sm font-medium transition-all"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F] p-4 relative overflow-hidden">
      {/* Aurora Background Effect - 대시보드와 동일 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5E6AD2]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            HEPHAITOS
          </h1>
          <p className="text-sm text-zinc-400">
            무료로 시작하고 {process.env.NEXT_PUBLIC_WELCOME_BONUS || 50}크레딧을 받으세요
          </p>
        </div>

        {/* Card - Glass Morphism */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 shadow-2xl">
          {/* Social Signup */}
          <div className="space-y-3 mb-6">
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full h-11 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </button>

            {/* Github Button */}
            <button
              type="button"
              onClick={handleGithubSignup}
              disabled={loading}
              className="w-full h-11 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 border border-white/[0.06]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Github으로 시작하기
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0D0D0F] text-zinc-500">또는</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-xs text-zinc-400 mb-1.5">
                이름
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5E6AD2]/50 focus:ring-1 focus:ring-[#5E6AD2]/20 transition-all"
                placeholder="홍길동"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-zinc-400 mb-1.5">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5E6AD2]/50 focus:ring-1 focus:ring-[#5E6AD2]/20 transition-all"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-zinc-400 mb-1.5">
                비밀번호 (최소 6자)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5E6AD2]/50 focus:ring-1 focus:ring-[#5E6AD2]/20 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {/* Primary Button - Design System Color */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-4 bg-[#5E6AD2] hover:bg-[#6E7AE2] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>

            <p className="text-[10px] text-zinc-500 text-center">
              가입 시{' '}
              <Link href="/terms" className="underline hover:text-zinc-400">
                서비스 약관
              </Link>
              과{' '}
              <Link href="/privacy" className="underline hover:text-zinc-400">
                개인정보 처리방침
              </Link>
              에 동의합니다
            </p>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-[#7C8AEA] hover:text-[#9AA5EF] font-medium transition-colors">
              로그인
            </Link>
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
