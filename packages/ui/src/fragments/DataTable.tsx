/**
 * FORGE LABS UI - DataTable Fragment
 * L3 (Tissues) - Data table with sorting and selection
 *
 * Supabase-inspired data table pattern
 */

import * as React from 'react';
import { cn } from '../lib/cn';
import { Skeleton } from '../atoms/Skeleton';
import { Badge } from '../atoms/Badge';

export interface Column<T> {
  /** Unique column key */
  key: string;
  /** Column header text */
  header: string;
  /** Cell renderer */
  cell?: (row: T, index: number) => React.ReactNode;
  /** Accessor for simple data */
  accessor?: keyof T;
  /** Column width */
  width?: string;
  /** Enable sorting */
  sortable?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  /** Table columns configuration */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Unique key for each row */
  rowKey: keyof T | ((row: T) => string);
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Selection change handler */
  onSelectionChange?: (keys: string[]) => void;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Current sort column */
  sortColumn?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Sort change handler */
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  /** Loading state */
  loading?: boolean;
  /** Loading row count */
  loadingRows?: number;
  /** Empty state content */
  emptyContent?: React.ReactNode;
  /** Compact mode */
  compact?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Show borders */
  bordered?: boolean;
}

// Sort icons
const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => {
  if (!direction) {
    return (
      <svg className="h-4 w-4 text-gray-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return direction === 'asc' ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
};

// Checkbox component
const Checkbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-6 bg-gray-3 text-brand-400 focus:ring-brand-400 focus:ring-offset-gray-1"
    />
  );
};

function DataTable<T extends Record<string, unknown>>({
  className,
  columns,
  data,
  rowKey,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  sortColumn,
  sortDirection,
  onSortChange,
  loading = false,
  loadingRows = 5,
  emptyContent,
  compact = false,
  striped = false,
  bordered = false,
  ...props
}: DataTableProps<T>) {
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isSomeSelected = selectedKeys.length > 0 && selectedKeys.length < data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(getRowKey));
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortChange) return;
    const newDirection =
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column.key, newDirection);
  };

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  const renderCell = (column: Column<T>, row: T, index: number) => {
    if (column.cell) {
      return column.cell(row, index);
    }
    if (column.accessor) {
      const value = row[column.accessor];
      return value !== undefined && value !== null ? String(value) : '-';
    }
    return '-';
  };

  return (
    <div
      className={cn(
        'w-full overflow-auto rounded-lg border border-gray-5',
        className
      )}
      {...props}
    >
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead className="bg-gray-3">
          <tr>
            {selectable && (
              <th className={cn('w-10', cellPadding)}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  cellPadding,
                  'text-left font-medium text-gray-11',
                  column.sortable && 'cursor-pointer select-none hover:text-gray-12',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.hideOnMobile && 'hidden md:table-cell'
                )}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <SortIcon
                      direction={
                        sortColumn === column.key ? sortDirection : undefined
                      }
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-5">
          {loading ? (
            // Loading skeleton
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="bg-gray-2">
                {selectable && (
                  <td className={cellPadding}>
                    <Skeleton className="h-4 w-4" />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(cellPadding, column.hideOnMobile && 'hidden md:table-cell')}
                  >
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center"
              >
                {emptyContent || (
                  <div className="text-gray-11">No data available</div>
                )}
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row, index) => {
              const key = getRowKey(row);
              const isSelected = selectedKeys.includes(key);

              return (
                <tr
                  key={key}
                  className={cn(
                    'transition-colors',
                    striped && index % 2 === 1 ? 'bg-gray-2' : 'bg-gray-1',
                    isSelected && 'bg-brand-400/10',
                    onRowClick && 'cursor-pointer hover:bg-gray-3'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td
                      className={cellPadding}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(key)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        cellPadding,
                        'text-gray-12',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.hideOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {renderCell(column, row, index)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.displayName = 'DataTable';

export { DataTable };
