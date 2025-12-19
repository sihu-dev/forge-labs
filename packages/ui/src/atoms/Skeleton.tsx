/**
 * FORGE LABS UI - Skeleton Component
 * L2 (Cells) - Loading placeholder
 *
 * Animated skeleton for content loading states
 */

import * as React from 'react';
import { cn } from '../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animation = 'pulse', rounded = 'md', ...props }, ref) => {
    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    const animationClasses = {
      pulse: 'animate-pulse',
      shimmer: 'animate-shimmer bg-gradient-to-r from-gray-4 via-gray-3 to-gray-4 bg-[length:200%_100%]',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-4',
          roundedClasses[rounded],
          animationClasses[animation],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

/**
 * Skeleton Text - Multi-line text placeholder
 */
export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Last line width */
  lastLineWidth?: string;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, lastLineWidth = '60%', ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: i === lines - 1 ? lastLineWidth : '100%',
            }}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

/**
 * Skeleton Avatar - Circular placeholder
 */
export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    return (
      <Skeleton
        ref={ref}
        rounded="full"
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * Skeleton Card - Card placeholder
 */
const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-gray-5 bg-gray-3 p-4 space-y-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
});
SkeletonCard.displayName = 'SkeletonCard';

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard };
