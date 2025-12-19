/**
 * HEPHAITOS - Landing Page
 * 메인 랜딩 페이지
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-6 bg-gray-1/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold">HEPHAITOS</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/features" className="text-sm text-gray-11 hover:text-gray-12 transition-colors">
              기능
            </Link>
            <Link href="/pricing" className="text-sm text-gray-11 hover:text-gray-12 transition-colors">
              가격
            </Link>
            <Link href="/docs" className="text-sm text-gray-11 hover:text-gray-12 transition-colors">
              문서
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm bg-gray-3 hover:bg-gray-4 rounded-lg transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center pt-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-sm mb-8">
            <span>🚀</span>
            <span>No-Code 트레이딩 전략 빌더</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            트레이딩 교육의
            <br />
            <span className="text-blue-500">새로운 패러다임</span>
          </h1>

          <p className="text-xl text-gray-11 mb-10 max-w-2xl mx-auto">
            유튜버와 수강생이 함께 만드는 AI 전략.
            <br />
            드래그 앤 드롭으로 백테스트하고, 실계좌까지 연결하세요.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-medium transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-gray-3 hover:bg-gray-4 rounded-xl text-lg font-medium transition-colors"
            >
              데모 보기
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="mt-16 flex items-center justify-center gap-12 text-gray-10 text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-12">100+</p>
              <p>크레딧 무료 제공</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-12">17개</p>
              <p>블록 지표</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-12">5+</p>
              <p>거래소 지원</p>
            </div>
          </div>
        </div>

        {/* 프리뷰 이미지 */}
        <div className="mt-20 w-full max-w-6xl mx-auto">
          <div className="aspect-video rounded-2xl bg-gray-2 border border-gray-6 overflow-hidden flex items-center justify-center">
            <p className="text-gray-10">전략 빌더 프리뷰</p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-6 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-10">
          <p>© 2025 FORGE LABS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-12 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-gray-12 transition-colors">이용약관</Link>
            <Link href="/contact" className="hover:text-gray-12 transition-colors">문의</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
