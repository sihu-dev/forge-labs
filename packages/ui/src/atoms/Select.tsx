/**
 * FORGE LABS UI - Select Component
 * L2 (Cells) - Dropdown selection input
 *
 * Supabase-inspired select with validation states and comprehensive sub-components
 */

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '../lib/cn';

// ============================================================================
// Variant Definitions
// ============================================================================

const selectTriggerVariants = cva(
  `
    flex w-full items-center justify-between gap-2
    rounded-md border bg-gray-2 px-3
    text-gray-12 placeholder:text-gray-9
    transition-colors duration-150
    focus:outline-none focus:ring-2
    focus:ring-offset-2 focus:ring-offset-gray-1
    disabled:cursor-not-allowed disabled:opacity-50
    [&>span]:line-clamp-1
  `,
  {
    variants: {
      variant: {
        default:
          'border-gray-5 focus:border-brand-400 focus:ring-brand-400 data-[state=open]:border-brand-400 data-[state=open]:ring-2 data-[state=open]:ring-brand-400',
        error:
          'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error-DEFAULT data-[state=open]:border-error-DEFAULT data-[state=open]:ring-error-DEFAULT',
        success:
          'border-success-DEFAULT focus:border-success-DEFAULT focus:ring-success-DEFAULT data-[state=open]:border-success-DEFAULT data-[state=open]:ring-success-DEFAULT',
      },
      selectSize: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      selectSize: 'md',
    },
  }
);

const selectContentVariants = cva(
  `
    relative z-50 max-h-96 min-w-[8rem] overflow-hidden
    rounded-md border border-gray-5 bg-gray-2
    text-gray-12 shadow-lg
    data-[state=open]:animate-in data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
    data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
    data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
  `,
  {
    variants: {
      position: {
        popper:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        'item-aligned': '',
      },
    },
    defaultVariants: {
      position: 'popper',
    },
  }
);

const selectItemVariants = cva(
  `
    relative flex w-full cursor-pointer select-none items-center
    rounded-sm py-1.5 pl-8 pr-2
    text-sm text-gray-12 outline-none
    transition-colors duration-100
    focus:bg-gray-4 focus:text-gray-12
    data-[disabled]:pointer-events-none data-[disabled]:opacity-50
  `
);

const selectLabelVariants = cva(
  'py-1.5 pl-8 pr-2 text-sm font-semibold text-gray-11'
);

const selectSeparatorVariants = cva('-mx-1 my-1 h-px bg-gray-5');

const selectScrollButtonVariants = cva(
  'flex cursor-default items-center justify-center py-1 text-gray-11'
);

// ============================================================================
// Type Definitions
// ============================================================================

export interface SelectProps {
  /** Select value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Whether the select is open */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Name for form submission */
  name?: string;
  /** Direction */
  dir?: 'ltr' | 'rtl';
  /** Children */
  children?: React.ReactNode;
}

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  /** Error state */
  hasError?: boolean;
}

export type SelectContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  'position'
> &
  VariantProps<typeof selectContentVariants>;

export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /** Whether to show the check indicator */
  showCheckIndicator?: boolean;
}

export interface SelectGroupProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group> {}

export interface SelectLabelProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {}

export interface SelectValueProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value> {}

export interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {}

export interface SelectScrollButtonProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> {}

export interface SelectFieldProps extends SelectProps {
  /** Trigger variant */
  variant?: 'default' | 'error' | 'success';
  /** Trigger size */
  selectSize?: 'sm' | 'md' | 'lg';
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Label */
  label?: string;
  /** Label ID for accessibility */
  labelId?: string;
  /** Class name for wrapper */
  wrapperClassName?: string;
  /** Trigger class name */
  triggerClassName?: string;
  /** Content class name */
  contentClassName?: string;
  /** Full width */
  fullWidth?: boolean;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Root Select component
 */
const Select = SelectPrimitive.Root;

/**
 * Select Group for grouping items
 */
const SelectGroup = SelectPrimitive.Group;

/**
 * Select Value display
 */
const SelectValue = SelectPrimitive.Value;

/**
 * Select Trigger button
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, variant, selectSize, hasError, children, ...props }, ref) => {
  const effectiveVariant = hasError ? 'error' : variant;

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        selectTriggerVariants({ variant: effectiveVariant, selectSize }),
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-9 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * Select Scroll Up Button
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  SelectScrollButtonProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(selectScrollButtonVariants(), className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * Select Scroll Down Button
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  SelectScrollButtonProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(selectScrollButtonVariants(), className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/**
 * Select Content - dropdown panel
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(selectContentVariants({ position }), className)}
      position={position ?? 'popper'}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * Select Label for groups
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(selectLabelVariants(), className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * Select Item - individual option
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, showCheckIndicator = true, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants(), className)}
    {...props}
  >
    {showCheckIndicator && (
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-brand-DEFAULT" />
        </SelectPrimitive.ItemIndicator>
      </span>
    )}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * Select Separator between items/groups
 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(selectSeparatorVariants(), className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/**
 * Complete Select Field with label, error/helper text
 * Convenience component for common use cases
 */
const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(
  (
    {
      variant,
      selectSize,
      placeholder,
      error,
      helperText,
      label,
      labelId,
      wrapperClassName,
      triggerClassName,
      contentClassName,
      fullWidth = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const effectiveVariant = error ? 'error' : variant;
    const ariaLabelledBy = labelId || (label ? `${props.name}-label` : undefined);

    return (
      <div className={cn(fullWidth && 'w-full', wrapperClassName)}>
        {label && (
          <label
            id={ariaLabelledBy}
            className="mb-1.5 block text-sm font-medium text-gray-11"
          >
            {label}
            {props.required && <span className="ml-1 text-error-DEFAULT">*</span>}
          </label>
        )}
        <Select disabled={disabled} {...props}>
          <SelectTrigger
            ref={ref}
            variant={effectiveVariant}
            selectSize={selectSize}
            hasError={!!error}
            className={cn(fullWidth && 'w-full', triggerClassName)}
            aria-labelledby={ariaLabelledBy}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={contentClassName}>
            {children}
          </SelectContent>
        </Select>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-error-DEFAULT' : 'text-gray-11'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
SelectField.displayName = 'SelectField';

// ============================================================================
// Exports
// ============================================================================

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectField,
  // Variants
  selectTriggerVariants,
  selectContentVariants,
  selectItemVariants,
  selectLabelVariants,
  selectSeparatorVariants,
  selectScrollButtonVariants,
};
