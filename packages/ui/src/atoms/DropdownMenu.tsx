/**
 * FORGE LABS UI - DropdownMenu Component
 * L2 (Cells) - Context-aware dropdown menu
 *
 * Accessible dropdown menu with keyboard navigation,
 * submenus, checkboxes, radio groups, and icons.
 */

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

// ============================================================================
// Root Component
// ============================================================================

const DropdownMenu = DropdownMenuPrimitive.Root;

// ============================================================================
// Trigger Component
// ============================================================================

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

// ============================================================================
// Group Component
// ============================================================================

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

// ============================================================================
// Portal Component
// ============================================================================

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

// ============================================================================
// Sub Component
// ============================================================================

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

// ============================================================================
// RadioGroup Component
// ============================================================================

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// ============================================================================
// Content Variants
// ============================================================================

const dropdownMenuContentVariants = cva(
  `
    z-50 min-w-[8rem] overflow-hidden rounded-md
    border border-gray-700 bg-gray-300 p-1
    text-gray-1200 shadow-lg

    /* Animation - Show */
    data-[state=open]:animate-in
    data-[state=open]:fade-in-0
    data-[state=open]:zoom-in-95

    /* Animation - Hide */
    data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0
    data-[state=closed]:zoom-out-95

    /* Side-aware slide animations */
    data-[side=top]:slide-in-from-bottom-2
    data-[side=right]:slide-in-from-left-2
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
  `,
  {
    variants: {
      size: {
        sm: 'min-w-[6rem]',
        md: 'min-w-[8rem]',
        lg: 'min-w-[12rem]',
        xl: 'min-w-[16rem]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// ============================================================================
// Content Component
// ============================================================================

export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>,
    VariantProps<typeof dropdownMenuContentVariants> {}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, size, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(dropdownMenuContentVariants({ size }), className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// ============================================================================
// SubContent Component
// ============================================================================

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      `
        z-50 min-w-[8rem] overflow-hidden rounded-md
        border border-gray-700 bg-gray-300 p-1
        text-gray-1200 shadow-lg

        data-[state=open]:animate-in
        data-[state=open]:fade-in-0
        data-[state=open]:zoom-in-95

        data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0
        data-[state=closed]:zoom-out-95

        data-[side=top]:slide-in-from-bottom-2
        data-[side=right]:slide-in-from-left-2
        data-[side=bottom]:slide-in-from-top-2
        data-[side=left]:slide-in-from-right-2
      `,
      className
    )}
    {...props}
  />
));

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// ============================================================================
// Item Variants
// ============================================================================

const dropdownMenuItemVariants = cva(
  `
    relative flex cursor-pointer select-none items-center gap-2
    rounded-sm px-2 py-1.5 text-sm outline-none
    transition-colors duration-100

    /* Focus/Hover state */
    focus:bg-gray-500 focus:text-gray-1200

    /* Disabled state */
    data-[disabled]:pointer-events-none data-[disabled]:opacity-50

    /* Icon sizing */
    [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-gray-1100
  `,
  {
    variants: {
      variant: {
        default: '',
        destructive: 'text-destructive-600 focus:bg-destructive-300 focus:text-destructive-600',
        success: 'text-brand-600 focus:bg-brand-400 focus:text-gray-1200',
      },
      inset: {
        true: 'pl-8',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      inset: false,
    },
  }
);

// ============================================================================
// Item Component
// ============================================================================

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
    VariantProps<typeof dropdownMenuItemVariants> {
  /** Icon to display before the item text */
  icon?: React.ReactNode;
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, variant, inset, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(dropdownMenuItemVariants({ variant, inset }), className)}
    {...props}
  >
    {icon}
    {children}
  </DropdownMenuPrimitive.Item>
));

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// ============================================================================
// CheckboxItem Component
// ============================================================================

export interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {
  /** Icon to display when checked */
  checkedIcon?: React.ReactNode;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, checkedIcon, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      `
        relative flex cursor-pointer select-none items-center
        rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none
        transition-colors duration-100
        focus:bg-gray-500 focus:text-gray-1200
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      `,
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        {checkedIcon ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-brand-DEFAULT"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// ============================================================================
// RadioItem Component
// ============================================================================

export interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> {
  /** Icon to display when selected */
  selectedIcon?: React.ReactNode;
}

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ className, children, selectedIcon, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      `
        relative flex cursor-pointer select-none items-center
        rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none
        transition-colors duration-100
        focus:bg-gray-500 focus:text-gray-1200
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      `,
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        {selectedIcon ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-2 w-2 text-brand-DEFAULT"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// ============================================================================
// SubTrigger Component
// ============================================================================

export interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  /** Inset left padding to align with checkbox/radio items */
  inset?: boolean;
  /** Icon to display before the item text */
  icon?: React.ReactNode;
}

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, inset, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      `
        flex cursor-pointer select-none items-center gap-2
        rounded-sm px-2 py-1.5 text-sm outline-none
        transition-colors duration-100
        focus:bg-gray-500 focus:text-gray-1200
        data-[state=open]:bg-gray-500

        [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-gray-1100
      `,
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {icon}
    {children}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-auto h-4 w-4"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// ============================================================================
// Label Component
// ============================================================================

export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  /** Inset left padding to align with checkbox/radio items */
  inset?: boolean;
}

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold text-gray-1100 uppercase tracking-wide',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// ============================================================================
// Separator Component
// ============================================================================

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-gray-600', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// ============================================================================
// Shortcut Component
// ============================================================================

export interface DropdownMenuShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const DropdownMenuShortcut = ({
  className,
  ...props
}: DropdownMenuShortcutProps) => (
  <span
    className={cn(
      'ml-auto text-xs tracking-widest text-gray-1000',
      className
    )}
    {...props}
  />
);

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// ============================================================================
// Arrow Component
// ============================================================================

const DropdownMenuArrow = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Arrow
    ref={ref}
    className={cn('fill-gray-300', className)}
    {...props}
  />
));

DropdownMenuArrow.displayName = DropdownMenuPrimitive.Arrow.displayName;

// ============================================================================
// Exports
// ============================================================================

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuArrow,
  dropdownMenuContentVariants,
  dropdownMenuItemVariants,
};
