/**
 * HEPHAITOS - Credit System Components
 * L3 (Tissues) - 크레딧 시스템 컴포넌트
 *
 * 크레딧 표시, 충전, 사용 내역
 *
 * QRY-H-5-003
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Progress,
  ScrollArea,
  Separator,
  Badge,
} from '@forge/ui';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

/**
 * 크레딧 패키지
 */
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

/**
 * 크레딧 거래 내역
 */
interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
  balance: number;
}

/**
 * 크레딧 패키지 목록
 */
const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', name: '스타터', credits: 100, price: 9900 },
  { id: 'basic', name: '베이직', credits: 500, price: 39000, bonus: 50 },
  { id: 'pro', name: '프로', credits: 1000, price: 69000, bonus: 150, popular: true },
  { id: 'enterprise', name: '엔터프라이즈', credits: 5000, price: 290000, bonus: 1000 },
];

/**
 * 크레딧 비용 (기능별)
 */
const CREDIT_COSTS: Record<string, number> = {
  backtest_basic: 10,
  backtest_advanced: 30,
  agent_hour: 5,
  ai_analysis: 20,
  export_report: 15,
};

/**
 * 크레딧 배지 컴포넌트
 */
interface CreditBadgeProps {
  credits: number;
  onClick?: () => void;
  className?: string;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({
  credits,
  onClick,
  className,
}) => {
  const getColor = () => {
    if (credits <= 50) return 'bg-red-500/10 text-red-500 border-red-500/30';
    if (credits <= 200) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors hover:opacity-80',
        getColor(),
        className
      )}
    >
      <span>💎</span>
      <span>{credits.toLocaleString()}</span>
    </button>
  );
};

/**
 * 크레딧 패키지 카드
 */
interface PackageCardProps {
  pkg: CreditPackage;
  isSelected: boolean;
  onSelect: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  isSelected,
  onSelect,
}) => {
  const totalCredits = pkg.credits + (pkg.bonus || 0);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col p-4 rounded-xl border-2 text-left transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-gray-6 hover:border-gray-8'
      )}
    >
      {pkg.popular && (
        <Badge className="absolute -top-2 right-4 bg-blue-500">인기</Badge>
      )}

      <h3 className="text-lg font-semibold text-gray-12">{pkg.name}</h3>

      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-12">
          {pkg.credits.toLocaleString()}
        </span>
        <span className="text-gray-10 ml-1">크레딧</span>
      </div>

      {pkg.bonus && (
        <p className="text-sm text-green-500 mt-1">
          +{pkg.bonus.toLocaleString()} 보너스
        </p>
      )}

      <Separator className="my-3" />

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-gray-12">
          ₩{pkg.price.toLocaleString()}
        </span>
      </div>

      <p className="text-xs text-gray-10 mt-1">
        크레딧당 ₩{(pkg.price / totalCredits).toFixed(1)}
      </p>
    </button>
  );
};

/**
 * 크레딧 충전 다이얼로그
 */
interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (packageId: string) => Promise<void>;
}

export const CreditPurchaseDialog: React.FC<CreditPurchaseDialogProps> = ({
  open,
  onOpenChange,
  onPurchase,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onPurchase(selectedPackage);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPackage, onPurchase, onOpenChange]);

  const selectedPkg = CREDIT_PACKAGES.find((p) => p.id === selectedPackage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>크레딧 충전</DialogTitle>
          <DialogDescription>
            원하는 패키지를 선택하세요. 보너스 크레딧이 추가됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handlePurchase} disabled={isProcessing}>
            {isProcessing
              ? '처리 중...'
              : `₩${selectedPkg?.price.toLocaleString()} 결제하기`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 크레딧 사용량 표시
 */
interface CreditUsageProps {
  used: number;
  total: number;
  className?: string;
}

export const CreditUsage: React.FC<CreditUsageProps> = ({
  used,
  total,
  className,
}) => {
  const percentage = (used / total) * 100;
  const remaining = total - used;

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-12">이번 달 사용량</h3>
        <span className="text-xs text-gray-10">
          {used.toLocaleString()} / {total.toLocaleString()} 크레딧
        </span>
      </div>

      <Progress value={percentage} className="h-2 mb-3" />

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-10">
          남은 크레딧: <span className="text-gray-12 font-medium">{remaining.toLocaleString()}</span>
        </span>
        <span className={cn(
          'font-medium',
          remaining < 50 ? 'text-red-500' : remaining < 200 ? 'text-yellow-500' : 'text-green-500'
        )}>
          {remaining < 50 ? '충전 필요' : remaining < 200 ? '충전 권장' : '충분'}
        </span>
      </div>
    </Card>
  );
};

