/**
 * FORGE LABS Design Tokens
 * L0 (Atoms) - Complete token system
 *
 * Supabase 100% match, dark/light mode optimized
 */

export * from './colors';
export * from './colors-light';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './animations';
export * from './effects';

// Re-export commonly used color tokens (dark mode - default)
export {
  grayDark,
  grayDarkAlpha,
  grayLight,
  brand,
  foreground,
  background,
  border,
  destructive,
  warning,
  codeBlock,
  appBrands,
  cssVariables,
  tailwindColors,
} from './colors';

// Re-export light mode color tokens
export {
  grayLight as grayLightScale,
  grayLightAlpha,
  brandLight,
  foregroundLight,
  backgroundLight,
  borderLight,
  destructiveLight,
  warningLight,
  codeBlockLight,
  cssVariablesLight,
  tailwindColorsLight,
  lightTheme,
  generateLightModeCSSVariables,
} from './colors-light';

// Re-export typography tokens
export {
  fontFamily,
  fontSize,
  fontWeight,
  textStyles,
} from './typography';

// Re-export spacing tokens
export {
  spacing,
  semanticSpacing,
  containers,
  panels,
} from './spacing';

// Re-export radius tokens
export {
  radius,
  componentRadius,
} from './radius';

// Re-export shadow tokens
export {
  shadows,
  glows,
  focusRing,
  componentShadows,
} from './shadows';

// Re-export animation tokens
export {
  duration,
  easing,
  transitions,
  keyframes,
  animations,
} from './animations';

// Re-export effect tokens (renamed to avoid conflicts)
export {
  blur,
  glass,
  gradients,
  glow,
  highlight,
  masks,
  noise,
  gridPattern,
  dotPattern,
  focusRing as effectFocusRing,
  borderGlow,
  utilities as effectUtilities,
} from './effects';
