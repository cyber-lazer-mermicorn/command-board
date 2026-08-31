/**
 * GET /api/deployments
 * Lists recent Vercel deployments when VERCEL_TOKEN is set.
 * Soft env: returns 503 with clear message instead of process crash.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VercelDeployment = {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  ready?: number;
  target?: string | null;
};

export async function GET(req: NextRequest) {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN not configured", deployments: [] },
      { status: 503 }
    );
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20,
    100
  );

  const params = new URLSearchParams({ limit: String(limit) });
  const teamId = process.env.VERCEL_ORG_ID?.trim();
  if (teamId) params.set("teamId", teamId);
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (projectId) params.set("projectId", projectId);

  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "mermicorn-command-board",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Vercel API ${res.status}`, deployments: [] },
        { status: 502 }
      );
    }
    const data = await res.json();
    const deployments: VercelDeployment[] = (data.deployments || []).map(
      (d: VercelDeployment) => ({
        uid: d.uid,
        name: d.name,
        url: d.url,
        state: d.state,
        created: d.created,
        ready: d.ready,
        target: d.target,
      })
    );
    return NextResponse.json({ deployments });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), deployments: [] },
      { status: 502 }
    );
  }
}
