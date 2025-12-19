/**
 * FORGE LABS UI - Popover Component
 * L2 (Cells) - Floating content panel
 *
 * Accessible popover built on Radix UI with Supabase dark theme
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/* -----------------------------------------------------------------------------
 * Popover Root
 * -------------------------------------------------------------------------- */

const Popover = PopoverPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Popover Trigger
 * -------------------------------------------------------------------------- */

const PopoverTrigger = PopoverPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Popover Anchor
 * -------------------------------------------------------------------------- */

const PopoverAnchor = PopoverPrimitive.Anchor;

/* -----------------------------------------------------------------------------
 * Popover Portal
 * -------------------------------------------------------------------------- */

const PopoverPortal = PopoverPrimitive.Portal;

/* -----------------------------------------------------------------------------
 * Popover Content Variants
 * -------------------------------------------------------------------------- */

const popoverContentVariants = cva(
  `
    z-50 rounded-md border border-border-overlay bg-surface-100 p-4 text-gray-1200
    shadow-lg outline-none
    data-[state=open]:animate-overlay-show
    data-[state=closed]:animate-overlay-hide
  `,
  {
    variants: {
      /** Content width */
      width: {
        auto: 'w-auto',
        sm: 'w-48',
        md: 'w-64',
        lg: 'w-80',
        xl: 'w-96',
        full: 'w-full',
      },
      /** Visual style */
      variant: {
        default: 'bg-surface-100 border-border-overlay',
        elevated: 'bg-surface-200 border-border-strong shadow-xl',
        glass: 'glass border-gray-700',
      },
    },
    defaultVariants: {
      width: 'auto',
      variant: 'default',
    },
  }
);

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverContentVariants> {
  /** Container element for portal */
  container?: HTMLElement | null;
  /** Show close button */
  showCloseButton?: boolean;
  /** Disable portal (render inline) */
  disablePortal?: boolean;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      width,
      variant,
      align = 'center',
      side = 'bottom',
      sideOffset = 4,
      alignOffset = 0,
      collisionPadding = 8,
      container,
      showCloseButton = false,
      disablePortal = false,
      children,
      ...props
    },
    ref
  ) => {
    const content = (
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cn(popoverContentVariants({ width, variant }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <PopoverPrimitive.Close
            className={cn(
              'absolute right-2 top-2 rounded-sm p-1',
              'text-gray-1000 hover:text-gray-1200',
              'opacity-70 hover:opacity-100',
              'transition-opacity duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-surface-100'
            )}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </PopoverPrimitive.Close>
        )}
      </PopoverPrimitive.Content>
    );

    if (disablePortal) {
      return content;
    }

    return <PopoverPortal container={container}>{content}</PopoverPortal>;
  }
);

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Popover Arrow
 * -------------------------------------------------------------------------- */

const popoverArrowVariants = cva('fill-surface-100', {
  variants: {
    /** Arrow size */
    size: {
      sm: 'w-2 h-1',
      md: 'w-3 h-1.5',
      lg: 'w-4 h-2',
    },
    /** Match content variant */
    variant: {
      default: 'fill-surface-100',
      elevated: 'fill-surface-200',
      glass: 'fill-gray-300',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface PopoverArrowProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>,
    VariantProps<typeof popoverArrowVariants> {}

const PopoverArrow = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Arrow>,
  PopoverArrowProps
>(({ className, size, variant, ...props }, ref) => (
  <PopoverPrimitive.Arrow
    ref={ref}
    className={cn(popoverArrowVariants({ size, variant }), className)}
    {...props}
  />
));

PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Popover Close
 * -------------------------------------------------------------------------- */

const popoverCloseVariants = cva(
  `
    inline-flex items-center justify-center rounded-md text-sm font-medium
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
    focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100
    disabled:pointer-events-none disabled:opacity-50
  `,
  {
    variants: {
      /** Button style */
      variant: {
        default: 'bg-gray-500 text-gray-1200 hover:bg-gray-600',
        ghost: 'text-gray-1100 hover:text-gray-1200 hover:bg-gray-400',
        outline: 'border border-gray-600 text-gray-1200 hover:bg-gray-400 hover:border-gray-700',
        brand: 'bg-brand-400 text-gray-100 hover:bg-brand-500',
      },
      /** Button size */
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-9 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface PopoverCloseProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>,
    VariantProps<typeof popoverCloseVariants> {}

const PopoverClose = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Close>,
  PopoverCloseProps
>(({ className, variant, size, ...props }, ref) => (
  <PopoverPrimitive.Close
    ref={ref}
    className={cn(popoverCloseVariants({ variant, size }), className)}
    {...props}
  />
));

PopoverClose.displayName = PopoverPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Popover Header
 * -------------------------------------------------------------------------- */

export interface PopoverHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverHeader = React.forwardRef<HTMLDivElement, PopoverHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 pb-3', className)}
      {...props}
    />
  )
);

PopoverHeader.displayName = 'PopoverHeader';

/* -----------------------------------------------------------------------------
 * Popover Title
 * -------------------------------------------------------------------------- */

export interface PopoverTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const PopoverTitle = React.forwardRef<HTMLHeadingElement, PopoverTitleProps>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn('text-sm font-medium text-gray-1200', className)}
      {...props}
    />
  )
);

PopoverTitle.displayName = 'PopoverTitle';

/* -----------------------------------------------------------------------------
 * Popover Description
 * -------------------------------------------------------------------------- */

export interface PopoverDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const PopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  PopoverDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-gray-1000', className)}
    {...props}
  />
));

PopoverDescription.displayName = 'PopoverDescription';

/* -----------------------------------------------------------------------------
 * Popover Footer
 * -------------------------------------------------------------------------- */

export interface PopoverFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverFooter = React.forwardRef<HTMLDivElement, PopoverFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 pt-3', className)}
      {...props}
    />
  )
);

PopoverFooter.displayName = 'PopoverFooter';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverFooter,
  popoverContentVariants,
  popoverArrowVariants,
  popoverCloseVariants,
};

// Re-export types from Radix for convenience
export type { PopoverProps } from '@radix-ui/react-popover';
