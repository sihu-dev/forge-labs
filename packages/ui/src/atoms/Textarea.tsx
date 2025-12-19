/**
 * FORGE LABS UI - Textarea Component
 * L2 (Cells) - Multi-line text input
 *
 * Styled native textarea with validation states
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const textareaVariants = cva(
  `
    flex w-full rounded-md border bg-gray-2
    text-gray-12 placeholder:text-gray-9
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1
    disabled:cursor-not-allowed disabled:opacity-50
    resize-y
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
      textareaSize: {
        sm: 'min-h-[80px] px-3 py-2 text-sm',
        md: 'min-h-[120px] px-3 py-2.5 text-base',
        lg: 'min-h-[160px] px-4 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'md',
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Label text */
  label?: string;
  /** Description text below label */
  description?: string;
  /** Error message (shows error variant automatically) */
  error?: string;
  /** Helper text below textarea */
  helperText?: string;
  /** Show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Mark as required */
  required?: boolean;
  /** Mark as optional */
  optional?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      textareaSize,
      label,
      description,
      error,
      helperText,
      showCount,
      maxLength,
      required,
      optional,
      value,
      defaultValue,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue?.toString() || ''
    );
    const currentValue = value !== undefined ? value.toString() : internalValue;
    const characterCount = currentValue.length;
    const effectiveVariant = error ? 'error' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const textarea = (
      <textarea
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          textareaVariants({ variant: effectiveVariant, textareaSize }),
          className
        )}
        {...props}
      />
    );

    // Simple textarea without wrapper
    if (!label && !description && !error && !helperText && !showCount) {
      return textarea;
    }

    return (
      <div className="w-full space-y-2">
        {/* Label and description */}
        {(label || description) && (
          <div className="space-y-1">
            {label && (
              <label
                className={cn(
                  'flex items-center gap-1 text-sm font-medium text-gray-12',
                  disabled && 'opacity-50'
                )}
              >
                {label}
                {required && (
                  <span className="text-error-DEFAULT" aria-label="required">
                    *
                  </span>
                )}
                {optional && (
                  <span className="text-xs text-gray-9 font-normal">(optional)</span>
                )}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-11">{description}</p>
            )}
          </div>
        )}

        {/* Textarea */}
        {textarea}

        {/* Footer: helper/error text and character count */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {(error || helperText) && (
              <p
                className={cn(
                  'text-sm',
                  error ? 'text-error-DEFAULT' : 'text-gray-11'
                )}
              >
                {error || helperText}
              </p>
            )}
          </div>
          {showCount && (
            <span
              className={cn(
                'text-xs text-gray-9 shrink-0',
                maxLength && characterCount >= maxLength && 'text-error-DEFAULT'
              )}
            >
              {characterCount}
              {maxLength && `/${maxLength}`}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
