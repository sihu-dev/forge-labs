/**
 * BIDFLOW - 메인 페이지
 * 입찰 자동화 시스템 랜딩 페이지
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          BIDFLOW
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          제조업 SME 맞춤 입찰 자동화 시스템
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/api/v1/bids"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            API 문서
          </Link>
        </div>
      </div>
    </main>
  );
}
