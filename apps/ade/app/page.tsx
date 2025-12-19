export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="text-8xl">🤖</div>

        {/* Title */}
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          ADE
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 dark:text-gray-400">
          AI Design Engine
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl">
          <FeatureCard
            icon="🎨"
            title="AI 디자인"
            description="자동 UI/UX 생성"
          />
          <FeatureCard
            icon="💻"
            title="코드 생성"
            description="디자인 → 코드 변환"
          />
          <FeatureCard
            icon="🧩"
            title="컴포넌트 라이브러리"
            description="재사용 가능한 UI Kit"
          />
        </div>

        {/* Status */}
        <div className="mt-12 text-sm text-gray-500">
          <p>개발 서버 실행 중 - Port 3003</p>
          <p className="text-purple-500 mt-1">✓ Next.js 15 + React 19</p>
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
                    hover:border-purple-500 transition-colors bg-white/50 dark:bg-gray-900/50">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}
