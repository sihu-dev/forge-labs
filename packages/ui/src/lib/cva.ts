/**
 * FORGE LABS UI Utils - Class Variance Authority Wrapper
 * L1 (Molecules) - Type-safe component variants
 *
 * Re-exports and extends cva for FORGE LABS components
 */

import { cva, type VariantProps } from 'class-variance-authority';

// Re-export cva and VariantProps
export { cva, type VariantProps };

/**
 * Helper type to extract variant props from a cva definition
 */
export type ExtractVariantProps<T extends (...args: unknown[]) => unknown> =
  VariantProps<T>;

/**
 * Helper to create a component with variants
 *
 * @example
 * const buttonVariants = defineVariants({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     intent: {
 *       primary: 'bg-brand-400 text-white',
 *       secondary: 'bg-gray-4 text-gray-12',
 *     },
 *     size: {
 *       sm: 'text-sm',
 *       md: 'text-base',
 *     },
 *   },
 *   defaultVariants: {
 *     intent: 'primary',
 *     size: 'md',
 *   },
 * });
 */
export function defineVariants<T extends Parameters<typeof cva>[1]>(
  config: { base: string } & T
) {
  const { base, ...rest } = config as { base: string } & Record<string, unknown>;
  return cva(base, rest as unknown as T);
}

/**
 * Compose multiple variant functions
 */
export function composeVariants<
  T extends Array<(...args: unknown[]) => string>
>(...variantFns: T) {
  return (...args: Parameters<T[number]>[]) => {
    return variantFns.map((fn, i) => fn(args[i])).join(' ');
  };
}
