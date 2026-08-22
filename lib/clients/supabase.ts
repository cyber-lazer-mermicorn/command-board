/**
 * Supabase Clients
 *
 * Exports two clients:
 *
 *   supabaseAdmin   — service-role, bypasses RLS, SERVER ONLY
 *   supabaseClient  — anon key, respects RLS, safe for browser
 *
 * CRITICAL: never expose supabaseAdmin outside of server-side code (API
 * routes, server actions, middleware). Use supabaseClient everywhere else.
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY     — server-side only
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { CommandBoardDatabase } from "@/types/supabase-agent-audit";

// ─── Server-side admin client (service role, bypasses RLS) ───────────────────

export const supabaseAdmin = createClient<CommandBoardDatabase>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-client-info": "command-board/server",
      },
    },
  }
);

// ─── Browser-safe anon client (respects RLS) ─────────────────────────────────

export const supabaseClient = createClient<CommandBoardDatabase>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": "command-board/browser",
      },
    },
  }
);

// ─── Typed query helpers ──────────────────────────────────────────────────────

/**
 * Throws a typed error if the Supabase response contains an error.
 * Use with all admin queries so failures are never silently swallowed.
 */
export function assertSupabaseSuccess<T>(
  result: { data: T | null; error: { message: string; code?: string } | null }
): T {
  if (result.error) {
    const err = new Error(result.error.message);
    err.name = "SupabaseQueryError";
    (err as Error & { code?: string }).code = result.error.code;
    throw err;
  }
  if (result.data === null) {
    const err = new Error("Supabase returned null data without an error");
    err.name = "SupabaseNullResultError";
    throw err;
  }
  return result.data;
}
