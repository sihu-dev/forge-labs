/**
 * 계약서 공개 링크 페이지
 * 고객이 계약서를 열람하고 서명할 수 있는 페이지
 */

'use client';

import { useState, useEffect, useRef, use } from 'react';

interface ContractItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PaymentSchedule {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  due_date: string;
}

interface ContractClause {
  id: string;
  order: number;
  title: string;
  content: string;
}

interface ContractData {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
  projectName: string;
  projectDescription: string | null;
  items: ContractItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
  paymentSchedule: PaymentSchedule[];
  clauses: ContractClause[];
  createdAt: string;
  provider: {
    name: string;
    businessNumber: string | null;
    email: string;
    phone: string | null;
    address: string | null;
  } | null;
  client: {
    name: string;
    email: string;
    businessNumber: string | null;
  };
}

export default function PublicContractPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/public/contracts/${resolvedParams.token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '계약서를 불러오지 못했습니다');
        }

        setContract(data.contract);
      } catch (err) {
        console.error('Failed to fetch public contract:', err);
        setError(err instanceof Error ? err.message : '계약서를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [resolvedParams.token]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!signerName.trim()) {
      alert('서명자 이름을 입력해주세요');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    setSigning(true);
    try {
      const res = await fetch(`/api/public/contracts/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign',
          signatureData,
          signerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '서명 처리에 실패했습니다');
      }

      setContract((prev) => prev ? { ...prev, status: 'approved' } : null);
      setShowSignModal(false);
    } catch (err) {
      console.error('Sign failed:', err);
      alert(err instanceof Error ? err.message : '서명 처리에 실패했습니다');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">계약서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">📄</p>
          <p className="text-gray-500">{error || '계약서를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const canSign = ['sent', 'viewed'].includes(contract.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상태 배너 */}
        {contract.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-800 font-medium">이 계약서는 체결되었습니다</p>
          </div>
        )}

        {/* 계약서 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-purple-600 text-white px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-1">{contract.documentNumber}</p>
                <h1 className="text-2xl font-bold">{contract.projectName || contract.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">₩{formatCurrency(contract.totalAmount)}</p>
                <p className="text-purple-200 text-sm mt-1">부가세 포함</p>
              </div>
            </div>
          </div>

          {/* 당사자 정보 */}
          <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">공급자 (을)</p>
              <p className="font-semibold text-gray-900">{contract.provider?.name || '-'}</p>
              {contract.provider?.businessNumber && (
                <p className="text-sm text-gray-500">{contract.provider.businessNumber}</p>
              )}
              <p className="text-sm text-gray-500">{contract.provider?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">고객 (갑)</p>
              <p className="font-semibold text-gray-900">{contract.client.name}</p>
              {contract.client.businessNumber && (
                <p className="text-sm text-gray-500">{contract.client.businessNumber}</p>
              )}
              <p className="text-sm text-gray-500">{contract.client.email}</p>
            </div>
          </div>

          {/* 계약 기간 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">계약 기간</h2>
            <p className="text-gray-700">
              {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
            </p>
            {contract.projectDescription && (
              <p className="text-gray-600 mt-2">{contract.projectDescription}</p>
            )}
          </div>

          {/* 계약 내역 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">계약 내역</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">품목</th>
                  <th className="pb-3 font-medium text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {contract.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.name}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      ₩{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 합계 */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>공급가액</span>
                <span>₩{formatCurrency(contract.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>부가세 (10%)</span>
                <span>₩{formatCurrency(contract.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>합계</span>
                <span className="text-purple-600">₩{formatCurrency(contract.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 결제 일정 */}
          {contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4">결제 일정</h2>
              <div className="space-y-3">
                {contract.paymentSchedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {schedule.name} ({schedule.percentage}%)
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(schedule.due_date)}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₩{formatCurrency(schedule.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 계약 조항 */}
          {contract.clauses && contract.clauses.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4">계약 조항</h2>
              <div className="space-y-4 text-sm">
                {contract.clauses.map((clause) => (
                  <div key={clause.id}>
                    <h3 className="font-medium text-gray-900 mb-1">
                      제{clause.order}조 ({clause.title})
                    </h3>
                    <p className="text-gray-600 pl-4 border-l-2 border-gray-200">
                      {clause.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 서명 버튼 */}
          {canSign && (
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => setShowSignModal(true)}
                className="w-full py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                계약서 서명하기
              </button>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Powered by ADE
        </p>

        {/* 서명 모달 */}
        {showSignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">전자 서명</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    서명자 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    서명 <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={340}
                      height={150}
                      className="w-full bg-white cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    지우기
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  위 내용을 확인하고 서명함으로써 본 계약의 내용에 동의합니다.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {signing ? '처리 중...' : '서명 완료'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
