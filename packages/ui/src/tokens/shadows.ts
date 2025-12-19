/**
 * FORGE LABS Design Tokens - Shadows
 * L0 (Atoms) - Elevation system for dark mode
 */

/**
 * Shadow Scale
 * Optimized for dark mode (subtle shadows)
 */
export const shadows = {
  none: 'none',

  // Subtle shadows for dark mode
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  innerLg: 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.4)',
} as const;

/**
 * Glow Effects (for brand accents)
 */
export const glows = {
  brand: '0 0 20px rgba(62, 207, 142, 0.3)',
  brandIntense: '0 0 30px rgba(62, 207, 142, 0.5)',
  success: '0 0 20px rgba(34, 197, 94, 0.3)',
  warning: '0 0 20px rgba(245, 158, 11, 0.3)',
  error: '0 0 20px rgba(239, 68, 68, 0.3)',
  info: '0 0 20px rgba(59, 130, 246, 0.3)',
} as const;

/**
 * Focus Ring
 */
export const focusRing = {
  DEFAULT: '0 0 0 2px var(--forge-bg), 0 0 0 4px var(--forge-primary)',
  error: '0 0 0 2px var(--forge-bg), 0 0 0 4px var(--forge-error)',
  offset: '0 0 0 3px var(--forge-bg), 0 0 0 5px var(--forge-primary)',
} as const;

/**
 * Component Shadows
 */
export const componentShadows = {
  // Cards
  card: shadows.sm,
  cardHover: shadows.md,
  cardElevated: shadows.lg,

  // Dropdowns & Popovers
  dropdown: shadows.lg,
  popover: shadows.lg,
  tooltip: shadows.md,

  // Modals
  dialog: shadows.xl,
  sheet: shadows['2xl'],

  // Buttons
  buttonDefault: shadows.none,
  buttonHover: shadows.sm,
  buttonPressed: shadows.inner,
} as const;

export type ShadowKey = keyof typeof shadows;
export type GlowKey = keyof typeof glows;
