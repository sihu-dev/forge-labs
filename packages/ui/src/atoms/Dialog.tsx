/**
 * FORGE LABS UI - Dialog/Modal Component
 * L2 (Cells) - Accessible dialog/modal overlay
 *
 * Built on Radix UI Dialog primitive with Supabase-inspired styling.
 * Includes backdrop blur, slide animations, and proper focus management.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description text.</DialogDescription>
 *     </DialogHeader>
 *     <div>Dialog body content</div>
 *     <DialogFooter>
 *       <DialogClose asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </DialogClose>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

// ============================================================================
// Dialog Root
// ============================================================================

/**
 * Root component that wraps the dialog. Controls open state.
 */
const Dialog = DialogPrimitive.Root;

/**
 * Button or element that triggers the dialog to open.
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Portal for rendering dialog outside the DOM hierarchy.
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * Close button primitive for custom close implementations.
 */
const DialogClose = DialogPrimitive.Close;

// ============================================================================
// Dialog Overlay
// ============================================================================

/**
 * Overlay (backdrop) props interface
 */
export interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {}

/**
 * Semi-transparent overlay behind the dialog content.
 * Includes backdrop blur and fade animations.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Base styles
      'fixed inset-0 z-50',
      // Background with blur
      'bg-black/60 backdrop-blur-sm',
      // Animation
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      'duration-200',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ============================================================================
// Dialog Content Variants
// ============================================================================

const dialogContentVariants = cva(
  [
    // Base styles
    'fixed z-50 grid w-full gap-4',
    // Background and border
    'border border-gray-6 bg-gray-2 shadow-xl',
    // Animation base
    'duration-200',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
    // Focus
    'focus:outline-none',
  ],
  {
    variants: {
      /**
       * Visual variant of the dialog
       */
      variant: {
        default: [
          // Centered positioning
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          // Rounded corners
          'rounded-lg',
          // Max height with scroll
          'max-h-[85vh] overflow-y-auto',
          // Slide and zoom animation
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        ],
        fullscreen: [
          // Full viewport
          'inset-0',
          // No rounded corners
          'rounded-none',
          // Full height scroll
          'h-full overflow-y-auto',
          // Simple fade animation
          'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
        ],
      },
      /**
       * Size preset for the dialog
       */
      size: {
        sm: 'max-w-sm p-4',
        md: 'max-w-md p-6',
        lg: 'max-w-lg p-6',
        xl: 'max-w-xl p-6',
        '2xl': 'max-w-2xl p-8',
        '3xl': 'max-w-3xl p-8',
        '4xl': 'max-w-4xl p-8',
        full: 'max-w-[calc(100vw-2rem)] p-6',
      },
    },
    compoundVariants: [
      // Fullscreen variant overrides size
      {
        variant: 'fullscreen',
        size: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'],
        className: 'max-w-none p-6',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ============================================================================
// Dialog Content
// ============================================================================

/**
 * Props for DialogContent component
 */
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Whether to show the close button (X icon)
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Custom class for the overlay
   */
  overlayClassName?: string;
  /**
   * Callback when close button is clicked
   */
  onCloseClick?: () => void;
}

/**
 * Close button icon component
 */
const CloseIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Main dialog content wrapper.
 * Renders inside a portal with overlay backdrop.
 *
 * @example
 * ```tsx
 * <DialogContent size="lg" variant="default">
 *   <DialogHeader>
 *     <DialogTitle>Title</DialogTitle>
 *   </DialogHeader>
 *   Content goes here
 * </DialogContent>
 * ```
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      variant,
      size,
      showCloseButton = true,
      overlayClassName,
      onCloseClick,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            onClick={onCloseClick}
            className={cn(
              // Positioning
              'absolute right-4 top-4',
              // Size and shape
              'rounded-md p-1.5',
              // Colors
              'text-gray-11 bg-transparent',
              // Hover and focus states
              'opacity-70 transition-opacity',
              'hover:opacity-100 hover:bg-gray-5',
              // Focus ring
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-gray-2',
              // Disabled state
              'disabled:pointer-events-none'
            )}
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ============================================================================
// Dialog Header
// ============================================================================

/**
 * Props for DialogHeader component
 */
export interface DialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Container for dialog title and description.
 * Provides consistent spacing and layout.
 */
const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

// ============================================================================
// Dialog Footer
// ============================================================================

/**
 * Props for DialogFooter component
 */
export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Container for dialog action buttons.
 * Provides consistent spacing and responsive layout.
 */
const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

// ============================================================================
// Dialog Title
// ============================================================================

/**
 * Props for DialogTitle component
 */
export interface DialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {}

/**
 * Accessible title for the dialog.
 * Required for screen reader accessibility.
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-12',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ============================================================================
// Dialog Description
// ============================================================================

/**
 * Props for DialogDescription component
 */
export interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {}

/**
 * Accessible description for the dialog.
 * Provides additional context for screen readers.
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-11', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ============================================================================
// Types Export
// ============================================================================

/**
 * Dialog content variant type
 */
export type DialogVariant = VariantProps<typeof dialogContentVariants>['variant'];

/**
 * Dialog size type
 */
export type DialogSize = VariantProps<typeof dialogContentVariants>['size'];

// ============================================================================
// Component Exports
// ============================================================================

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentVariants,
};
