/**
 * FORGE LABS UI - Checkbox Component
 * L2 (Cells) - Checkbox input with Radix UI
 *
 * Accessible checkbox control with label and description support
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import { cn } from '../lib/cn';

const checkboxVariants = cva(
  `
    peer shrink-0 rounded border-2
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1
    disabled:cursor-not-allowed disabled:opacity-50
    data-[state=unchecked]:bg-gray-2
  `,
  {
    variants: {
      variant: {
        default: `
          border-gray-5
          data-[state=checked]:border-brand-400 data-[state=checked]:bg-brand-400
          data-[state=indeterminate]:border-brand-400 data-[state=indeterminate]:bg-brand-400
          focus-visible:ring-brand-400
        `,
        error: `
          border-error-DEFAULT
          data-[state=checked]:border-error-DEFAULT data-[state=checked]:bg-error-DEFAULT
          data-[state=indeterminate]:border-error-DEFAULT data-[state=indeterminate]:bg-error-DEFAULT
          focus-visible:ring-error-DEFAULT
        `,
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const iconSizeMap = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

const labelSizeMap = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /** Label text */
  label?: string;
  /** Description text below label */
  description?: string;
  /** Error message (shows error variant automatically) */
  error?: string;
  /** Position of checkbox relative to label */
  position?: 'left' | 'right';
  /** Indeterminate state */
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      variant,
      size = 'md',
      label,
      description,
      error,
      position = 'left',
      checked,
      indeterminate,
      disabled,
      ...props
    },
    ref
  ) => {
    const effectiveVariant = error ? 'error' : variant;
    const effectiveChecked = indeterminate ? 'indeterminate' : checked;
    const iconSize = iconSizeMap[size || 'md'];
    const labelSize = labelSizeMap[size || 'md'];

    const checkboxElement = (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={effectiveChecked}
        disabled={disabled}
        className={cn(checkboxVariants({ variant: effectiveVariant, size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className="flex items-center justify-center text-white"
        >
          {indeterminate ? (
            <Minus className={iconSize} strokeWidth={3} />
          ) : (
            <Check className={iconSize} strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!label && !description && !error) {
      return checkboxElement;
    }

    return (
      <div className="space-y-1">
        <label
          className={cn(
            'flex items-start gap-3 cursor-pointer',
            position === 'right' && 'flex-row-reverse justify-end',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="flex items-center h-5">
            {checkboxElement}
          </div>
          <div className="flex flex-col gap-0.5">
            {label && (
              <span
                className={cn(
                  'font-medium text-gray-12 leading-tight',
                  labelSize
                )}
              >
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-11 leading-relaxed">
                {description}
              </span>
            )}
          </div>
        </label>
        {error && (
          <p className="text-sm text-error-DEFAULT ml-8">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
