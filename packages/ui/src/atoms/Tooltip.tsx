/**
 * FORGE LABS UI - Tooltip Component
 * L2 (Cells) - Contextual information overlay
 *
 * Supabase-inspired tooltip with semantic variants and animations
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

// ============================================================================
// Tooltip Content Variants
// ============================================================================

const tooltipContentVariants = cva(
  `
    z-50 overflow-hidden rounded-md px-3 py-1.5
    text-xs font-medium shadow-md
    animate-in fade-in-0 zoom-in-95
    data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0
    data-[state=closed]:zoom-out-95
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2
    data-[side=top]:slide-in-from-bottom-2
  `,
  {
    variants: {
      variant: {
        default: 'bg-gray-12 text-gray-1 border border-gray-10',
        info: 'bg-info-DEFAULT text-white border border-info-dark',
        warning: 'bg-warning-DEFAULT text-gray-12 border border-warning-dark',
        error: 'bg-error-DEFAULT text-white border border-error-dark',
        success: 'bg-success-DEFAULT text-white border border-success-dark',
        subtle: 'bg-gray-3 text-gray-12 border border-gray-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tooltipArrowVariants = cva('', {
  variants: {
    variant: {
      default: 'fill-gray-12',
      info: 'fill-info-DEFAULT',
      warning: 'fill-warning-DEFAULT',
      error: 'fill-error-DEFAULT',
      success: 'fill-success-DEFAULT',
      subtle: 'fill-gray-3',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// ============================================================================
// Types
// ============================================================================

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipVariant = 'default' | 'info' | 'warning' | 'error' | 'success' | 'subtle';

export interface TooltipProviderProps extends TooltipPrimitive.TooltipProviderProps {
  /** Global delay duration for all tooltips (ms) */
  delayDuration?: number;
  /** Duration before tooltip hides when moving to another trigger (ms) */
  skipDelayDuration?: number;
  /** Disable hover card behavior on touch devices */
  disableHoverableContent?: boolean;
}

export interface TooltipProps extends TooltipPrimitive.TooltipProps {
  /** Delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Disable closing on escape key */
  disableHoverableContent?: boolean;
}

export interface TooltipTriggerProps extends TooltipPrimitive.TooltipTriggerProps {
  /** Render as child element */
  asChild?: boolean;
}

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {
  /** Side of the trigger to render */
  side?: TooltipSide;
  /** Alignment relative to the trigger */
  align?: TooltipAlign;
  /** Offset from the trigger (px) */
  sideOffset?: number;
  /** Show arrow */
  showArrow?: boolean;
  /** Arrow width (px) */
  arrowWidth?: number;
  /** Arrow height (px) */
  arrowHeight?: number;
  /** Collision padding (px) */
  collisionPadding?: number;
  /** Avoid collisions with boundary */
  avoidCollisions?: boolean;
  /** Maximum width */
  maxWidth?: number | string;
}

export interface TooltipArrowProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>,
    VariantProps<typeof tooltipArrowVariants> {}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * TooltipProvider - Wraps the app to provide tooltip context
 *
 * @example
 * <TooltipProvider delayDuration={200}>
 *   <App />
 * </TooltipProvider>
 */
const TooltipProvider: React.FC<TooltipProviderProps> = ({
  delayDuration = 300,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  children,
  ...props
}) => (
  <TooltipPrimitive.Provider
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    disableHoverableContent={disableHoverableContent}
    {...props}
  >
    {children}
  </TooltipPrimitive.Provider>
);
TooltipProvider.displayName = 'TooltipProvider';

// ============================================================================
// Root Component
// ============================================================================

/**
 * Tooltip - Root component that manages tooltip state
 */
const Tooltip: React.FC<TooltipProps> = TooltipPrimitive.Root;
Tooltip.displayName = 'Tooltip';

// ============================================================================
// Trigger Component
// ============================================================================

/**
 * TooltipTrigger - Element that triggers the tooltip on hover/focus
 */
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ asChild = false, ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} asChild={asChild} {...props} />
));
TooltipTrigger.displayName = 'TooltipTrigger';

// ============================================================================
// Content Component
// ============================================================================

/**
 * TooltipContent - The content displayed in the tooltip
 *
 * @example
 * <TooltipContent side="top" variant="info">
 *   This is a helpful tooltip
 * </TooltipContent>
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    {
      className,
      variant,
      side = 'top',
      align = 'center',
      sideOffset = 4,
      showArrow = true,
      arrowWidth = 10,
      arrowHeight = 5,
      collisionPadding = 8,
      avoidCollisions = true,
      maxWidth,
      children,
      style,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        className={cn(tooltipContentVariants({ variant }), className)}
        style={{
          maxWidth: maxWidth ?? 320,
          ...style,
        }}
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipArrow
            variant={variant}
            width={arrowWidth}
            height={arrowHeight}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = 'TooltipContent';

// ============================================================================
// Arrow Component
// ============================================================================

/**
 * TooltipArrow - Visual arrow pointing to the trigger
 */
const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  TooltipArrowProps
>(({ className, variant, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn(tooltipArrowVariants({ variant }), className)}
    {...props}
  />
));
TooltipArrow.displayName = 'TooltipArrow';

// ============================================================================
// Compound Component (Convenience wrapper)
// ============================================================================

export interface SimpleTooltipProps extends Omit<TooltipContentProps, 'children' | 'content'> {
  /** Tooltip content text or element */
  label: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Delay before showing (ms) */
  delayDuration?: number;
  /** Open state (controlled) */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Render trigger as child element */
  asChild?: boolean;
  /** Disable the tooltip */
  disabled?: boolean;
}

/**
 * SimpleTooltip - All-in-one tooltip component for simple use cases
 *
 * @example
 * <SimpleTooltip label="Delete item" side="bottom" variant="error">
 *   <Button variant="destructive" size="icon">
 *     <TrashIcon />
 *   </Button>
 * </SimpleTooltip>
 */
const SimpleTooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  SimpleTooltipProps
>(
  (
    {
      label,
      children,
      delayDuration,
      open,
      defaultOpen,
      onOpenChange,
      asChild = true,
      disabled = false,
      ...contentProps
    },
    ref
  ) => {
    if (disabled) {
      return <>{children}</>;
    }

    return (
      <Tooltip
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
      >
        <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
        <TooltipContent ref={ref} {...contentProps}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }
);
SimpleTooltip.displayName = 'SimpleTooltip';

// ============================================================================
// Preset Delay Durations
// ============================================================================

/**
 * Common delay duration presets (ms)
 */
export const TOOLTIP_DELAYS = {
  /** Instant show - no delay */
  instant: 0,
  /** Fast - 100ms */
  fast: 100,
  /** Default - 300ms */
  default: 300,
  /** Slow - 500ms */
  slow: 500,
  /** Very slow - 700ms */
  verySlow: 700,
} as const;

// ============================================================================
// Exports
// ============================================================================

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  SimpleTooltip,
  tooltipContentVariants,
  tooltipArrowVariants,
};
