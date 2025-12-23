/**
 * Claude AI 에이전트 - Anthropic API 연동
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';
import type {
  Program,
  AnalysisResult,
  BusinessPlanRequest,
  BusinessPlan,
} from '../types/index.js';
import { AnalysisResultSchema, BusinessPlanSchema } from '../types/index.js';

/**
 * Claude AI 클라이언트
 */
export class ClaudeAgent {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
    this.model = config.anthropic.model;
    this.maxTokens = config.anthropic.maxTokens;
    this.temperature = config.anthropic.temperature;

    log.info('ClaudeAgent initialized', {
      model: this.model,
      maxTokens: this.maxTokens,
    });
  }

  /**
   * 공고 적합도 분석
   */
  async analyzeProgram(program: Program): Promise<AnalysisResult> {
    log.info(`Analyzing program: ${program.title}`);

    const prompt = this.buildAnalysisPrompt(program);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0]?.type === 'text' ? message.content[0].text : '';

      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      const validated = AnalysisResultSchema.parse(analysisData);

      log.info(`Analysis completed for ${program.title}`, {
        score: validated.score,
        recommendation: validated.recommendation,
      });

      return validated;
    } catch (error) {
      log.error(`Failed to analyze program: ${program.title}`, error);
      throw error;
    }
  }

  /**
   * 적합도 분석 프롬프트 생성
   */
  private buildAnalysisPrompt(program: Program): string {
    const { myBusiness } = config;

    return `
당신은 정부지원사업 분석 전문가입니다.

[내 사업 정보]
- 서비스명: ${myBusiness.serviceName}
- 아이템: ${myBusiness.item}
- 분야: ${myBusiness.field}
- 창업단계: ${myBusiness.stage}
- 팀 구성: ${myBusiness.team}
- 기술스택: ${myBusiness.techStack}

[분석할 공고]
- 사업명: ${program.title}
- 주관기관: ${program.organization}
- 분야: ${program.category || 'N/A'}
- 지원대상: ${program.target || 'N/A'}
- 마감일: ${program.deadline}
- URL: ${program.url || 'N/A'}

다음 형식으로 JSON 응답해주세요:

{
  "score": 1-10 (적합도 점수, 1이 가장 낮고 10이 가장 높음),
  "recommendation": "강력추천" | "추천" | "검토필요" | "부적합",
  "matchReasons": ["이유1", "이유2", "이유3"],
  "concerns": ["우려사항1", "우려사항2"],
  "keyEvaluationCriteria": ["평가기준1", "평가기준2"],
  "preparationTips": ["준비팁1", "준비팁2"],
  "estimatedBudget": "예상 지원금액",
  "priority": "HIGH" | "MEDIUM" | "LOW"
}

**중요**: JSON만 응답하세요. 다른 텍스트나 설명 없이 순수 JSON만 출력해주세요.
`;
  }

  /**
   * 사업계획서 생성
   */
  async generateBusinessPlan(
    request: BusinessPlanRequest
  ): Promise<BusinessPlan> {
    log.info(`Generating business plan for: ${request.program.title}`);

    const prompt = this.buildBusinessPlanPrompt(request);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 8000, // 사업계획서는 더 많은 토큰 필요
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0]?.type === 'text' ? message.content[0].text : '';

      // JSON 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response');
      }

      const planData = JSON.parse(jsonMatch[0]);
      planData.generatedAt = new Date().toISOString();

      const validated = BusinessPlanSchema.parse(planData);

      log.info(`Business plan generated for ${request.program.title}`);

      return validated;
    } catch (error) {
      log.error(
        `Failed to generate business plan: ${request.program.title}`,
        error
      );
      throw error;
    }
  }

  /**
   * 사업계획서 생성 프롬프트
   */
  private buildBusinessPlanPrompt(request: BusinessPlanRequest): string {
    const { program, myBusiness, targetBudget, evaluationCriteria } = request;

    const criteriaText = evaluationCriteria
      ? evaluationCriteria.map((c) => `- ${c.name}: ${c.points}점`).join('\n')
      : '평가기준 정보 없음';

    return `
당신은 정부지원사업 사업계획서 작성 전문가입니다.
공고문의 평가기준을 분석하고, 제공된 사업 정보로 최적화된 사업계획서를 작성합니다.

[내 사업 정보]
- 서비스명: ${myBusiness.serviceName}
- 아이템: ${myBusiness.item}
- 분야: ${myBusiness.field}
- 창업단계: ${myBusiness.stage}
- 팀 구성: ${myBusiness.team}
- 기술스택: ${myBusiness.techStack}

[지원 공고]
- 사업명: ${program.title}
- 주관기관: ${program.organization}
- 분야: ${program.category || 'N/A'}
- 마감일: ${program.deadline}

[평가기준]
${criteriaText}

[목표 예산]
${targetBudget ? `${targetBudget.toLocaleString()}원` : '정보 없음'}

다음 JSON 형식으로 사업계획서를 생성해주세요:

{
  "title": "사업계획서 제목",
  "sections": [
    {
      "heading": "1. 창업아이템 개요",
      "content": "상세 내용...",
      "points": 30
    },
    {
      "heading": "2. 시장 분석",
      "content": "상세 내용...",
      "points": 25
    }
  ],
  "budget": {
    "total": 50000000,
    "items": [
      {
        "category": "인건비",
        "amount": 20000000,
        "percentage": 40,
        "justification": "개발인력 4인월 x 500만원"
      }
    ]
  },
  "checklist": [
    "필수서류 1",
    "필수서류 2"
  ],
  "expectedScore": {
    "total": 85,
    "breakdown": [
      {
        "criterion": "기술혁신성",
        "expectedPoints": 25,
        "maxPoints": 30
      }
    ]
  },
  "strategy": "전략 요약"
}

**중요**: JSON만 응답하세요. 다른 텍스트나 마크다운 없이 순수 JSON만 출력해주세요.
`;
  }

  /**
   * 범용 프롬프트 실행
   */
  async prompt(userMessage: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      return message.content[0]?.type === 'text' ? message.content[0].text : '';
    } catch (error) {
      log.error('Failed to execute prompt', error);
      throw error;
    }
  }
}

export const claudeAgent = new ClaudeAgent();
