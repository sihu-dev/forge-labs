/**
 * FORGE LABS UI Utils - Class Name Merger
 * L1 (Molecules) - Utility for merging Tailwind classes
 *
 * Combines clsx and tailwind-merge for conflict-free class merging
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // conditional classes
 * cn(['flex', 'items-center'], { 'hidden': isHidden }) // arrays and objects
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Create a class name generator with base classes
 *
 * @example
 * const buttonClasses = createClassComposer('px-4 py-2 rounded');
 * buttonClasses('bg-blue-500', { 'opacity-50': disabled }) // => 'px-4 py-2 rounded bg-blue-500 opacity-50'
 */
export function createClassComposer(baseClasses: string) {
  return (...inputs: ClassValue[]): string => {
    return cn(baseClasses, ...inputs);
  };
}

/**
 * Type-safe class merger for component variants
 */
export type ClassNameValue = ClassValue;
