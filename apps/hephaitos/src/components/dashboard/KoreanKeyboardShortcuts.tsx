/**
 * Korean Keyboard Shortcuts Component
 * Mobile Claude App Integration - Global Korean shortcut handler
 *
 * This component wraps the app and listens for Korean Hangul shortcuts.
 * It shows submenu modals when needed (e.g., ㅎ → 빌더/백테스트/거래소/멘토)
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useKoreanShortcuts, type KoreanShortcutKey } from '@/hooks/use-korean-shortcuts';

// ============================================
// Types
// ============================================

type SubmenuOption = {
  key: string;
  label: string;
  action: () => void;
};

type SubmenuState = {
  title: string;
  options: SubmenuOption[];
} | null;

// ============================================
// Component
// ============================================

interface KoreanKeyboardShortcutsProps {
  children: React.ReactNode;
}

export function KoreanKeyboardShortcuts({ children }: KoreanKeyboardShortcutsProps) {
  const router = useRouter();
  const [submenuState, setSubmenuState] = useState<SubmenuState>(null);
  const [sequenceIndicator, setSequenceIndicator] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, duration: number = 2000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  // Execute next task (supports ㄱㄱㄱ sequences)
  const executeNextTasks = useCallback(
    async (count: number) => {
      showToast(`Executing ${count} task${count > 1 ? 's' : ''}...`);

      try {
        // Call remote command API
        const response = await fetch('/api/claude/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: 'next',
            params: { count },
          }),
        });

        if (!response.ok) {
          throw new Error('Command execution failed');
        }

        const data = await response.json();
        showToast(data.message || `Started ${count} task${count > 1 ? 's' : ''}`, 3000);
      } catch (error) {
        console.error('[Korean Shortcuts] Next task error:', error);
        showToast('⚠️ Failed to execute task', 3000);
      }
    },
    [showToast]
  );

  // Commit & Push
  const executeCommitPush = useCallback(async () => {
    showToast('Committing & pushing...');

    try {
      const response = await fetch('/api/claude/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'commit_push' }),
      });

      if (!response.ok) {
        throw new Error('Commit & push failed');
      }

      const data = await response.json();
      showToast(data.message || '✓ Committed & pushed', 3000);
    } catch (error) {
      console.error('[Korean Shortcuts] Commit & push error:', error);
      showToast('⚠️ Failed to commit & push', 3000);
    }
  }, [showToast]);

  // Code Review
  const executeCodeReview = useCallback(async () => {
    showToast('Running code review...');

    try {
      const response = await fetch('/api/claude/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'code_review' }),
      });

      if (!response.ok) {
        throw new Error('Code review failed');
      }

      const data = await response.json();
      showToast(data.message || '✓ Code review complete', 3000);
    } catch (error) {
      console.error('[Korean Shortcuts] Code review error:', error);
      showToast('⚠️ Failed to run code review', 3000);
    }
  }, [showToast]);

  // Test Execution
  const executeTests = useCallback(async () => {
    showToast('Running tests...');

    try {
      const response = await fetch('/api/claude/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'test' }),
      });

      if (!response.ok) {
        throw new Error('Test execution failed');
      }

      const data = await response.json();
      showToast(data.message || '✓ Tests complete', 3000);
    } catch (error) {
      console.error('[Korean Shortcuts] Test execution error:', error);
      showToast('⚠️ Failed to run tests', 3000);
    }
  }, [showToast]);

  // Deploy
  const executeDeploy = useCallback(async () => {
    showToast('Deploying...');

    try {
      const response = await fetch('/api/claude/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'deploy' }),
      });

      if (!response.ok) {
        throw new Error('Deploy failed');
      }

      const data = await response.json();
      showToast(data.message || '✓ Deployed successfully', 3000);
    } catch (error) {
      console.error('[Korean Shortcuts] Deploy error:', error);
      showToast('⚠️ Failed to deploy', 3000);
    }
  }, [showToast]);

  // Show status
  const showStatus = useCallback(async () => {
    showToast('Fetching status...');

    try {
      const response = await fetch('/api/claude/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'status' }),
      });

      if (!response.ok) {
        throw new Error('Status fetch failed');
      }

      const data = await response.json();
      // For status, we might want to show it differently (e.g., redirect to /status page)
      router.push('/dashboard/status');
    } catch (error) {
      console.error('[Korean Shortcuts] Status error:', error);
      showToast('⚠️ Failed to fetch status', 3000);
    }
  }, [showToast, router]);

  // HEPHAITOS submenu options
  const hephaitosOptions: SubmenuOption[] = [
    {
      key: '빌더',
      label: '빌더 - No-Code Strategy Builder',
      action: () => {
        router.push('/dashboard/strategy-builder');
        setSubmenuState(null);
      },
    },
    {
      key: '백테스트',
      label: '백테스트 - Backtest Engine',
      action: () => {
        router.push('/dashboard/backtest');
        setSubmenuState(null);
      },
    },
    {
      key: '거래소',
      label: '거래소 - Exchange Integration',
      action: () => {
        router.push('/dashboard/settings/broker');
        setSubmenuState(null);
      },
    },
    {
      key: '멘토',
      label: '멘토 - Mentor/Mentee System',
      action: () => {
        router.push('/dashboard/mentor');
        setSubmenuState(null);
      },
    },
  ];

  // BIDFLOW submenu options (cross-project navigation)
  const bidflowOptions: SubmenuOption[] = [
    {
      key: '리드',
      label: '리드 - Lead Management',
      action: () => {
        // If BIDFLOW is on different domain/port, use full URL
        // For now, assuming same monorepo with different route
        window.location.href = '/bidflow/leads';
        setSubmenuState(null);
      },
    },
    {
      key: '캠페인',
      label: '캠페인 - Campaign Management',
      action: () => {
        window.location.href = '/bidflow/campaigns';
        setSubmenuState(null);
      },
    },
    {
      key: '워크플로우',
      label: '워크플로우 - n8n Workflows',
      action: () => {
        window.location.href = '/bidflow/workflows';
        setSubmenuState(null);
      },
    },
    {
      key: '입찰',
      label: '입찰 - Bid Crawling',
      action: () => {
        window.location.href = '/bidflow/dashboard';
        setSubmenuState(null);
      },
    },
  ];

  // Define Korean shortcut bindings
  const bindings = [
    {
      key: 'ㅅ' as KoreanShortcutKey,
      handler: async () => {
        await showStatus();
      },
    },
    {
      key: 'ㅎ' as KoreanShortcutKey,
      handler: async () => {
        // Show HEPHAITOS submenu
        setSubmenuState({
          title: 'HEPHAITOS Mode',
          options: hephaitosOptions,
        });
      },
    },
    {
      key: 'ㅂ' as KoreanShortcutKey,
      handler: async () => {
        // Show BIDFLOW submenu
        setSubmenuState({
          title: 'BIDFLOW Mode',
          options: bidflowOptions,
        });
      },
    },
    {
      key: 'ㄱ' as KoreanShortcutKey,
      handler: async (key, sequence) => {
        // Execute N tasks based on sequence length
        const count = sequence.length;
        await executeNextTasks(count);
      },
      allowSequence: true,
      maxSequence: 5,
    },
    {
      key: 'ㅋ' as KoreanShortcutKey,
      handler: async () => {
        await executeCommitPush();
      },
    },
    {
      key: 'ㅊ' as KoreanShortcutKey,
      handler: async () => {
        await executeCodeReview();
      },
    },
    {
      key: 'ㅌ' as KoreanShortcutKey,
      handler: async () => {
        await executeTests();
      },
    },
    {
      key: 'ㅍ' as KoreanShortcutKey,
      handler: async () => {
        await executeDeploy();
      },
    },
  ];

  // Use Korean shortcuts hook
  useKoreanShortcuts(bindings, {
    enabled: true,
    sequenceTimeout: 800,
    enableEnglishFallback: true,
    onSequenceStart: (key) => {
      setSequenceIndicator(`${key}`);
    },
    onSequenceComplete: (sequence) => {
      setSequenceIndicator(null);
    },
  });

  return (
    <>
      {children}

      {/* Submenu Modal */}
      {submenuState && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSubmenuState(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{submenuState.title}</h2>
              <p className="text-sm text-slate-500 mt-1">Select an option or press Esc to cancel</p>
            </div>

            {/* Options */}
            <div className="py-2">
              {submenuState.options.map((option, index) => (
                <button
                  key={option.key}
                  onClick={option.action}
                  className="w-full px-6 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-mono flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 rounded-b-lg border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">1</kbd>
                -<kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">4</kbd> or click to select
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Indicator */}
      {sequenceIndicator && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm">
          {sequenceIndicator.repeat(sequenceIndicator.length)} ({sequenceIndicator.length} task{sequenceIndicator.length > 1 ? 's' : ''})
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm max-w-md">
          {toast}
        </div>
      )}
    </>
  );
}

// ============================================
// Korean Shortcuts Reference Data
// ============================================

export const KOREAN_SHORTCUTS_DATA = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['ㅅ'], english: ['S'], description: 'Status Check (전체 상태)' },
      { keys: ['ㅎ'], english: ['H'], description: 'HEPHAITOS Mode (트레이딩 교육)' },
      { keys: ['ㅂ'], english: ['B'], description: 'BIDFLOW Mode (입찰 자동화)' },
    ],
  },
  {
    category: 'Development',
    shortcuts: [
      { keys: ['ㄱ'], english: ['G'], description: 'Next Task (다음 태스크)' },
      { keys: ['ㄱㄱ'], english: ['GG'], description: '2 Tasks Sequential (2개 연속)' },
      { keys: ['ㄱㄱㄱ'], english: ['GGG'], description: '3 Tasks Sequential (3개 연속)' },
      { keys: ['ㅋ'], english: ['K'], description: 'Commit & Push (커밋 & 푸시)' },
      { keys: ['ㅊ'], english: ['C'], description: 'Code Review (코드 리뷰)' },
    ],
  },
  {
    category: 'Operations',
    shortcuts: [
      { keys: ['ㅌ'], english: ['T'], description: 'Run Tests (테스트 실행)' },
      { keys: ['ㅍ'], english: ['P'], description: 'Deploy (배포)' },
    ],
  },
  {
    category: 'HEPHAITOS Submenu',
    shortcuts: [
      { keys: ['ㅎ', '→', '빌더'], english: ['H', '→', 'Builder'], description: 'No-Code Strategy Builder' },
      { keys: ['ㅎ', '→', '백테스트'], english: ['H', '→', 'Backtest'], description: 'Backtest Engine' },
      { keys: ['ㅎ', '→', '거래소'], english: ['H', '→', 'Exchange'], description: 'Exchange Integration' },
      { keys: ['ㅎ', '→', '멘토'], english: ['H', '→', 'Mentor'], description: 'Mentor/Mentee System' },
    ],
  },
  {
    category: 'BIDFLOW Submenu',
    shortcuts: [
      { keys: ['ㅂ', '→', '리드'], english: ['B', '→', 'Lead'], description: 'Lead Management' },
      { keys: ['ㅂ', '→', '캠페인'], english: ['B', '→', 'Campaign'], description: 'Campaign Management' },
      { keys: ['ㅂ', '→', '워크플로우'], english: ['B', '→', 'Workflow'], description: 'n8n Workflows' },
      { keys: ['ㅂ', '→', '입찰'], english: ['B', '→', 'Bid'], description: 'Bid Crawling' },
    ],
  },
];

export default KoreanKeyboardShortcuts;
