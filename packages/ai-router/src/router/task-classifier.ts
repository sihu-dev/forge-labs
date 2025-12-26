/**
 * TaskClassifier - 태스크 유형에 따른 모델 자동 선택
 *
 * 라우팅 전략:
 * - Haiku (70%): 키워드 추출, 단순 분류, 짧은 요약
 * - Sonnet (25%): 점수화, 복잡한 매칭, 긴 요약
 * - Opus (5%): 복잡한 분석, 다단계 추론
 */

import type {
  TaskType,
  TaskClassification,
  AIModel,
  ClassifierConfig,
} from '../types.js';
import { DEFAULT_CLASSIFIER_CONFIG } from '../types.js';

// 태스크 패턴 정의
const TASK_PATTERNS: Record<TaskType, RegExp[]> = {
  keyword_extraction: [
    /키워드/i,
    /핵심.*추출/i,
    /keyword/i,
    /extract/i,
    /태그/i,
  ],
  scoring: [
    /점수/i,
    /스코어/i,
    /score/i,
    /평가/i,
    /적합도/i,
    /rating/i,
  ],
  summary: [
    /요약/i,
    /summary/i,
    /summarize/i,
    /간략/i,
    /줄여/i,
  ],
  product_match: [
    /제품.*매칭/i,
    /product.*match/i,
    /추천/i,
    /적합.*제품/i,
    /recommend/i,
  ],
  complex_analysis: [
    /분석/i,
    /analysis/i,
    /비교/i,
    /전략/i,
    /심층/i,
    /종합/i,
  ],
  unknown: [],
};

// 토큰 수 추정 (대략 4글자 = 1 토큰)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class TaskClassifier {
  private config: ClassifierConfig;

  constructor(config: Partial<ClassifierConfig> = {}) {
    this.config = { ...DEFAULT_CLASSIFIER_CONFIG, ...config };
  }

  /**
   * 태스크 유형 감지
   */
  detectTaskType(task: string): TaskType {
    for (const [type, patterns] of Object.entries(TASK_PATTERNS)) {
      if (type === 'unknown') continue;
      for (const pattern of patterns) {
        if (pattern.test(task)) {
          return type as TaskType;
        }
      }
    }
    return 'unknown';
  }

  /**
   * 모델 선택 로직
   */
  selectModel(taskType: TaskType, tokenCount: number): AIModel {
    // 복잡한 분석은 Opus
    if (this.config.complexTaskTypes.includes(taskType)) {
      return 'opus';
    }

    // 토큰 수 기반 라우팅
    if (tokenCount <= this.config.maxTokensForHaiku) {
      // 간단한 태스크는 Haiku
      if (['keyword_extraction', 'summary'].includes(taskType)) {
        return 'haiku';
      }
    }

    if (tokenCount <= this.config.maxTokensForSonnet) {
      // 중간 복잡도는 Sonnet
      return 'sonnet';
    }

    // 긴 컨텍스트는 Sonnet (Opus보다 비용 효율적)
    return 'sonnet';
  }

  /**
   * 태스크 분류 및 모델 결정
   */
  classify(task: string, context?: string): TaskClassification {
    const fullText = context ? `${task}\n${context}` : task;
    const tokenCount = estimateTokens(fullText);
    const taskType = this.detectTaskType(task);
    const model = this.selectModel(taskType, tokenCount);

    const reasons = this.buildReason(taskType, model, tokenCount);

    return {
      type: taskType,
      model,
      estimatedTokens: tokenCount,
      reason: reasons,
    };
  }

  /**
   * 분류 이유 생성
   */
  private buildReason(
    taskType: TaskType,
    model: AIModel,
    tokenCount: number
  ): string {
    const typeNames: Record<TaskType, string> = {
      keyword_extraction: '키워드 추출',
      scoring: '점수 평가',
      summary: '요약',
      product_match: '제품 매칭',
      complex_analysis: '복잡 분석',
      unknown: '알 수 없음',
    };

    const modelNames: Record<AIModel, string> = {
      haiku: 'Haiku (빠르고 저렴)',
      sonnet: 'Sonnet (균형)',
      opus: 'Opus (고성능)',
    };

    return `태스크: ${typeNames[taskType]}, 토큰: ~${tokenCount}, 모델: ${modelNames[model]}`;
  }

  /**
   * 특정 모델 강제 지정 시 검증
   */
  validateForceModel(
    forceModel: AIModel,
    classification: TaskClassification
  ): { valid: boolean; warning?: string } {
    // Haiku로 복잡한 분석 강제 시 경고
    if (
      forceModel === 'haiku' &&
      this.config.complexTaskTypes.includes(classification.type)
    ) {
      return {
        valid: true,
        warning: '복잡한 분석에 Haiku 사용 시 품질 저하 가능',
      };
    }

    // Opus로 단순 태스크 강제 시 비용 경고
    if (
      forceModel === 'opus' &&
      ['keyword_extraction', 'summary'].includes(classification.type)
    ) {
      return {
        valid: true,
        warning: '단순 태스크에 Opus 사용은 비용 비효율적',
      };
    }

    return { valid: true };
  }
}

// 싱글톤 인스턴스
let classifierInstance: TaskClassifier | null = null;

export function getTaskClassifier(
  config?: Partial<ClassifierConfig>
): TaskClassifier {
  if (!classifierInstance || config) {
    classifierInstance = new TaskClassifier(config);
  }
  return classifierInstance;
}
