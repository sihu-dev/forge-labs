/**
 * Shortcuts Help Modal
 * Triggered by Shift+? or clicking help button
 *
 * Shows both Korean and English shortcuts in a clean modal
 */

'use client';

import { useState, useEffect } from 'react';
import { KOREAN_SHORTCUTS_DATA } from './KoreanKeyboardShortcuts';
import { SHORTCUTS_DATA } from './KeyboardShortcuts';

// ============================================
// Component
// ============================================

export function ShortcutsHelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>('korean');

  // Listen for Shift+? to open modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    // Listen for custom event from keyboard shortcuts
    const handleOpenHelp = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-shortcuts-help', handleOpenHelp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-shortcuts-help', handleOpenHelp);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Navigate faster with keyboard shortcuts
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('korean')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'korean'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Korean (한글)
            </button>
            <button
              onClick={() => setActiveTab('english')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'english'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'korean' ? (
            <div className="space-y-6">
              {KOREAN_SHORTCUTS_DATA.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            {shortcut.description}
                          </div>
                          {shortcut.english && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              English: {shortcut.english.join(' + ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                          {shortcut.keys.map((key, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-900 dark:text-slate-100">
                                {key}
                              </kbd>
                              {idx < shortcut.keys.length - 1 && (
                                <span className="text-slate-400 dark:text-slate-600">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {SHORTCUTS_DATA.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {shortcut.description}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                          {shortcut.keys.map((key, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-900 dark:text-slate-100">
                                {key}
                              </kbd>
                              {idx < shortcut.keys.length - 1 && (
                                <span className="text-slate-400 dark:text-slate-600">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">Shift</kbd>{' '}
            + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">?</kbd>{' '}
            to open this dialog anytime
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelpModal;
