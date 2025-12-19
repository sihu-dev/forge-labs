/**
 * FORGE LABS UI - Slider Component
 * L2 (Cells) - Range input slider
 *
 * Supabase-inspired slider with marks and range support
 */

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const sliderVariants = cva(
  `
    relative flex w-full touch-none select-none items-center
  `,
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      disabled: false,
    },
  }
);

const sliderTrackVariants = cva(
  `
    relative grow overflow-hidden rounded-full bg-gray-4
  `,
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const sliderRangeVariants = cva('absolute h-full rounded-full', {
  variants: {
    variant: {
      default: 'bg-brand-400',
      success: 'bg-success-DEFAULT',
      warning: 'bg-warning-DEFAULT',
      error: 'bg-error-DEFAULT',
      gradient: 'bg-gradient-to-r from-brand-400 to-brand-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const sliderThumbVariants = cva(
  `
    block rounded-full border-2 bg-white shadow-lg
    ring-offset-gray-1
    transition-all duration-150
    hover:scale-110
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-brand-400 focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-50
  `,
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      variant: {
        default: 'border-brand-400',
        success: 'border-success-DEFAULT',
        warning: 'border-warning-DEFAULT',
        error: 'border-error-DEFAULT',
        gradient: 'border-brand-400',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface SliderMark {
  /** Value position for the mark */
  value: number;
  /** Label to display (optional) */
  label?: string;
}

export type SliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'disabled'
> &
  VariantProps<typeof sliderVariants> &
  VariantProps<typeof sliderRangeVariants> & {
  /** Single value or array for range */
  value?: number[];
  /** Default value(s) */
  defaultValue?: number[];
  /** Marks/ticks to display */
  marks?: SliderMark[] | boolean;
  /** Show current value tooltip */
  showTooltip?: boolean;
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Custom value formatter */
  formatValue?: (value: number) => string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      size = 'md',
      variant = 'default',
      disabled,
      marks = false,
      showTooltip = false,
      showMinMax = false,
      formatValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(
      defaultValue ?? value ?? [min]
    );
    const [isDragging, setIsDragging] = React.useState(false);

    const currentValue = value ?? internalValue;

    const handleValueChange = (newValue: number[]) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    const formatDisplay = (val: number) => {
      return formatValue ? formatValue(val) : String(val);
    };

    // Generate marks array if marks is true
    const marksArray = React.useMemo((): SliderMark[] => {
      if (Array.isArray(marks)) {
        return marks;
      }
      if (marks === true) {
        // Generate marks at min, max, and optionally middle
        const middle = (min + max) / 2;
        return [
          { value: min, label: formatDisplay(min) },
          { value: middle },
          { value: max, label: formatDisplay(max) },
        ];
      }
      return [];
    }, [marks, min, max]);

    return (
      <div className={cn('w-full', showMinMax && 'px-1')}>
        <SliderPrimitive.Root
          ref={ref}
          className={cn(sliderVariants({ size, disabled }), className)}
          value={currentValue}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={handleValueChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          {...props}
        >
          <SliderPrimitive.Track className={cn(sliderTrackVariants({ size }))}>
            <SliderPrimitive.Range
              className={cn(sliderRangeVariants({ variant }))}
            />
          </SliderPrimitive.Track>
          {currentValue.map((val, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className={cn(sliderThumbVariants({ size, variant }), 'relative')}
            >
              {showTooltip && isDragging && (
                <div
                  className={cn(
                    'absolute -top-8 left-1/2 -translate-x-1/2',
                    'rounded bg-gray-12 px-2 py-1 text-xs text-gray-1',
                    'whitespace-nowrap shadow-lg',
                    'animate-in fade-in-0 zoom-in-95'
                  )}
                >
                  {formatDisplay(val)}
                </div>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>

        {/* Marks */}
        {marksArray.length > 0 && (
          <div className="relative mt-1">
            {marksArray.map((mark, index) => {
              const position = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={index}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${position}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="h-1.5 w-0.5 bg-gray-6" />
                  {mark.label && (
                    <span className="mt-1 text-xs text-gray-11">
                      {mark.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Min/Max Labels */}
        {showMinMax && !marks && (
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-gray-11">{formatDisplay(min)}</span>
            <span className="text-xs text-gray-11">{formatDisplay(max)}</span>
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export {
  Slider,
  sliderVariants,
  sliderTrackVariants,
  sliderRangeVariants,
  sliderThumbVariants,
};
