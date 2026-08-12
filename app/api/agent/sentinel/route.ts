/**
 * /api/agent/sentinel
 *
 * POST — ingest a new security/anomaly event (Sentinel agent only)
 * PATCH — resolve an open incident (Stytch-authed operator only)
 *
 * Auth:
 *   POST:  x-agent-secret (Sentinel agent, server-to-server)
 *   PATCH: Stytch session (human operator resolving an incident)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, assertSupabaseSuccess } from "@/lib/clients/supabase";
import { stytch } from "@/lib/clients/stytch";
import { captureException, addBreadcrumb } from "@/lib/clients/sentry";
import { StytchAuthError } from "@/lib/clients/stytch";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAgentRequest(req: NextRequest): boolean {
  return req.headers.get("x-agent-secret") === env.AGENT_API_SECRET;
}

function extractBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
}

// ── POST: ingest event ────────────────────────────────────────────────────────

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

  const required = ["event_type", "threat_level", "action", "subject_type"];
  const missing = required.filter((k) => b[k] === undefined || b[k] === null);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 422 }
    );
  }

  addBreadcrumb("sentinel", "Ingesting security event", {
    event_type:   b.event_type,
    threat_level: b.threat_level,
    action:       b.action,
  });

  try {
    const event = assertSupabaseSuccess(
      await supabaseAdmin
        .from("sentinel_log")
        .insert({
          event_type:   b.event_type   as string,
          threat_level: b.threat_level as string,
          action:       b.action       as string,
          subject_type: b.subject_type as string,
          subject_id:   b.subject_id   as string | undefined,
          request_id:   b.request_id   as string | undefined,
          source_ip:    b.source_ip    as string | undefined,
          evidence:     b.evidence     ?? [],
          metadata:     b.metadata     ?? {},
        })
        .select()
        .single()
    );
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    captureException(err, { tags: { route: "sentinel", method: "POST" } });
    return NextResponse.json({ error: "Failed to ingest event" }, { status: 500 });
  }
}

// ── PATCH: resolve incident ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let session: Awaited<ReturnType<typeof stytch.authenticateSession>>;
  try {
    session = await stytch.authenticateSession(token);
  } catch (err) {
    if (err instanceof StytchAuthError)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    captureException(err, { tags: { route: "sentinel", method: "PATCH" } });
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (!b.id || typeof b.id !== "string")
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 422 }
    );

  if (!b.resolution_note || typeof b.resolution_note !== "string")
    return NextResponse.json(
      { error: "Missing required field: resolution_note" },
      { status: 422 }
    );

  addBreadcrumb("sentinel", "Resolving incident", {
    id:          b.id,
    resolved_by: session.user.user_id,
  });

  try {
    const updated = assertSupabaseSuccess(
      await supabaseAdmin
        .from("sentinel_log")
        .update({
          resolved_at:     new Date().toISOString(),
          resolved_by:     session.user.user_id,
          resolution_note: b.resolution_note as string,
        })
        .eq("id", b.id)
        .is("resolved_at", null) // idempotency guard — cannot re-resolve
        .select()
        .single()
    );
    return NextResponse.json({ event: updated });
  } catch (err) {
    captureException(err, { tags: { route: "sentinel", method: "PATCH" } });
    return NextResponse.json(
      { error: "Failed to resolve incident" },
      { status: 500 }
    );
  }
}
