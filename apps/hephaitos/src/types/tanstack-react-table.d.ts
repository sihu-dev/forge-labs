/**
 * Type declarations for @tanstack/react-table
 * This is a workaround until proper type declarations are available
 */

declare module '@tanstack/react-table' {
  export interface ColumnDef<TData, TValue = unknown> {
    id?: string
    accessorKey?: keyof TData | string
    accessorFn?: (row: TData) => TValue
    header?: string | ((props: { column: Column<TData, TValue> }) => React.ReactNode)
    cell?: (props: { row: Row<TData>; getValue: () => TValue }) => React.ReactNode
    footer?: string | ((props: { column: Column<TData, TValue> }) => React.ReactNode)
    enableSorting?: boolean
    enableColumnFilter?: boolean
    enableGlobalFilter?: boolean
    meta?: Record<string, unknown>
  }

  export interface Column<TData, TValue = unknown> {
    id: string
    columnDef: ColumnDef<TData, TValue>
    getCanSort: () => boolean
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
    getCanFilter: () => boolean
    getFilterValue: () => unknown
    setFilterValue: (value: unknown) => void
  }

  export interface Row<TData> {
    id: string
    index: number
    original: TData
    getValue: <TValue = unknown>(columnId: string) => TValue
    getVisibleCells: () => Cell<TData, unknown>[]
  }

  export interface Cell<TData, TValue> {
    id: string
    column: Column<TData, TValue>
    row: Row<TData>
    getValue: () => TValue
    getContext: () => {
      table: Table<TData>
      column: Column<TData, TValue>
      row: Row<TData>
      cell: Cell<TData, TValue>
      getValue: () => TValue
    }
  }

  export interface HeaderGroup<TData> {
    id: string
    headers: Header<TData, unknown>[]
  }

  export interface Header<TData, TValue> {
    id: string
    column: Column<TData, TValue>
    isPlaceholder: boolean
    colSpan: number
    getContext: () => {
      table: Table<TData>
      column: Column<TData, TValue>
      header: Header<TData, TValue>
    }
  }

  export interface Table<TData> {
    getHeaderGroups: () => HeaderGroup<TData>[]
    getRowModel: () => { rows: Row<TData>[] }
    getState: () => {
      sorting: SortingState
      columnFilters: ColumnFiltersState
      globalFilter: string
      pagination: PaginationState
    }
    setPageIndex: (index: number) => void
    setPageSize: (size: number) => void
    getCanPreviousPage: () => boolean
    getCanNextPage: () => boolean
    previousPage: () => void
    nextPage: () => void
    getPageCount: () => number
    getAllColumns: () => Column<TData, unknown>[]
    getColumn: (id: string) => Column<TData, unknown> | undefined
    setGlobalFilter: (filter: string) => void
  }

  export interface TableOptions<TData> {
    data: TData[]
    columns: ColumnDef<TData, unknown>[]
    getCoreRowModel: () => (table: Table<TData>) => { rows: Row<TData>[] }
    getSortedRowModel?: () => (table: Table<TData>) => { rows: Row<TData>[] }
    getFilteredRowModel?: () => (table: Table<TData>) => { rows: Row<TData>[] }
    getPaginationRowModel?: () => (table: Table<TData>) => { rows: Row<TData>[] }
    onSortingChange?: OnChangeFn<SortingState>
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
    onGlobalFilterChange?: OnChangeFn<string>
    onPaginationChange?: OnChangeFn<PaginationState>
    state?: Partial<{
      sorting: SortingState
      columnFilters: ColumnFiltersState
      globalFilter: string
      pagination: PaginationState
    }>
  }

  export type SortingState = { id: string; desc: boolean }[]
  export type ColumnFiltersState = { id: string; value: unknown }[]
  export type PaginationState = { pageIndex: number; pageSize: number }
  export type OnChangeFn<T> = (updaterOrValue: T | ((old: T) => T)) => void

  export function useReactTable<TData>(options: TableOptions<TData>): Table<TData>
  export function getCoreRowModel<TData>(): (table: Table<TData>) => { rows: Row<TData>[] }
  export function getSortedRowModel<TData>(): (table: Table<TData>) => { rows: Row<TData>[] }
  export function getFilteredRowModel<TData>(): (table: Table<TData>) => { rows: Row<TData>[] }
  export function getPaginationRowModel<TData>(): (table: Table<TData>) => { rows: Row<TData>[] }
  export function flexRender<TProps>(
    Comp: string | ((props: TProps) => React.ReactNode) | undefined,
    props: TProps
  ): React.ReactNode
}
