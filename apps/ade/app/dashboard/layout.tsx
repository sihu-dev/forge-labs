/**
 * ADE - 대시보드 레이아웃
 */

import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200">
        {/* 로고 */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              ADE
            </span>
          </Link>
        </div>

        {/* 네비게이션 */}
        <nav className="p-4 space-y-1">
          <NavItem href="/dashboard" icon="🏠" label="홈" />
          <NavItem href="/dashboard/projects" icon="📁" label="프로젝트" />
          <NavItem href="/dashboard/projects/new" icon="➕" label="새 프로젝트" />

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs text-gray-400 uppercase tracking-wider mb-2">
              템플릿
            </p>
            <NavItem href="/dashboard/projects/new?type=card" icon="💳" label="명함" />
            <NavItem href="/dashboard/projects/new?type=invoice" icon="📄" label="인보이스" />
            <NavItem href="/dashboard/projects/new?type=portfolio" icon="🎨" label="포트폴리오" />
            <NavItem href="/dashboard/projects/new?type=quote" icon="📋" label="견적서" />
            <NavItem href="/dashboard/projects/new?type=landing" icon="🚀" label="랜딩페이지" />
          </div>
        </nav>

        {/* 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                사용자
              </p>
              <p className="text-xs text-gray-500">무료 플랜</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
