/**
 * Supabase Client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Type export for hooks
export type SupabaseClientType = SupabaseClient<Database> | null

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get Supabase browser client (singleton)
 */
export function getSupabaseBrowserClient(): SupabaseClientType {
  if (!isSupabaseConfigured) {
    return null
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseInstance
}

// Default export for backward compatibility
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    })
  : null

// Server-side client with service role key
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl
  ? createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null
