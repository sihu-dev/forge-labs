/**
 * ADE - 정산 자동화 대시보드 홈
 */

import Link from 'next/link';
import { DOCUMENT_META } from '@/types';

export default function DashboardPage() {
  // 더미 통계 (실제로는 DB에서 가져옴)
  const stats = {
    thisMonth: {
      quotes: 5,
      contracts: 2,
      invoices: 3,
      revenue: 4500000,
    },
    pending: {
      quotesToApprove: 2,
      contractsToSign: 1,
      invoicesToPay: 2,
      overdueInvoices: 1,
    },
  };

  // 더미 최근 문서 (실제로는 DB에서 가져옴)
  type DocType = 'quote' | 'contract' | 'invoice' | 'tax_invoice';
  const recentDocuments: Array<{
    id: string;
    type: DocType;
    number: string;
    client: string;
    amount: number;
    status: string;
    date: string;
  }> = [
    {
      id: 'q-001',
      type: 'quote',
      number: 'Q-2024-0015',
      client: '(주)테크스타트',
      amount: 3000000,
      status: 'sent',
      date: '2024-12-20',
    },
    {
      id: 'i-001',
      type: 'invoice',
      number: 'I-2024-0012',
      client: '디자인랩',
      amount: 1500000,
      status: 'paid',
      date: '2024-12-19',
    },
    {
      id: 'c-001',
      type: 'contract',
      number: 'C-2024-0008',
      client: '스마트솔루션',
      amount: 5000000,
      status: 'approved',
      date: '2024-12-18',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">정산 현황을 한눈에 확인하세요</p>
      </div>

      {/* 미결 알림 */}
      {(stats.pending.overdueInvoices > 0 || stats.pending.quotesToApprove > 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-amber-800">
            <span>⚠️</span>
            <span className="font-medium">
              {stats.pending.overdueInvoices > 0 &&
                `연체 인보이스 ${stats.pending.overdueInvoices}건`}
              {stats.pending.overdueInvoices > 0 && stats.pending.quotesToApprove > 0 && ' / '}
              {stats.pending.quotesToApprove > 0 &&
                `승인 대기 견적 ${stats.pending.quotesToApprove}건`}
            </span>
          </div>
        </div>
      )}

      {/* 이번 달 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📋"
          label="이번 달 견적"
          value={stats.thisMonth.quotes}
          suffix="건"
          color="blue"
        />
        <StatCard
          icon="📝"
          label="체결 계약"
          value={stats.thisMonth.contracts}
          suffix="건"
          color="purple"
        />
        <StatCard
          icon="💳"
          label="발행 인보이스"
          value={stats.thisMonth.invoices}
          suffix="건"
          color="green"
        />
        <StatCard
          icon="💰"
          label="이번 달 매출"
          value={formatCurrency(stats.thisMonth.revenue)}
          suffix="원"
          color="amber"
        />
      </div>

      {/* 빠른 작성 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작성</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(DOCUMENT_META).map((doc) => {
            // tax_invoice → tax-invoices 변환
            const path = doc.id === 'tax_invoice' ? 'tax-invoices' : `${doc.id}s`;
            return (
              <Link
                key={doc.id}
                href={`/dashboard/${path}/new` as never}
                className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {doc.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                <span className="text-xs text-gray-400 mt-1">{doc.description}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 최근 문서 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 문서</h2>

        {recentDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 mb-4">아직 문서가 없습니다</p>
            <Link
              href={"/dashboard/quotes/new" as never}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 견적서 작성하기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    문서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    고객
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    날짜
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentDocuments.map((doc) => {
                  const meta = DOCUMENT_META[doc.type];
                  // tax_invoice → tax-invoices 변환
                  const basePath = doc.type === 'tax_invoice' ? 'tax-invoices' : `${doc.type}s`;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">{doc.number}</p>
                            <p className="text-xs text-gray-500">{meta.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.client}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {new Intl.NumberFormat('ko-KR').format(doc.amount)}원
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/${basePath}/${doc.id}` as never}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          보기
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  suffix: string;
  color: 'blue' | 'purple' | 'green' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    amber: 'bg-amber-100',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center text-lg`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-0.5">{suffix}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    draft: { label: '초안', className: 'bg-gray-100 text-gray-600' },
    sent: { label: '발송됨', className: 'bg-blue-100 text-blue-600' },
    approved: { label: '승인됨', className: 'bg-green-100 text-green-600' },
    paid: { label: '결제됨', className: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-600' },
    overdue: { label: '연체', className: 'bg-red-100 text-red-600' },
  };

  const config = configs[status] || configs.draft;
  return (
    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
