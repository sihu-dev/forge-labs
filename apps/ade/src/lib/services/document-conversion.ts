/**
 * 문서 전환 서비스
 * Quote → Contract → Invoice → TaxInvoice
 */

// 견적서 → 계약서 전환
export function createContractFromQuote(quote: {
  id: string;
  clientId: string;
  title: string;
  items: unknown[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 기본 1개월

  return {
    quote_id: quote.id,
    client_id: quote.clientId,
    title: `${quote.title} 계약서`,
    project_name: quote.title,
    project_description: null,
    items: quote.items,
    subtotal: quote.subtotal,
    tax_amount: quote.taxAmount,
    total_amount: quote.totalAmount,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    // 기본 결제 일정: 계약금 30%, 잔금 70%
    payment_schedule: [
      {
        id: `ps_${Date.now()}_1`,
        name: '계약금',
        percentage: 30,
        amount: Math.round(quote.totalAmount * 0.3),
        dueDate: startDate.toISOString().split('T')[0],
        status: 'pending',
      },
      {
        id: `ps_${Date.now()}_2`,
        name: '잔금',
        percentage: 70,
        amount: Math.round(quote.totalAmount * 0.7),
        dueDate: endDate.toISOString().split('T')[0],
        status: 'pending',
      },
    ],
    // 기본 계약 조항
    clauses: [
      {
        id: `cl_${Date.now()}_1`,
        title: '계약의 목적',
        content: `본 계약은 "${quote.title}"의 수행에 관한 사항을 정함을 목적으로 합니다.`,
      },
      {
        id: `cl_${Date.now()}_2`,
        title: '계약 기간',
        content: '계약 기간은 계약 체결일로부터 프로젝트 완료일까지로 합니다.',
      },
      {
        id: `cl_${Date.now()}_3`,
        title: '대금 지급',
        content: '대금은 계약금과 잔금으로 나누어 지급하며, 세부 일정은 결제 일정에 따릅니다.',
      },
    ],
    status: 'draft',
  };
}

// 계약서 → 인보이스 전환 (회차별)
export function createInvoiceFromContract(
  contract: {
    id: string;
    clientId: string;
    projectName: string;
    paymentSchedule: Array<{
      id: string;
      name: string;
      amount: number;
      dueDate: string;
    }>;
  },
  scheduleId: string,
  paymentInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
) {
  const schedule = contract.paymentSchedule.find((s) => s.id === scheduleId);
  if (!schedule) {
    throw new Error('결제 일정을 찾을 수 없습니다');
  }

  const subtotal = Math.round(schedule.amount / 1.1);
  const taxAmount = schedule.amount - subtotal;

  return {
    contract_id: contract.id,
    client_id: contract.clientId,
    payment_schedule_id: scheduleId,
    title: `${contract.projectName} - ${schedule.name}`,
    items: [
      {
        id: `item_${Date.now()}`,
        name: `${contract.projectName} - ${schedule.name}`,
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
        unit: '식',
        taxRate: 10,
      },
    ],
    subtotal,
    tax_amount: taxAmount,
    total_amount: schedule.amount,
    due_date: schedule.dueDate,
    payment_status: 'pending',
    payment_info: paymentInfo,
    status: 'draft',
  };
}

// 인보이스 → 세금계산서 전환
export function createTaxInvoiceFromInvoice(
  invoice: {
    id: string;
    clientId: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  },
  provider: {
    businessNumber: string;
    name: string;
    representativeName: string;
    address: string;
    businessType: string;
    businessCategory: string;
    email: string;
  }
) {
  const issueDate = new Date().toISOString().split('T')[0];

  return {
    invoice_id: invoice.id,
    client_id: invoice.clientId,
    provider_info: provider,
    items: invoice.items.map((item) => ({
      id: item.id,
      date: issueDate,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      supplyAmount: item.amount,
      taxAmount: Math.round(item.amount * 0.1),
    })),
    subtotal: invoice.subtotal,
    tax_amount: invoice.taxAmount,
    total_amount: invoice.totalAmount,
    issue_date: issueDate,
    issue_type: 'regular',
    nts_status: 'pending',
    status: 'draft',
  };
}

// 문서 번호 생성 헬퍼
export function generateDocumentNumber(prefix: string, sequence: number, year?: number): string {
  const y = year || new Date().getFullYear();
  return `${prefix}-${y}-${String(sequence).padStart(4, '0')}`;
}

// 토큰 생성 헬퍼
export function generatePublicToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
