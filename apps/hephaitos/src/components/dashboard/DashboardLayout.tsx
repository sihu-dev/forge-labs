/**
 * HEPHAITOS - Dashboard Layout
 * L3 (Tissues) - 사용자 대시보드 레이아웃
 *
 * 사이드바 + 헤더 + 메인 콘텐츠 레이아웃
 *
 * QRY-H-5-002
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  Separator,
} from '@forge/ui';
import { cn } from '@/lib/utils';
import { useAuth, type UserProfile } from '@/providers/AuthProvider';

/**
 * 네비게이션 아이템
 */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

/**
 * 기본 네비게이션 메뉴
 */
const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    href: '/dashboard',
    icon: '📊',
  },
  {
    id: 'strategies',
    label: '전략',
    href: '/strategies',
    icon: '📈',
    children: [
      { id: 'my-strategies', label: '내 전략', href: '/strategies', icon: '📁' },
      { id: 'builder', label: '전략 빌더', href: '/strategies/builder', icon: '🔧' },
      { id: 'templates', label: '템플릿', href: '/strategies/templates', icon: '📋' },
    ],
  },
  {
    id: 'backtest',
    label: '백테스트',
    href: '/backtest',
    icon: '🧪',
    children: [
      { id: 'run', label: '실행', href: '/backtest/run', icon: '▶️' },
      { id: 'history', label: '기록', href: '/backtest/history', icon: '📜' },
    ],
  },
  {
    id: 'agents',
    label: '에이전트',
    href: '/agents',
    icon: '🤖',
  },
  {
    id: 'portfolio',
    label: '포트폴리오',
    href: '/portfolio',
    icon: '💼',
  },
  {
    id: 'learn',
    label: '학습',
    href: '/learn',
    icon: '📚',
    children: [
      { id: 'courses', label: '강의', href: '/learn/courses', icon: '🎓' },
      { id: 'mentors', label: '멘토', href: '/learn/mentors', icon: '👨‍🏫' },
    ],
  },
];

/**
 * 사이드바 네비게이션 아이템 컴포넌트
 */
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  depth?: number;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  isExpanded,
  onToggle,
  depth = 0,
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <Link
        href={hasChildren ? '#' : item.href}
        onClick={hasChildren ? onToggle : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
          'hover:bg-gray-3',
          isActive
            ? 'bg-blue-500/10 text-blue-500 font-medium'
            : 'text-gray-11 hover:text-gray-12',
          depth > 0 && 'ml-6'
        )}
      >
        <span className="text-base">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <span
            className={cn(
              'text-gray-10 transition-transform',
              isExpanded && 'rotate-90'
            )}
          >
            ▶
          </span>
        )}
      </Link>

      {/* 하위 메뉴 */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <Link
              key={child.id}
              href={child.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ml-6',
                'hover:bg-gray-3',
                pathname === child.href
                  ? 'bg-blue-500/10 text-blue-500 font-medium'
                  : 'text-gray-11 hover:text-gray-12'
              )}
            >
              <span className="text-sm">{child.icon}</span>
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 사용자 메뉴
 */
interface UserMenuProps {
  profile: UserProfile;
  onSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ profile, onSignOut }) => {
  const initials = profile.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile.email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 hover:bg-gray-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile.avatar}
              fallback={initials}
              size="sm"
            />
            <div className="text-left hidden lg:block">
              <p className="text-sm font-medium text-gray-12">
                {profile.name || profile.email}
              </p>
              <p className="text-xs text-gray-10">{profile.role}</p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-12">
            {profile.name || profile.email}
          </p>
          <p className="text-xs text-gray-10">{profile.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">프로필 설정</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/api-keys">API 키 관리</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">결제 및 크레딧</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-red-500">
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * DashboardLayout Props
 */
export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dashboard Layout Component
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
}) => {
  const { profile, signOut, isLoading } = useAuth();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['strategies']));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 확장 토글
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // 활성 상태 확인
  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      if (pathname === item.href) return true;
      if (item.children) {
        return item.children.some((child) => pathname === child.href);
      }
      return false;
    },
    [pathname]
  );

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-1">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-10">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-screen bg-gray-1', className)}>
      {/* 사이드바 */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-gray-2 border-r border-gray-6 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* 로고 */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-6">
          <span className="text-2xl">🔥</span>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-gray-12">HEPHAITOS</span>
          )}
        </div>

        {/* 네비게이션 */}
        <ScrollArea className="flex-1 p-3">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={isItemActive(item)}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleExpanded(item.id)}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* 크레딧 표시 */}
        {profile && !sidebarCollapsed && (
          <div className="p-3 border-t border-gray-6">
            <Link
              href="/settings/billing"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-3 hover:bg-gray-4 transition-colors"
            >
              <span>💎</span>
              <div className="flex-1">
                <p className="text-xs text-gray-10">크레딧</p>
                <p className="text-sm font-medium text-gray-12">
                  {profile.credits.toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-blue-500">충전</span>
            </Link>
          </div>
        )}

        {/* 사이드바 토글 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-3 border border-gray-6 flex items-center justify-center text-gray-10 hover:text-gray-12 transition-colors"
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </aside>

      {/* 메인 영역 */}
      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* 헤더 */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-gray-1 border-b border-gray-6">
          {/* 검색 */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="검색..."
                className="w-64 h-9 pl-9 pr-4 rounded-lg bg-gray-2 border border-gray-6 text-sm text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-10">
                🔍
              </span>
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-4">
            {/* 알림 */}
            <Button variant="ghost" size="icon" className="relative">
              <span className="text-lg">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* 도움말 */}
            <Button variant="ghost" size="icon">
              <span className="text-lg">❓</span>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* 사용자 메뉴 */}
            {profile ? (
              <UserMenu profile={profile} onSignOut={signOut} />
            ) : (
              <Button asChild size="sm">
                <Link href="/auth/login">로그인</Link>
              </Button>
            )}
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
