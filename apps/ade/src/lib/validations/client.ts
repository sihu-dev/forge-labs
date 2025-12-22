/**
 * 고객 폼 검증 스키마
 */

import { z } from 'zod';

// 사업자등록번호 포맷 (000-00-00000)
const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;

// 전화번호 포맷
const phoneRegex = /^(01[016789]-?\d{3,4}-?\d{4}|0\d{1,2}-?\d{3,4}-?\d{4})$/;

export const clientSchema = z.object({
  type: z.enum(['individual', 'business'], {
    required_error: '고객 유형을 선택해주세요',
  }),
  name: z.string()
    .min(1, '상호/이름을 입력해주세요')
    .max(100, '100자 이내로 입력해주세요'),
  businessNumber: z.string()
    .regex(businessNumberRegex, '올바른 사업자등록번호 형식이 아닙니다 (000-00-00000)')
    .optional()
    .or(z.literal('')),
  representativeName: z.string()
    .max(50, '50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  phone: z.string()
    .regex(phoneRegex, '올바른 전화번호 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(200, '200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  businessType: z.string()
    .max(50, '50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  businessCategory: z.string()
    .max(50, '50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(1000, '1000자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // 사업자인 경우 사업자등록번호 필수
    if (data.type === 'business') {
      return data.businessNumber && data.businessNumber.length > 0;
    }
    return true;
  },
  {
    message: '사업자 고객은 사업자등록번호가 필수입니다',
    path: ['businessNumber'],
  }
);

export type ClientFormData = z.infer<typeof clientSchema>;

// 사업자등록번호 자동 포맷팅
export function formatBusinessNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
}

// 전화번호 자동 포맷팅
export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  }
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}
