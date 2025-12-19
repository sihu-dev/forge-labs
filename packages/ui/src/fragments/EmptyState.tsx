/**
 * FORGE LABS UI - EmptyState Fragment
 * L3 (Tissues) - Empty/no-data state display
 *
 * Supabase-inspired empty state pattern
 */

import * as React from 'react';
import { cn } from '../lib/cn';
import { Button } from '../atoms/Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button text */
  actionLabel?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionLabel?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom illustration */
  illustration?: React.ReactNode;
}

// Default empty state icon
const DefaultIcon = () => (
  <svg
    className="h-12 w-12"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

// Size configurations
const sizeConfig = {
  sm: {
    wrapper: 'py-8 px-4',
    icon: 'h-10 w-10',
    title: 'text-base',
    description: 'text-sm',
    iconWrapper: 'p-3',
  },
  md: {
    wrapper: 'py-12 px-6',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
    iconWrapper: 'p-4',
  },
  lg: {
    wrapper: 'py-16 px-8',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
    iconWrapper: 'p-5',
  },
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      actionLabel,
      onAction,
      secondaryActionLabel,
      onSecondaryAction,
      size = 'md',
      illustration,
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          config.wrapper,
          className
        )}
        {...props}
      >
        {/* Illustration or Icon */}
        {illustration ? (
          <div className="mb-6">{illustration}</div>
        ) : (
          <div
            className={cn(
              'mb-4 rounded-full bg-gray-4 text-gray-9',
              config.iconWrapper
            )}
          >
            {icon || <DefaultIcon />}
          </div>
        )}

        {/* Content */}
        <div className="max-w-md space-y-2">
          <h3
            className={cn(
              'font-semibold text-gray-12',
              config.title
            )}
          >
            {title}
          </h3>
          {description && (
            <p className={cn('text-gray-11', config.description)}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="mt-6 flex items-center gap-3">
            {actionLabel && onAction && (
              <Button onClick={onAction} size={size === 'sm' ? 'sm' : 'md'}>
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                variant="outline"
                onClick={onSecondaryAction}
                size={size === 'sm' ? 'sm' : 'md'}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
