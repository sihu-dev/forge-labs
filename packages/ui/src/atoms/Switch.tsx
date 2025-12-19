/**
 * FORGE LABS UI - Switch Component
 * L2 (Cells) - Toggle switch
 *
 * Accessible toggle control
 */

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const switchVariants = cva(
  `
    peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent
    transition-colors duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
    focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1
    disabled:cursor-not-allowed disabled:opacity-50
    data-[state=unchecked]:bg-gray-6
  `,
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-brand-400',
        success: 'data-[state=checked]:bg-success-DEFAULT',
        warning: 'data-[state=checked]:bg-warning-DEFAULT',
        error: 'data-[state=checked]:bg-error-DEFAULT',
      },
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const thumbVariants = cva(
  `
    pointer-events-none block rounded-full bg-white shadow-lg ring-0
    transition-transform duration-200
    data-[state=unchecked]:translate-x-0
  `,
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(
  (
    {
      className,
      variant,
      size,
      label,
      description,
      labelPosition = 'right',
      ...props
    },
    ref
  ) => {
    const switchElement = (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(switchVariants({ variant, size }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb className={cn(thumbVariants({ size }))} />
      </SwitchPrimitive.Root>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <label
        className={cn(
          'flex items-center gap-3 cursor-pointer',
          labelPosition === 'left' && 'flex-row-reverse justify-end'
        )}
      >
        {switchElement}
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-12">{label}</span>
          )}
          {description && (
            <span className="text-xs text-gray-11">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch, switchVariants };
