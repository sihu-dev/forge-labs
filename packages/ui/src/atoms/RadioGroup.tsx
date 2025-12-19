/**
 * FORGE LABS UI - RadioGroup Component
 * L2 (Cells) - Radio group input with Radix UI
 *
 * Accessible radio button group with label and description support
 */

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { Circle } from 'lucide-react';
import { cn } from '../lib/cn';

// RadioGroup Root
const radioGroupVariants = cva('grid gap-2', {
  variants: {
    orientation: {
      horizontal: 'grid-flow-col auto-cols-max gap-4',
      vertical: 'grid-flow-row',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

// RadioGroup Item
const radioItemVariants = cva(
  `
    aspect-square rounded-full border-2
    transition-colors duration-150
    focus:outline-none focus-visible:ring-2
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
          focus-visible:ring-brand-400
        `,
        error: `
          border-error-DEFAULT
          data-[state=checked]:border-error-DEFAULT data-[state=checked]:bg-error-DEFAULT
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

const indicatorSizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const labelSizeMap = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

// ============================================================================
// RadioGroup Root
// ============================================================================

export interface RadioGroupProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    'orientation'
  > {
  /** Group label */
  label?: string;
  /** Description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = 'vertical', label, description, error, children, ...props }, ref) => (
  <div className="space-y-3">
    {(label || description) && (
      <div className="space-y-1">
        {label && (
          <span className="text-sm font-medium text-gray-12">{label}</span>
        )}
        {description && (
          <p className="text-xs text-gray-11">{description}</p>
        )}
      </div>
    )}
    <RadioGroupPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(radioGroupVariants({ orientation }), className)}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Root>
    {error && <p className="text-sm text-error-DEFAULT">{error}</p>}
  </div>
));

RadioGroup.displayName = 'RadioGroup';

// ============================================================================
// RadioGroup Item
// ============================================================================

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Position of radio relative to label */
  position?: 'left' | 'right';
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(
  (
    {
      className,
      variant,
      size = 'md',
      label,
      description,
      position = 'left',
      disabled,
      ...props
    },
    ref
  ) => {
    const indicatorSize = indicatorSizeMap[size || 'md'];
    const labelSize = labelSizeMap[size || 'md'];

    const radioElement = (
      <RadioGroupPrimitive.Item
        ref={ref}
        disabled={disabled}
        className={cn(radioItemVariants({ variant, size }), className)}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className={cn(indicatorSize, 'fill-white text-white')} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );

    if (!label && !description) {
      return radioElement;
    }

    return (
      <label
        className={cn(
          'flex items-start gap-3 cursor-pointer',
          position === 'right' && 'flex-row-reverse justify-end',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="flex items-center h-5">
          {radioElement}
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
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem, radioGroupVariants, radioItemVariants };
