/**
 * FORGE LABS Design Tokens - Colors (Supabase 100% Match)
 * L0 (Atoms) - HSL-based color system with alpha support
 *
 * Based on actual Supabase design tokens
 */

/**
 * Gray Scale - Dark Mode (12-step scale)
 * Format: hsl(H, S%, L%)
 */
export const grayDark = {
  100: 'hsl(0, 0%, 8.6%)',
  200: 'hsl(0, 0%, 11%)',
  300: 'hsl(0, 0%, 13.7%)',
  400: 'hsl(0, 0%, 15.7%)',
  500: 'hsl(0, 0%, 18%)',
  600: 'hsl(0, 0%, 20.4%)',
  700: 'hsl(0, 0%, 24.3%)',
  800: 'hsl(0, 0%, 31.4%)',
  900: 'hsl(0, 0%, 43.9%)',
  1000: 'hsl(0, 0%, 49.4%)',
  1100: 'hsl(0, 0%, 62.7%)',
  1200: 'hsl(0, 0%, 92.9%)',
} as const;

/**
 * Gray Scale - Dark Mode Alpha Variants
 */
export const grayDarkAlpha = {
  100: 'hsla(0, 0%, 0%, 0)',
  200: 'hsla(0, 0%, 100%, 0.031)',
  300: 'hsla(0, 0%, 100%, 0.059)',
  400: 'hsla(0, 0%, 100%, 0.078)',
  500: 'hsla(0, 0%, 100%, 0.102)',
  600: 'hsla(0, 0%, 100%, 0.129)',
  700: 'hsla(0, 0%, 100%, 0.169)',
  800: 'hsla(0, 0%, 100%, 0.251)',
  900: 'hsla(0, 0%, 100%, 0.388)',
  1000: 'hsla(0, 0%, 100%, 0.451)',
  1100: 'hsla(0, 0%, 100%, 0.588)',
  1200: 'hsla(0, 0%, 100%, 0.922)',
} as const;

/**
 * Gray Scale - Light Mode (12-step scale)
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
 * Brand Colors - Supabase Green
 */
export const brand = {
  200: 'hsl(162, 100%, 2%)',
  300: 'hsl(155, 100%, 8%)',
  400: 'hsl(155.5, 100%, 9.6%)',
  500: 'hsl(155, 100%, 19.2%)',
  600: 'hsl(155, 59.5%, 70%)',
  DEFAULT: 'hsl(153, 60.2%, 52.7%)', // #3ECF8E
  link: 'hsl(155, 100%, 38.6%)',
} as const;

/**
 * Semantic Foreground Colors
 */
export const foreground = {
  DEFAULT: 'hsl(0, 0%, 98%)',
  light: 'hsl(0, 0%, 70.6%)',
  lighter: 'hsl(0, 0%, 53.7%)',
  muted: 'hsl(0, 0%, 30.2%)',
  contrast: 'hsl(0, 0%, 8.6%)',
} as const;

/**
 * Semantic Background Colors
 */
export const background = {
  200: 'hsl(0, 0%, 9%)',
  DEFAULT: 'hsl(0, 0%, 7.1%)',
  alternative: {
    200: 'hsl(0, 0%, 11%)',
    DEFAULT: 'hsl(0, 0%, 5.9%)',
  },
  selection: 'hsl(0, 0%, 19.2%)',
  control: 'hsl(0, 0%, 14.1%)',
  muted: 'hsl(0, 0%, 14.1%)',
  surface: {
    75: 'hsl(0, 0%, 9%)',
    100: 'hsl(0, 0%, 12.2%)',
    200: 'hsl(0, 0%, 12.9%)',
    300: 'hsl(0, 0%, 16.1%)',
    400: 'hsl(0, 0%, 16.1%)',
  },
  overlay: {
    DEFAULT: 'hsl(0, 0%, 14.1%)',
    hover: 'hsl(0, 0%, 18%)',
  },
  button: {
    DEFAULT: 'hsl(0, 0%, 18%)',
  },
  dialog: {
    DEFAULT: 'hsl(0, 0%, 7.1%)',
  },
  dash: {
    sidebar: 'hsl(0, 0%, 9%)',
    canvas: 'hsl(0, 0%, 7.1%)',
  },
} as const;

/**
 * Semantic Border Colors
 */
export const border = {
  DEFAULT: 'hsl(0, 0%, 18%)',
  muted: 'hsl(0, 0%, 14.1%)',
  secondary: 'hsl(0, 0%, 14.1%)',
  overlay: 'hsl(0, 0%, 20%)',
  control: 'hsl(0, 0%, 22.4%)',
  alternative: 'hsl(0, 0%, 26.7%)',
  strong: 'hsl(0, 0%, 21.2%)',
  stronger: 'hsl(0, 0%, 27.1%)',
  button: {
    DEFAULT: 'hsl(0, 0%, 24.3%)',
    hover: 'hsl(0, 0%, 31.4%)',
  },
} as const;

/**
 * Destructive (Error) Colors
 */
export const destructive = {
  200: 'hsl(11, 23.4%, 9.2%)',
  300: 'hsl(7.5, 51.3%, 15.3%)',
  400: 'hsl(6.7, 60%, 20.6%)',
  500: 'hsl(7.9, 71.6%, 29%)',
  600: 'hsl(9.7, 85.2%, 62.9%)',
  DEFAULT: 'hsl(10.2, 77.9%, 53.9%)',
} as const;

/**
 * Warning Colors
 */
export const warning = {
  200: 'hsl(36.6, 100%, 8%)',
  300: 'hsl(32.3, 100%, 10.2%)',
  400: 'hsl(33.2, 100%, 14.5%)',
  500: 'hsl(34.8, 90.9%, 21.6%)',
  600: 'hsl(38.9, 100%, 42.9%)',
  DEFAULT: 'hsl(38.9, 100%, 42.9%)',
} as const;

