/**
 * FORGE LABS UI Utils - Common Variant Definitions
 * L1 (Molecules) - Shared variant configurations
 */

import { cva } from './cva';

/**
 * Intent/Color Variants
 * Used across Button, Badge, Alert, etc.
 */
export const intentVariants = {
  primary: 'bg-brand-400 text-white hover:bg-brand-500',
  secondary: 'bg-gray-4 text-gray-12 hover:bg-gray-5',
  ghost: 'bg-transparent text-gray-12 hover:bg-gray-4',
  outline: 'border border-gray-6 bg-transparent text-gray-12 hover:bg-gray-4',
  destructive: 'bg-error-DEFAULT text-white hover:bg-error-dark',
  success: 'bg-success-DEFAULT text-white hover:bg-success-dark',
  warning: 'bg-warning-DEFAULT text-gray-1 hover:bg-warning-dark',
  info: 'bg-info-DEFAULT text-white hover:bg-info-dark',
  link: 'bg-transparent text-brand-400 hover:underline',
} as const;

/**
 * Size Variants
 */
export const sizeVariants = {
  xs: 'h-6 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-8 text-xl',
} as const;

/**
 * Icon Size Variants
 */
export const iconSizeVariants = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

/**
 * Rounded Variants
 */
export const roundedVariants = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Status Variants (for badges, alerts, indicators)
 */
export const statusVariants = {
  default: 'bg-gray-4 text-gray-11',
  success: 'bg-success-muted text-success-DEFAULT',
  warning: 'bg-warning-muted text-warning-DEFAULT',
  error: 'bg-error-muted text-error-DEFAULT',
  info: 'bg-info-muted text-info-DEFAULT',
  brand: 'bg-brand-400/15 text-brand-400',
} as const;

/**
 * Focus Ring Styles
 */
export const focusRingStyles =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1';

/**
 * Disabled Styles
 */
export const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-50';

/**
 * Interactive Base Styles
 */
export const interactiveBaseStyles = `
  transition-colors duration-150 ease-out
  ${focusRingStyles}
  ${disabledStyles}
`;

/**
 * Base Card Variants (used as foundation)
 */
export const baseCardVariants = cva(
  'rounded-lg border border-gray-5 bg-gray-3 text-gray-12',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-md',
        interactive:
          'cursor-pointer hover:border-gray-6 hover:bg-gray-4 transition-colors',
        outline: 'bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

/**
 * Base Input Variants (used as foundation)
 */
export const baseInputVariants = cva(
  `
    flex w-full rounded-md border bg-gray-2 px-3 py-2
    text-gray-12 placeholder:text-gray-9
    transition-colors duration-150
    file:border-0 file:bg-transparent file:text-sm file:font-medium
    ${focusRingStyles}
    ${disabledStyles}
  `,
  {
    variants: {
      variant: {
        default: 'border-gray-5 focus:border-brand-400',
        error: 'border-error-DEFAULT focus:border-error-DEFAULT focus-visible:ring-error-DEFAULT',
        success: 'border-success-DEFAULT focus:border-success-DEFAULT',
      },
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Export variant types
export type IntentVariant = keyof typeof intentVariants;
export type SizeVariant = keyof typeof sizeVariants;
export type RoundedVariant = keyof typeof roundedVariants;
export type StatusVariant = keyof typeof statusVariants;
