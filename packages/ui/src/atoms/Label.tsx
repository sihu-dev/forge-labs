/**
 * FORGE LABS UI - Label Component
 * L2 (Cells) - Form label
 *
 * Accessible label for form elements
 */

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-gray-12',
        muted: 'text-gray-11',
        error: 'text-error-DEFAULT',
        success: 'text-success-DEFAULT',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /** Mark as required */
  required?: boolean;
  /** Optional label */
  optional?: boolean;
  /** Helper/description text */
  description?: string;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, required, optional, description, children, ...props }, ref) => (
  <div className="space-y-1">
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ variant }), 'flex items-center gap-1', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error-DEFAULT" aria-label="required">
          *
        </span>
      )}
      {optional && (
        <span className="text-xs text-gray-9 font-normal">(optional)</span>
      )}
    </LabelPrimitive.Root>
    {description && (
      <p className="text-xs text-gray-11">{description}</p>
    )}
  </div>
));

Label.displayName = 'Label';

export { Label, labelVariants };
