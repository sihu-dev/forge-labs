/**
 * FORGE LABS Design Tokens - Effects (Supabase 100% Match)
 * L0 (Atoms) - Advanced visual effects
 *
 * Includes: gradients, blurs, glows, overlays, masks
 */

/**
 * Backdrop Blur Effects
 */
export const blur = {
  none: 'blur(0)',
  sm: 'blur(4px)',
  DEFAULT: 'blur(8px)',
  md: 'blur(12px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)',
  '2xl': 'blur(40px)',
  '3xl': 'blur(64px)',
} as const;

/**
 * Glass/Frosted Effects
 */
export const glass = {
  subtle: {
    backdropFilter: 'blur(8px)',
    background: 'hsla(0, 0%, 7%, 0.7)',
    border: '1px solid hsla(0, 0%, 100%, 0.05)',
  },
  DEFAULT: {
    backdropFilter: 'blur(12px)',
    background: 'hsla(0, 0%, 7%, 0.8)',
    border: '1px solid hsla(0, 0%, 100%, 0.1)',
  },
  strong: {
    backdropFilter: 'blur(20px)',
    background: 'hsla(0, 0%, 7%, 0.9)',
    border: '1px solid hsla(0, 0%, 100%, 0.15)',
  },
} as const;

/**
 * Gradient Definitions
 */
export const gradients = {
  // Brand gradients
  brand: {
    primary: 'linear-gradient(135deg, hsl(153, 60%, 52.7%) 0%, hsl(155, 100%, 38.6%) 100%)',
    subtle: 'linear-gradient(135deg, hsla(153, 60%, 52.7%, 0.15) 0%, hsla(155, 100%, 38.6%, 0.05) 100%)',
    glow: 'radial-gradient(ellipse at center, hsla(153, 60%, 52.7%, 0.3) 0%, transparent 70%)',
  },

  // Background gradients
  background: {
    radial: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsla(153, 60%, 52.7%, 0.15) 0%, transparent 100%)',
    noise: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
    mesh: 'linear-gradient(180deg, hsl(0, 0%, 5.9%) 0%, hsl(0, 0%, 7.1%) 100%)',
  },

  // Overlay gradients
  overlay: {
    fadeTop: 'linear-gradient(to bottom, hsl(0, 0%, 7.1%) 0%, transparent 100%)',
    fadeBottom: 'linear-gradient(to top, hsl(0, 0%, 7.1%) 0%, transparent 100%)',
    fadeLeft: 'linear-gradient(to right, hsl(0, 0%, 7.1%) 0%, transparent 100%)',
    fadeRight: 'linear-gradient(to left, hsl(0, 0%, 7.1%) 0%, transparent 100%)',
    vignette: 'radial-gradient(ellipse at center, transparent 0%, hsl(0, 0%, 5.9%) 100%)',
  },

  // Text gradients
  text: {
    brand: 'linear-gradient(90deg, hsl(153, 60%, 52.7%) 0%, hsl(155, 100%, 70%) 100%)',
    silver: 'linear-gradient(90deg, hsl(0, 0%, 62.7%) 0%, hsl(0, 0%, 92.9%) 50%, hsl(0, 0%, 62.7%) 100%)',
    rainbow: 'linear-gradient(90deg, hsl(170.8, 43.1%, 61.4%) 0%, hsl(276.1, 67.7%, 74.5%) 50%, hsl(13.8, 89.7%, 69.6%) 100%)',
  },

  // Shine effect for loading
  shine: 'linear-gradient(90deg, transparent 0%, hsla(0, 0%, 100%, 0.1) 50%, transparent 100%)',

  // Line loading
  lineLoading: {
    dark: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 0.65) 50%, rgba(0, 0, 0, 0) 100%)',
    light: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(33, 33, 33, 0.65) 50%, rgba(0, 0, 0, 0) 100%)',
  },
} as const;

/**
 * Glow Effects
 */
export const glow = {
  brand: {
    sm: '0 0 10px hsla(153, 60%, 52.7%, 0.3)',
    DEFAULT: '0 0 20px hsla(153, 60%, 52.7%, 0.4)',
    lg: '0 0 30px hsla(153, 60%, 52.7%, 0.5)',
    xl: '0 0 50px hsla(153, 60%, 52.7%, 0.6)',
  },
  error: {
    sm: '0 0 10px hsla(10.2, 77.9%, 53.9%, 0.3)',
    DEFAULT: '0 0 20px hsla(10.2, 77.9%, 53.9%, 0.4)',
  },
  warning: {
    sm: '0 0 10px hsla(38.9, 100%, 42.9%, 0.3)',
    DEFAULT: '0 0 20px hsla(38.9, 100%, 42.9%, 0.4)',
  },
  white: {
    sm: '0 0 10px hsla(0, 0%, 100%, 0.1)',
    DEFAULT: '0 0 20px hsla(0, 0%, 100%, 0.15)',
  },
} as const;

/**
 * Highlight Effects (inset box-shadow)
 */
export const highlight = {
  top: 'inset 0 1px 0 0 hsla(0, 0%, 100%, 0.05)',
  bottom: 'inset 0 -1px 0 0 hsla(0, 0%, 100%, 0.05)',
  both: 'inset 0 1px 0 0 hsla(0, 0%, 100%, 0.05), inset 0 -1px 0 0 hsla(0, 0%, 100%, 0.05)',
} as const;

/**
 * Mask Effects
 */
export const masks = {
  fadeoutRight: 'linear-gradient(to right, white 98%, transparent 100%)',
  fadeoutLeft: 'linear-gradient(to left, white 98%, transparent 100%)',
  fadeoutTop: 'linear-gradient(to top, white 98%, transparent 100%)',
  fadeoutBottom: 'linear-gradient(to bottom, white 98%, transparent 100%)',
  fadeoutHorizontal: 'linear-gradient(to right, transparent 0%, white 2%, white 98%, transparent 100%)',
  fadeoutVertical: 'linear-gradient(to bottom, transparent 0%, white 2%, white 98%, transparent 100%)',
} as const;

/**
 * Noise Texture Overlay
 */
export const noise = {
  svg: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  opacity: {
    subtle: '0.02',
    DEFAULT: '0.04',
    strong: '0.08',
  },
} as const;

/**
 * Grid Pattern Background
 * Usage: bg-grid-{color}
 */
export const gridPattern = {
  svg: (color: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='${encodeURIComponent(color)}'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E")`,
  default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='hsla(0, 0%25, 100%25, 0.05)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E")`,
} as const;

/**
 * Dot Pattern Background
 */
export const dotPattern = {
  svg: (color: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='1' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`,
  default: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='1' fill='hsla(0, 0%25, 100%25, 0.1)'/%3E%3C/svg%3E")`,
} as const;

/**
 * Focus Ring Effects
 */
export const focusRing = {
  brand: {
    ring: '0 0 0 2px hsl(0, 0%, 7.1%), 0 0 0 4px hsl(153, 60.2%, 52.7%)',
    outline: '2px solid hsl(153, 60.2%, 52.7%)',
    outlineOffset: '2px',
  },
  error: {
    ring: '0 0 0 2px hsl(0, 0%, 7.1%), 0 0 0 4px hsl(10.2, 77.9%, 53.9%)',
    outline: '2px solid hsl(10.2, 77.9%, 53.9%)',
    outlineOffset: '2px',
  },
  inset: {
    ring: 'inset 0 0 0 2px hsl(153, 60.2%, 52.7%)',
  },
} as const;

/**
 * Border Glow (for interactive elements)
 */
export const borderGlow = {
  brand: '0 0 0 1px hsla(153, 60%, 52.7%, 0.5), 0 0 20px -5px hsla(153, 60%, 52.7%, 0.4)',
  subtle: '0 0 0 1px hsla(0, 0%, 100%, 0.1), 0 0 20px -5px hsla(0, 0%, 100%, 0.05)',
} as const;

/**
 * Tailwind Plugin-ready utilities
 */
export const utilities = {
  '.glass': {
    backdropFilter: glass.DEFAULT.backdropFilter,
    backgroundColor: glass.DEFAULT.background,
    borderWidth: '1px',
    borderColor: 'hsla(0, 0%, 100%, 0.1)',
  },
  '.glass-subtle': {
    backdropFilter: glass.subtle.backdropFilter,
    backgroundColor: glass.subtle.background,
    borderWidth: '1px',
    borderColor: 'hsla(0, 0%, 100%, 0.05)',
  },
  '.no-scrollbar': {
    '-ms-overflow-style': 'none',
    'scrollbar-width': 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  '.mask-fadeout-right': {
    '-webkit-mask-image': masks.fadeoutRight,
    'mask-image': masks.fadeoutRight,
  },
  '.mask-fadeout-left': {
    '-webkit-mask-image': masks.fadeoutLeft,
    'mask-image': masks.fadeoutLeft,
  },
  '.text-gradient-brand': {
    background: gradients.text.brand,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    'background-clip': 'text',
  },
  '.bg-noise': {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '0',
      background: noise.svg,
      opacity: noise.opacity.DEFAULT,
      pointerEvents: 'none',
    },
  },
  '.bg-grid': {
    backgroundImage: gridPattern.default,
  },
  '.bg-dots': {
    backgroundImage: dotPattern.default,
  },
  '.line-loading-bg': {
    background: gradients.lineLoading.dark,
  },
  '.line-loading-bg-light': {
    background: gradients.lineLoading.light,
  },
} as const;

// All exports are inline with their definitions above
