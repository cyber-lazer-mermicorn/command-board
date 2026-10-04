/**
 * Supabase clients — soft init when env is incomplete (dev / partial deploy).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { CommandBoardDatabase } from '@/types/supabase-agent-audit'

function makeAdmin(): SupabaseClient<CommandBoardDatabase> | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient<CommandBoardDatabase>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { headers: { 'x-client-info': 'command-board/server' } },
    }
  )
}

function makeAnon(): SupabaseClient<CommandBoardDatabase> | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return createClient<CommandBoardDatabase>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: { headers: { 'x-client-info': 'command-board/browser' } },
    }
  )
}

export const supabaseAdmin = makeAdmin()
export const supabaseClient = makeAnon()

export function assertSupabaseSuccess<T>(result: {
  data: T | null
  error: { message: string; code?: string } | null
}): T {
  if (result.error) {
    const err = new Error(result.error.message)
    err.name = 'SupabaseQueryError'
    ;(err as Error & { code?: string }).code = result.error.code
    throw err
  }
  if (result.data === null) {
    const err = new Error('Supabase returned null data without an error')
    err.name = 'SupabaseNullResultError'
    throw err
  }
  return result.data
}
