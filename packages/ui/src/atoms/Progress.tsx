/**
 * FORGE LABS UI - Progress Component
 * L2 (Cells) - Progress indicator
 *
 * Supabase-inspired progress bar with variants
 */

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const progressVariants = cva(
  `
    relative w-full overflow-hidden rounded-full
    bg-gray-4
  `,
  {
    variants: {
      size: {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
        xl: 'h-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const progressIndicatorVariants = cva(
  `
    h-full w-full flex-1 rounded-full
    transition-all duration-300 ease-out
  `,
  {
    variants: {
      variant: {
        default: 'bg-brand-400',
        success: 'bg-success-DEFAULT',
        warning: 'bg-warning-DEFAULT',
        error: 'bg-error-DEFAULT',
        gradient: 'bg-gradient-to-r from-brand-400 to-brand-600',
      },
      animated: {
        true: '',
        false: '',
      },
      indeterminate: {
        true: 'animate-progress-indeterminate',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animated: false,
      indeterminate: false,
    },
  }
);

const progressLabelVariants = cva('font-medium tabular-nums', {
  variants: {
    size: {
      xs: 'text-[10px]',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
    variant: {
      default: 'text-gray-12',
      success: 'text-success-DEFAULT',
      warning: 'text-warning-DEFAULT',
      error: 'text-error-DEFAULT',
      gradient: 'text-brand-400',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'right' | 'top' | 'inside';
  /** Custom label formatter */
  formatLabel?: (value: number) => string;
  /** Progress value (0-100) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Show stripe pattern */
  striped?: boolean;
  /** Animate stripe pattern */
  stripedAnimated?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      max = 100,
      size,
      variant,
      animated,
      indeterminate,
      showLabel = false,
      labelPosition = 'right',
      formatLabel,
      striped = false,
      stripedAnimated = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    const displayValue = formatLabel
      ? formatLabel(value)
      : `${Math.round(percentage)}%`;

    const progressBar = (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        value={value}
        max={max}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            progressIndicatorVariants({ variant, animated, indeterminate }),
            striped &&
              'bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:20px_20px]',
            stripedAnimated && 'animate-progress-stripe'
          )}
          style={{
            transform: indeterminate
              ? undefined
              : `translateX(-${100 - percentage}%)`,
          }}
        />
      </ProgressPrimitive.Root>
    );

    if (!showLabel) {
      return progressBar;
    }

    if (labelPosition === 'top') {
      return (
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between">
            <span
              className={cn(progressLabelVariants({ size, variant }), 'text-gray-11')}
            >
              Progress
            </span>
            <span className={cn(progressLabelVariants({ size, variant }))}>
              {displayValue}
            </span>
          </div>
          {progressBar}
        </div>
      );
    }

    if (labelPosition === 'inside' && (size === 'lg' || size === 'xl')) {
      return (
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size }), 'relative', className)}
          value={value}
          max={max}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressIndicatorVariants({ variant, animated, indeterminate }),
              striped &&
                'bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:20px_20px]',
              stripedAnimated && 'animate-progress-stripe'
            )}
            style={{
              transform: indeterminate
                ? undefined
                : `translateX(-${100 - percentage}%)`,
            }}
          />
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              progressLabelVariants({ size: 'sm' }),
              'text-white mix-blend-difference'
            )}
          >
            {displayValue}
          </span>
        </ProgressPrimitive.Root>
      );
    }

    return (
      <div className="flex w-full items-center gap-3">
        <div className="flex-1">{progressBar}</div>
        <span
          className={cn(
            progressLabelVariants({ size, variant }),
            'min-w-[3ch]'
          )}
        >
          {displayValue}
        </span>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export {
  Progress,
  progressVariants,
  progressIndicatorVariants,
  progressLabelVariants,
};
