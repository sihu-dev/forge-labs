export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="text-8xl">🌱</div>

        {/* Title */}
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          FOLIO
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 dark:text-gray-400">
          소상공인 AI SaaS 플랫폼
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl">
          <FeatureCard
            icon="💰"
            title="매출 분석"
            description="AI 기반 매출 예측"
          />
          <FeatureCard
            icon="📦"
            title="재고 관리"
            description="자동 재고 최적화"
          />
          <FeatureCard
            icon="📈"
            title="경쟁사 분석"
            description="시장 트렌드 인사이트"
          />
        </div>

        {/* Status */}
        <div className="mt-12 text-sm text-gray-500">
          <p>개발 서버 실행 중 - Port 3002</p>
          <p className="text-blue-500 mt-1">✓ Next.js 15 + React 19</p>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl
                    hover:border-blue-500 transition-colors bg-white/50 dark:bg-gray-900/50">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}
