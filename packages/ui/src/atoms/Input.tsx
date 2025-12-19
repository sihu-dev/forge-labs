/**
 * FORGE LABS UI - Input Component
 * L2 (Cells) - Text input field
 *
 * Supabase-inspired input with validation states
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const inputVariants = cva(
  `
    flex w-full rounded-md border bg-gray-2 px-3
    text-gray-12 placeholder:text-gray-9
    transition-colors duration-150
    file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-12
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    variants: {
      variant: {
        default:
          'border-gray-5 focus-visible:border-brand-400 focus-visible:ring-brand-400',
        error:
          'border-error-DEFAULT focus-visible:border-error-DEFAULT focus-visible:ring-error-DEFAULT',
        success:
          'border-success-DEFAULT focus-visible:border-success-DEFAULT focus-visible:ring-success-DEFAULT',
      },
      inputSize: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Left addon/icon */
  leftAddon?: React.ReactNode;
  /** Right addon/icon */
  rightAddon?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Helper text */
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type = 'text',
      leftAddon,
      rightAddon,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const hasAddons = leftAddon || rightAddon;
    const effectiveVariant = error ? 'error' : variant;

    const input = (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: effectiveVariant, inputSize }),
          leftAddon && 'pl-10',
          rightAddon && 'pr-10',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (!hasAddons && !error && !helperText) {
      return input;
    }

    return (
      <div className="w-full">
        <div className="relative">
          {leftAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-9">
              {leftAddon}
            </div>
          )}
          {input}
          {rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-9">
              {rightAddon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-error-DEFAULT' : 'text-gray-11'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
