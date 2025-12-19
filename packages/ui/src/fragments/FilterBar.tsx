/**
 * FORGE LABS UI - FilterBar Fragment
 * L3 (Tissues) - Search and filter controls
 *
 * Supabase-inspired filter bar pattern
 */

import * as React from 'react';
import { cn } from '../lib/cn';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

export interface ActiveFilter {
  groupId: string;
  optionId: string;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Filter groups */
  filters?: FilterGroup[];
  /** Currently active filters */
  activeFilters?: ActiveFilter[];
  /** Filter change handler */
  onFilterChange?: (filters: ActiveFilter[]) => void;
  /** Action buttons (right side) */
  actions?: React.ReactNode;
  /** Show active filter count */
  showFilterCount?: boolean;
  /** Clear all filters handler */
  onClearFilters?: () => void;
  /** Compact mode */
  compact?: boolean;
}

// Search icon
const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Filter icon
const FilterIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// X icon for clear
const XIcon = () => (
  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      searchPlaceholder = 'Search...',
      searchValue = '',
      onSearchChange,
      filters = [],
      activeFilters = [],
      onFilterChange,
      actions,
      showFilterCount = true,
      onClearFilters,
      compact = false,
      ...props
    },
    ref
  ) => {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const handleFilterClick = (groupId: string, optionId: string) => {
      if (!onFilterChange) return;

      const group = filters.find((g) => g.id === groupId);
      const isActive = activeFilters.some(
        (f) => f.groupId === groupId && f.optionId === optionId
      );

      let newFilters: ActiveFilter[];

      if (isActive) {
        // Remove filter
        newFilters = activeFilters.filter(
          (f) => !(f.groupId === groupId && f.optionId === optionId)
        );
      } else if (group?.multiple) {
        // Add to existing filters for this group
        newFilters = [...activeFilters, { groupId, optionId }];
      } else {
        // Replace filter for this group
        newFilters = [
          ...activeFilters.filter((f) => f.groupId !== groupId),
          { groupId, optionId },
        ];
      }

      onFilterChange(newFilters);
    };

    const getActiveFilterLabels = () => {
      return activeFilters.map((af) => {
        const group = filters.find((g) => g.id === af.groupId);
        const option = group?.options.find((o) => o.id === af.optionId);
        return {
          ...af,
          label: option?.label || '',
          groupLabel: group?.label || '',
        };
      });
    };

    const activeFilterLabels = getActiveFilterLabels();

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3',
          compact ? 'p-2' : 'p-4',
          className
        )}
        {...props}
      >
        {/* Main bar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              leftAddon={<SearchIcon />}
              inputSize={compact ? 'sm' : 'md'}
            />
          </div>

          {/* Filter toggle */}
          {filters.length > 0 && (
            <Button
              variant={activeFilters.length > 0 ? 'secondary' : 'outline'}
              size={compact ? 'sm' : 'md'}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              leftIcon={<FilterIcon />}
            >
              Filters
              {showFilterCount && activeFilters.length > 0 && (
                <Badge variant="brand" size="sm" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          )}

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 ml-auto">
              {actions}
            </div>
          )}
        </div>

        {/* Active filters */}
        {activeFilterLabels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-11">Active filters:</span>
            {activeFilterLabels.map((filter) => (
              <Badge
                key={`${filter.groupId}-${filter.optionId}`}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-gray-4"
                onClick={() => handleFilterClick(filter.groupId, filter.optionId)}
                rightIcon={<XIcon />}
              >
                {filter.groupLabel}: {filter.label}
              </Badge>
            ))}
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-xs text-gray-11 hover:text-gray-12 underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Filter dropdown */}
        {isFilterOpen && filters.length > 0 && (
          <div className="border border-gray-5 rounded-lg bg-gray-3 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filters.map((group) => (
                <div key={group.id} className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-11 uppercase tracking-wider">
                    {group.label}
                  </h4>
                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const isActive = activeFilters.some(
                        (f) =>
                          f.groupId === group.id && f.optionId === option.id
                      );
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleFilterClick(group.id, option.id)
                          }
                          className={cn(
                            'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                            isActive
                              ? 'bg-brand-400/15 text-brand-400'
                              : 'text-gray-12 hover:bg-gray-4'
                          )}
                        >
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-gray-9">
                              {option.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FilterBar.displayName = 'FilterBar';

export { FilterBar };
