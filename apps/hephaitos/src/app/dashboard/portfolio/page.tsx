/**
 * HEPHAITOS - Portfolio Page
 * 포트폴리오 페이지
 *
 * QRY-H-6-005
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface Asset {
  symbol: string;
  name: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

const mockAssets: Asset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    exchange: 'Binance',
    quantity: 0.5,
    avgPrice: 60000000,
    currentPrice: 65000000,
    pnl: 2500000,
    pnlPercent: 8.33,
    allocation: 50,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    exchange: 'Binance',
    quantity: 5,
    avgPrice: 4000000,
    currentPrice: 4200000,
    pnl: 1000000,
    pnlPercent: 5,
    allocation: 30,
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    exchange: 'Upbit',
    quantity: 5000,
    avgPrice: 800,
    currentPrice: 850,
    pnl: 250000,
    pnlPercent: 6.25,
    allocation: 20,
  },
];

export default function PortfolioPage() {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const totalValue = assets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
  const totalPnl = assets.reduce((sum, a) => sum + a.pnl, 0);
  const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">포트폴리오</h1>
          <p className="text-gray-11 mt-1">연결된 거래소의 자산을 한눈에</p>
        </div>
        <button className="px-4 py-2 bg-gray-4 hover:bg-gray-5 rounded-xl font-medium transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          동기화
        </button>
      </div>

      {/* 총 자산 요약 */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-10 mb-1">총 자산</p>
            <p className="text-4xl font-bold">{formatCurrency(totalValue)}</p>
            <p className={`mt-2 text-lg ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} ({totalPnlPercent.toFixed(2)}%)
            </p>
          </div>
          {/* 기간 선택 */}
          <div className="flex items-center gap-1 p-1 bg-gray-2/50 rounded-lg">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white/10 text-white'
                    : 'text-gray-10 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* 차트 placeholder */}
        <div className="mt-6 h-48 rounded-xl bg-gray-2/30 flex items-center justify-center">
          <div className="text-center text-gray-10">
            <p className="text-4xl mb-2">📈</p>
            <p className="text-sm">자산 변동 차트</p>
          </div>
        </div>
      </div>

      {/* 자산 분포 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 파이 차트 */}
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <h2 className="font-semibold mb-4">자산 분포</h2>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {assets.reduce((acc, asset, index) => {
                  const offset = acc.offset;
                  const colors = ['#3B82F6', '#8B5CF6', '#22C55E', '#EAB308', '#EF4444'];
                  const element = (
                    <circle
                      key={asset.symbol}
                      className="fill-none"
                      stroke={colors[index % colors.length]}
                      strokeWidth="4"
                      strokeDasharray={`${asset.allocation} ${100 - asset.allocation}`}
                      strokeDashoffset={-offset}
                      cx="18"
                      cy="18"
                      r="16"
                    />
                  );
                  acc.elements.push(element);
                  acc.offset += asset.allocation;
                  return acc;
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{assets.length}</p>
                  <p className="text-xs text-gray-10">자산</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {assets.map((asset, index) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
              return (
                <div key={asset.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span>{asset.symbol}</span>
                  </div>
                  <span className="text-gray-10">{asset.allocation}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 거래소별 */}
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <h2 className="font-semibold mb-4">거래소별 자산</h2>
          <div className="space-y-3">
            {['Binance', 'Upbit'].map((exchange) => {
              const exchangeAssets = assets.filter((a) => a.exchange === exchange);
              const exchangeValue = exchangeAssets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
              const percent = (exchangeValue / totalValue) * 100;
              return (
                <div key={exchange} className="p-3 rounded-lg bg-gray-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-5 flex items-center justify-center text-sm">
                        {exchange === 'Binance' ? '🟡' : '🔵'}
                      </div>
                      <span className="font-medium">{exchange}</span>
                    </div>
                    <span className="text-gray-10">{formatCurrency(exchangeValue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-6 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 자산 목록 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-6">
          <h2 className="font-semibold">보유 자산</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-10 border-b border-gray-6">
                <th className="px-5 py-3 font-medium">자산</th>
                <th className="px-5 py-3 font-medium text-right">보유량</th>
                <th className="px-5 py-3 font-medium text-right">평균 단가</th>
                <th className="px-5 py-3 font-medium text-right">현재가</th>
                <th className="px-5 py-3 font-medium text-right">평가금액</th>
                <th className="px-5 py-3 font-medium text-right">손익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-6">
              {assets.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-gray-3 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-5 flex items-center justify-center font-bold text-sm">
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-sm text-gray-10">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono">{asset.quantity}</td>
                  <td className="px-5 py-4 text-right text-gray-11">{formatCurrency(asset.avgPrice)}</td>
                  <td className="px-5 py-4 text-right font-medium">{formatCurrency(asset.currentPrice)}</td>
                  <td className="px-5 py-4 text-right font-medium">{formatCurrency(asset.currentPrice * asset.quantity)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {asset.pnl >= 0 ? '+' : ''}{formatCurrency(asset.pnl)} ({asset.pnlPercent.toFixed(2)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
