/**
 * HEPHAITOS - Settings Page
 * 설정 페이지
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'notifications', label: '알림', icon: '🔔' },
    { id: 'security', label: '보안', icon: '🔒' },
    { id: 'billing', label: '결제', icon: '💳' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="flex gap-6">
        {/* 사이드바 */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-3 text-gray-12'
                  : 'text-gray-11 hover:bg-gray-2 hover:text-gray-12'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4">프로필 정보</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-5 flex items-center justify-center text-2xl">
                      {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <button className="px-3 py-1.5 text-sm bg-gray-4 hover:bg-gray-5 rounded-lg transition-colors">
                      이미지 변경
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-10 mb-1.5">이름</label>
                    <input
                      type="text"
                      defaultValue={profile?.name || ''}
                      className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-10 mb-1.5">이메일</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl text-gray-10"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                    저장
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4 text-red-400">위험 영역</h2>
                <p className="text-sm text-gray-10 mb-4">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                </p>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors">
                  계정 삭제
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
              <h2 className="font-semibold mb-4">알림 설정</h2>
              <div className="space-y-4">
                {[
                  { id: 'email_backtest', label: '백테스트 완료', desc: '백테스트가 완료되면 이메일로 알림' },
                  { id: 'email_agent', label: '에이전트 상태', desc: '에이전트 시작/정지 시 알림' },
                  { id: 'email_trade', label: '거래 알림', desc: '실거래 체결 시 알림' },
                  { id: 'email_news', label: '뉴스레터', desc: '새로운 기능 및 업데이트 소식' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-10">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4">비밀번호 변경</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-10 mb-1.5">현재 비밀번호</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-10 mb-1.5">새 비밀번호</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-10 mb-1.5">새 비밀번호 확인</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-gray-3 border border-gray-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                    비밀번호 변경
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4">로그인 세션</h2>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-gray-4 hover:bg-gray-5 rounded-xl font-medium transition-colors"
                >
                  모든 기기에서 로그아웃
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4">현재 플랜</h2>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-3">
                  <div>
                    <p className="font-semibold">Free</p>
                    <p className="text-sm text-gray-10">기본 기능 무료 이용</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                    업그레이드
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gray-2 border border-gray-6">
                <h2 className="font-semibold mb-4">크레딧</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold">{profile?.credits ?? 100}</div>
                  <span className="text-gray-10">크레딧</span>
                </div>
                <button className="px-4 py-2 bg-gray-4 hover:bg-gray-5 rounded-xl font-medium transition-colors">
                  크레딧 충전
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
