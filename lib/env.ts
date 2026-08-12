/**
 * Environment Validator
 *
 * Single source of truth for every env var the application reads.
 * Validated at module load time — if a required variable is absent
 * or malformed the process throws immediately rather than failing
 * silently on the first API call.
 *
 * Pattern:
 *   - Required server vars:  throw on missing
 *   - Optional server vars:  return undefined / typed default
 *   - Public vars (NEXT_PUBLIC_*): safe for browser bundles
 *
 * Import:
 *   import { env } from "@/lib/env";
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Missing required environment variable: ${name}\n` +
        `  Add it to .env.local (development) or your Vercel project settings (production).`
    );
  }
  return value.trim();
}

function optional(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") return fallback;
  return value.trim();
}

function requiredUrl(name: string): string {
  const value = required(name);
  try {
    new URL(value);
  } catch {
    throw new Error(
      `[env] Environment variable ${name} must be a valid URL. Got: "${value}"`
    );
  }
  return value;
}

function requiredEnum<T extends string>(name: string, allowed: T[]): T {
  const value = required(name) as T;
  if (!allowed.includes(value)) {
    throw new Error(
      `[env] Environment variable ${name} must be one of: ${allowed.join(", ")}. Got: "${value}"`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Validated environment — every consumer uses this object, never
// process.env directly.
// ---------------------------------------------------------------------------

export const env = {
  // ── Node ──────────────────────────────────────────────────────────────────
  NODE_ENV: (optional("NODE_ENV", "development") as
    | "development"
    | "test"
    | "production"),

  // ── Supabase ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),

  // ── Stytch ────────────────────────────────────────────────────────────────
  STYTCH_PROJECT_ID: required("STYTCH_PROJECT_ID"),
  STYTCH_SECRET: required("STYTCH_SECRET"),
  STYTCH_PROJECT_ENV: requiredEnum("STYTCH_PROJECT_ENV", ["live", "test"]),

  // ── Vercel ────────────────────────────────────────────────────────────────
  VERCEL_TOKEN: required("VERCEL_TOKEN"),
  VERCEL_TEAM_ID: optional("VERCEL_TEAM_ID"),

  // ── Sentry ────────────────────────────────────────────────────────────────
  SENTRY_DSN: optional("SENTRY_DSN"),
  NEXT_PUBLIC_SENTRY_DSN: optional("NEXT_PUBLIC_SENTRY_DSN"),
  SENTRY_AUTH_TOKEN: optional("SENTRY_AUTH_TOKEN"), // CI only — source map upload

  // ── GitHub ────────────────────────────────────────────────────────────────
  MERMICORN_PAT: required("MERMICORN_PAT"),

  // ── Hugging Face ──────────────────────────────────────────────────────────
  HUGGINGFACE_API_KEY: required("HUGGINGFACE_API_KEY"),

  // ── Internal ──────────────────────────────────────────────────────────────
  /** Shared secret for server-to-server agent API calls (e.g. sentinel ingest). */
  AGENT_API_SECRET: required("AGENT_API_SECRET"),

  /** Base URL of this deployment — used to build absolute callback URLs. */
  NEXT_PUBLIC_APP_URL: requiredUrl("NEXT_PUBLIC_APP_URL"),
} as const;

export type Env = typeof env;
