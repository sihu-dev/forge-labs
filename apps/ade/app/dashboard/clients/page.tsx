/**
 * 고객 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// 임시 데모 데이터 (추후 Supabase 연동)
const demoClients = [
  {
    id: '1',
    type: 'business' as const,
    name: '(주)테크스타트',
    businessNumber: '123-45-67890',
    email: 'tech@start.com',
    phone: '02-1234-5678',
    stats: { documentCount: 5, totalRevenue: 15000000 },
  },
  {
    id: '2',
    type: 'business' as const,
    name: '디자인랩',
    businessNumber: '456-78-90123',
    email: 'hello@designlab.kr',
    phone: '02-9876-5432',
    stats: { documentCount: 3, totalRevenue: 8500000 },
  },
  {
    id: '3',
    type: 'individual' as const,
    name: '김철수',
    email: 'kim@email.com',
    phone: '010-1234-5678',
    stats: { documentCount: 2, totalRevenue: 3000000 },
  },
];

type SortOption = 'recent' | 'name' | 'revenue';
type FilterOption = 'all' | 'business' | 'individual';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('recent');

  // 필터링 및 정렬
  const filteredClients = demoClients
    .filter((client) => {
      if (filter !== 'all' && client.type !== filter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          (client.businessNumber?.includes(search))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        case 'revenue':
          return b.stats.totalRevenue - a.stats.totalRevenue;
        default:
          return 0; // recent - 기본 순서 유지
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객 관리</h1>
          <p className="text-gray-500 mt-1">총 {filteredClients.length}명의 고객</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 고객 등록
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 검색 */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="이름, 이메일, 사업자번호로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 필터 */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">전체</option>
          <option value="business">사업자</option>
          <option value="individual">개인</option>
        </select>

        {/* 정렬 */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="recent">최근순</option>
          <option value="name">이름순</option>
          <option value="revenue">매출순</option>
        </select>
      </div>

      {/* 고객 목록 */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">👥</span>
          <p className="text-gray-500 mb-4">
            {search ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
          </p>
          {!search && (
            <Link
              href="/dashboard/clients/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 고객 등록하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* 아바타 */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                    client.type === 'business' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {client.name.charAt(0)}
                  </div>

                  {/* 정보 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        client.type === 'business'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {client.type === 'business' ? '사업자' : '개인'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {client.businessNumber && `${client.businessNumber} | `}
                      {client.email}
                    </p>
                  </div>
                </div>

                {/* 통계 */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {client.stats.documentCount}건
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(client.stats.totalRevenue)}원
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
