/**
 * FORGE LABS Design Tokens - Animations
 * L0 (Atoms) - Motion system
 */

/**
 * Duration Scale
 */
export const duration = {
  instant: '0ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

/**
 * Easing Functions
 * Based on Supabase/Radix animations
 */
export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Expressive easings
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

  // Enter/Exit
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/**
 * Transition Presets
 */
export const transitions = {
  // Common properties
  all: `all ${duration.normal} ${easing.easeInOut}`,
  colors: `color ${duration.fast} ${easing.easeInOut}, background-color ${duration.fast} ${easing.easeInOut}, border-color ${duration.fast} ${easing.easeInOut}`,
  opacity: `opacity ${duration.normal} ${easing.easeInOut}`,
  shadow: `box-shadow ${duration.normal} ${easing.easeInOut}`,
  transform: `transform ${duration.normal} ${easing.easeInOut}`,

  // Component-specific
  button: `all ${duration.fast} ${easing.easeInOut}`,
  input: `border-color ${duration.fast} ${easing.easeInOut}, box-shadow ${duration.fast} ${easing.easeInOut}`,
  card: `transform ${duration.normal} ${easing.easeOut}, box-shadow ${duration.normal} ${easing.easeOut}`,
  modal: `opacity ${duration.normal} ${easing.enter}, transform ${duration.normal} ${easing.spring}`,
  dropdown: `opacity ${duration.fast} ${easing.enter}, transform ${duration.fast} ${easing.enter}`,
  tooltip: `opacity ${duration.fast} ${easing.easeOut}`,
} as const;

/**
 * Keyframe Animations
 */
export const keyframes = {
  // Fade
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },

  // Slide
  slideInFromTop: {
    from: { transform: 'translateY(-10px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideInFromBottom: {
    from: { transform: 'translateY(10px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideInFromLeft: {
    from: { transform: 'translateX(-10px)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },
  slideInFromRight: {
    from: { transform: 'translateX(10px)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },

  // Scale
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: '1' },
    to: { transform: 'scale(0.95)', opacity: '0' },
  },

  // Skeleton loading
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },

  // Pulse
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },

  // Spin
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Bounce
  bounce: {
    '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  },

  // Accordion
  accordionDown: {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  accordionUp: {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' },
  },

  // Progress
  progressIndeterminate: {
    '0%': { transform: 'translateX(-100%)' },
    '50%': { transform: 'translateX(0%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  progressStripe: {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '40px 0' },
  },
} as const;

/**
 * Animation Presets
 */
export const animations = {
  fadeIn: `fadeIn ${duration.normal} ${easing.easeOut}`,
  fadeOut: `fadeOut ${duration.normal} ${easing.easeIn}`,
  slideInFromTop: `slideInFromTop ${duration.normal} ${easing.enter}`,
  slideInFromBottom: `slideInFromBottom ${duration.normal} ${easing.enter}`,
  scaleIn: `scaleIn ${duration.normal} ${easing.spring}`,
  shimmer: `shimmer 2s ${easing.linear} infinite`,
  pulse: `pulse 2s ${easing.easeInOut} infinite`,
  spin: `spin 1s ${easing.linear} infinite`,
  // Accordion
  accordionDown: `accordionDown ${duration.slow} ${easing.easeOut}`,
  accordionUp: `accordionUp ${duration.slow} ${easing.easeOut}`,
  // Progress
  progressIndeterminate: `progressIndeterminate 1.5s ${easing.easeInOut} infinite`,
  progressStripe: `progressStripe 1s ${easing.linear} infinite`,
} as const;

export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type AnimationKey = keyof typeof animations;
