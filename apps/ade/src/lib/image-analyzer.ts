/**
 * ADE - 이미지 분석기
 * Claude Vision API를 사용한 명함 OCR 및 색상 추출
 */

import type {
  ImageAnalysisResult,
  ExtractedBusinessCard,
  ExtractedColors,
  CardData,
} from '../types';

/**
 * 이미지를 Base64로 변환
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64, 부분 제거
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 타입 감지
 */
export function detectImageType(
  file: File
): 'business_card' | 'logo' | 'photo' | 'product' | 'unknown' {
  const name = file.name.toLowerCase();

  if (name.includes('card') || name.includes('명함')) {
    return 'business_card';
  }
  if (name.includes('logo') || name.includes('로고')) {
    return 'logo';
  }
  if (name.includes('profile') || name.includes('프로필') || name.includes('photo')) {
    return 'photo';
  }
  if (name.includes('product') || name.includes('상품')) {
    return 'product';
  }

  return 'unknown';
}

/**
 * Claude Vision API로 명함 분석
 */
export async function analyzeBusinessCard(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<ExtractedBusinessCard> {
  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      mimeType,
      type: 'business_card',
    }),
  });

  if (!response.ok) {
    throw new Error('명함 분석 실패');
  }

  const result = await response.json();
  return result.data as ExtractedBusinessCard;
}

/**
 * 이미지에서 색상 추출
 */
export async function extractColors(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<ExtractedColors> {
  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      mimeType,
      type: 'colors',
    }),
  });

  if (!response.ok) {
    throw new Error('색상 추출 실패');
  }

  const result = await response.json();
  return result.data as ExtractedColors;
}

/**
 * 명함 이미지 → CardData 변환
 */
export async function businessCardToCardData(file: File): Promise<CardData> {
  const base64 = await imageToBase64(file);
  const mimeType = file.type || 'image/png';

  const extracted = await analyzeBusinessCard(base64, mimeType);

  return {
    type: 'card',
    name: extracted.name || '',
    title: extracted.title,
    company: extracted.company,
    email: extracted.email,
    phone: extracted.phone,
    website: extracted.website,
    address: extracted.address,
  };
}

/**
 * 로고 이미지 → 테마 색상 추출
 */
export async function logoToThemeColors(
  file: File
): Promise<{ primaryColor: string; secondaryColor?: string }> {
  const base64 = await imageToBase64(file);
  const mimeType = file.type || 'image/png';

  const colors = await extractColors(base64, mimeType);

  return {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
  };
}

/**
 * 클라이언트 사이드 색상 추출 (Canvas API 사용)
 * API 호출 없이 빠른 색상 추출
 */
export function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context 생성 실패'));
        return;
      }

      // 작은 크기로 리사이즈 (성능)
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      // 색상 빈도 계산
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 투명 픽셀 무시
        if (a < 128) continue;

        // 흰색/검정색에 가까운 색상 무시
        const brightness = (r + g + b) / 3;
        if (brightness > 240 || brightness < 15) continue;

        // 색상을 양자화 (비슷한 색상 그룹화)
        const quantizedR = Math.round(r / 32) * 32;
        const quantizedG = Math.round(g / 32) * 32;
        const quantizedB = Math.round(b / 32) * 32;

        const hex = rgbToHex(quantizedR, quantizedG, quantizedB);
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      // 빈도 순으로 정렬
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      if (sortedColors.length === 0) {
        resolve({
          primary: '#3B82F6',
          palette: ['#3B82F6'],
        });
        return;
      }

      resolve({
        primary: sortedColors[0],
        secondary: sortedColors[1],
        accent: sortedColors[2],
        palette: sortedColors.slice(0, 5),
      });
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = imageUrl;
  });
}

/**
 * RGB to Hex 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.min(255, Math.max(0, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * 이미지 리사이즈 (업로드 전 최적화)
 */
export function resizeImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context 생성 실패'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 변환 실패'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}