/**
 * 크레딧 거래 내역
 */
interface CreditHistoryProps {
  transactions: CreditTransaction[];
  className?: string;
}

export const CreditHistory: React.FC<CreditHistoryProps> = ({
  transactions,
  className,
}) => {
  const typeConfig = {
    purchase: { icon: '💳', label: '충전', color: 'text-green-500' },
    usage: { icon: '📊', label: '사용', color: 'text-red-500' },
    bonus: { icon: '🎁', label: '보너스', color: 'text-blue-500' },
    refund: { icon: '↩️', label: '환불', color: 'text-yellow-500' },
  };

  return (
    <Card className={cn('', className)}>
      <div className="p-4 border-b border-gray-6">
        <h3 className="text-sm font-semibold text-gray-12">크레딧 내역</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="divide-y divide-gray-6">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-10">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm">내역이 없습니다</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const config = typeConfig[tx.type];
              const isPositive = tx.type === 'purchase' || tx.type === 'bonus' || tx.type === 'refund';

              return (
                <div key={tx.id} className="flex items-center gap-3 p-4">
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-12 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-10">
                      {new Date(tx.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-medium', config.color)}>
                      {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-10">
                      잔액: {tx.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

/**
 * 크레딧 비용 안내
 */
interface CreditPricingProps {
  className?: string;
}

export const CreditPricing: React.FC<CreditPricingProps> = ({ className }) => {
  const pricingItems = [
    { label: '기본 백테스트', cost: CREDIT_COSTS.backtest_basic, icon: '🧪' },
    { label: '고급 백테스트', cost: CREDIT_COSTS.backtest_advanced, icon: '🔬' },
    { label: '에이전트 실행 (시간당)', cost: CREDIT_COSTS.agent_hour, icon: '🤖' },
    { label: 'AI 분석', cost: CREDIT_COSTS.ai_analysis, icon: '🧠' },
    { label: '리포트 내보내기', cost: CREDIT_COSTS.export_report, icon: '📄' },
  ];

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="text-sm font-semibold text-gray-12 mb-3">크레딧 비용 안내</h3>
      <div className="space-y-2">
        {pricingItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-gray-11">{item.label}</span>
            </div>
            <span className="font-medium text-gray-12">
              {item.cost} 크레딧
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * 크레딧 요약 대시보드
 */
export interface CreditDashboardProps {
  className?: string;
}

export const CreditDashboard: React.FC<CreditDashboardProps> = ({ className }) => {
  const { profile, refreshProfile } = useAuth();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  // Mock 거래 내역
  const mockTransactions: CreditTransaction[] = [
    {
      id: '1',
      type: 'purchase',
      amount: 1000,
      description: '프로 패키지 구매',
      createdAt: new Date().toISOString(),
      balance: 1150,
    },
    {
      id: '2',
      type: 'bonus',
      amount: 150,
      description: '프로 패키지 보너스',
      createdAt: new Date().toISOString(),
      balance: 1150,
    },
    {
      id: '3',
      type: 'usage',
      amount: 30,
      description: 'RSI+MACD 전략 백테스트',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      balance: 1120,
    },
  ];

  const handlePurchase = async (packageId: string) => {
    // TODO: 실제 결제 연동
    console.log('Purchasing package:', packageId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await refreshProfile();
  };

  const credits = profile?.credits || 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-12">크레딧 관리</h2>
          <p className="text-sm text-gray-10">크레딧 잔액 및 사용 내역</p>
        </div>
        <Button onClick={() => setShowPurchaseDialog(true)}>
          크레딧 충전
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-10 mb-1">현재 잔액</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-12">
              {credits.toLocaleString()}
            </span>
            <span className="text-gray-10">크레딧</span>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-10 mb-1">이번 달 사용</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-12">30</span>
            <span className="text-gray-10">크레딧</span>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-10 mb-1">예상 소진일</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-12">38</span>
            <span className="text-gray-10">일 후</span>
          </div>
        </Card>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditHistory transactions={mockTransactions} />
        <CreditPricing />
      </div>

      {/* 충전 다이얼로그 */}
      <CreditPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onPurchase={handlePurchase}
      />
    </div>
  );
};

export default CreditDashboard;
