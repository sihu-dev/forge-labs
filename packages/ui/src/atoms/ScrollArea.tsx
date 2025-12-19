/**
 * FORGE LABS UI - ScrollArea Component
 * L2 (Cells) - Custom scrollable container
 *
 * Supabase-inspired scroll area with styled scrollbars
 */

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const scrollAreaVariants = cva('relative overflow-hidden', {
  variants: {
    size: {
      sm: 'max-h-48',
      md: 'max-h-72',
      lg: 'max-h-96',
      xl: 'max-h-[32rem]',
      full: 'h-full',
    },
  },
  defaultVariants: {
    size: 'full',
  },
});

const scrollBarVariants = cva(
  `
    flex touch-none select-none transition-colors duration-150
    data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100
  `,
  {
    variants: {
      orientation: {
        vertical: 'h-full w-2.5 border-l border-l-transparent p-[1px]',
        horizontal: 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      },
      variant: {
        default: '',
        thin: '',
        invisible: 'opacity-0 hover:opacity-100',
      },
    },
    compoundVariants: [
      {
        orientation: 'vertical',
        variant: 'thin',
        className: 'w-1.5',
      },
      {
        orientation: 'horizontal',
        variant: 'thin',
        className: 'h-1.5',
      },
    ],
    defaultVariants: {
      orientation: 'vertical',
      variant: 'default',
    },
  }
);

const scrollThumbVariants = cva(
  `
    relative flex-1 rounded-full
    transition-colors duration-150
  `,
  {
    variants: {
      variant: {
        default: 'bg-gray-7 hover:bg-gray-8',
        subtle: 'bg-gray-6 hover:bg-gray-7',
        contrast: 'bg-gray-9 hover:bg-gray-10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
    VariantProps<typeof scrollAreaVariants> {
  /** Scrollbar variant */
  scrollBarVariant?: 'default' | 'thin' | 'invisible';
  /** Scrollbar thumb variant */
  thumbVariant?: 'default' | 'subtle' | 'contrast';
  /** Show vertical scrollbar */
  showVertical?: boolean;
  /** Show horizontal scrollbar */
  showHorizontal?: boolean;
  /** Scroll bar always visible */
  scrollbarAlwaysVisible?: boolean;
}

export type ScrollBarProps = Omit<
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  'orientation'
> &
  VariantProps<typeof scrollBarVariants> & {
    /** Thumb variant */
    thumbVariant?: 'default' | 'subtle' | 'contrast';
  };

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      size,
      scrollBarVariant = 'default',
      thumbVariant = 'default',
      showVertical = true,
      showHorizontal = false,
      scrollbarAlwaysVisible = false,
      ...props
    },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(scrollAreaVariants({ size }), className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showVertical && (
        <ScrollBar
          orientation="vertical"
          variant={scrollBarVariant}
          thumbVariant={thumbVariant}
          forceMount={scrollbarAlwaysVisible ? true : undefined}
        />
      )}
      {showHorizontal && (
        <ScrollBar
          orientation="horizontal"
          variant={scrollBarVariant}
          thumbVariant={thumbVariant}
          forceMount={scrollbarAlwaysVisible ? true : undefined}
        />
      )}
      <ScrollAreaPrimitive.Corner className="bg-gray-6" />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = 'ScrollArea';

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = 'vertical', variant, thumbVariant = 'default', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation ?? 'vertical'}
    className={cn(scrollBarVariants({ orientation, variant }), className)}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(scrollThumbVariants({ variant: thumbVariant }))}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = 'ScrollBar';

export {
  ScrollArea,
  ScrollBar,
  scrollAreaVariants,
  scrollBarVariants,
  scrollThumbVariants,
};
