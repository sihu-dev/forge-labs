/**
 * Command Reference Component
 * Mobile-optimized command palette and shortcut reference
 *
 * Shows:
 * - Korean keyboard shortcuts
 * - English fallback shortcuts
 * - CLI-style command examples
 * - Quick copy-to-clipboard
 */

'use client';

import { useState } from 'react';
import { KOREAN_SHORTCUTS_DATA } from '../dashboard/KoreanKeyboardShortcuts';

// ============================================
// Types
// ============================================

type CommandCategory = {
  category: string;
  shortcuts: {
    keys: string[];
    english?: string[];
    description: string;
  }[];
};

// ============================================
// Component
// ============================================

export function CommandReference() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Filter shortcuts based on search
  const filteredCategories = KOREAN_SHORTCUTS_DATA.map((category) => ({
    ...category,
    shortcuts: category.shortcuts.filter((shortcut) => {
      const query = searchQuery.toLowerCase();
      return (
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some((k) => k.toLowerCase().includes(query)) ||
        shortcut.english?.some((k) => k.toLowerCase().includes(query))
      );
    }),
  })).filter((category) => category.shortcuts.length > 0);

  // Copy command to clipboard
  const copyToClipboard = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-100 mb-2">Command Reference</h2>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No shortcuts found
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.category} className="mb-4">
              {/* Category Header */}
              <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {category.category}
                </h3>
              </div>

              {/* Shortcuts */}
              <div className="px-2 py-1">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="px-2 py-2 hover:bg-slate-800/50 rounded cursor-pointer group"
                    onClick={() => {
                      const command = shortcut.keys.join('');
                      copyToClipboard(command);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Keys */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {shortcut.keys.map((key, idx) => (
                          <span key={idx}>
                            <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-800 border border-slate-600 rounded text-slate-100 shadow-sm">
                              {key}
                            </kbd>
                            {idx < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-slate-600">+</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Copy button (visible on hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const command = shortcut.keys.join('');
                          copyToClipboard(command);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded"
                        title="Copy"
                      >
                        {copiedCommand === shortcut.keys.join('') ? (
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-slate-400 mt-1">
                      {shortcut.description}
                    </div>

                    {/* English fallback */}
                    {shortcut.english && (
                      <div className="text-xs text-slate-600 mt-0.5">
                        English: {shortcut.english.join(' + ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30">
        <p className="text-xs text-slate-500">
          Click any shortcut to copy • {filteredCategories.reduce((acc, cat) => acc + cat.shortcuts.length, 0)} shortcuts
        </p>
      </div>
    </div>
  );
}

// ============================================
// Compact Command Reference (for mobile)
// ============================================

export function CompactCommandReference() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Commands
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden z-50">
          <CommandReference />
        </div>
      )}
    </div>
  );
}

export default CommandReference;
