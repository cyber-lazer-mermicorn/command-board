/**
 * GET /api/deployments
 *
 * Returns recent Vercel deployments for the constellation dashboard.
 *
 * Auth: Stytch session token via Authorization: Bearer <session_token>
 * Scope: read-only, server-side Vercel API call
 */

import { NextRequest, NextResponse } from "next/server";
import { stytch } from "@/lib/clients/stytch";
import { vercel } from "@/lib/clients/vercel";
import { captureException, addBreadcrumb } from "@/lib/clients/sentry";
import { StytchAuthError } from "@/lib/clients/stytch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  // --- Auth ---
  try {
    await stytch.authenticateSession(token);
  } catch (err) {
    if (err instanceof StytchAuthError) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    captureException(err, { tags: { route: "deployments" } });
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }

  // --- Fetch ---
  addBreadcrumb("deployments", "Fetching Vercel deployments");
  try {
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10),
      100
    );
    const deployments = await vercel.listDeployments(limit);
    return NextResponse.json({ deployments });
  } catch (err) {
    captureException(err, { tags: { route: "deployments" } });
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 502 }
    );
  }
}
