/**
 * FORGE LABS UI - PageHeader Fragment
 * L3 (Tissues) - Page title and actions header
 *
 * Supabase-inspired page header layout
 */

import * as React from 'react';
import { cn } from '../lib/cn';
import { Skeleton } from '../atoms/Skeleton';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Breadcrumb navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons/elements */
  actions?: React.ReactNode;
  /** Badge or status indicator */
  badge?: React.ReactNode;
  /** Icon for the page */
  icon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Tabs or secondary navigation */
  tabs?: React.ReactNode;
  /** Sticky header */
  sticky?: boolean;
}

// Breadcrumb component
const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-11">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="h-4 w-4 text-gray-9"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="flex items-center gap-1 hover:text-gray-12 transition-colors"
            >
              {item.icon}
              {item.label}
            </a>
          ) : (
            <span className="flex items-center gap-1 text-gray-12">
              {item.icon}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      description,
      breadcrumbs,
      actions,
      badge,
      icon,
      loading = false,
      tabs,
      sticky = false,
      ...props
    },
    ref
  ) => {
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            'border-b border-gray-5 bg-gray-1 px-6 py-4',
            sticky && 'sticky top-0 z-10',
            className
          )}
          {...props}
        >
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border-b border-gray-5 bg-gray-1',
          sticky && 'sticky top-0 z-10',
          className
        )}
        {...props}
      >
        <div className="px-6 py-4 space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} />
          )}

          {/* Header content */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* Icon */}
              {icon && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-4 text-gray-11">
                  {icon}
                </div>
              )}

              {/* Title and description */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-12 tracking-tight truncate">
                    {title}
                  </h1>
                  {badge}
                </div>
                {description && (
                  <p className="text-sm text-gray-11 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs && (
          <div className="px-6 -mb-px">
            {tabs}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export { PageHeader };
