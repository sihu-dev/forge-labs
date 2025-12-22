/**
 * 견적서 폼 검증 스키마
 */

import { z } from 'zod';

// 품목 스키마
export const quoteItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '품목명을 입력해주세요'),
  description: z.string().optional(),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  unit: z.string().default('개'),
  unitPrice: z.number().min(0, '단가는 0 이상이어야 합니다'),
  amount: z.number(),
  taxRate: z.number().default(10),
});

export type QuoteItemFormData = z.infer<typeof quoteItemSchema>;

// 견적서 스키마
export const quoteSchema = z.object({
  // Step 1: 고객 선택
  clientId: z.string().min(1, '고객을 선택해주세요'),

  // Step 2: 견적 내용
  title: z.string().min(1, '견적 제목을 입력해주세요').max(200),
  items: z.array(quoteItemSchema).min(1, '최소 1개 이상의 품목이 필요합니다'),

  // Step 3: 조건
  validDays: z.number().min(1).max(365).default(14),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

// Step별 스키마
export const quoteStep1Schema = quoteSchema.pick({ clientId: true });
export const quoteStep2Schema = quoteSchema.pick({ title: true, items: true });
export const quoteStep3Schema = quoteSchema.pick({
  validDays: true,
  paymentTerms: true,
  deliveryTerms: true,
  notes: true,
});

// 기본값
export const defaultQuoteItem: QuoteItemFormData = {
  id: '',
  name: '',
  description: '',
  quantity: 1,
  unit: '개',
  unitPrice: 0,
  amount: 0,
  taxRate: 10,
};

export const defaultQuoteFormData: QuoteFormData = {
  clientId: '',
  title: '',
  items: [],
  validDays: 14,
  paymentTerms: '',
  deliveryTerms: '',
  notes: '',
};

// 금액 계산
export function calculateItemAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateQuoteTotals(items: QuoteItemFormData[]) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * 0.1); // 10% 부가세
  const totalAmount = subtotal + taxAmount;

  return { subtotal, taxAmount, totalAmount };
}

// 유효기한 계산
export function calculateValidUntil(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ID 생성
export function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
