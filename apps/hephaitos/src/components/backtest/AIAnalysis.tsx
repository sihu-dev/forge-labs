/**
 * HEPHAITOS - AI Analysis Component
 * L3 (Tissues) - AI 전략 분석 및 개선 제안
 *
 * 백테스트 결과를 분석하여 전략 개선 포인트 제시
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@forge/ui';
import type { HephaitosTypes } from '@forge/types';

type IPerformanceMetrics = HephaitosTypes.IPerformanceMetrics;

/**
 * 분석 항목 타입
 */
type AnalysisType = 'strength' | 'weakness' | 'suggestion' | 'warning';

/**
 * 분석 항목
 */
interface AnalysisItem {
  id: string;
  type: AnalysisType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable?: string;
}

/**
 * 분석 결과
 */
interface AnalysisResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  items: AnalysisItem[];
}

/**
 * 지표 기반 분석 수행
 */
function analyzeMetrics(metrics: Partial<IPerformanceMetrics>): AnalysisResult {
  const items: AnalysisItem[] = [];
  let score = 50; // 기본 점수

  // === 수익률 분석 ===
  const totalReturn = metrics.totalReturn ?? 0;
  if (totalReturn > 50) {
    items.push({
      id: 'return-excellent',
      type: 'strength',
      title: '우수한 수익률',
      description: `총 수익률 ${totalReturn.toFixed(1)}%로 매우 양호합니다.`,
      impact: 'high',
    });
    score += 15;
  } else if (totalReturn > 20) {
    items.push({
      id: 'return-good',
      type: 'strength',
      title: '양호한 수익률',
      description: `총 수익률 ${totalReturn.toFixed(1)}%입니다.`,
      impact: 'medium',
    });
    score += 10;
  } else if (totalReturn < 0) {
    items.push({
      id: 'return-negative',
      type: 'weakness',
      title: '손실 발생',
      description: `총 수익률 ${totalReturn.toFixed(1)}%로 손실이 발생했습니다.`,
      impact: 'high',
      actionable: '진입/청산 조건을 재검토하세요.',
    });
    score -= 15;
  }

  // === 리스크 분석 ===
  const sharpe = metrics.sharpeRatio ?? 0;
  if (sharpe > 2) {
    items.push({
      id: 'sharpe-excellent',
      type: 'strength',
      title: '탁월한 위험 조정 수익',
      description: `샤프 지수 ${sharpe.toFixed(2)}로 위험 대비 수익이 매우 우수합니다.`,
      impact: 'high',
    });
    score += 15;
  } else if (sharpe < 0.5) {
    items.push({
      id: 'sharpe-low',
      type: 'weakness',
      title: '낮은 위험 조정 수익',
      description: `샤프 지수 ${sharpe.toFixed(2)}로 위험 대비 수익이 낮습니다.`,
      impact: 'high',
      actionable: '변동성 대비 수익률을 개선하세요.',
    });
    score -= 10;
  }

  // === MDD 분석 ===
  const mdd = metrics.maxDrawdown ?? 0;
  if (mdd > -10) {
    items.push({
      id: 'mdd-excellent',
      type: 'strength',
      title: '낮은 최대 낙폭',
      description: `MDD ${mdd.toFixed(1)}%로 리스크 관리가 우수합니다.`,
      impact: 'high',
    });
    score += 10;
  } else if (mdd < -25) {
    items.push({
      id: 'mdd-high',
      type: 'warning',
      title: '높은 최대 낙폭',
      description: `MDD ${mdd.toFixed(1)}%로 심각한 손실 위험이 있습니다.`,
      impact: 'high',
      actionable: '손절 조건을 강화하거나 포지션 크기를 줄이세요.',
    });
    score -= 15;
  } else if (mdd < -15) {
    items.push({
      id: 'mdd-moderate',
      type: 'weakness',
      title: '다소 높은 최대 낙폭',
      description: `MDD ${mdd.toFixed(1)}%입니다.`,
      impact: 'medium',
      actionable: '손절 조건 추가를 고려하세요.',
    });
    score -= 5;
  }

  // === 승률 분석 ===
  const winRate = metrics.winRate ?? 0;
  if (winRate > 60) {
    items.push({
      id: 'winrate-high',
      type: 'strength',
      title: '높은 승률',
      description: `승률 ${winRate.toFixed(1)}%로 안정적인 수익을 기대할 수 있습니다.`,
      impact: 'medium',
    });
    score += 10;
  } else if (winRate < 40) {
    items.push({
      id: 'winrate-low',
      type: 'weakness',
      title: '낮은 승률',
      description: `승률 ${winRate.toFixed(1)}%입니다. 손익비가 충분히 높아야 합니다.`,
      impact: 'medium',
      actionable: '진입 조건을 더 보수적으로 설정하세요.',
    });
    score -= 5;
  }

  // === 손익비 분석 ===
  const profitFactor = metrics.profitFactor ?? 0;
  if (profitFactor > 2) {
    items.push({
      id: 'pf-excellent',
      type: 'strength',
      title: '우수한 손익비',
      description: `손익비 ${profitFactor.toFixed(2)}로 수익이 손실의 2배 이상입니다.`,
      impact: 'high',
    });
    score += 10;
  } else if (profitFactor < 1) {
    items.push({
      id: 'pf-negative',
      type: 'warning',
      title: '손익비 1 미만',
      description: `손익비 ${profitFactor.toFixed(2)}로 손실이 수익보다 큽니다.`,
      impact: 'high',
      actionable: '익절 조건을 높이거나 손절 조건을 낮추세요.',
    });
    score -= 15;
  }

  // === 연속 손실 분석 ===
  const maxConsecLosses = metrics.maxConsecutiveLosses ?? 0;
  if (maxConsecLosses > 7) {
    items.push({
      id: 'streak-warning',
      type: 'warning',
      title: '긴 연속 손실',
      description: `최대 ${maxConsecLosses}회 연속 손실이 발생했습니다.`,
      impact: 'high',
      actionable: '추세 필터를 추가하거나 진입 조건을 강화하세요.',
    });
    score -= 10;
  }

  // === 거래 빈도 분석 ===
  const totalTrades = metrics.totalTrades ?? 0;
  if (totalTrades < 30) {
    items.push({
      id: 'trades-low',
      type: 'suggestion',
      title: '거래 샘플 부족',
      description: `총 ${totalTrades}회 거래로 통계적 신뢰도가 낮을 수 있습니다.`,
      impact: 'medium',
      actionable: '더 긴 백테스트 기간이나 다양한 시장 조건에서 테스트하세요.',
    });
  } else if (totalTrades > 500) {
    items.push({
      id: 'trades-high',
      type: 'suggestion',
      title: '높은 거래 빈도',
      description: `총 ${totalTrades}회 거래입니다. 수수료 영향을 고려하세요.`,
      impact: 'low',
    });
  }

  // === 개선 제안 ===
  // 승률은 높지만 손익비가 낮은 경우
  if (winRate > 50 && profitFactor < 1.3) {
    items.push({
      id: 'suggestion-rr',
      type: 'suggestion',
      title: '손익비 개선 필요',
      description: '승률은 양호하나 손익비가 낮습니다.',
      impact: 'medium',
      actionable: '익절 목표를 높이거나 손절을 더 빡빡하게 설정하세요.',
    });
  }

  // 손익비는 높지만 승률이 낮은 경우
  if (winRate < 45 && profitFactor > 1.5) {
    items.push({
      id: 'suggestion-winrate',
      type: 'suggestion',
      title: '심리적 부담 고려',
      description: '손익비는 양호하나 낮은 승률로 인한 심리적 부담이 있을 수 있습니다.',
      impact: 'low',
    });
  }

  // 점수 정규화
  score = Math.max(0, Math.min(100, score));

  // 등급 결정
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'F';

  // 요약 생성
  let summary: string;
  if (grade === 'A') {
    summary = '전략이 매우 우수합니다. 실거래 적용을 고려해볼 수 있습니다.';
  } else if (grade === 'B') {
    summary = '전략이 양호합니다. 일부 개선 후 실거래를 고려하세요.';
  } else if (grade === 'C') {
    summary = '전략에 개선이 필요합니다. 제안 사항을 검토하세요.';
  } else if (grade === 'D') {
    summary = '전략에 상당한 개선이 필요합니다. 핵심 로직을 재검토하세요.';
  } else {
    summary = '전략이 손실을 발생시킵니다. 전면 재설계가 필요합니다.';
  }

  return { score, grade, summary, items };
}

