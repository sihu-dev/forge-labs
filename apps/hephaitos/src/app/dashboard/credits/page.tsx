/**
 * HEPHAITOS - Credits Page
 * 크레딧 충전 페이지
 *
 * QRY-H-6-007
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus';
  amount: number;
  description: string;
  date: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', credits: 100, price: 10000, bonus: 0 },
  { id: 'basic', credits: 500, price: 45000, bonus: 50, popular: true },
  { id: 'pro', credits: 1000, price: 80000, bonus: 200 },
  { id: 'enterprise', credits: 5000, price: 350000, bonus: 1500 },
];

const mockTransactions: Transaction[] = [
  { id: '1', type: 'purchase', amount: 500, description: 'Basic 패키지 구매', date: '2024-12-18' },
  { id: '2', type: 'bonus', amount: 50, description: 'Basic 패키지 보너스', date: '2024-12-18' },
  { id: '3', type: 'usage', amount: -10, description: '백테스트 실행 (RSI 전략)', date: '2024-12-17' },
  { id: '4', type: 'usage', amount: -5, description: '백테스트 실행 (MACD 전략)', date: '2024-12-16' },
  { id: '5', type: 'usage', amount: -50, description: '에이전트 실행 (1시간)', date: '2024-12-15' },
];

export default function CreditsPage() {
  const { profile } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
        return '💳';
      case 'usage':
        return '⚡';
      case 'bonus':
        return '🎁';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">크레딧</h1>
          <p className="text-gray-11 mt-1">에이전트 실행에 필요한 크레딧을 충전하세요</p>
        </div>
      </div>

      {/* 현재 크레딧 */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-10 mb-1">보유 크레딧</p>
            <p className="text-4xl font-bold flex items-center gap-2">
              <span className="text-yellow-500">💰</span>
              {profile?.credits ?? 100}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-10 mb-1">이번 달 사용량</p>
            <p className="text-xl font-semibold">65 크레딧</p>
          </div>
        </div>
      </div>

      {/* 크레딧 사용처 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-2 border border-gray-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              📊
            </div>
            <div>
              <p className="font-medium">백테스트</p>
              <p className="text-sm text-gray-10">1회당 5-20 크레딧</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gray-2 border border-gray-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              🤖
            </div>
            <div>
              <p className="font-medium">에이전트</p>
              <p className="text-sm text-gray-10">시간당 10 크레딧</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gray-2 border border-gray-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              🧠
            </div>
            <div>
              <p className="font-medium">AI 분석</p>
              <p className="text-sm text-gray-10">1회당 3 크레딧</p>
            </div>
          </div>
        </div>
      </div>

      {/* 크레딧 패키지 */}
      <div>
        <h2 className="font-semibold mb-4">크레딧 충전</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative p-5 rounded-xl border text-left transition-all ${
                selectedPackage === pkg.id
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'bg-gray-2 border-gray-6 hover:border-gray-8'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-blue-600 text-xs font-medium rounded-full">
                  인기
                </span>
              )}
              <p className="text-3xl font-bold mb-1">
                {pkg.credits.toLocaleString()}
              </p>
              <p className="text-sm text-gray-10 mb-3">크레딧</p>
              {pkg.bonus > 0 && (
                <p className="text-sm text-green-400 mb-3">+{pkg.bonus} 보너스</p>
              )}
              <p className="text-lg font-semibold">{formatCurrency(pkg.price)}</p>
              <p className="text-xs text-gray-10 mt-1">
                {formatCurrency(pkg.price / (pkg.credits + pkg.bonus))}/크레딧
              </p>
            </button>
          ))}
        </div>
        {selectedPackage && (
          <div className="mt-4 flex justify-end">
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
              결제하기
            </button>
          </div>
        )}
      </div>

      {/* 거래 내역 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-6 flex items-center justify-between">
          <h2 className="font-semibold">거래 내역</h2>
          <button className="text-sm text-blue-500 hover:text-blue-400">
            전체 보기
          </button>
        </div>
        <div className="divide-y divide-gray-6">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-gray-10">{tx.date}</p>
                </div>
              </div>
              <span
                className={`font-medium ${
                  tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {tx.amount >= 0 ? '+' : ''}{tx.amount} 크레딧
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 자동 충전 */}
      <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">자동 충전</h3>
            <p className="text-sm text-gray-10 mt-1">
              크레딧이 50 이하로 떨어지면 자동으로 충전합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>
      </div>

      {/* 결제 수단 */}
      <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
        <h3 className="font-semibold mb-4">등록된 결제 수단</h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 rounded bg-gradient-to-r from-blue-600 to-purple-600" />
            <div>
              <p className="text-sm font-medium">•••• 1234</p>
              <p className="text-xs text-gray-10">Toss Payments</p>
            </div>
          </div>
          <button className="text-sm text-gray-10 hover:text-gray-12">
            변경
          </button>
        </div>
      </div>
    </div>
  );
}