/**
 * Code Block Syntax Colors
 */
export const codeBlock = {
  1: 'hsl(170.8, 43.1%, 61.4%)', // Teal
  2: 'hsl(33.2, 90.3%, 75.7%)',  // Orange
  3: 'hsl(83.8, 61.7%, 63.1%)',  // Green
  4: 'hsl(276.1, 67.7%, 74.5%)', // Purple
  5: 'hsl(13.8, 89.7%, 69.6%)',  // Red
} as const;

/**
 * App-Specific Brand Colors
 */
export const appBrands = {
  hephaitos: {
    primary: 'hsl(153, 60.2%, 52.7%)', // Supabase Green
    accent: 'hsl(152.9, 56.1%, 46.5%)',
    muted: 'hsla(153, 60%, 52%, 0.15)',
  },
  dryon: {
    primary: 'hsl(142, 76%, 36%)',
    accent: 'hsl(142, 69%, 58%)',
    muted: 'hsla(142, 76%, 36%, 0.15)',
  },
  folio: {
    primary: 'hsl(250, 87%, 67%)',
    accent: 'hsl(250, 95%, 76%)',
    muted: 'hsla(250, 87%, 67%, 0.15)',
  },
  ade: {
    primary: 'hsl(38.9, 100%, 42.9%)',
    accent: 'hsl(43, 96%, 58%)',
    muted: 'hsla(38.9, 100%, 42%, 0.15)',
  },
} as const;

/**
 * CSS Variables for Runtime Theming
 * Format: var(--name) for use in hsl()
 */
export const cssVariables = {
  // Core
  '--colors-black': '0, 0%, 0%',
  '--colors-white': '0, 0%, 100%',

  // Foreground
  '--foreground-default': '0, 0%, 98%',
  '--foreground-light': '0, 0%, 70.6%',
  '--foreground-lighter': '0, 0%, 53.7%',
  '--foreground-muted': '0, 0%, 30.2%',
  '--foreground-contrast': '0, 0%, 8.6%',

  // Background
  '--background-200': '0, 0%, 9%',
  '--background-default': '0, 0%, 7.1%',
  '--background-alternative-200': '0, 0%, 11%',
  '--background-alternative-default': '0, 0%, 5.9%',
  '--background-selection': '0, 0%, 19.2%',
  '--background-control': '0, 0%, 14.1%',
  '--background-surface-75': '0, 0%, 9%',
  '--background-surface-100': '0, 0%, 12.2%',
  '--background-surface-200': '0, 0%, 12.9%',
  '--background-surface-300': '0, 0%, 16.1%',
  '--background-surface-400': '0, 0%, 16.1%',
  '--background-overlay-default': '0, 0%, 14.1%',
  '--background-overlay-hover': '0, 0%, 18%',
  '--background-muted': '0, 0%, 14.1%',
  '--background-button-default': '0, 0%, 18%',
  '--background-dialog-default': '0, 0%, 7.1%',

  // Border
  '--border-default': '0, 0%, 18%',
  '--border-muted': '0, 0%, 14.1%',
  '--border-secondary': '0, 0%, 14.1%',
  '--border-overlay': '0, 0%, 20%',
  '--border-control': '0, 0%, 22.4%',
  '--border-alternative': '0, 0%, 26.7%',
  '--border-strong': '0, 0%, 21.2%',
  '--border-stronger': '0, 0%, 27.1%',
  '--border-button-default': '0, 0%, 24.3%',
  '--border-button-hover': '0, 0%, 31.4%',

  // Brand
  '--brand-200': '162, 100%, 2%',
  '--brand-300': '155, 100%, 8%',
  '--brand-400': '155.5, 100%, 9.6%',
  '--brand-500': '155, 100%, 19.2%',
  '--brand-600': '155, 59.5%, 70%',
  '--brand-default': '153, 60.2%, 52.7%',
  '--brand-link': '155, 100%, 38.6%',

  // Destructive
  '--destructive-200': '11, 23.4%, 9.2%',
  '--destructive-300': '7.5, 51.3%, 15.3%',
  '--destructive-400': '6.7, 60%, 20.6%',
  '--destructive-500': '7.9, 71.6%, 29%',
  '--destructive-600': '9.7, 85.2%, 62.9%',
  '--destructive-default': '10.2, 77.9%, 53.9%',

  // Warning
  '--warning-200': '36.6, 100%, 8%',
  '--warning-300': '32.3, 100%, 10.2%',
  '--warning-400': '33.2, 100%, 14.5%',
  '--warning-500': '34.8, 90.9%, 21.6%',
  '--warning-600': '38.9, 100%, 42.9%',
  '--warning-default': '38.9, 100%, 42.9%',
} as const;

/**
 * Tailwind Theme Extension
 */
export const tailwindColors = {
  // Core
  black: 'hsl(0, 0%, 0%)',
  white: 'hsl(0, 0%, 100%)',

  // Gray scales
  gray: grayDark,
  'gray-alpha': grayDarkAlpha,
  'gray-light': grayLight,

  // Semantic
  foreground,
  background,
  border,

  // Status
  brand,
  destructive,
  warning,

  // Code
  'code-block': codeBlock,

  // App brands
  ...appBrands,

  // Hi/Lo contrast
  'hi-contrast': 'hsl(var(--foreground-default))',
  'lo-contrast': 'hsl(var(--background-alternative-default))',
} as const;

// Type exports
export type GrayStep = keyof typeof grayDark;
export type BrandStep = keyof typeof brand;
export type AppBrand = keyof typeof appBrands;
