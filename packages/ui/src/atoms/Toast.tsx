/**
 * FORGE LABS UI - Toast Component
 * L2 (Cells) - Notification/toast system
 *
 * Supabase-inspired toast with semantic variants and positions
 * Built on @radix-ui/react-toast for accessibility
 */

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/cn';

// ============================================================================
// TOAST PROVIDER
// ============================================================================

const ToastProvider = ToastPrimitives.Provider;

// ============================================================================
// TOAST VIEWPORT
// ============================================================================

const toastViewportVariants = cva(
  'fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]',
  {
    variants: {
      position: {
        'top-right': 'top-0 right-0',
        'top-center': 'top-0 left-1/2 -translate-x-1/2',
        'top-left': 'top-0 left-0',
        'bottom-right': 'bottom-0 right-0',
        'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
        'bottom-left': 'bottom-0 left-0',
      },
    },
    defaultVariants: {
      position: 'bottom-right',
    },
  }
);

export interface ToastViewportProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>,
    VariantProps<typeof toastViewportVariants> {}

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  ToastViewportProps
>(({ className, position, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(toastViewportVariants({ position }), className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// ============================================================================
// TOAST
// ============================================================================

const toastVariants = cva(
  `
    group pointer-events-auto relative flex w-full items-center justify-between
    gap-3 overflow-hidden rounded-lg border p-4 shadow-lg
    transition-all duration-300 ease-out
    data-[swipe=cancel]:translate-x-0
    data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
    data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
    data-[swipe=move]:transition-none
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[swipe=end]:animate-out
    data-[state=closed]:fade-out-80
    data-[state=closed]:slide-out-to-right-full
    data-[state=open]:slide-in-from-bottom-full
    data-[state=open]:sm:slide-in-from-bottom-full
  `,
  {
    variants: {
      variant: {
        default:
          'bg-gray-300 border-gray-600 text-gray-1200',
        success:
          'bg-[hsl(155,100%,8%)] border-[hsl(153,60%,52%,0.3)] text-[hsl(153,60%,52%)] [&_svg]:text-[hsl(153,60%,52%)]',
        error:
          'bg-[hsl(7,51%,15%)] border-[hsl(10,78%,54%,0.3)] text-[hsl(10,78%,54%)] [&_svg]:text-[hsl(10,78%,54%)]',
        warning:
          'bg-[hsl(33,100%,14%)] border-[hsl(39,100%,43%,0.3)] text-[hsl(39,100%,43%)] [&_svg]:text-[hsl(39,100%,43%)]',
        info:
          'bg-[hsl(217,91%,12%)] border-[hsl(217,91%,60%,0.3)] text-[hsl(217,91%,60%)] [&_svg]:text-[hsl(217,91%,60%)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const variantIcons: Record<string, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  /** Custom icon (overrides default) */
  icon?: React.ReactNode;
  /** Hide the default icon */
  hideIcon?: boolean;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant = 'default', icon, hideIcon, children, ...props }, ref) => {
  const IconComponent = variantIcons[variant || 'default'];

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {!hideIcon && (
        <div className="shrink-0">
          {icon || <IconComponent className="h-5 w-5" />}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

// ============================================================================
// TOAST ACTION
// ============================================================================

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      `
        inline-flex h-8 shrink-0 items-center justify-center rounded-md
        border border-gray-600 bg-transparent px-3
        text-sm font-medium transition-colors
        hover:bg-gray-500
        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-gray-300
        disabled:pointer-events-none disabled:opacity-50
        group-[.success]:border-[hsl(153,60%,52%,0.3)] group-[.success]:hover:bg-[hsl(155,100%,12%)]
        group-[.error]:border-[hsl(10,78%,54%,0.3)] group-[.error]:hover:bg-[hsl(7,51%,20%)]
        group-[.warning]:border-[hsl(39,100%,43%,0.3)] group-[.warning]:hover:bg-[hsl(33,100%,18%)]
        group-[.info]:border-[hsl(217,91%,60%,0.3)] group-[.info]:hover:bg-[hsl(217,91%,16%)]
      `,
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

// ============================================================================
// TOAST CLOSE
// ============================================================================

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      `
        absolute right-2 top-2 rounded-md p-1
        text-gray-900 opacity-0 transition-opacity
        hover:text-gray-1100
        focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-400
        group-hover:opacity-100
        group-[.success]:text-[hsl(153,60%,52%,0.7)] group-[.success]:hover:text-[hsl(153,60%,52%)]
        group-[.error]:text-[hsl(10,78%,54%,0.7)] group-[.error]:hover:text-[hsl(10,78%,54%)]
        group-[.warning]:text-[hsl(39,100%,43%,0.7)] group-[.warning]:hover:text-[hsl(39,100%,43%)]
        group-[.info]:text-[hsl(217,91%,60%,0.7)] group-[.info]:hover:text-[hsl(217,91%,60%)]
      `,
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

// ============================================================================
// TOAST TITLE
// ============================================================================

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

// ============================================================================
// TOAST DESCRIPTION
// ============================================================================

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-80', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// ============================================================================
// USE TOAST HOOK
// ============================================================================

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ActionType = {
  ADD_TOAST: 'ADD_TOAST';
  UPDATE_TOAST: 'UPDATE_TOAST';
  DISMISS_TOAST: 'DISMISS_TOAST';
  REMOVE_TOAST: 'REMOVE_TOAST';
};

const actionTypes: ActionType = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export type ToastInput = Omit<ToasterToast, 'id'>;

export interface ToastOptions {
  /** Toast duration in milliseconds (default: 5000) */
  duration?: number;
}

function toast({ ...props }: ToastInput & ToastOptions) {
  const id = genId();
  const { duration = 5000, ...toastProps } = props;

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...toastProps,
      id,
      open: true,
      duration,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Convenience methods for different variants
toast.success = (props: Omit<ToastInput, 'variant'> & ToastOptions) =>
  toast({ ...props, variant: 'success' });

toast.error = (props: Omit<ToastInput, 'variant'> & ToastOptions) =>
  toast({ ...props, variant: 'error' });

toast.warning = (props: Omit<ToastInput, 'variant'> & ToastOptions) =>
  toast({ ...props, variant: 'warning' });

toast.info = (props: Omit<ToastInput, 'variant'> & ToastOptions) =>
  toast({ ...props, variant: 'info' });

// Promise-based toast for async operations
toast.promise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: Omit<ToastInput, 'variant'>;
    success: Omit<ToastInput, 'variant'> | ((data: T) => Omit<ToastInput, 'variant'>);
    error: Omit<ToastInput, 'variant'> | ((error: Error) => Omit<ToastInput, 'variant'>);
  },
  options?: ToastOptions
) => {
  const { id, update, dismiss } = toast({
    ...messages.loading,
    variant: 'default',
    duration: Infinity, // Keep loading toast until resolved
  });

  promise
    .then((data) => {
      const successProps =
        typeof messages.success === 'function'
          ? messages.success(data)
          : messages.success;
      update({
        ...successProps,
        id,
        variant: 'success',
        duration: options?.duration ?? 5000,
      });
    })
    .catch((error) => {
      const errorProps =
        typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
      update({
        ...errorProps,
        id,
        variant: 'error',
        duration: options?.duration ?? 5000,
      });
    });

  return { id, dismiss, update };
};

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
    dismissAll: () => dispatch({ type: 'DISMISS_TOAST' }),
  };
}

// ============================================================================
// TOASTER COMPONENT
// ============================================================================

export type ToastPosition = NonNullable<
  VariantProps<typeof toastViewportVariants>['position']
>;

export interface ToasterProps {
  /** Position of the toast container */
  position?: ToastPosition;
  /** Default duration for toasts in milliseconds */
  defaultDuration?: number;
  /** Swipe direction for dismissing toasts */
  swipeDirection?: 'right' | 'left' | 'up' | 'down';
  /** Additional class name for the viewport */
  className?: string;
}

function Toaster({
  position = 'bottom-right',
  defaultDuration = 5000,
  swipeDirection = 'right',
  className,
}: ToasterProps) {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={defaultDuration} swipeDirection={swipeDirection}>
      {toasts.map(({ id, title, description, action, variant, icon, hideIcon, ...props }) => (
        <Toast key={id} variant={variant} icon={icon} hideIcon={hideIcon} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport position={position} className={className} />
    </ToastProvider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Provider
  ToastProvider,
  // Viewport
  ToastViewport,
  toastViewportVariants,
  // Toast components
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
  // Hook
  useToast,
  toast,
  // Toaster
  Toaster,
};
