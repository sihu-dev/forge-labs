/**
 * HEPHAITOS - Exchanges Page
 * 거래소 연결 페이지
 *
 * QRY-H-6-006
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface Exchange {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  balance?: number;
}

const SUPPORTED_EXCHANGES: Exchange[] = [
  { id: 'binance', name: 'Binance', icon: '🟡', status: 'disconnected' },
  { id: 'upbit', name: 'Upbit', icon: '🔵', status: 'disconnected' },
  { id: 'bithumb', name: 'Bithumb', icon: '🟠', status: 'disconnected' },
  { id: 'coinbase', name: 'Coinbase', icon: '🔷', status: 'disconnected' },
  { id: 'kraken', name: 'Kraken', icon: '🐙', status: 'disconnected' },
];

const mockConnected: Exchange[] = [
  {
    id: 'binance',
    name: 'Binance',
    icon: '🟡',
    status: 'connected',
    lastSync: '5분 전',
    balance: 45000000,
  },
  {
    id: 'upbit',
    name: 'Upbit',
    icon: '🔵',
    status: 'connected',
    lastSync: '3분 전',
    balance: 20000000,
  },
];

export default function ExchangesPage() {
  const { profile } = useAuth();
  const [connectedExchanges, setConnectedExchanges] = useState<Exchange[]>(mockConnected);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);

  const availableExchanges = SUPPORTED_EXCHANGES.filter(
    (e) => !connectedExchanges.find((c) => c.id === e.id)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: Exchange['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            연결됨
          </span>
        );
      case 'disconnected':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-6 text-gray-11">
            미연결
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
            오류
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">거래소 연결</h1>
          <p className="text-gray-11 mt-1">API 키로 거래소를 연결하세요</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
        >
          + 거래소 추가
        </button>
      </div>

      {/* BYOK 안내 */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-xl">🔐</span>
          <div>
            <p className="font-medium text-blue-400">BYOK (Bring Your Own Key)</p>
            <p className="text-sm text-blue-400/80 mt-1">
              API 키는 로컬에서 암호화되어 저장됩니다. 서버에 평문으로 전송되지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 연결된 거래소 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-6">
          <h2 className="font-semibold">연결된 거래소</h2>
        </div>

        {connectedExchanges.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <p className="text-gray-10 mb-4">연결된 거래소가 없습니다</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            >
              첫 거래소 연결하기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-6">
            {connectedExchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="px-5 py-4 hover:bg-gray-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-5 flex items-center justify-center text-2xl">
                      {exchange.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{exchange.name}</p>
                        {getStatusBadge(exchange.status)}
                      </div>
                      <p className="text-sm text-gray-10 mt-0.5">
                        마지막 동기화: {exchange.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-10">잔고</p>
                      <p className="font-semibold">{formatCurrency(exchange.balance || 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-gray-4 hover:bg-gray-5 rounded-lg text-sm transition-colors">
                        동기화
                      </button>
                      <button className="px-3 py-1.5 bg-gray-4 hover:bg-gray-5 rounded-lg text-sm transition-colors">
                        설정
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
                        연결 해제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 지원 거래소 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-6">
          <h2 className="font-semibold">지원 거래소</h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUPPORTED_EXCHANGES.map((exchange) => {
            const isConnected = connectedExchanges.find((c) => c.id === exchange.id);
            return (
              <button
                key={exchange.id}
                onClick={() => {
                  if (!isConnected) {
                    setSelectedExchange(exchange.id);
                    setShowConnectModal(true);
                  }
                }}
                disabled={!!isConnected}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isConnected
                    ? 'bg-green-500/10 border-green-500/30 cursor-default'
                    : 'bg-gray-3 border-gray-6 hover:border-gray-8 hover:bg-gray-4'
                }`}
              >
                <div className="text-2xl mb-2">{exchange.icon}</div>
                <p className="font-medium">{exchange.name}</p>
                <p className="text-xs text-gray-10 mt-1">
                  {isConnected ? '연결됨' : '연결 가능'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* API 키 가이드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <h3 className="font-semibold mb-3">API 키 발급 방법</h3>
          <ol className="space-y-2 text-sm text-gray-11">
            <li className="flex gap-2">
              <span className="text-blue-500">1.</span>
              거래소 웹사이트에서 API 관리 메뉴 접속
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">2.</span>
              새 API 키 생성 (읽기/거래 권한 설정)
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">3.</span>
              API 키와 시크릿 키 복사
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">4.</span>
              HEPHAITOS에서 API 키 등록
            </li>
          </ol>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <h3 className="font-semibold mb-3">보안 권장사항</h3>
          <ul className="space-y-2 text-sm text-gray-11">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              IP 화이트리스트 설정
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              출금 권한 비활성화
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              2FA 활성화
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              정기적인 API 키 갱신
            </li>
          </ul>
        </div>
      </div>

      {/* 연결 모달 (placeholder) */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gray-2 border border-gray-6">
            <h2 className="text-xl font-semibold mb-4">거래소 연결</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-10 mb-1.5">API 키</label>
                <input
                  type="text"
                  placeholder="API 키를 입력하세요"
                  className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-10 mb-1.5">시크릿 키</label>
                <input
                  type="password"
                  placeholder="시크릿 키를 입력하세요"
                  className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-4 hover:bg-gray-5 rounded-xl font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
              >
                연결
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
