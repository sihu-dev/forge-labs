/**
 * FORGE LABS UI - Separator Component
 * L2 (Cells) - Visual divider
 *
 * Horizontal or vertical divider line
 */

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../lib/cn';

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Visual style */
  variant?: 'default' | 'dashed' | 'dotted';
  /** Optional label to display in the middle */
  label?: string;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = 'horizontal',
      decorative = true,
      variant = 'default',
      label,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    };

    if (label && orientation === 'horizontal') {
      return (
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-5" />
          <span className="mx-4 flex-shrink text-xs text-gray-9">{label}</span>
          <div className="flex-grow border-t border-gray-5" />
        </div>
      );
    }

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          'shrink-0 bg-gray-5',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };
