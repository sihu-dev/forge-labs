/**
 * AI 함수 셀 렌더러
 *
 * 스프레드시트 셀에서 AI 함수 결과를 시각적으로 표시
 * =AI_SCORE(), =AI_SUMMARY() 등의 결과 렌더링
 */

import type Handsontable from 'handsontable';

// ============================================================================
// 타입 정의
// ============================================================================

export interface AIFunctionCellMeta {
  aiFunction?: string;
  aiLoading?: boolean;
  aiError?: string;
  aiValue?: string | number;
}

// ============================================================================
// AI 함수 렌더러
// ============================================================================

/**
 * AI 점수 렌더러 (=AI_SCORE())
 */
export function aiScoreRenderer(
  _instance: Handsontable,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: number | string | null,
  cellProperties: Handsontable.CellProperties & AIFunctionCellMeta
): HTMLTableCellElement {
  td.innerHTML = '';
  td.className = 'htCenter htMiddle';

  // 로딩 상태
  if (cellProperties.aiLoading) {
    td.innerHTML = '<span class="animate-pulse text-gray-400">⏳</span>';
    return td;
  }

  // 에러 상태
  if (cellProperties.aiError) {
    td.innerHTML = '<span class="text-red-500 text-xs">#ERROR</span>';
    td.title = cellProperties.aiError;
    return td;
  }

  // 값이 없는 경우
  if (value === null || value === undefined) {
    td.textContent = '-';
    return td;
  }

  const score = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(score)) {
    td.textContent = String(value);
    return td;
  }

  // 점수 시각화
  const container = document.createElement('div');
  container.className = 'flex items-center gap-2 justify-center';

  // 프로그레스 바
  const bar = document.createElement('div');
  bar.className = 'w-16 h-2 bg-gray-200 rounded-full overflow-hidden';

  const fill = document.createElement('div');
  fill.className = `h-full transition-all ${
    score >= 70
      ? 'bg-green-500'
      : score >= 40
      ? 'bg-yellow-500'
      : 'bg-red-400'
  }`;
  fill.style.width = `${Math.min(100, Math.max(0, score))}%`;
  bar.appendChild(fill);

  // 점수 텍스트
  const label = document.createElement('span');
  label.className = `text-sm font-medium ${
    score >= 70
      ? 'text-green-600'
      : score >= 40
      ? 'text-yellow-600'
      : 'text-red-500'
  }`;
  label.textContent = `${score}`;

  container.appendChild(bar);
  container.appendChild(label);
  td.appendChild(container);

  return td;
}

/**
 * AI 요약 렌더러 (=AI_SUMMARY())
 */
export function aiSummaryRenderer(
  _instance: Handsontable,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: string | null,
  cellProperties: Handsontable.CellProperties & AIFunctionCellMeta
): HTMLTableCellElement {
  td.innerHTML = '';
  td.className = 'htLeft htMiddle text-sm';

  // 로딩 상태
  if (cellProperties.aiLoading) {
    td.innerHTML = '<span class="animate-pulse text-gray-400">요약 생성 중...</span>';
    return td;
  }

  // 에러 상태
  if (cellProperties.aiError) {
    td.innerHTML = '<span class="text-red-500 text-xs">#ERROR</span>';
    td.title = cellProperties.aiError;
    return td;
  }

  if (!value) {
    td.textContent = '-';
    return td;
  }

  // 긴 텍스트 말줄임
  const maxLength = 100;
  const displayText = value.length > maxLength
    ? value.slice(0, maxLength) + '...'
    : value;

  td.textContent = displayText;
  td.title = value; // 전체 텍스트는 툴팁으로

  return td;
}

/**
 * AI 매칭 렌더러 (=AI_MATCH())
 */
