/**
 * @module useAIFunctions
 * @description 스프레드시트 AI 함수 실행 훅
 *
 * 지원 함수:
 * - =AI_SUMMARY() - 입찰 공고 요약
 * - =AI_SCORE() - 적합도 점수
 * - =AI_MATCH() - 제품 매칭
 * - =AI_KEYWORDS() - 키워드 추출
 * - =AI_DEADLINE() - 마감일 분석
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

export type AIFunctionName =
  | 'AI_SUMMARY'
  | 'AI_SCORE'
  | 'AI_MATCH'
  | 'AI_KEYWORDS'
  | 'AI_DEADLINE';

export interface AIFunctionResult {
  value: string | number;
  display: string;
  loading: boolean;
  error: string | null;
}

export interface AIFunctionContext {
  title: string;
  organization?: string;
  description?: string;
  deadline?: string;
}

interface CacheEntry {
  result: AIFunctionResult;
  timestamp: number;
}

// ============================================================================
// 상수
// ============================================================================

const AI_FUNCTION_REGEX = /^=AI_(SUMMARY|SCORE|MATCH|KEYWORDS|DEADLINE)\(\)$/i;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시

// ============================================================================
// Hook
// ============================================================================

export interface UseAIFunctionsOptions {
  apiEndpoint?: string;
  cacheEnabled?: boolean;
  onResult?: (funcName: AIFunctionName, result: AIFunctionResult) => void;
  onError?: (funcName: AIFunctionName, error: Error) => void;
}

export interface UseAIFunctionsReturn {
  // 상태
  isLoading: boolean;
  results: Map<string, AIFunctionResult>;

  // 액션
  executeFunction: (
    funcName: AIFunctionName,
    context: AIFunctionContext,
    cellKey?: string
  ) => Promise<AIFunctionResult>;
  parseAndExecute: (
    formula: string,
    context: AIFunctionContext,
    cellKey?: string
  ) => Promise<AIFunctionResult | null>;
  clearCache: () => void;

  // 유틸
  isAIFunction: (formula: string) => boolean;
  getFunctionName: (formula: string) => AIFunctionName | null;
}

export function useAIFunctions(
  options: UseAIFunctionsOptions = {}
): UseAIFunctionsReturn {
  const {
    apiEndpoint = '/api/v2/ai/functions',
    cacheEnabled = true,
    onResult,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Map<string, AIFunctionResult>>(new Map());
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // AI 함수인지 확인
  const isAIFunction = useCallback((formula: string): boolean => {
    return AI_FUNCTION_REGEX.test(formula.trim());
  }, []);

  // 함수명 추출
  const getFunctionName = useCallback((formula: string): AIFunctionName | null => {
    const match = formula.trim().match(AI_FUNCTION_REGEX);
    if (match) {
      return `AI_${match[1].toUpperCase()}` as AIFunctionName;
    }
    return null;
  }, []);

  // 캐시 키 생성
  const getCacheKey = useCallback(
    (funcName: AIFunctionName, context: AIFunctionContext): string => {
      return `${funcName}:${context.title}:${context.organization || ''}`;
    },
    []
  );

  // 캐시 조회
  const getFromCache = useCallback(
    (key: string): AIFunctionResult | null => {
      if (!cacheEnabled) return null;

      const entry = cacheRef.current.get(key);
      if (!entry) return null;

      // TTL 체크
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cacheRef.current.delete(key);
        return null;
      }

      return entry.result;
    },
    [cacheEnabled]
  );

  // 캐시 저장
  const saveToCache = useCallback(
    (key: string, result: AIFunctionResult): void => {
      if (!cacheEnabled) return;

      cacheRef.current.set(key, {
        result,
        timestamp: Date.now(),
      });
    },
    [cacheEnabled]
  );

  // 함수 실행
  const executeFunction = useCallback(
    async (
      funcName: AIFunctionName,
      context: AIFunctionContext,
      cellKey?: string
    ): Promise<AIFunctionResult> => {
      const cacheKey = getCacheKey(funcName, context);

      // 캐시 확인
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 로딩 상태 설정
      const loadingResult: AIFunctionResult = {
        value: '',
        display: '로딩...',
        loading: true,
        error: null,
      };

      if (cellKey) {
        setResults((prev) => new Map(prev).set(cellKey, loadingResult));
      }
      setIsLoading(true);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function: funcName,
            ...context,
          }),
        });

        if (!response.ok) {
          throw new Error(`API 오류: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '알 수 없는 오류');
        }

        const result: AIFunctionResult = {
          value: data.data.value,
          display: data.data.display,
          loading: false,
          error: null,
        };

        // 캐시 저장
        saveToCache(cacheKey, result);

        // 결과 저장
        if (cellKey) {
          setResults((prev) => new Map(prev).set(cellKey, result));
        }

        onResult?.(funcName, result);
        return result;
      } catch (error) {
        const errorResult: AIFunctionResult = {
          value: '#ERROR',
          display: error instanceof Error ? error.message : '오류',
          loading: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        };

        if (cellKey) {
          setResults((prev) => new Map(prev).set(cellKey, errorResult));
        }

        onError?.(funcName, error instanceof Error ? error : new Error('Unknown'));
        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, getCacheKey, getFromCache, saveToCache, onResult, onError]
  );

  // 수식 파싱 후 실행
  const parseAndExecute = useCallback(
    async (
      formula: string,
      context: AIFunctionContext,
      cellKey?: string
    ): Promise<AIFunctionResult | null> => {
      const funcName = getFunctionName(formula);
      if (!funcName) return null;

      return executeFunction(funcName, context, cellKey);
    },
    [getFunctionName, executeFunction]
  );

  // 캐시 초기화
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setResults(new Map());
  }, []);

  return {
    isLoading,
    results,
    executeFunction,
    parseAndExecute,
    clearCache,
    isAIFunction,
    getFunctionName,
  };
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * AI 함수 결과를 셀 표시용으로 포맷팅
 */
export function formatAIResult(
  funcName: AIFunctionName,
  result: AIFunctionResult
): string {
  if (result.loading) return '⏳';
  if (result.error) return '#ERROR';

  switch (funcName) {
    case 'AI_SCORE':
      return `${result.value}%`;
    case 'AI_MATCH':
    case 'AI_KEYWORDS':
    case 'AI_SUMMARY':
    case 'AI_DEADLINE':
    default:
      return result.display;
  }
}

/**
 * AI 함수 설명 조회
 */
export function getAIFunctionDescription(funcName: AIFunctionName): string {
  const descriptions: Record<AIFunctionName, string> = {
    AI_SUMMARY: '입찰 공고를 2-3문장으로 요약',
    AI_SCORE: '낙찰 가능성 점수 (0-100)',
    AI_MATCH: '가장 적합한 제품 추천',
    AI_KEYWORDS: '핵심 키워드 3개 추출',
    AI_DEADLINE: '마감일 분석 및 권장 액션',
  };
  return descriptions[funcName];
}
