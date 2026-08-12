/**
 * GET /api/health
 *
 * Integration health check. Verifies every external dependency is
 * reachable and env vars are present. Returns 200 if all required
 * services are healthy, 503 if any required service is degraded.
 *
 * Auth: none — public endpoint intentionally (used by Vercel health checks).
 * Do NOT expose sensitive data in the response.
 */

import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/clients/supabase";
import { sentryHealthy, captureException } from "@/lib/clients/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceStatus = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
};

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from("oracle_forecasts")
      .select("id")
      .limit(1);
    if (error) throw error;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err), latencyMs: Date.now() - start };
  }
}

async function checkVercel(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err), latencyMs: Date.now() - start };
  }
}

async function checkHuggingFace(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err), latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const [supabase, vercel, huggingface] = await Promise.all([
    checkSupabase(),
    checkVercel(),
    checkHuggingFace(),
  ]);

  const sentry: ServiceStatus = { ok: sentryHealthy() };

  const stytch: ServiceStatus = {
    ok: Boolean(env.STYTCH_PROJECT_ID && env.STYTCH_SECRET),
  };

  const github: ServiceStatus = {
    ok: Boolean(env.MERMICORN_PAT),
  };

  const services = { supabase, vercel, huggingface, sentry, stytch, github };
  const allHealthy = Object.values(services).every((s) => s.ok);
  const requiredHealthy = [supabase, stytch, github].every((s) => s.ok);

  if (!requiredHealthy) {
    captureException(
      new Error("Health check: required service(s) degraded"),
      { tags: { endpoint: "health" } }
    );
  }

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : requiredHealthy ? "degraded" : "unhealthy",
      services,
      checkedAt: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : requiredHealthy ? 200 : 503 }
  );
}
