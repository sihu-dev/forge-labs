/**
 * Top Organizations
 * 리드가 많은 상위 조직 목록
 */

'use client';

import { BuildingOfficeIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface TopOrganizationsProps {
  data: Array<{ organization: string; count: number }>;
}

export function TopOrganizations({ data }: TopOrganizationsProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-medium text-white">상위 조직</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              리드가 많은 상위 10개 조직
            </p>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="divide-y divide-white/[0.06]">
        {data.length > 0 ? (
          data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <div
                key={item.organization}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 순위 */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                      index === 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : index === 1
                        ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        : index === 2
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* 조직 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingOfficeIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-white truncate">
                        {item.organization}
                      </p>
                    </div>

                    {/* 진행률 바 */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            index === 0
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                              : index === 1
                              ? 'bg-gradient-to-r from-zinc-400 to-zinc-500'
                              : index === 2
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="flex-shrink-0 text-xs text-zinc-400 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 리드 수 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-white">
                      {item.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-400">리드</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <BuildingOfficeIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-sm text-zinc-400">조직 데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
