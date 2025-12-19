/**
 * HEPHAITOS - Signup Page
 * 회원가입 페이지
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, displayName);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        const result = await signInWithGoogle();
        if (result.error) {
          setError(result.error);
        }
      } else {
        setError('GitHub 로그인은 아직 지원되지 않습니다');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth 로그인에 실패했습니다.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-6xl">📧</div>
          <h1 className="text-2xl font-bold mb-4">이메일을 확인하세요</h1>
          <p className="text-gray-11 mb-6">
            <span className="text-blue-500 font-medium">{email}</span>으로 인증 링크를
            보냈습니다.
            <br />
            이메일의 링크를 클릭하여 회원가입을 완료하세요.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-gray-3 hover:bg-gray-4 rounded-xl transition-colors"
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🔥</span>
            <span className="text-2xl font-bold">HEPHAITOS</span>
          </Link>
          <p className="mt-2 text-gray-11">무료 계정을 만들고 시작하세요</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* OAuth 버튼 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-2 hover:bg-gray-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google로 시작하기</span>
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-2 hover:bg-gray-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>GitHub로 시작하기</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-6" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-1 text-gray-10">또는</span>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-11 mb-1.5">
              이름
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="홍길동"
              required
              className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-11 mb-1.5">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-11 mb-1.5">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-11 mb-1.5"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 다시 입력"
              required
              className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-1 w-4 h-4 rounded bg-gray-2 border-gray-6 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="terms" className="text-sm text-gray-11">
              <Link href="/terms" className="text-blue-500 hover:text-blue-400">
                이용약관
              </Link>
              과{' '}
              <Link href="/privacy" className="text-blue-500 hover:text-blue-400">
                개인정보처리방침
              </Link>
              에 동의합니다.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '무료로 시작하기'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-gray-11">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-400 font-medium">
            로그인
          </Link>
        </p>

        {/* 혜택 안내 */}
        <div className="mt-8 p-4 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm font-medium text-gray-12 mb-2">가입하면 무료로 받을 수 있어요</p>
          <ul className="space-y-1.5 text-sm text-gray-11">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              100 크레딧 무료 제공
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              17개 기술 지표 블록
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              무제한 백테스트
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
