/**
 * ADE - 대시보드 홈
 */

import Link from 'next/link';
import { TEMPLATE_META } from '@/templates';

export default function DashboardPage() {
  // 더미 프로젝트 데이터 (실제로는 DB에서 가져옴)
  const recentProjects = [
    {
      id: '1',
      name: '내 명함',
      type: 'card' as const,
      status: 'published' as const,
      updatedAt: '2024-01-15',
    },
    {
      id: '2',
      name: '프로젝트 견적서',
      type: 'quote' as const,
      status: 'draft' as const,
      updatedAt: '2024-01-14',
    },
  ];

  const stats = {
    totalProjects: 5,
    publishedPages: 3,
    totalViews: 127,
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">페이지를 생성하고 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="📁"
          label="전체 프로젝트"
          value={stats.totalProjects}
        />
        <StatCard
          icon="🌐"
          label="게시된 페이지"
          value={stats.publishedPages}
        />
        <StatCard
          icon="👁️"
          label="총 조회수"
          value={stats.totalViews}
        />
      </div>

      {/* 빠른 시작 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          빠른 시작
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.values(TEMPLATE_META).map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/projects/new?type=${template.id}` as never}
              className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {template.icon}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {template.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 최근 프로젝트 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            최근 프로젝트
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            전체 보기 →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 mb-4">아직 프로젝트가 없습니다</p>
            <Link
              href="/dashboard/projects/new"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수정일
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProjects.map((project) => {
                  const template = TEMPLATE_META[project.type];
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{template.icon}</span>
                          <span className="font-medium text-gray-900">
                            {project.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {template.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            project.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {project.status === 'published' ? '게시됨' : '초안'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {project.updatedAt}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/projects/${project.id}` as never}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          편집
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
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
