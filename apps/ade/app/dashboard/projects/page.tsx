/**
 * ADE - 프로젝트 목록 페이지
 */

import Link from 'next/link';

// 임시 프로젝트 데이터
const projects = [
  {
    id: 'proj-1',
    name: '홍길동 명함',
    type: 'card',
    icon: '💳',
    status: 'published',
    updatedAt: '2024-12-20',
    views: 156,
  },
  {
    id: 'proj-2',
    name: '12월 인보이스',
    type: 'invoice',
    icon: '📄',
    status: 'draft',
    updatedAt: '2024-12-19',
    views: 0,
  },
  {
    id: 'proj-3',
    name: '개발자 포트폴리오',
    type: 'portfolio',
    icon: '🎨',
    status: 'published',
    updatedAt: '2024-12-18',
    views: 342,
  },
  {
    id: 'proj-4',
    name: '웹개발 견적서',
    type: 'quote',
    icon: '📋',
    status: 'sent',
    updatedAt: '2024-12-17',
    views: 12,
  },
  {
    id: 'proj-5',
    name: 'SaaS 랜딩페이지',
    type: 'landing',
    icon: '🚀',
    status: 'published',
    updatedAt: '2024-12-15',
    views: 890,
  },
];

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: '초안', className: 'bg-gray-100 text-gray-600' },
  published: { label: '게시됨', className: 'bg-green-100 text-green-700' },
  sent: { label: '발송됨', className: 'bg-blue-100 text-blue-700' },
  archived: { label: '보관됨', className: 'bg-yellow-100 text-yellow-700' },
};

export default function ProjectsPage() {
  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-500 mt-1">
            모든 프로젝트를 관리하세요
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          + 새 프로젝트
        </Link>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        <FilterTab label="전체" count={projects.length} active />
        <FilterTab label="명함" count={1} />
        <FilterTab label="인보이스" count={1} />
        <FilterTab label="포트폴리오" count={1} />
        <FilterTab label="견적서" count={1} />
        <FilterTab label="랜딩" count={1} />
      </div>

      {/* 프로젝트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* 새 프로젝트 카드 */}
        <Link
          href="/dashboard/projects/new"
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors min-h-[200px]"
        >
          <span className="text-4xl">+</span>
          <span className="font-medium">새 프로젝트 만들기</span>
        </Link>
      </div>
    </div>
  );
}

function FilterTab({
  label,
  count,
  active = false,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-purple-100 text-purple-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} <span className="ml-1 opacity-60">{count}</span>
    </button>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    type: string;
    icon: string;
    status: string;
    updatedAt: string;
    views: number;
  };
}) {
  const status = statusLabels[project.status] || statusLabels.draft;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* 프리뷰 영역 */}
      <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
          {project.icon}
        </span>
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{project.updatedAt}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>👁</span>
            <span>{project.views}</span>
          </div>
          <div className="flex-1" />
          <Link
            href={`/dashboard/projects/${project.id}` as never}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            편집 →
          </Link>
        </div>
      </div>
    </div>
  );
}
