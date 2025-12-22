/**
 * ADE - 이미지 분석 API
 * Claude Vision API를 사용한 명함 OCR 및 색상 추출
 */

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, type } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: '이미지가 필요합니다' },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      // API 키 없으면 더미 데이터 반환 (개발용)
      return NextResponse.json({
        success: true,
        data: getDummyData(type),
      });
    }

    const prompt = getPromptForType(type);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/png',
                  data: image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return NextResponse.json(
        { error: '이미지 분석 실패' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: '분석 결과 없음' },
        { status: 500 }
      );
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'JSON 파싱 실패' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: '이미지 분석 중 오류 발생' },
      { status: 500 }
    );
  }
}

function getPromptForType(type: string): string {
  switch (type) {
    case 'business_card':
      return `이 명함 이미지를 분석하여 다음 정보를 추출해주세요.
반드시 JSON 형식으로만 응답해주세요.

{
  "name": "이름",
  "title": "직함/직위",
  "company": "회사명",
  "email": "이메일",
  "phone": "전화번호",
  "website": "웹사이트",
  "address": "주소"
}

찾을 수 없는 정보는 null로 표시하세요.
한국어와 영어 모두 인식해주세요.`;

    case 'colors':
      return `이 이미지에서 주요 색상을 추출해주세요.
반드시 JSON 형식으로만 응답해주세요.

{
  "primary": "#XXXXXX",
  "secondary": "#XXXXXX",
  "accent": "#XXXXXX",
  "palette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"]
}

색상은 6자리 HEX 코드로 반환하세요.
가장 눈에 띄는 브랜드 색상을 primary로 지정하세요.
흰색, 검정색, 회색은 제외하고 추출하세요.`;

    default:
      return `이 이미지의 내용을 분석하고 JSON 형식으로 설명해주세요.`;
  }
}

function getDummyData(type: string): Record<string, unknown> {
  switch (type) {
    case 'business_card':
      return {
        name: '홍길동',
        title: '대표이사',
        company: 'ABC 컴퍼니',
        email: 'hong@abc.com',
        phone: '010-1234-5678',
        website: 'www.abc.com',
        address: '서울시 강남구',
      };

    case 'colors':
      return {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#10B981',
        palette: ['#3B82F6', '#1E40AF', '#10B981', '#F59E0B', '#EF4444'],
      };

    default:
      return {};
  }
}
