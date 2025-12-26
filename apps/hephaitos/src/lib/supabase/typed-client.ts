/**
 * Type-Safe Supabase Client Helpers
 *
 * Provides properly typed Supabase query methods that work around
 * type inference issues with dynamically generated Database types.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

// Generic result type for queries
type QueryResult<T> = { data: T | null; error: Error | null }

/**
 * Create a typed table reference that bypasses Supabase's strict type inference
 * This allows .from() calls to work with our Database types
 */
export function typedFrom<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T
) {
  // Use type assertion to bypass the strict inference that causes 'never' types
  const tableRef = client.from(table) as unknown as {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => Promise<QueryResult<Tables[T]['Row'][]>> & {
        single: () => Promise<QueryResult<Tables[T]['Row']>>
        order: (column: string, options?: { ascending?: boolean }) => Promise<QueryResult<Tables[T]['Row'][]>>
        limit: (count: number) => Promise<QueryResult<Tables[T]['Row'][]>>
      }
      neq: (column: string, value: unknown) => Promise<QueryResult<Tables[T]['Row'][]>>
      single: () => Promise<QueryResult<Tables[T]['Row']>>
      order: (column: string, options?: { ascending?: boolean }) => Promise<QueryResult<Tables[T]['Row'][]>> & {
        limit: (count: number) => Promise<QueryResult<Tables[T]['Row'][]>>
      }
      limit: (count: number) => Promise<QueryResult<Tables[T]['Row'][]>>
      then: (onfulfilled?: (value: QueryResult<Tables[T]['Row'][]>) => unknown) => Promise<unknown>
    } & Promise<QueryResult<Tables[T]['Row'][]>>
    insert: (values: Tables[T]['Insert'] | Tables[T]['Insert'][]) => Promise<QueryResult<Tables[T]['Row']>> & {
      select: () => Promise<QueryResult<Tables[T]['Row'][]>>
    }
    update: (values: Tables[T]['Update']) => {
      eq: (column: string, value: unknown) => Promise<QueryResult<Tables[T]['Row']>>
      match: (query: Record<string, unknown>) => Promise<QueryResult<Tables[T]['Row']>>
    }
    upsert: (
      values: Tables[T]['Insert'] | Tables[T]['Insert'][],
      options?: { onConflict?: string; ignoreDuplicates?: boolean }
    ) => Promise<QueryResult<Tables[T]['Row']>>
    delete: () => {
      eq: (column: string, value: unknown) => Promise<QueryResult<null>>
      match: (query: Record<string, unknown>) => Promise<QueryResult<null>>
    }
  }
  return tableRef
}

/**
 * Type-safe insert helper with proper return type
 */
export async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Insert']
): Promise<QueryResult<Tables[T]['Row']>> {
  const result = await (client.from(table) as any).insert(data)
  return result as QueryResult<Tables[T]['Row']>
}

/**
 * Type-safe update helper with filter
 */
export async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Update'],
  filter: { column: string; value: unknown }
): Promise<QueryResult<Tables[T]['Row']>> {
  const result = await (client.from(table) as any).update(data).eq(filter.column, filter.value)
  return result as QueryResult<Tables[T]['Row']>
}

/**
 * Type-safe upsert helper
 */
export async function upsertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Insert'],
  options?: { onConflict?: string }
): Promise<QueryResult<Tables[T]['Row']>> {
  const result = await (client.from(table) as any).upsert(data, options)
  return result as QueryResult<Tables[T]['Row']>
}

/**
 * Type-safe select helper that returns typed rows
 */
export async function selectRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  query?: string
): Promise<QueryResult<Tables[T]['Row'][]>> {
  const result = await (client.from(table) as any).select(query || '*')
  return result as QueryResult<Tables[T]['Row'][]>
}

/**
 * Type-safe single row select
 */
export async function selectRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  query?: string
): Promise<QueryResult<Tables[T]['Row'] | null>> {
  const result = await (client.from(table) as any).select(query || '*').single()
  return result as QueryResult<Tables[T]['Row'] | null>
}

/**
 * Type-safe select with filter
 */
export async function selectWhere<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  filter: { column: string; value: unknown },
  query?: string
): Promise<QueryResult<Tables[T]['Row'][]>> {
  const result = await (client.from(table) as any)
    .select(query || '*')
    .eq(filter.column, filter.value)
  return result as QueryResult<Tables[T]['Row'][]>
}

/**
 * Re-export the Database type for convenience
 */
export type { Database, Json, Tables, TableName }
