/**
 * FORGE LABS Theme Context
 * L2 (Cells) - ThemeProvider with React Context for light/dark mode support
 *
 * Features:
 * - React Context for theme state management
 * - useTheme hook for consuming theme
 * - Support for 'light', 'dark', 'system' modes
 * - Persist preference to localStorage
 * - Handle system preference with matchMedia
 * - Apply data-theme attribute to document
 */

import * as React from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme (actual applied theme, never 'system')
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  /** Current theme mode (can be 'system') */
  theme: ThemeMode;
  /** Resolved theme (actual applied theme) */
  resolvedTheme: ResolvedTheme;
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** Whether system preference is being used */
  isSystemTheme: boolean;
  /** Whether theme is currently being hydrated */
  isHydrating: boolean;
}

/**
 * ThemeProvider props
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme mode */
  defaultTheme?: ThemeMode;
  /** Storage key for persisting theme */
  storageKey?: string;
  /** Attribute to apply to document element */
  attribute?: 'class' | 'data-theme';
  /** Disable system theme detection */
  disableSystemTheme?: boolean;
  /** Force a specific theme (overrides everything) */
  forcedTheme?: ResolvedTheme;
  /** Enable color scheme meta tag updates */
  enableColorScheme?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_DEFAULT = 'forge-labs-theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

// ============================================================================
// Context
// ============================================================================

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get system theme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

/**
 * Get stored theme from localStorage
 */
function getStoredTheme(key: string): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return null;
  } catch {
    // localStorage may not be available
    return null;
  }
}

/**
 * Store theme in localStorage
 */
function storeTheme(key: string, theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, theme);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Apply theme to document
 */
function applyTheme(
  theme: ResolvedTheme,
  attribute: 'class' | 'data-theme',
  enableColorScheme: boolean
): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const oppositeTheme = theme === 'dark' ? 'light' : 'dark';

  if (attribute === 'class') {
    root.classList.remove(oppositeTheme);
    root.classList.add(theme);
  } else {
    root.setAttribute('data-theme', theme);
  }

  // Update color-scheme for native elements
  if (enableColorScheme) {
    root.style.colorScheme = theme;
  }
}

// ============================================================================
// ThemeProvider Component
// ============================================================================

/**
 * ThemeProvider - Provides theme context to the application
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY_DEFAULT,
  attribute = 'data-theme',
  disableSystemTheme = false,
  forcedTheme,
  enableColorScheme = true,
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    // Server-side: use default
    if (typeof window === 'undefined') return defaultTheme;
    // Client-side: try to get stored theme
    return getStoredTheme(storageKey) ?? defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() => {
    if (forcedTheme) return forcedTheme;
    if (typeof window === 'undefined') return 'dark';
    if (theme === 'system' && !disableSystemTheme) {
      return getSystemTheme();
    }
    return theme === 'system' ? 'dark' : theme;
  });

  const [isHydrating, setIsHydrating] = React.useState(true);

  // Handle hydration
  React.useEffect(() => {
    setIsHydrating(false);
  }, []);

  // Handle theme changes
  const setTheme = React.useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      storeTheme(storageKey, newTheme);
    },
    [storageKey]
  );

  // Toggle theme between light and dark
  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Resolve theme when theme or system preference changes
  React.useEffect(() => {
    if (forcedTheme) {
      setResolvedTheme(forcedTheme);
      return;
    }

    if (theme === 'system' && !disableSystemTheme) {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme === 'system' ? 'dark' : theme);
    }
  }, [theme, forcedTheme, disableSystemTheme]);

  // Apply theme to document
  React.useEffect(() => {
    applyTheme(resolvedTheme, attribute, enableColorScheme);
  }, [resolvedTheme, attribute, enableColorScheme]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (disableSystemTheme || theme !== 'system') return;

    const mediaQuery = window.matchMedia(MEDIA_QUERY);

    const handleChange = (e: MediaQueryListEvent) => {
      if (!forcedTheme) {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, forcedTheme, disableSystemTheme]);

  // Listen for storage changes (sync across tabs)
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as ThemeMode;
        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
          setThemeState(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isSystemTheme: theme === 'system',
      isHydrating,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, isHydrating]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// useTheme Hook
// ============================================================================

/**
 * useTheme hook - Access theme context
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================================================
// Inline Script for SSR (prevents flash)
// ============================================================================

/**
 * Script to run before React hydration to prevent theme flash
 * Insert this in your document head for SSR applications
 *
 * NOTE: This uses dangerouslySetInnerHTML which is safe here because:
 * 1. The script content is generated internally, not from user input
 * 2. All parameters are validated and sanitized
 * 3. This is a standard pattern used by theme libraries (next-themes, etc.)
 */
export function getThemeScript(
  storageKey: string = STORAGE_KEY_DEFAULT,
  attribute: 'class' | 'data-theme' = 'data-theme',
  defaultTheme: ThemeMode = 'system'
): string {
  // Sanitize inputs to prevent injection
  const safeStorageKey = storageKey.replace(/['"\\]/g, '');
  const safeDefaultTheme = ['light', 'dark', 'system'].includes(defaultTheme)
    ? defaultTheme
    : 'system';

  const attributeCode =
    attribute === 'class'
      ? `root.classList.remove('light','dark');root.classList.add(r);`
      : `root.setAttribute('data-theme',r);`;

  return `(function(){try{var s=localStorage.getItem('${safeStorageKey}');var t=s||'${safeDefaultTheme}';var r=t;if(t==='system'){r=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}var root=document.documentElement;${attributeCode}root.style.colorScheme=r;}catch(e){}})();`;
}

/**
 * ThemeScript component for Next.js or other SSR frameworks
 * Prevents flash of wrong theme on initial page load
 *
 * @example
 * ```tsx
 * // In your layout or _document
 * <head>
 *   <ThemeScript />
 * </head>
 * ```
 */
export function ThemeScript({
  storageKey = STORAGE_KEY_DEFAULT,
  attribute = 'data-theme',
  defaultTheme = 'system',
}: {
  storageKey?: string;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: ThemeMode;
}): React.ReactElement {
  // Script is generated from trusted internal code, not user input
  const scriptContent = getThemeScript(storageKey, attribute, defaultTheme);

  return React.createElement('script', {
    dangerouslySetInnerHTML: { __html: scriptContent },
  });
}

// ============================================================================
// Display Names
// ============================================================================

ThemeProvider.displayName = 'ThemeProvider';
ThemeScript.displayName = 'ThemeScript';
