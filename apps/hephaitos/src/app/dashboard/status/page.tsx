/**
 * Status Page
 * Shows current project status, tasks, and shortcuts
 * Accessible via ㅅ (S) shortcut
 */

'use client';

import { useState, useEffect } from 'react';
import { KOREAN_SHORTCUTS_DATA } from '@/components/dashboard/KoreanKeyboardShortcuts';

// ============================================
// Types
// ============================================

interface ProjectStatus {
  project: string;
  completion: number;
  currentTask: string;
  currentTaskProgress: number;
  nextTask: string;
  nextTaskPriority: string;
  stats: {
    todayCommits: number;
    tasksCompleted: number;
    tasksRemaining: number;
    uptime: number;
  };
}

// ============================================
// Component
// ============================================

export default function StatusPage() {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mobile/status?project=HEPHAITOS');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Error Loading Status</h2>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400">No status data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">System Status</h1>
        <p className="text-slate-400">Real-time project status and metrics</p>
      </div>

      {/* Project Overview */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100">{status.project}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Connected</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Overall Progress</span>
            <span className="text-sm font-mono font-semibold text-slate-200">{status.completion}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${status.completion}%` }}
            />
          </div>
        </div>

        {/* Current & Next Task */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Task</div>
            <div className="text-sm font-medium text-slate-200 mb-2">{status.currentTask}</div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${status.currentTaskProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Next Task</div>
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-orange-500/20 text-orange-400 rounded">
                {status.nextTaskPriority}
              </span>
            </div>
            <div className="text-sm font-medium text-slate-200">{status.nextTask}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Commits" value={status.stats.todayCommits} />
        <StatCard label="Tasks Completed" value={status.stats.tasksCompleted} color="green" />
        <StatCard label="Tasks Remaining" value={status.stats.tasksRemaining} color="orange" />
        <StatCard
          label="Uptime"
          value={formatUptime(status.stats.uptime)}
          mono={false}
        />
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Keyboard Shortcuts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {KOREAN_SHORTCUTS_DATA.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <kbd
                          key={idx}
                          className="px-2 py-0.5 text-xs font-mono bg-slate-700 border border-slate-600 rounded text-slate-200"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchStatus}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
}

// ============================================
// StatCard Component
// ============================================

function StatCard({
  label,
  value,
  color = 'blue',
  mono = true,
}: {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'orange';
  mono?: boolean;
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-semibold text-slate-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}

// ============================================
// Utilities
// ============================================

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
