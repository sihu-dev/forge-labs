/**
 * Korean Keyboard Shortcuts Hook
 * Mobile Claude App Integration - Handle Hangul shortcuts
 *
 * Shortcuts:
 * ㅅ → Status check (전체 상태 확인)
 * ㅎ → HEPHAITOS mode (+ submenu: 빌더, 백테스트, 거래소, 멘토)
 * ㅂ → BIDFLOW mode (+ submenu: 리드, 캠페인, 워크플로우, 입찰)
 * ㄱ → Next task (ㄱㄱㄱ for 3 sequential tasks)
 * ㅋ → Commit & push
 * ㅊ → Code review
 * ㅌ → Test execution
 * ㅍ → Deploy
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

// Korean key mapping (Hangul → Latin)
// These are the actual key codes when typing in Korean IME
const KOREAN_KEY_MAP: Record<string, string> = {
  // Direct Hangul characters
  'ㅅ': 'ㅅ', // Status
  'ㅎ': 'ㅎ', // HEPHAITOS
  'ㅂ': 'ㅂ', // BIDFLOW
  'ㄱ': 'ㄱ', // Go (next task)
  'ㅋ': 'ㅋ', // Kommit (commit)
  'ㅊ': 'ㅊ', // Check (code review)
  'ㅌ': 'ㅌ', // Test
  'ㅍ': 'ㅍ', // Push (deploy)
};

// English fallback keys (for non-Korean keyboards)
const ENGLISH_FALLBACK_MAP: Record<string, string> = {
  's': 'ㅅ', // Status
  'h': 'ㅎ', // HEPHAITOS
  'b': 'ㅂ', // BIDFLOW
  'g': 'ㄱ', // Go
  'k': 'ㅋ', // Kommit
  'c': 'ㅊ', // Check
  't': 'ㅌ', // Test
  'p': 'ㅍ', // Push
};

export type KoreanShortcutKey = 'ㅅ' | 'ㅎ' | 'ㅂ' | 'ㄱ' | 'ㅋ' | 'ㅊ' | 'ㅌ' | 'ㅍ';

export type KoreanShortcutHandler = (key: KoreanShortcutKey, sequence: KoreanShortcutKey[]) => void | Promise<void>;

interface KoreanShortcutBinding {
  key: KoreanShortcutKey;
  handler: KoreanShortcutHandler;
  allowSequence?: boolean; // Allow ㄱㄱㄱ style sequences
  maxSequence?: number; // Max sequence length (default 5)
}

interface UseKoreanShortcutsOptions {
  enabled?: boolean;
  sequenceTimeout?: number; // ms to wait for next key in sequence (default 800ms)
  enableEnglishFallback?: boolean; // Allow English keys as fallback
  onSequenceStart?: (key: KoreanShortcutKey) => void;
  onSequenceComplete?: (sequence: KoreanShortcutKey[]) => void;
}

/**
 * Hook for handling Korean keyboard shortcuts
 */
export function useKoreanShortcuts(
  bindings: KoreanShortcutBinding[],
  options: UseKoreanShortcutsOptions = {}
) {
  const {
    enabled = true,
    sequenceTimeout = 800,
    enableEnglishFallback = true,
    onSequenceStart,
    onSequenceComplete,
  } = options;

  const bindingsRef = useRef(bindings);
  const sequenceRef = useRef<KoreanShortcutKey[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyRef = useRef<KoreanShortcutKey | null>(null);

  bindingsRef.current = bindings;

  const clearSequence = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    sequenceRef.current = [];
    lastKeyRef.current = null;
  }, []);

  const executeHandler = useCallback(
    async (binding: KoreanShortcutBinding, sequence: KoreanShortcutKey[]) => {
      try {
        await binding.handler(binding.key, sequence);
        if (onSequenceComplete) {
          onSequenceComplete(sequence);
        }
      } catch (error) {
        console.error('[Korean Shortcuts] Handler error:', error);
      } finally {
        clearSequence();
      }
    },
    [clearSequence, onSequenceComplete]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // Skip if user is typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip if modifier keys are pressed (except for natural IME composition)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Get the key - check both event.key for Hangul and event.code for English fallback
      let koreanKey: KoreanShortcutKey | null = null;

      // Try direct Hangul match
      if (event.key in KOREAN_KEY_MAP) {
        koreanKey = event.key as KoreanShortcutKey;
      }
      // Try English fallback
      else if (enableEnglishFallback && event.key.toLowerCase() in ENGLISH_FALLBACK_MAP) {
        koreanKey = ENGLISH_FALLBACK_MAP[event.key.toLowerCase()] as KoreanShortcutKey;
      }

      if (!koreanKey) return;

      // Find matching binding
      const binding = bindingsRef.current.find((b) => b.key === koreanKey);
      if (!binding) return;

      event.preventDefault();

      // Handle sequence support (like ㄱㄱㄱ for 3 tasks)
      if (binding.allowSequence && koreanKey === lastKeyRef.current) {
        // Same key pressed again - add to sequence
        sequenceRef.current.push(koreanKey);

        const maxLength = binding.maxSequence ?? 5;
        if (sequenceRef.current.length >= maxLength) {
          // Max sequence reached - execute immediately
          await executeHandler(binding, [...sequenceRef.current]);
          return;
        }

        // Reset timeout to wait for more keys
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          executeHandler(binding, [...sequenceRef.current]);
        }, sequenceTimeout);
      } else {
        // New key or sequence not allowed
        clearSequence();

        if (binding.allowSequence) {
          // Start new sequence
          sequenceRef.current = [koreanKey];
          lastKeyRef.current = koreanKey;

          if (onSequenceStart) {
            onSequenceStart(koreanKey);
          }

          // Set timeout to execute after delay
          timeoutRef.current = setTimeout(() => {
            executeHandler(binding, [...sequenceRef.current]);
          }, sequenceTimeout);
        } else {
          // Execute immediately (no sequence)
          await executeHandler(binding, [koreanKey]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearSequence();
    };
  }, [enabled, sequenceTimeout, enableEnglishFallback, executeHandler, clearSequence, onSequenceStart]);

  return {
    clearSequence,
    currentSequence: sequenceRef.current,
  };
}

/**
 * Hook for detecting Korean IME composition state
 * Useful for showing visual feedback during typing
 */
export function useKoreanIME() {
  const [isComposing, setIsComposing] = useState(false);
  const [compositionText, setCompositionText] = useState('');

  useEffect(() => {
    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionUpdate = (event: CompositionEvent) => {
      setCompositionText(event.data);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
      setCompositionText('');
    };

    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionupdate', handleCompositionUpdate);
    window.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionupdate', handleCompositionUpdate);
      window.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, []);

  return { isComposing, compositionText };
}

/**
 * Utility: Check if a key is a valid Korean shortcut
 */
export function isKoreanShortcutKey(key: string): key is KoreanShortcutKey {
  return key in KOREAN_KEY_MAP;
}

/**
 * Utility: Get Korean key from English fallback
 */
export function getKoreanKeyFromEnglish(englishKey: string): KoreanShortcutKey | null {
  const normalized = englishKey.toLowerCase();
  return (ENGLISH_FALLBACK_MAP[normalized] as KoreanShortcutKey) || null;
}

/**
 * Utility: Get English fallback from Korean key
 */
export function getEnglishFromKoreanKey(koreanKey: KoreanShortcutKey): string | null {
  const entry = Object.entries(ENGLISH_FALLBACK_MAP).find(([, value]) => value === koreanKey);
  return entry ? entry[0] : null;
}
