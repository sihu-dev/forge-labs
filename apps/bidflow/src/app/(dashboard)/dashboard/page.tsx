/**
 * BIDFLOW 대시보드 - Supabase 100% 벤치마킹
 * 미니멀 전문 디자인, 인공적 요소 최소화
 */

'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Bid } from '@/components/spreadsheet/SpreadsheetView';

// Handsontable 동적 로드
const ClientSpreadsheet = dynamic(
  () => import('@/components/spreadsheet/ClientSpreadsheet'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">로딩 중</p>
        </div>
      </div>
    )
  }
);

// 샘플 데이터
const SAMPLE_BIDS = [
  {
    id: '1',
    source: 'narajangto',
    external_id: '20251219001',
    title: '서울시 상수도사업본부 초음파유량계 구매',
    organization: '서울특별시 상수도사업본부',
    deadline: '2025-01-02T18:00:00',
    estimated_amount: 450000000,
    status: 'reviewing',
    priority: 'high',
    type: 'product',
    keywords: ['초음파유량계', '상수도', '계측기'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.92,
    matched_product: 'UR-1000PLUS',
    ai_summary: '서울시 상수도사업본부 초음파유량계 구매. UR-1000PLUS 제품 95% 일치. DN100-400 규격.',
    created_at: '2024-12-19T10:00:00',
    updated_at: '2024-12-20T10:00:00',
  },
  {
    id: '2',
    source: 'narajangto',
    external_id: '20251219002',
    title: 'K-water 정수장 전자유량계 교체 공사',
    organization: '한국수자원공사',
    deadline: '2025-01-08T17:00:00',
    estimated_amount: 280000000,
    status: 'new',
    priority: 'high',
    type: 'product',
    keywords: ['전자유량계', '정수장'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.78,
    matched_product: 'MF-1000C',
    ai_summary: null,
    created_at: '2024-12-19T11:00:00',
    updated_at: '2024-12-19T11:00:00',
  },
  {
    id: '3',
    source: 'ted',
    external_id: 'TED-2025-12345',
    title: 'Water Flow Meters for Municipal Water Supply - Berlin',
    organization: 'Berliner Wasserbetriebe',
    deadline: '2025-02-01T12:00:00',
    estimated_amount: 850000000,
    status: 'preparing',
    priority: 'high',
    type: 'product',
    keywords: ['유량계', 'EU', '상수도'],
    url: 'https://ted.europa.eu/',
    match_score: 0.85,
    matched_product: 'UR-1000PLUS',
    ai_summary: '베를린 수도공사 유량계 입찰. EU TED 공고. CPV 38421110.',
    created_at: '2024-12-18T09:00:00',
    updated_at: '2024-12-19T08:00:00',
  },
  {
    id: '4',
    source: 'kepco',
    external_id: 'KEPCO-2025-0101',
    title: '한국전력 발전소 열량계 납품',
    organization: '한국전력공사',
    deadline: '2025-01-25T16:00:00',
    estimated_amount: 120000000,
    status: 'new',
    priority: 'low',
    type: 'product',
    keywords: ['열량계', '발전소'],
    url: null,
    match_score: 0.45,
    matched_product: 'EnerRay',
    ai_summary: null,
    created_at: '2024-12-19T14:00:00',
    updated_at: '2024-12-19T14:00:00',
  },
  {
    id: '5',
    source: 'manual',
    external_id: 'MANUAL-001',
    title: '부산시 하수처리장 비만관 유량계 설치',
    organization: '부산광역시 환경공단',
    deadline: '2024-12-25T17:00:00',
    estimated_amount: 95000000,
    status: 'submitted',
    priority: 'medium',
    type: 'product',
    keywords: ['비만관', '하수처리'],
    url: null,
    match_score: 0.88,
    matched_product: 'UR-1010PLUS',
    ai_summary: '부산 하수처리장 비만관 유량계 설치. UR-1010PLUS 적합.',
    created_at: '2024-12-15T10:00:00',
    updated_at: '2024-12-19T09:00:00',
  },
  {
    id: '6',
    source: 'narajangto',
    external_id: '20251220001',
    title: '인천시 상수도 유량 모니터링 시스템 구축',
    organization: '인천광역시 상수도사업본부',
    deadline: '2025-01-15T17:00:00',
    estimated_amount: 320000000,
    status: 'new',
    priority: 'medium',
    type: 'product',
    keywords: ['유량모니터링', 'IoT'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.72,
    matched_product: 'UR-1000PLUS',
    ai_summary: null,
    created_at: '2024-12-20T09:00:00',
    updated_at: '2024-12-20T09:00:00',
  },
  {
    id: '7',
    source: 'narajangto',
    external_id: '20251220002',
    title: '대전시 하천 수위 및 유량 관측 장비',
    organization: '대전광역시청',
    deadline: '2025-01-20T17:00:00',
    estimated_amount: 180000000,
    status: 'reviewing',
    priority: 'medium',
    type: 'product',
    keywords: ['하천', '개수로'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.81,
    matched_product: 'SL-3000PLUS',
    ai_summary: '대전시 하천 수위/유량 관측. SL-3000PLUS 개수로 유량계 적합.',
    created_at: '2024-12-20T10:00:00',
    updated_at: '2024-12-20T10:00:00',
  },
  {
    id: '8',
    source: 'ted',
    external_id: 'TED-2025-67890',
    title: 'Ultrasonic Flow Measurement Equipment - Amsterdam',
    organization: 'Waternet Amsterdam',
    deadline: '2025-02-15T12:00:00',
    estimated_amount: 620000000,
    status: 'new',
    priority: 'medium',
    type: 'product',
    keywords: ['초음파', 'EU'],
    url: 'https://ted.europa.eu/',
    match_score: 0.79,
    matched_product: 'UR-1000PLUS',
    ai_summary: null,
    created_at: '2024-12-20T08:00:00',
    updated_at: '2024-12-20T08:00:00',
  },
  {
    id: '9',
    source: 'narajangto',
    external_id: '20251218001',
    title: '광주시 정수장 계장설비 교체',
    organization: '광주광역시 상수도사업본부',
    deadline: '2025-01-05T17:00:00',
    estimated_amount: 210000000,
    status: 'preparing',
    priority: 'high',
    type: 'product',
    keywords: ['정수장', '계장설비'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.86,
    matched_product: 'MF-1000C',
    ai_summary: '광주시 정수장 계장설비 교체. MF-1000C 전자유량계 적합.',
    created_at: '2024-12-18T14:00:00',
    updated_at: '2024-12-19T16:00:00',
  },
  {
    id: '10',
    source: 'manual',
    external_id: 'MANUAL-002',
    title: '울산 석유화학단지 유량측정 시스템',
    organization: 'SK에너지',
    deadline: '2025-01-30T17:00:00',
    estimated_amount: 540000000,
    status: 'won',
    priority: 'high',
    type: 'product',
    keywords: ['석유화학', '산업용'],
    url: null,
    match_score: 0.91,
    matched_product: 'UR-1000PLUS',
    ai_summary: '울산 석유화학단지 유량측정 시스템 낙찰. 5.4억원. UR-1000PLUS 20대.',
    created_at: '2024-12-01T10:00:00',
    updated_at: '2024-12-18T15:00:00',
  },
  {
    id: '11',
    source: 'narajangto',
    external_id: '20251215001',
    title: '세종시 스마트시티 용수 관리 시스템',
    organization: '세종특별자치시청',
    deadline: '2024-12-28T17:00:00',
    estimated_amount: 380000000,
    status: 'lost',
    priority: 'medium',
    type: 'product',
    keywords: ['스마트시티', 'IoT'],
    url: 'https://www.g2b.go.kr/',
    match_score: 0.67,
    matched_product: null,
    ai_summary: '세종시 스마트시티 용수 관리 시스템 유찰.',
    created_at: '2024-12-15T11:00:00',
    updated_at: '2024-12-20T09:00:00',
  },
  {
    id: '12',
    source: 'kepco',
    external_id: 'KEPCO-2025-0102',
    title: '한전 영광원자력발전소 냉각수 유량계',
    organization: '한국수력원자력',
    deadline: '2025-02-10T16:00:00',
    estimated_amount: 890000000,
    status: 'new',
    priority: 'high',
    type: 'product',
    keywords: ['원자력', '냉각수'],
    url: null,
    match_score: 0.58,
    matched_product: null,
    ai_summary: null,
    created_at: '2024-12-20T11:00:00',
    updated_at: '2024-12-20T11:00:00',
  },
];

// DashboardStats 타입 정의
interface DashboardStats {
  totalBids: number;
  byStatus: Record<string, number>;
  upcomingDeadlines: number;
  highPriority: number;
  wonRate: number;
  recentActivity: Array<{
    id: string;
    title: string;
    action: string;
    timestamp: string;
  }>;
}

// 로컬 통계 계산 (폴백용)
function calculateStats(bids: typeof SAMPLE_BIDS) {
  const now = new Date();
  return {
    total: bids.length,
    new: bids.filter(b => b.status === 'new').length,
    reviewing: bids.filter(b => b.status === 'reviewing').length,
    preparing: bids.filter(b => b.status === 'preparing').length,
    submitted: bids.filter(b => b.status === 'submitted').length,
    won: bids.filter(b => b.status === 'won').length,
    lost: bids.filter(b => b.status === 'lost').length,
    urgent: bids.filter(b => {
      const deadline = new Date(b.deadline);
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0 && !['won', 'lost', 'cancelled'].includes(b.status);
    }).length,
    highMatch: bids.filter(b => (b.match_score ?? 0) >= 0.8).length,
    totalAmount: bids.reduce((sum, b) => sum + (b.estimated_amount || 0), 0),
  };
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [showBanner, setShowBanner] = useState(true);
  const [bids, setBids] = useState<Bid[]>(SAMPLE_BIDS as unknown as Bid[]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upcomingBids, setUpcomingBids] = useState<Bid[]>([]);
  const [selectedBidForAnalysis, setSelectedBidForAnalysis] = useState<Bid | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 로컬 계산된 통계 (폴백용)
  const localStats = calculateStats(bids as unknown as typeof SAMPLE_BIDS);

  // API 통계 우선, 없으면 로컬 통계 사용
  const stats = apiStats ? {
    total: apiStats.totalBids,
    new: apiStats.byStatus['new'] || 0,
    reviewing: apiStats.byStatus['reviewing'] || 0,
    preparing: apiStats.byStatus['preparing'] || 0,
    submitted: apiStats.byStatus['submitted'] || 0,
    won: apiStats.byStatus['won'] || 0,
    lost: apiStats.byStatus['lost'] || 0,
    urgent: apiStats.upcomingDeadlines,
    highMatch: apiStats.highPriority,
    totalAmount: localStats.totalAmount, // API에 없으므로 로컬 계산 사용
  } : localStats;

  // 통계 API 호출
  const fetchStats = useCallback(async () => {
    if (isDemo) return; // 데모 모드에서는 API 호출 안 함

    try {
      const response = await fetch('/api/v1/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setApiStats(data.data);
        }
      }
    } catch (error) {
      console.error('Stats fetch failed:', error);
      // 실패해도 로컬 통계 사용하므로 조용히 실패
    }
  }, [isDemo]);

  // 알림 가져오기
  const fetchNotifications = useCallback(async () => {
    if (isDemo) return; // 데모 모드에서는 API 호출 안 함

    try {
      const response = await fetch('/api/v1/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: any) => !n.read).length);
        }
      }
    } catch (error) {
      console.error('Notifications fetch failed:', error);
    }
  }, [isDemo]);

  // 알림 읽음 처리
  const markNotificationsAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  }, []);

  // AI 분석 API 호출
  const analyzeBid = useCallback(async (bid: Bid) => {
    setSelectedBidForAnalysis(bid);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`/api/v1/bids/${bid.id}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('AI 분석 요청 실패');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
      } else {
        setError('AI 분석에 실패했습니다');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setError('AI 분석 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 마감 임박 입찰 API 호출
  const fetchUpcoming = useCallback(async () => {
    if (isDemo) {
      // 데모 모드: 로컬 데이터에서 마감 임박 입찰 필터링
      const now = new Date();
      const urgent = (bids as unknown as typeof SAMPLE_BIDS).filter(b => {
        const deadline = new Date(b.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0 && !['won', 'lost', 'cancelled'].includes(b.status);
      });
      setUpcomingBids(urgent as unknown as Bid[]);
      return;
    }

    try {
      const response = await fetch('/api/v1/bids/upcoming?days=7');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUpcomingBids(data.data);
        }
      }
    } catch (error) {
      console.error('Upcoming bids fetch failed:', error);
    }
  }, [isDemo, bids]);

  // Bid 수정 API 호출
  const handleBidUpdate = useCallback(async (id: string, updates: Partial<Bid>) => {
    try {
      const response = await fetch(`/api/v1/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update bid');
      }

      // 로컬 상태 업데이트
      setBids(prev => prev.map(bid =>
        bid.id === id ? { ...bid, ...updates } : bid
      ));

      // 통계 재로드
      fetchStats();
    } catch (error) {
      console.error('Bid update failed:', error);
      setError('입찰 정보 업데이트에 실패했습니다');
      throw error;
    }
  }, [fetchStats]);

  // 새로고침 API 호출
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/bids');
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      const data = await response.json();
      if (data.data) {
        setBids(data.data);
      }
      // 통계 및 마감 임박 입찰도 함께 새로고침
      await Promise.all([fetchStats(), fetchUpcoming()]);
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('데이터를 불러오는 데 실패했습니다');
      // 데모 모드에서는 샘플 데이터 유지
      if (isDemo) {
        setBids(SAMPLE_BIDS as unknown as Bid[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, fetchStats, fetchUpcoming]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!isDemo) {
      handleRefresh();
      fetchNotifications();
    } else {
      // 데모 모드에서도 마감 임박 입찰은 표시
      fetchUpcoming();
    }
  }, [isDemo, handleRefresh, fetchUpcoming, fetchNotifications]);

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      {/* 데모 모드 배너 - 미니멀 */}
      {isDemo && showBanner && (
        <div className="bg-slate-900 text-slate-300 px-6 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Demo Mode</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{SAMPLE_BIDS.length} records</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="text-white font-medium hover:underline">
              Get Started
            </Link>
            <button onClick={() => setShowBanner(false)} className="text-slate-500 hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}

      {/* 헤더 - 반응형 */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-base font-semibold text-slate-900 hidden sm:inline">BIDFLOW</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 rounded">
              Bids
            </Link>
            <a href="#" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Pipeline
            </a>
            <a href="#" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Analytics
            </a>
            <Link href="/docs" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 알림 벨 */}
          {!isDemo && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    // 드롭다운 열 때 안읽은 알림을 읽음 처리
                    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
                    if (unreadIds.length > 0) {
                      markNotificationsAsRead(unreadIds);
                    }
                  }
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                aria-label="알림"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        알림이 없습니다
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer",
                            !notif.read && "bg-blue-50/50"
                          )}
                          onClick={() => {
                            if (notif.bidId) {
                              // TODO: 입찰 상세 페이지로 이동
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs mt-0.5">
                              {notif.type === 'deadline' && '⏰'}
                              {notif.type === 'new_bid' && '📢'}
                              {notif.type === 'match' && '✓'}
                              {notif.type === 'status_change' && '🔄'}
                              {notif.type === 'system' && 'ℹ️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isDemo ? (
            <Link
              href="/signup"
              className="px-3 md:px-4 py-1.5 text-sm font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              Sign up
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600">U</span>
            </div>
          )}
        </div>
      </header>

      {/* 에러 배너 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 md:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {/* 통계 바 - 반응형 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="flex items-center gap-4 md:gap-6 min-w-max md:min-w-0">
          {/* 메트릭 그리드 - 모바일에서 핵심만 */}
          <div className="flex items-center gap-3 md:gap-6">
            <Metric label="Total" value={stats.total} />
            <div className="w-px h-8 bg-slate-200" />
            <Metric label="New" value={stats.new} highlight={stats.new > 0} />
            <Metric label="Review" value={stats.reviewing} className="hidden sm:flex" />
            <Metric label="Prepare" value={stats.preparing} className="hidden sm:flex" />
            <div className="w-px h-8 bg-slate-200 hidden md:block" />
            <Metric label="Urgent" value={stats.urgent} warning={stats.urgent > 0} />
            <Metric label="High Match" value={stats.highMatch} success className="hidden lg:flex" />
            <div className="w-px h-8 bg-slate-200 hidden lg:block" />
            <Metric label="Won" value={stats.won} success className="hidden md:flex" />
            <Metric label="Lost" value={stats.lost} className="hidden md:flex" />
          </div>

          {/* 총 추정가 */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 hidden sm:inline">Est. Total</span>
            <span className="text-base md:text-lg font-mono font-semibold text-slate-900">
              ₩{(stats.totalAmount / 100000000).toFixed(1)}B
            </span>
          </div>
        </div>
      </div>

      {/* 마감 임박 입찰 */}
      {upcomingBids.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming Deadlines (7 days)</h3>
            <span className="text-xs text-slate-500">{upcomingBids.length} bids</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcomingBids.slice(0, 5).map((bid) => {
              const deadline = new Date((bid as any).deadline);
              const now = new Date();
              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 3;

              return (
                <div
                  key={bid.id}
                  className={cn(
                    "min-w-[280px] rounded border p-3 bg-white",
                    isUrgent ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-slate-900 line-clamp-2 flex-1">
                      {(bid as any).title}
                    </h4>
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0",
                        isUrgent
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {daysLeft}d
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">
                    {(bid as any).organization}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">
                      {deadline.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-slate-700">
                      ₩{((bid as any).estimated_amount / 100000000).toFixed(1)}B
                    </span>
                  </div>
                  <button
                    onClick={() => analyzeBid(bid)}
                    className="w-full text-xs px-2 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                  >
                    AI Analyze
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 스프레드시트 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        <ClientSpreadsheet
          initialData={bids}
          onBidUpdate={handleBidUpdate}
          onRefresh={handleRefresh}
        />
      </div>

      {/* AI 분석 모달 */}
      {selectedBidForAnalysis && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedBidForAnalysis(null);
            setAnalysisResult(null);
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Analysis</h2>
                <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                  {(selectedBidForAnalysis as any).title}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBidForAnalysis(null);
                  setAnalysisResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm text-slate-600">AI 분석 중...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  {/* 요약 */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{analysisResult.summary}</p>
                  </div>

                  {/* 승률 & 난이도 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded p-4">
                      <div className="text-xs text-slate-500 mb-1">Win Probability</div>
                      <div className="text-2xl font-semibold text-slate-900">
                        {analysisResult.winProbability}%
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded p-4">
                      <div className="text-xs text-slate-500 mb-1">Estimated Effort</div>
                      <div className="text-2xl font-semibold text-slate-900 capitalize">
                        {analysisResult.estimatedEffort}
                      </div>
                    </div>
                  </div>

                  {/* 핵심 요구사항 */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Key Requirements</h3>
                    <ul className="space-y-1">
                      {analysisResult.keyRequirements.map((req: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 추천 제품 */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Recommended Products</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.recommendedProducts.map((product: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 리스크 요인 */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Risk Factors</h3>
                    <ul className="space-y-1">
                      {analysisResult.riskFactors.map((risk: string, idx: number) => (
                        <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                          <span className="text-red-400 mt-1">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 제안 가격 */}
                  {analysisResult.suggestedPrice && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Suggested Price Range</h3>
                      <div className="bg-slate-50 rounded p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Minimum:</span>
                          <span className="font-mono text-slate-900">{analysisResult.suggestedPrice.min}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Recommended:</span>
                          <span className="font-mono font-semibold text-slate-900">{analysisResult.suggestedPrice.recommended}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Maximum:</span>
                          <span className="font-mono text-slate-900">{analysisResult.suggestedPrice.max}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 미니멀 메트릭 컴포넌트
function Metric({
  label,
  value,
  highlight,
  warning,
  success,
  className
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warning?: boolean;
  success?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={cn(
        'text-lg md:text-xl font-semibold font-mono',
        warning ? 'text-neutral-700' :
        success ? 'text-neutral-800' :
        highlight ? 'text-neutral-700' :
        'text-slate-900'
      )}>
        {value}
      </span>
    </div>
  );
}
