/**
 * Environment access — soft by default so optional integrations do not crash the app.
 * Required vars throw only when a feature that needs them is invoked via requireEnv().
 */

function optional(name: string, fallback?: string): string | undefined {
  const value = process.env[name]
  if (!value || value.trim() === '') return fallback
  return value.trim()
}

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. Add it to .env.local or Vercel.`
    )
  }
  return value
}

export const env = {
  NODE_ENV: (optional('NODE_ENV', 'development') as 'development' | 'test' | 'production'),

  // Public / common
  NEXT_PUBLIC_SUPABASE_URL: optional('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: optional('SUPABASE_SERVICE_ROLE_KEY'),

  STYTCH_PROJECT_ID: optional('STYTCH_PROJECT_ID'),
  STYTCH_SECRET: optional('STYTCH_SECRET'),
  STYTCH_PROJECT_ENV: optional('STYTCH_PROJECT_ENV', 'test'),

  VERCEL_TOKEN: optional('VERCEL_TOKEN'),
  VERCEL_TEAM_ID: optional('VERCEL_TEAM_ID') ?? optional('VERCEL_ORG_ID'),
  VERCEL_PROJECT_ID: optional('VERCEL_PROJECT_ID'),

  SENTRY_DSN: optional('SENTRY_DSN'),
  NEXT_PUBLIC_SENTRY_DSN: optional('NEXT_PUBLIC_SENTRY_DSN'),

  MERMICORN_PAT: optional('MERMICORN_PAT') ?? optional('GITHUB_TOKEN'),
  HUGGINGFACE_API_KEY: optional('HUGGINGFACE_API_KEY'),
  LINEAR_API_KEY: optional('LINEAR_API_KEY'),

  AGENT_API_SECRET: optional('AGENT_API_SECRET'),
  COMMAND_BOARD_ACCESS_TOKEN: optional('COMMAND_BOARD_ACCESS_TOKEN'),
  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL'),

  has: {
    supabase: () =>
      present('NEXT_PUBLIC_SUPABASE_URL') && present('SUPABASE_SERVICE_ROLE_KEY'),
    stytch: () => present('STYTCH_PROJECT_ID') && present('STYTCH_SECRET'),
    vercel: () => present('VERCEL_TOKEN'),
    github: () => present('MERMICORN_PAT') || present('GITHUB_TOKEN'),
    huggingface: () => present('HUGGINGFACE_API_KEY'),
    linear: () => present('LINEAR_API_KEY'),
  },
} as const

export type Env = typeof env
