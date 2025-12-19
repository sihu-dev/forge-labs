/**
 * FORGE LABS UI - Tabs Component
 * L2 (Cells) - Accessible tabbed interface
 *
 * Supabase-inspired tabs with multiple variants
 * Built on @radix-ui/react-tabs for full accessibility
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

// ============================================================================
// TabsList Variants
// ============================================================================

const tabsListVariants = cva(
  `
    inline-flex items-center justify-center
    text-gray-1100
  `,
  {
    variants: {
      variant: {
        default: `
          rounded-lg bg-gray-300 p-1
        `,
        underline: `
          border-b border-gray-600
          bg-transparent p-0
          gap-1
        `,
        pills: `
          gap-2 bg-transparent p-0
        `,
        bordered: `
          rounded-lg border border-gray-600
          bg-gray-200 p-1
        `,
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col items-stretch',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      // Vertical + underline: use left border instead
      {
        variant: 'underline',
        orientation: 'vertical',
        className: 'border-b-0 border-l gap-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      orientation: 'horizontal',
      fullWidth: false,
      size: 'md',
    },
  }
);

// ============================================================================
// TabsTrigger Variants
// ============================================================================

const tabsTriggerVariants = cva(
  `
    inline-flex items-center justify-center whitespace-nowrap
    font-medium transition-all duration-150 ease-out
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-brand-400 focus-visible:ring-offset-2
    focus-visible:ring-offset-gray-100
    disabled:pointer-events-none disabled:opacity-50
  `,
  {
    variants: {
      variant: {
        default: `
          rounded-md
          text-gray-1100
          hover:bg-gray-400 hover:text-gray-1200
          data-[state=active]:bg-gray-100
          data-[state=active]:text-gray-1200
          data-[state=active]:shadow-sm
        `,
        underline: `
          relative rounded-none
          text-gray-1100
          border-b-2 border-transparent
          hover:text-gray-1200
          data-[state=active]:text-brand-DEFAULT
          data-[state=active]:border-brand-DEFAULT
        `,
        pills: `
          rounded-full
          text-gray-1100
          border border-transparent
          hover:bg-gray-400 hover:text-gray-1200
          data-[state=active]:bg-brand-400
          data-[state=active]:text-gray-1200
          data-[state=active]:border-brand-500
        `,
        bordered: `
          rounded-md
          text-gray-1100
          hover:bg-gray-300 hover:text-gray-1200
          data-[state=active]:bg-gray-100
          data-[state=active]:text-gray-1200
          data-[state=active]:shadow-sm
        `,
      },
      orientation: {
        horizontal: '',
        vertical: 'w-full justify-start text-left',
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base',
      },
      fullWidth: {
        true: 'flex-1',
        false: '',
      },
    },
    compoundVariants: [
      // Vertical underline: use left border instead of bottom
      {
        variant: 'underline',
        orientation: 'vertical',
        className: 'border-b-0 border-l-2 pl-3',
      },
      // Underline sizes need different padding
      {
        variant: 'underline',
        size: 'sm',
        className: 'pb-2',
      },
      {
        variant: 'underline',
        size: 'md',
        className: 'pb-2.5',
      },
      {
        variant: 'underline',
        size: 'lg',
        className: 'pb-3',
      },
    ],
    defaultVariants: {
      variant: 'default',
      orientation: 'horizontal',
      size: 'md',
      fullWidth: false,
    },
  }
);

// ============================================================================
// TabsContent Variants
// ============================================================================

const tabsContentVariants = cva(
  `
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-brand-400
    focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100
  `,
  {
    variants: {
      size: {
        sm: 'mt-2',
        md: 'mt-3',
        lg: 'mt-4',
      },
      orientation: {
        horizontal: '',
        vertical: 'ml-4 mt-0',
      },
    },
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
    },
  }
);

// ============================================================================
// Context for sharing variant props
// ============================================================================

interface TabsContextValue {
  variant: 'default' | 'underline' | 'pills' | 'bordered';
  size: 'sm' | 'md' | 'lg';
  orientation: 'horizontal' | 'vertical';
  fullWidth: boolean;
}

const TabsContext = React.createContext<TabsContextValue>({
  variant: 'default',
  size: 'md',
  orientation: 'horizontal',
  fullWidth: false,
});

const useTabsContext = () => React.useContext(TabsContext);

// ============================================================================
// Tabs Root
// ============================================================================

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    Omit<VariantProps<typeof tabsListVariants>, 'orientation'> {
  /** Visual style variant */
  variant?: 'default' | 'underline' | 'pills' | 'bordered';
  /** Size of the tabs */
  size?: 'sm' | 'md' | 'lg';
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether tabs should take full width */
  fullWidth?: boolean;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      orientation = 'horizontal',
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const contextValue = React.useMemo(
      () => ({ variant, size, orientation, fullWidth }),
      [variant, size, orientation, fullWidth]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <TabsPrimitive.Root
          ref={ref}
          orientation={orientation}
          className={cn(
            orientation === 'vertical' && 'flex gap-4',
            className
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.Root>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

// ============================================================================
// TabsList
// ============================================================================

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    Omit<VariantProps<typeof tabsListVariants>, 'variant' | 'size' | 'orientation' | 'fullWidth'> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, ...props }, ref) => {
  const { variant, size, orientation, fullWidth } = useTabsContext();

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        tabsListVariants({ variant, size, orientation, fullWidth }),
        className
      )}
      {...props}
    />
  );
});

TabsList.displayName = 'TabsList';

// ============================================================================
// TabsTrigger
// ============================================================================

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    Omit<VariantProps<typeof tabsTriggerVariants>, 'variant' | 'size' | 'orientation' | 'fullWidth'> {
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Badge or count to display */
  badge?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, leftIcon, rightIcon, badge, ...props }, ref) => {
  const { variant, size, orientation, fullWidth } = useTabsContext();

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({ variant, size, orientation, fullWidth }),
        'gap-2',
        className
      )}
      {...props}
    >
      {leftIcon && (
        <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {badge && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium',
            'bg-gray-500 text-gray-1100',
            'data-[state=active]:bg-brand-500 data-[state=active]:text-gray-1200'
          )}
        >
          {badge}
        </span>
      )}
      {rightIcon && (
        <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{rightIcon}</span>
      )}
    </TabsPrimitive.Trigger>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

// ============================================================================
// TabsContent
// ============================================================================

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    Omit<VariantProps<typeof tabsContentVariants>, 'size' | 'orientation'> {
  /** Whether to force mount content (keeps in DOM when inactive) */
  forceMount?: true;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => {
  const { size, orientation } = useTabsContext();

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(tabsContentVariants({ size, orientation }), className)}
      {...props}
    />
  );
});

TabsContent.displayName = 'TabsContent';

// ============================================================================
// Exports
// ============================================================================

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
};