export function aiMatchRenderer(
  _instance: Handsontable,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: string | null,
  cellProperties: Handsontable.CellProperties & AIFunctionCellMeta
): HTMLTableCellElement {
  td.innerHTML = '';
  td.className = 'htCenter htMiddle';

  // 로딩 상태
  if (cellProperties.aiLoading) {
    td.innerHTML = '<span class="animate-pulse text-gray-400">매칭 중...</span>';
    return td;
  }

  // 에러 상태
  if (cellProperties.aiError) {
    td.innerHTML = '<span class="text-red-500 text-xs">#ERROR</span>';
    td.title = cellProperties.aiError;
    return td;
  }

  if (!value) {
    td.textContent = '-';
    return td;
  }

  // 제품명 배지
  const badge = document.createElement('span');
  badge.className = 'inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800';
  badge.textContent = value;
  td.appendChild(badge);

  return td;
}

/**
 * AI 키워드 렌더러 (=AI_KEYWORDS())
 */
export function aiKeywordsRenderer(
  _instance: Handsontable,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: string | null,
  cellProperties: Handsontable.CellProperties & AIFunctionCellMeta
): HTMLTableCellElement {
  td.innerHTML = '';
  td.className = 'htLeft htMiddle';

  // 로딩 상태
  if (cellProperties.aiLoading) {
    td.innerHTML = '<span class="animate-pulse text-gray-400">추출 중...</span>';
    return td;
  }

  // 에러 상태
  if (cellProperties.aiError) {
    td.innerHTML = '<span class="text-red-500 text-xs">#ERROR</span>';
    td.title = cellProperties.aiError;
    return td;
  }

  if (!value) {
    td.textContent = '-';
    return td;
  }

  const keywords = value.split(',').map((k) => k.trim()).filter(Boolean);

  const container = document.createElement('div');
  container.className = 'flex flex-wrap gap-1';

  keywords.slice(0, 5).forEach((keyword) => {
    const tag = document.createElement('span');
    tag.className = 'px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded';
    tag.textContent = keyword;
    container.appendChild(tag);
  });

  td.appendChild(container);

  return td;
}

/**
 * AI 데드라인 렌더러 (=AI_DEADLINE())
 */
export function aiDeadlineRenderer(
  _instance: Handsontable,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: string | null,
  cellProperties: Handsontable.CellProperties & AIFunctionCellMeta
): HTMLTableCellElement {
  td.innerHTML = '';
  td.className = 'htCenter htMiddle';

  // 로딩 상태
  if (cellProperties.aiLoading) {
    td.innerHTML = '<span class="animate-pulse text-gray-400">분석 중...</span>';
    return td;
  }

  // 에러 상태
  if (cellProperties.aiError) {
    td.innerHTML = '<span class="text-red-500 text-xs">#ERROR</span>';
    td.title = cellProperties.aiError;
    return td;
  }

  if (!value) {
    td.textContent = '-';
    return td;
  }

  // D-day 파싱
  const ddayMatch = value.match(/D-(\d+)/);
  if (ddayMatch) {
    const days = parseInt(ddayMatch[1], 10);
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center';

    const dday = document.createElement('span');
    dday.className = `text-sm font-bold ${
      days <= 3
        ? 'text-red-600'
        : days <= 7
        ? 'text-yellow-600'
        : 'text-gray-600'
    }`;
    dday.textContent = `D-${days}`;

    const action = document.createElement('span');
    action.className = 'text-xs text-gray-500';
    action.textContent = value.replace(/D-\d+[:\s]*/, '').slice(0, 20);

    container.appendChild(dday);
    container.appendChild(action);
    td.appendChild(container);
  } else {
    td.textContent = value;
  }

  return td;
}

// ============================================================================
// 렌더러 맵
// ============================================================================

export const AI_RENDERERS = {
  AI_SCORE: aiScoreRenderer,
  AI_SUMMARY: aiSummaryRenderer,
  AI_MATCH: aiMatchRenderer,
  AI_KEYWORDS: aiKeywordsRenderer,
  AI_DEADLINE: aiDeadlineRenderer,
} as const;

export type AIRendererType = keyof typeof AI_RENDERERS;
