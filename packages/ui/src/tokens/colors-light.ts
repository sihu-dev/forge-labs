/**
 * FORGE LABS Design Tokens - Light Mode Colors
 * L0 (Atoms) - HSL-based color system with proper contrast ratios
 *
 * Mirrors the dark mode structure from colors.ts
 * Based on Supabase light mode design tokens
 */

/**
 * Gray Scale - Light Mode (12-step scale)
 * Format: hsl(H, S%, L%)
 */
export const grayLight = {
  100: 'hsl(0, 0%, 98.8%)',
  200: 'hsl(0, 0%, 97.3%)',
  300: 'hsl(0, 0%, 95.3%)',
  400: 'hsl(0, 0%, 92.9%)',
  500: 'hsl(0, 0%, 91%)',
  600: 'hsl(0, 0%, 88.6%)',
  700: 'hsl(0, 0%, 85.9%)',
  800: 'hsl(0, 0%, 78%)',
  900: 'hsl(0, 0%, 56.1%)',
  1000: 'hsl(0, 0%, 52.2%)',
  1100: 'hsl(0, 0%, 43.5%)',
  1200: 'hsl(0, 0%, 9%)',
} as const;

/**
 * Gray Scale - Light Mode Alpha Variants
 */
export const grayLightAlpha = {
  100: 'hsla(0, 0%, 0%, 0)',
  200: 'hsla(0, 0%, 0%, 0.027)',
  300: 'hsla(0, 0%, 0%, 0.047)',
  400: 'hsla(0, 0%, 0%, 0.071)',
  500: 'hsla(0, 0%, 0%, 0.090)',
  600: 'hsla(0, 0%, 0%, 0.114)',
  700: 'hsla(0, 0%, 0%, 0.141)',
  800: 'hsla(0, 0%, 0%, 0.220)',
  900: 'hsla(0, 0%, 0%, 0.439)',
  1000: 'hsla(0, 0%, 0%, 0.478)',
  1100: 'hsla(0, 0%, 0%, 0.565)',
  1200: 'hsla(0, 0%, 0%, 0.910)',
} as const;

/**
 * Brand Colors - Supabase Green (Light Mode adjusted)
 */
export const brandLight = {
  200: 'hsl(152, 68%, 96%)',
  300: 'hsl(153, 64%, 91%)',
  400: 'hsl(153, 60%, 83%)',
  500: 'hsl(153, 58%, 70%)',
  600: 'hsl(153, 56%, 58%)',
  DEFAULT: 'hsl(153, 60.2%, 52.7%)', // #3ECF8E - same as dark
  link: 'hsl(155, 100%, 32%)', // Darker for light mode contrast
} as const;

/**
 * Semantic Foreground Colors - Light Mode
 */
export const foregroundLight = {
  DEFAULT: 'hsl(0, 0%, 9%)', // Near black
  light: 'hsl(0, 0%, 32%)',
  lighter: 'hsl(0, 0%, 46%)',
  muted: 'hsl(0, 0%, 60%)',
  contrast: 'hsl(0, 0%, 98%)', // For dark backgrounds
} as const;

/**
 * Semantic Background Colors - Light Mode
 */
export const backgroundLight = {
  200: 'hsl(0, 0%, 96%)',
  DEFAULT: 'hsl(0, 0%, 100%)', // Pure white
  alternative: {
    200: 'hsl(0, 0%, 97%)',
    DEFAULT: 'hsl(0, 0%, 98.5%)',
  },
  selection: 'hsl(153, 60%, 94%)', // Brand tint
  control: 'hsl(0, 0%, 100%)',
  muted: 'hsl(0, 0%, 96%)',
  surface: {
    75: 'hsl(0, 0%, 99%)',
    100: 'hsl(0, 0%, 98%)',
    200: 'hsl(0, 0%, 96%)',
    300: 'hsl(0, 0%, 94%)',
    400: 'hsl(0, 0%, 92%)',
  },
  overlay: {
    DEFAULT: 'hsl(0, 0%, 100%)',
    hover: 'hsl(0, 0%, 97%)',
  },
  button: {
    DEFAULT: 'hsl(0, 0%, 96%)',
  },
  dialog: {
    DEFAULT: 'hsl(0, 0%, 100%)',
  },
  dash: {
    sidebar: 'hsl(0, 0%, 98%)',
    canvas: 'hsl(0, 0%, 100%)',
  },
} as const;

/**
 * Semantic Border Colors - Light Mode
 */
export const borderLight = {
  DEFAULT: 'hsl(0, 0%, 89%)',
  muted: 'hsl(0, 0%, 92%)',
  secondary: 'hsl(0, 0%, 92%)',
  overlay: 'hsl(0, 0%, 85%)',
  control: 'hsl(0, 0%, 82%)',
  alternative: 'hsl(0, 0%, 78%)',
  strong: 'hsl(0, 0%, 75%)',
  stronger: 'hsl(0, 0%, 65%)',
  button: {
    DEFAULT: 'hsl(0, 0%, 82%)',
    hover: 'hsl(0, 0%, 72%)',
  },
} as const;

/**
 * Destructive (Error) Colors - Light Mode
 */
export const destructiveLight = {
  200: 'hsl(10, 100%, 97%)',
  300: 'hsl(10, 95%, 92%)',
  400: 'hsl(10, 85%, 85%)',
  500: 'hsl(10, 80%, 72%)',
  600: 'hsl(10.2, 77.9%, 53.9%)',
  DEFAULT: 'hsl(10.2, 77.9%, 53.9%)', // Same as dark for consistency
} as const;

/**
 * Warning Colors - Light Mode
 */
