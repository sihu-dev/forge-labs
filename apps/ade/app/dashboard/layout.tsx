/**
 * ADE - 정산 자동화 대시보드 레이아웃
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
            <span className="text-2xl">📋</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ADE
            </span>
          </Link>
        </div>

        {/* 네비게이션 */}
        <nav className="p-4 space-y-1">
          <NavItem href="/dashboard" icon="🏠" label="대시보드" />
          <NavItem href="/dashboard/clients" icon="👥" label="고객 관리" />

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs text-gray-400 uppercase tracking-wider mb-2">
              문서 작성
            </p>
            <NavItem href="/dashboard/quotes/new" icon="📋" label="견적서" />
            <NavItem href="/dashboard/contracts/new" icon="📝" label="계약서" />
            <NavItem href="/dashboard/invoices/new" icon="💳" label="인보이스" />
            <NavItem href="/dashboard/tax-invoices/new" icon="🧾" label="세금계산서" />
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs text-gray-400 uppercase tracking-wider mb-2">
              설정
            </p>
            <NavItem href="/dashboard/settings" icon="⚙️" label="사업자 정보" />
          </div>
        </nav>

        {/* 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">U</span>
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
