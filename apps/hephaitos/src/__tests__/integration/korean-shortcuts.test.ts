/**
 * Korean Keyboard Shortcuts Integration Tests
 * Tests the complete flow of Korean shortcuts from keypress to command execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKoreanShortcuts, getKoreanKeyFromEnglish, getEnglishFromKoreanKey } from '@/hooks/use-korean-shortcuts';

describe('Korean Keyboard Shortcuts', () => {
  let handlers: any = {};
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn();
    handlers = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useKoreanShortcuts hook', () => {
    it('should handle Korean shortcut key press', () => {
      const bindings = [
        {
          key: 'ㅎ' as const,
          handler: mockHandler,
        },
      ];

      const { result } = renderHook(() => useKoreanShortcuts(bindings));

      // Simulate keydown event
      const event = new KeyboardEvent('keydown', {
        key: 'ㅎ',
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockHandler).toHaveBeenCalledWith('ㅎ', ['ㅎ']);
    });

    it('should handle English fallback key press', () => {
      const bindings = [
        {
          key: 'ㅎ' as const,
          handler: mockHandler,
        },
      ];

      renderHook(() =>
        useKoreanShortcuts(bindings, {
          enableEnglishFallback: true,
        })
      );

      // Simulate English 'h' keypress
      const event = new KeyboardEvent('keydown', {
        key: 'h',
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockHandler).toHaveBeenCalledWith('ㅎ', ['ㅎ']);
    });

    it('should handle sequence of same key (ㄱㄱㄱ)', async () => {
      const bindings = [
        {
          key: 'ㄱ' as const,
          handler: mockHandler,
          allowSequence: true,
          maxSequence: 5,
        },
      ];

      renderHook(() =>
        useKoreanShortcuts(bindings, {
          sequenceTimeout: 100,
        })
      );

      // Press ㄱ three times quickly
      for (let i = 0; i < 3; i++) {
        const event = new KeyboardEvent('keydown', {
          key: 'ㄱ',
          bubbles: true,
        });

        act(() => {
          window.dispatchEvent(event);
        });

        // Wait a bit between keypresses (less than timeout)
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for sequence to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be called with sequence of 3
      expect(mockHandler).toHaveBeenCalledWith('ㄱ', ['ㄱ', 'ㄱ', 'ㄱ']);
    });

    it('should not trigger on modifier keys', () => {
      const bindings = [
        {
          key: 'ㅎ' as const,
          handler: mockHandler,
        },
      ];

      renderHook(() => useKoreanShortcuts(bindings));

      // Simulate keydown with Ctrl
      const event = new KeyboardEvent('keydown', {
        key: 'ㅎ',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not trigger in input fields', () => {
      const bindings = [
        {
          key: 'ㅎ' as const,
          handler: mockHandler,
        },
      ];

      renderHook(() => useKoreanShortcuts(bindings));

      // Create input element
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Simulate keydown in input
      const event = new KeyboardEvent('keydown', {
        key: 'ㅎ',
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should respect maxSequence limit', async () => {
      const bindings = [
        {
          key: 'ㄱ' as const,
          handler: mockHandler,
          allowSequence: true,
          maxSequence: 3,
        },
      ];

      renderHook(() =>
        useKoreanShortcuts(bindings, {
          sequenceTimeout: 100,
        })
      );

      // Press ㄱ 5 times (max is 3)
      for (let i = 0; i < 5; i++) {
        const event = new KeyboardEvent('keydown', {
          key: 'ㄱ',
          bubbles: true,
        });

        act(() => {
          window.dispatchEvent(event);
        });

        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Should have been called with max sequence of 3
      expect(mockHandler).toHaveBeenCalled();
      const lastCall = mockHandler.mock.calls[mockHandler.mock.calls.length - 1];
      expect(lastCall[1].length).toBeLessThanOrEqual(3);
    });

    it('should call onSequenceStart callback', async () => {
      const onSequenceStart = vi.fn();
      const bindings = [
        {
          key: 'ㄱ' as const,
          handler: mockHandler,
          allowSequence: true,
        },
      ];

      renderHook(() =>
        useKoreanShortcuts(bindings, {
          sequenceTimeout: 100,
          onSequenceStart,
        })
      );

      // Press ㄱ
      const event = new KeyboardEvent('keydown', {
        key: 'ㄱ',
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(onSequenceStart).toHaveBeenCalledWith('ㄱ');
    });

    it('should call onSequenceComplete callback', async () => {
      const onSequenceComplete = vi.fn();
      const bindings = [
        {
          key: 'ㄱ' as const,
          handler: mockHandler,
          allowSequence: true,
        },
      ];

      renderHook(() =>
        useKoreanShortcuts(bindings, {
          sequenceTimeout: 50,
          onSequenceComplete,
        })
      );

      // Press ㄱ twice
      for (let i = 0; i < 2; i++) {
        const event = new KeyboardEvent('keydown', {
          key: 'ㄱ',
          bubbles: true,
        });

        act(() => {
          window.dispatchEvent(event);
        });
      }

      // Wait for sequence to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSequenceComplete).toHaveBeenCalledWith(['ㄱ', 'ㄱ']);
    });
  });

  describe('Utility functions', () => {
    it('should convert English key to Korean', () => {
      expect(getKoreanKeyFromEnglish('h')).toBe('ㅎ');
      expect(getKoreanKeyFromEnglish('b')).toBe('ㅂ');
      expect(getKoreanKeyFromEnglish('g')).toBe('ㄱ');
      expect(getKoreanKeyFromEnglish('k')).toBe('ㅋ');
      expect(getKoreanKeyFromEnglish('s')).toBe('ㅅ');
    });

    it('should handle uppercase English keys', () => {
      expect(getKoreanKeyFromEnglish('H')).toBe('ㅎ');
      expect(getKoreanKeyFromEnglish('B')).toBe('ㅂ');
    });

    it('should return null for invalid English key', () => {
      expect(getKoreanKeyFromEnglish('x')).toBeNull();
      expect(getKoreanKeyFromEnglish('1')).toBeNull();
    });

    it('should convert Korean key to English', () => {
      expect(getEnglishFromKoreanKey('ㅎ')).toBe('h');
      expect(getEnglishFromKoreanKey('ㅂ')).toBe('b');
      expect(getEnglishFromKoreanKey('ㄱ')).toBe('g');
    });

    it('should return null for invalid Korean key', () => {
      expect(getEnglishFromKoreanKey('ㅏ' as any)).toBeNull();
    });
  });

  describe('Keyboard shortcut categories', () => {
    const testShortcut = (koreanKey: string, englishKey: string, description: string) => {
      it(`should handle ${koreanKey} (${englishKey}) - ${description}`, () => {
        const bindings = [
          {
            key: koreanKey as any,
            handler: mockHandler,
          },
        ];

        renderHook(() =>
          useKoreanShortcuts(bindings, {
            enableEnglishFallback: true,
          })
        );

        // Test Korean key
        let event = new KeyboardEvent('keydown', {
          key: koreanKey,
          bubbles: true,
        });

        act(() => {
          window.dispatchEvent(event);
        });

        expect(mockHandler).toHaveBeenCalledWith(koreanKey, [koreanKey]);

        mockHandler.mockClear();

        // Test English fallback
        event = new KeyboardEvent('keydown', {
          key: englishKey,
          bubbles: true,
        });

        act(() => {
          window.dispatchEvent(event);
        });

        expect(mockHandler).toHaveBeenCalled();
      });
    };

    testShortcut('ㅅ', 's', 'Status check');
    testShortcut('ㅎ', 'h', 'HEPHAITOS mode');
    testShortcut('ㅂ', 'b', 'BIDFLOW mode');
    testShortcut('ㄱ', 'g', 'Next task');
    testShortcut('ㅋ', 'k', 'Commit & push');
    testShortcut('ㅊ', 'c', 'Code review');
    testShortcut('ㅌ', 't', 'Run tests');
    testShortcut('ㅍ', 'p', 'Deploy');
  });
});