export const warningLight = {
  200: 'hsl(38, 100%, 96%)',
  300: 'hsl(38, 98%, 90%)',
  400: 'hsl(38, 95%, 80%)',
  500: 'hsl(38, 92%, 65%)',
  600: 'hsl(38.9, 100%, 42.9%)',
  DEFAULT: 'hsl(38.9, 100%, 42.9%)', // Same as dark for consistency
} as const;

/**
 * Code Block Syntax Colors - Light Mode (adjusted for light backgrounds)
 */
export const codeBlockLight = {
  1: 'hsl(170.8, 50%, 35%)', // Teal - darker for contrast
  2: 'hsl(33.2, 75%, 45%)',  // Orange
  3: 'hsl(83.8, 55%, 38%)',  // Green
  4: 'hsl(276.1, 55%, 50%)', // Purple
  5: 'hsl(13.8, 70%, 48%)',  // Red
} as const;

/**
 * CSS Variables for Light Mode Runtime Theming
 * Format: var(--name) for use in hsl()
 */
export const cssVariablesLight = {
  // Core
  '--colors-black': '0, 0%, 0%',
  '--colors-white': '0, 0%, 100%',

  // Foreground
  '--foreground-default': '0, 0%, 9%',
  '--foreground-light': '0, 0%, 32%',
  '--foreground-lighter': '0, 0%, 46%',
  '--foreground-muted': '0, 0%, 60%',
  '--foreground-contrast': '0, 0%, 98%',

  // Background
  '--background-200': '0, 0%, 96%',
  '--background-default': '0, 0%, 100%',
  '--background-alternative-200': '0, 0%, 97%',
  '--background-alternative-default': '0, 0%, 98.5%',
  '--background-selection': '153, 60%, 94%',
  '--background-control': '0, 0%, 100%',
  '--background-surface-75': '0, 0%, 99%',
  '--background-surface-100': '0, 0%, 98%',
  '--background-surface-200': '0, 0%, 96%',
  '--background-surface-300': '0, 0%, 94%',
  '--background-surface-400': '0, 0%, 92%',
  '--background-overlay-default': '0, 0%, 100%',
  '--background-overlay-hover': '0, 0%, 97%',
  '--background-muted': '0, 0%, 96%',
  '--background-button-default': '0, 0%, 96%',
  '--background-dialog-default': '0, 0%, 100%',

  // Border
  '--border-default': '0, 0%, 89%',
  '--border-muted': '0, 0%, 92%',
  '--border-secondary': '0, 0%, 92%',
  '--border-overlay': '0, 0%, 85%',
  '--border-control': '0, 0%, 82%',
  '--border-alternative': '0, 0%, 78%',
  '--border-strong': '0, 0%, 75%',
  '--border-stronger': '0, 0%, 65%',
  '--border-button-default': '0, 0%, 82%',
  '--border-button-hover': '0, 0%, 72%',

  // Brand (same hues, adjusted for light mode)
  '--brand-200': '152, 68%, 96%',
  '--brand-300': '153, 64%, 91%',
  '--brand-400': '153, 60%, 83%',
  '--brand-500': '153, 58%, 70%',
  '--brand-600': '153, 56%, 58%',
  '--brand-default': '153, 60.2%, 52.7%',
  '--brand-link': '155, 100%, 32%',

  // Destructive
  '--destructive-200': '10, 100%, 97%',
  '--destructive-300': '10, 95%, 92%',
  '--destructive-400': '10, 85%, 85%',
  '--destructive-500': '10, 80%, 72%',
  '--destructive-600': '10.2, 77.9%, 53.9%',
  '--destructive-default': '10.2, 77.9%, 53.9%',

  // Warning
  '--warning-200': '38, 100%, 96%',
  '--warning-300': '38, 98%, 90%',
  '--warning-400': '38, 95%, 80%',
  '--warning-500': '38, 92%, 65%',
  '--warning-600': '38.9, 100%, 42.9%',
  '--warning-default': '38.9, 100%, 42.9%',
} as const;

/**
 * Tailwind Theme Extension - Light Mode
 */
export const tailwindColorsLight = {
  // Core
  black: 'hsl(0, 0%, 0%)',
  white: 'hsl(0, 0%, 100%)',

  // Gray scales
  gray: grayLight,
  'gray-alpha': grayLightAlpha,

  // Semantic
  foreground: foregroundLight,
  background: backgroundLight,
  border: borderLight,

  // Status
  brand: brandLight,
  destructive: destructiveLight,
  warning: warningLight,

  // Code
  'code-block': codeBlockLight,

  // Hi/Lo contrast (inverted for light mode)
  'hi-contrast': 'hsl(var(--foreground-default))',
  'lo-contrast': 'hsl(var(--background-alternative-default))',
} as const;

/**
 * Generate CSS custom properties string for light mode
 * Use in <style> or inject via JavaScript
 */
export function generateLightModeCSSVariables(): string {
  return Object.entries(cssVariablesLight)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
}

/**
 * Complete light mode theme configuration
 * Ready for Tailwind or CSS-in-JS integration
 */
export const lightTheme = {
  gray: grayLight,
  grayAlpha: grayLightAlpha,
  brand: brandLight,
  foreground: foregroundLight,
  background: backgroundLight,
  border: borderLight,
  destructive: destructiveLight,
  warning: warningLight,
  codeBlock: codeBlockLight,
  cssVariables: cssVariablesLight,
  tailwindColors: tailwindColorsLight,
} as const;

// Type exports
export type GrayLightStep = keyof typeof grayLight;
export type BrandLightStep = keyof typeof brandLight;
