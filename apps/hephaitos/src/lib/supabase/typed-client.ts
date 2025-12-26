/**
 * Type-Safe Supabase Client Helpers
 *
 * Provides properly typed Supabase query methods that work around
 * type inference issues with dynamically generated Database types.
 */

import type { SupabaseClient, PostgrestFilterBuilder } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

/**
 * Get a typed table reference for select queries
 */
export function fromTable<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T
) {
  return client.from(table) as unknown as {
    select: <Cols extends string = '*'>(
      columns?: Cols
    ) => PostgrestFilterBuilder<
      Database['public'],
      Tables[T]['Row'],
      Tables[T]['Row'][],
      T,
      Tables[T]['Row'][]
    >
    insert: (
      values: Tables[T]['Insert'] | Tables[T]['Insert'][]
    ) => PostgrestFilterBuilder<
      Database['public'],
      Tables[T]['Row'],
      null,
      T,
      null
    >
    update: (
      values: Tables[T]['Update']
    ) => PostgrestFilterBuilder<
      Database['public'],
      Tables[T]['Row'],
      null,
      T,
      null
    >
    upsert: (
      values: Tables[T]['Insert'] | Tables[T]['Insert'][],
      options?: { onConflict?: string; ignoreDuplicates?: boolean }
    ) => PostgrestFilterBuilder<
      Database['public'],
      Tables[T]['Row'],
      null,
      T,
      null
    >
    delete: () => PostgrestFilterBuilder<
      Database['public'],
      Tables[T]['Row'],
      null,
      T,
      null
    >
  }
}

/**
 * Type-safe insert helper
 */
export async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Insert']
) {
  return client.from(table).insert(data as never)
}

/**
 * Type-safe update helper
 */
export async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Update']
) {
  return client.from(table).update(data as never)
}

/**
 * Type-safe upsert helper
 */
export async function upsertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Tables[T]['Insert'],
  options?: { onConflict?: string }
) {
  return client.from(table).upsert(data as never, options as never)
}

/**
 * Type-safe select helper that returns typed rows
 */
export async function selectRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  query?: string
): Promise<{ data: Tables[T]['Row'][] | null; error: Error | null }> {
  const result = await client.from(table).select(query || '*')
  return result as { data: Tables[T]['Row'][] | null; error: Error | null }
}

/**
 * Type-safe single row select
 */
export async function selectRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  query?: string
): Promise<{ data: Tables[T]['Row'] | null; error: Error | null }> {
  const result = await client.from(table).select(query || '*').single()
  return result as { data: Tables[T]['Row'] | null; error: Error | null }
}

/**
 * Re-export the Database type for convenience
 */
export type { Database, Json, Tables, TableName }
