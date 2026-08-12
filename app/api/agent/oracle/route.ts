/**
 * /api/agent/oracle
 *
 * GET  — fetch latest non-stale forecast for a date range
 * POST — ingest a new forecast produced by the Oracle agent
 *
 * Auth:
 *   GET:  Stytch session (dashboard consumers)
 *   POST: AGENT_API_SECRET header (server-to-server, Oracle agent only)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, assertSupabaseSuccess } from "@/lib/clients/supabase";
import { stytch } from "@/lib/clients/stytch";
import { captureException, addBreadcrumb } from "@/lib/clients/sentry";
import { StytchAuthError } from "@/lib/clients/stytch";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Auth helpers ─────────────────────────────────────────────────────────────

function extractBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
}

function isAgentRequest(req: NextRequest): boolean {
  return req.headers.get("x-agent-secret") === env.AGENT_API_SECRET;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await stytch.authenticateSession(token);
  } catch (err) {
    if (err instanceof StytchAuthError)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    captureException(err, { tags: { route: "oracle", method: "GET" } });
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  addBreadcrumb("oracle", "Fetching forecasts", { from, to });

  try {
    let query = supabaseAdmin
      .from("oracle_forecasts")
      .select("*")
      .eq("is_stale", false)
      .order("generated_at", { ascending: false })
      .limit(50);

    if (from) query = query.gte("period_starts_at", from);
    if (to)   query = query.lte("period_ends_at", to);

    const forecasts = assertSupabaseSuccess(await query);
    return NextResponse.json({ forecasts });
  } catch (err) {
    captureException(err, { tags: { route: "oracle", method: "GET" } });
    return NextResponse.json({ error: "Failed to fetch forecasts" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAgentRequest(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const required = [
    "period_starts_at", "period_ends_at",
    "demand_score", "confidence",
    "model_version",
  ];
  const missing = required.filter((k) => b[k] === undefined || b[k] === null);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 422 }
    );
  }

  addBreadcrumb("oracle", "Inserting new forecast", {
    model_version: b.model_version,
  });

  try {
    const forecast = assertSupabaseSuccess(
      await supabaseAdmin
        .from("oracle_forecasts")
        .insert({
          period_starts_at:  b.period_starts_at  as string,
          period_ends_at:    b.period_ends_at    as string,
          demand_score:      b.demand_score      as number,
          confidence:        b.confidence        as number,
          model_version:     b.model_version     as string,
          signals:           b.signals           ?? [],
        })
        .select()
        .single()
    );
    return NextResponse.json({ forecast }, { status: 201 });
  } catch (err) {
    captureException(err, { tags: { route: "oracle", method: "POST" } });
    return NextResponse.json({ error: "Failed to insert forecast" }, { status: 500 });
  }
}
