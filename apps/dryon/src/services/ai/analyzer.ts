/**
 * AI 기반 공고 분석 서비스
 * OpenAI GPT-4를 사용하여 공고의 사업 적합성을 분석합니다.
 */

import OpenAI from 'openai';
import { log } from '../../utils/logger.js';
import type {
  Program,
  AnalysisResult,
  AnalyzedProgram,
  MyBusiness,
} from '../../types/index.js';
import { AnalysisResultSchema } from '../../types/index.js';

export class ProgramAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * 단일 공고 분석
   */
  async analyzeProgram(
    program: Program,
    myBusiness: MyBusiness
  ): Promise<AnalyzedProgram> {
    try {
      log.info(`🤖 분석 시작: ${program.title}`);

      const prompt = this.createAnalysisPrompt(program, myBusiness);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API returned empty response');
      }

      const analysisData = JSON.parse(content);
      const analysis = AnalysisResultSchema.parse(analysisData);

      log.info(
        `✅ 분석 완료: ${program.title} - ${analysis.recommendation} (점수: ${analysis.score}/10)`
      );

      return {
        ...program,
        analysis,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      log.error(`분석 실패: ${program.title}`, error);
      // 분석 실패 시 기본 결과 반환
      return {
        ...program,
        analysis: this.createDefaultAnalysis(),
        analyzedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 여러 공고 일괄 분석
   */
  async analyzePrograms(
    programs: Program[],
    myBusiness: MyBusiness
  ): Promise<AnalyzedProgram[]> {
    log.info(`🤖 ${programs.length}개 공고 분석 시작`);

    const results: AnalyzedProgram[] = [];

    for (const program of programs) {
      try {
        const analyzed = await this.analyzeProgram(program, myBusiness);
        results.push(analyzed);

        // Rate limiting 방지 (OpenAI API: 3 RPM for free tier)
        await this.delay(1000);
      } catch (error) {
        log.error(`공고 분석 실패: ${program.title}`, error);
        // 실패한 경우에도 기본 분석 결과 추가
        results.push({
          ...program,
          analysis: this.createDefaultAnalysis(),
          analyzedAt: new Date().toISOString(),
        });
      }
    }

    log.info(`✅ ${results.length}개 공고 분석 완료`);
    return results;
  }

  /**
   * 시스템 프롬프트
   */
  private getSystemPrompt(): string {
    return `당신은 스타트업 지원사업 전문 컨설턴트입니다.
정부 및 민간 지원사업 공고를 분석하고, 창업자의 사업과 적합성을 평가하는 전문가입니다.

평가 기준:
1. 사업 단계 적합성 (초기/성장기/확장기)
2. 기술 스택 및 분야 일치도
3. 지원 내용의 실질적 도움 정도
4. 선정 가능성 (경쟁률, 평가 기준)
5. 준비 기간 및 난이도

반드시 JSON 형식으로 응답하세요:
{
  "score": 1-10 (정수),
  "recommendation": "강력추천" | "추천" | "검토필요" | "부적합",
  "matchReasons": ["이유1", "이유2", ...],
  "concerns": ["우려사항1", "우려사항2", ...],
  "keyEvaluationCriteria": ["평가기준1", "평가기준2", ...],
  "preparationTips": ["준비팁1", "준비팁2", ...],
  "estimatedBudget": "예상 지원금액 (선택사항)",
  "priority": "HIGH" | "MEDIUM" | "LOW"
}`;
  }

  /**
   * 분석 프롬프트 생성
   */
  private createAnalysisPrompt(
    program: Program,
    myBusiness: MyBusiness
  ): string {
    return `다음 지원사업 공고를 분석해주세요.

[내 사업 정보]
- 서비스명: ${myBusiness.serviceName}
- 아이템: ${myBusiness.item}
- 분야: ${myBusiness.field}
- 단계: ${myBusiness.stage}
- 팀 구성: ${myBusiness.team}
- 기술 스택: ${myBusiness.techStack}
${myBusiness.additionalInfo ? `- 추가 정보: ${JSON.stringify(myBusiness.additionalInfo, null, 2)}` : ''}

[공고 정보]
- 제목: ${program.title}
- 주관기관: ${program.organization}
- 카테고리: ${program.category || 'N/A'}
- 대상: ${program.target || 'N/A'}
- 마감일: ${program.deadline}
- URL: ${program.url || 'N/A'}
${program.memo ? `- 상세 정보:\n${program.memo}` : ''}

위 정보를 바탕으로 사업 적합성을 분석하고, JSON 형식으로 응답해주세요.

분석 시 고려사항:
1. 우리 사업이 공고의 지원 대상에 부합하는가?
2. 우리 기술 스택과 분야가 공고의 중점 분야와 일치하는가?
3. 마감일까지 충분한 준비 기간이 있는가?
4. 지원금 규모와 지원 내용이 우리에게 실질적 도움이 되는가?
5. 선정 가능성은 어느 정도인가? (경쟁률, 평가 기준)

구체적이고 실용적인 분석을 제공해주세요.`;
  }

  /**
   * 기본 분석 결과 (분석 실패 시)
   */
  private createDefaultAnalysis(): AnalysisResult {
    return {
      score: 5,
      recommendation: '검토필요',
      matchReasons: ['자동 분석 실패로 수동 검토가 필요합니다.'],
      concerns: ['AI 분석을 수행할 수 없었습니다.'],
      keyEvaluationCriteria: ['수동으로 공고를 확인하세요.'],
      preparationTips: ['공고 원문을 직접 확인하시기 바랍니다.'],
      priority: 'MEDIUM',
    };
  }

  /**
   * 지연 함수 (Rate limiting)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 분석 결과 필터링 및 정렬
   */
  static filterAndSort(
    analyzedPrograms: AnalyzedProgram[],
    options?: {
      minScore?: number;
      recommendations?: Array<'강력추천' | '추천' | '검토필요' | '부적합'>;
      priorities?: Array<'HIGH' | 'MEDIUM' | 'LOW'>;
    }
  ): AnalyzedProgram[] {
    let filtered = analyzedPrograms;

    // 점수 필터
    if (options?.minScore) {
      filtered = filtered.filter((p) => p.analysis.score >= options.minScore!);
    }

    // 추천도 필터
    if (options?.recommendations && options.recommendations.length > 0) {
      filtered = filtered.filter((p) =>
        options.recommendations!.includes(p.analysis.recommendation)
      );
    }

    // 우선순위 필터
    if (options?.priorities && options.priorities.length > 0) {
      filtered = filtered.filter((p) =>
        options.priorities!.includes(p.analysis.priority)
      );
    }

    // 정렬: 점수 높은 순 -> 우선순위 높은 순
    return filtered.sort((a, b) => {
      // 1차: 점수
      if (b.analysis.score !== a.analysis.score) {
        return b.analysis.score - a.analysis.score;
      }

      // 2차: 우선순위
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (
        priorityOrder[b.analysis.priority] - priorityOrder[a.analysis.priority]
      );
    });
  }
}