/**
 * AIAnalysis Props
 */
export interface AIAnalysisProps {
  /** 성과 지표 */
  metrics: Partial<IPerformanceMetrics>;
  /** 전략 이름 */
  strategyName?: string;
  /** AI 분석 요청 콜백 */
  onRequestAIAnalysis?: () => void;
  /** AI 분석 로딩 상태 */
  isLoading?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * 분석 아이템 아이콘
 */
const typeIcons: Record<AnalysisType, string> = {
  strength: '💪',
  weakness: '⚠️',
  suggestion: '💡',
  warning: '🚨',
};

/**
 * 분석 아이템 색상
 */
const typeColors: Record<AnalysisType, string> = {
  strength: 'border-green-500/30 bg-green-500/5',
  weakness: 'border-yellow-500/30 bg-yellow-500/5',
  suggestion: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-red-500/30 bg-red-500/5',
};

const typeLabels: Record<AnalysisType, string> = {
  strength: '강점',
  weakness: '약점',
  suggestion: '제안',
  warning: '경고',
};

/**
 * AI Analysis Component
 *
 * 백테스트 결과를 분석하여 전략 개선 제안
 * - 규칙 기반 자동 분석
 * - 강점/약점/제안/경고 분류
 * - 종합 점수 및 등급
 * - AI 심층 분석 요청 (선택)
 */
export function AIAnalysis({
  metrics,
  strategyName,
  onRequestAIAnalysis,
  isLoading = false,
  className,
}: AIAnalysisProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 분석 수행
  const analysis = useMemo(() => analyzeMetrics(metrics), [metrics]);

  // 타입별 아이템 그룹핑
  const groupedItems = useMemo(() => {
    const groups: Record<AnalysisType, AnalysisItem[]> = {
      warning: [],
      weakness: [],
      suggestion: [],
      strength: [],
    };
    analysis.items.forEach((item) => {
      groups[item.type].push(item);
    });
    return groups;
  }, [analysis.items]);

  // 아이템 토글
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 등급 색상
  const gradeColors: Record<string, string> = {
    A: 'text-green-400 bg-green-500/20',
    B: 'text-blue-400 bg-blue-500/20',
    C: 'text-yellow-400 bg-yellow-500/20',
    D: 'text-orange-400 bg-orange-500/20',
    F: 'text-red-400 bg-red-500/20',
  };

  return (
    <div className={cn('rounded-xl bg-gray-2 border border-gray-6', className)}>
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold">AI 전략 분석</h3>
              {strategyName && (
                <p className="text-sm text-gray-10">{strategyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 점수 */}
            <div className="text-right">
              <p className="text-xs text-gray-10">종합 점수</p>
              <p className="text-xl font-bold">{analysis.score}점</p>
            </div>
            {/* 등급 */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold',
                gradeColors[analysis.grade]
              )}
            >
              {analysis.grade}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-11">{analysis.summary}</p>
      </div>

      {/* 분석 결과 */}
      <div className="p-5 space-y-4">
        {/* 경고 (최우선 표시) */}
        {groupedItems.warning.length > 0 && (
          <div className="space-y-2">
            {groupedItems.warning.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-colors',
                  typeColors[item.type],
                  expandedItems.has(item.id) && 'ring-1 ring-red-500/50'
                )}
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{typeIcons[item.type]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        {typeLabels[item.type]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-11 mt-1">
                      {item.description}
                    </p>
                    {expandedItems.has(item.id) && item.actionable && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-3">
                        <p className="text-xs text-gray-10 mb-1">권장 조치</p>
                        <p className="text-sm">{item.actionable}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 기타 분석 */}
        {(['weakness', 'suggestion', 'strength'] as AnalysisType[]).map(
          (type) =>
            groupedItems[type].length > 0 && (
              <div key={type} className="space-y-2">
                <h4 className="text-xs text-gray-10 uppercase tracking-wider">
                  {typeLabels[type]} ({groupedItems[type].length})
                </h4>
                {groupedItems[type].map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-3/50',
                      typeColors[item.type]
                    )}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{typeIcons[item.type]}</span>
                      <span className="text-sm font-medium">{item.title}</span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          item.impact === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : item.impact === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {item.impact === 'high'
                          ? '중요'
                          : item.impact === 'medium'
                            ? '보통'
                            : '참고'}
                      </span>
                    </div>
                    {expandedItems.has(item.id) && (
                      <div className="mt-2 pl-7">
                        <p className="text-sm text-gray-11">
                          {item.description}
                        </p>
                        {item.actionable && (
                          <p className="text-sm text-blue-400 mt-1">
                            → {item.actionable}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
        )}

        {/* AI 심층 분석 버튼 */}
        {onRequestAIAnalysis && (
          <div className="pt-4 border-t border-gray-6">
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestAIAnalysis}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  AI 분석 중...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  AI 심층 분석 요청 (크레딧 10)
                </>
              )}
            </Button>
            <p className="text-xs text-gray-10 text-center mt-2">
              Claude AI가 전략을 심층 분석하고 구체적인 개선안을 제시합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAnalysis;
