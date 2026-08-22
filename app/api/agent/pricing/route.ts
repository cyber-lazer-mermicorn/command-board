/**
 * POST /api/agent/pricing
 *
 * Append-only ingest for Phantom-Pricer decisions.
 * Only the Phantom-Pricer agent may write here — via AGENT_API_SECRET.
 * Dashboard consumers read directly from Supabase via supabaseAdmin in
 * server components; no GET handler is exposed here.
 *
 * Auth: x-agent-secret header (server-to-server only)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, assertSupabaseSuccess } from "@/lib/clients/supabase";
import { captureException, addBreadcrumb } from "@/lib/clients/sentry";
import { env } from "@/lib/env";
import { jsonOrFallback } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAgentRequest(req: NextRequest): boolean {
  return req.headers.get("x-agent-secret") === env.AGENT_API_SECRET;
}

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
    "forecast_id",
    "stay_period_starts_at",
    "stay_period_ends_at",
    "recommended_nightly_rate_cents",
    "minimum_nightly_rate_cents",
    "maximum_nightly_rate_cents",
    "estimated_total_cents",
    "confidence",
    "disposition",
    "strategy",
    "model_version",
  ];
  const missing = required.filter((k) => b[k] === undefined || b[k] === null);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 422 }
    );
  }

  addBreadcrumb("phantom-pricer", "Logging pricing decision", {
    disposition: b.disposition,
    strategy:    b.strategy,
  });

  try {
    const record = assertSupabaseSuccess(
      await supabaseAdmin
        .from("phantom_pricing_log")
        .insert({
          forecast_id:                    b.forecast_id                    as string,
          stay_period_starts_at:          b.stay_period_starts_at          as string,
          stay_period_ends_at:            b.stay_period_ends_at            as string,
          recommended_nightly_rate_cents: b.recommended_nightly_rate_cents as number,
          minimum_nightly_rate_cents:     b.minimum_nightly_rate_cents     as number,
          maximum_nightly_rate_cents:     b.maximum_nightly_rate_cents     as number,
          estimated_total_cents:          b.estimated_total_cents          as number,
          confidence:                     b.confidence                     as number,
          disposition:                    b.disposition                    as string,
          strategy:                       b.strategy                       as string,
          model_version:                  b.model_version                  as string,
          rationale:                      jsonOrFallback(b.rationale, []),
        })
        .select()
        .single()
    );
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    captureException(err, { tags: { route: "pricing", method: "POST" } });
    return NextResponse.json({ error: "Failed to log pricing decision" }, { status: 500 });
  }
}
