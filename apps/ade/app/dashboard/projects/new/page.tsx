/**
 * ADE - 새 프로젝트 생성 페이지
 */

'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TEMPLATE_META, type TemplateType } from '@/templates';
import type { CardData, Theme, DEFAULT_THEME } from '@/types';

function NewProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialType = (searchParams.get('type') as TemplateType) || 'card';

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<TemplateType>(initialType);
  const [projectName, setProjectName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<CardData | null>(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));

      // 명함 타입이면 자동 분석
      if (selectedType === 'card') {
        setIsAnalyzing(true);

        try {
          // 이미지를 Base64로 변환
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });

          // API 호출
          const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              mimeType: file.type,
              type: 'business_card',
            }),
          });

          const result = await response.json();

          if (result.success && result.data) {
            setExtractedData({
              type: 'card',
              ...result.data,
            });
            setProjectName(result.data.name || '내 명함');
          }
        } catch (error) {
          console.error('Image analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    },
    [selectedType]
  );

  // 프로젝트 생성
  const handleCreate = useCallback(async () => {
    // TODO: 실제 프로젝트 생성 API 호출
    console.log('Creating project:', {
      name: projectName,
      type: selectedType,
      data: extractedData,
    });

    // 성공 시 프로젝트 페이지로 이동
    router.push('/dashboard/projects');
  }, [projectName, selectedType, extractedData, router]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">새 프로젝트</h1>
        <p className="text-gray-500 mt-1">새로운 페이지를 만들어보세요</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 rounded ${
                  step > s ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 템플릿 선택 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. 템플릿 선택
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {Object.values(TEMPLATE_META).map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedType(template.id as TemplateType)}
                className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                  selectedType === template.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-4xl mb-3">{template.icon}</span>
                <span className="font-medium text-gray-900">
                  {template.name}
                </span>
                <span className="text-xs text-gray-500 mt-1 text-center">
                  {template.description}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: 정보 입력 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. 정보 입력
          </h2>

          {/* 이미지 업로드 (명함용) */}
          {selectedType === 'card' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                명함 이미지 업로드 (선택)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    {isAnalyzing && (
                      <div className="flex items-center justify-center gap-2 text-purple-600">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <span>명함 분석 중...</span>
                      </div>
                    )}
                    {extractedData && !isAnalyzing && (
                      <p className="text-green-600 text-sm">
                        ✓ 명함 정보가 자동으로 추출되었습니다
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="text-4xl mb-4 block">📷</span>
                    <p className="text-gray-500 mb-2">
                      명함 사진을 업로드하면 자동으로 정보를 추출합니다
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      이미지 선택
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 프로젝트 이름 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 이름
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: 내 명함, 프로젝트 견적서"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 추출된 데이터 표시 (명함) */}
          {selectedType === 'card' && extractedData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                추출된 정보 (수정 가능)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="이름"
                  value={extractedData.name}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, name: v })
                  }
                />
                <InputField
                  label="직함"
                  value={extractedData.title || ''}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, title: v })
                  }
                />
                <InputField
                  label="회사"
                  value={extractedData.company || ''}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, company: v })
                  }
                />
                <InputField
                  label="이메일"
                  value={extractedData.email || ''}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, email: v })
                  }
                />
                <InputField
                  label="전화"
                  value={extractedData.phone || ''}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, phone: v })
                  }
                />
                <InputField
                  label="웹사이트"
                  value={extractedData.website || ''}
                  onChange={(v) =>
                    setExtractedData({ ...extractedData, website: v })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!projectName}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 확인 및 생성 */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            3. 확인 및 생성
          </h2>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">
                {TEMPLATE_META[selectedType].icon}
              </span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {projectName}
                </h3>
                <p className="text-gray-500">
                  {TEMPLATE_META[selectedType].name}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">템플릿</span>
                <span className="text-gray-900">
                  {TEMPLATE_META[selectedType].name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">URL</span>
                <span className="text-purple-600">
                  ade.forgeone.io/{projectName
                    .toLowerCase()
                    .replace(/\s+/g, '-')}
                </span>
              </div>
              {extractedData?.name && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">이름</span>
                  <span className="text-gray-900">{extractedData.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              프로젝트 생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewProjectContent />
    </Suspense>
  );
}
