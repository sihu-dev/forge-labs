/**
 * FORGE LABS UI - Badge Component
 * L2 (Cells) - Status indicator
 *
 * Supabase-inspired badge with semantic variants
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-4 text-gray-11',
        brand: 'bg-brand-400/15 text-brand-400',
        success: 'bg-success-muted text-success-DEFAULT',
        warning: 'bg-warning-muted text-warning-DEFAULT',
        error: 'bg-error-muted text-error-DEFAULT',
        info: 'bg-info-muted text-info-DEFAULT',
        outline: 'border border-gray-6 text-gray-11 bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs rounded',
        md: 'px-2.5 py-0.5 text-sm rounded-md',
        lg: 'px-3 py-1 text-sm rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a dot indicator */
  dot?: boolean;
  /** Dot color (defaults to current text color) */
  dotColor?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      dotColor,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-current"
            style={dotColor ? { backgroundColor: dotColor } : undefined}
          />
        )}
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
