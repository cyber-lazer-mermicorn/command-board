/**
 * GET /api/health — soft-fail optional services. Never crashes on missing env.
 */

import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ServiceStatus = {
  ok: boolean
  configured: boolean
  latencyMs?: number
  error?: string
}

async function checkSupabase(): Promise<ServiceStatus> {
  if (!env.has.supabase()) {
    return { ok: false, configured: false, error: 'env not set' }
  }
  const start = Date.now()
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { error } = await client.from('oracle_forecasts').select('id').limit(1)
    // Table may not exist — connectivity still counts if we get a structured error
    if (error && /fetch failed|network/i.test(error.message)) {
      return { ok: false, configured: true, error: error.message, latencyMs: Date.now() - start }
    }
    return { ok: true, configured: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, configured: true, error: String(err), latencyMs: Date.now() - start }
  }
}

async function checkVercel(): Promise<ServiceStatus> {
  if (!env.has.vercel()) return { ok: false, configured: false }
  const start = Date.now()
  try {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, configured: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, configured: true, error: String(err), latencyMs: Date.now() - start }
  }
}

async function checkHuggingFace(): Promise<ServiceStatus> {
  if (!env.has.huggingface()) return { ok: false, configured: false }
  const start = Date.now()
  try {
    const res = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, configured: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, configured: true, error: String(err), latencyMs: Date.now() - start }
  }
}

export async function GET() {
  const [supabase, vercel, huggingface] = await Promise.all([
    checkSupabase(),
    checkVercel(),
    checkHuggingFace(),
  ])

  const services = {
    supabase,
    vercel,
    huggingface,
    github: { ok: env.has.github(), configured: env.has.github() },
    stytch: { ok: env.has.stytch(), configured: env.has.stytch() },
    linear: { ok: env.has.linear(), configured: env.has.linear() },
    sentry: { ok: Boolean(env.SENTRY_DSN), configured: Boolean(env.SENTRY_DSN) },
  }

  const configured = Object.values(services).filter((s) => s.configured)
  const healthyConfigured = configured.filter((s) => s.ok)
  const status =
    configured.length === 0
      ? 'bootstrapped'
      : healthyConfigured.length === configured.length
        ? 'healthy'
        : healthyConfigured.length > 0
          ? 'degraded'
          : 'unhealthy'

  return NextResponse.json(
    {
      status,
      services,
      summary: {
        configured: configured.length,
        healthy: healthyConfigured.length,
      },
      checkedAt: new Date().toISOString(),
    },
    { status: 200 }
  )
}
