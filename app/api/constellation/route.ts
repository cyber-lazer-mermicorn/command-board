/**
 * GET /api/constellation
 * Live manifest check for core public repos (mermicorn.repo.yaml on main).
 * Soft dependencies: works without MERMICORN_PAT for public repos; PAT unlocks rate limits.
 * Does not import lib/env (avoids hard-fail when other secrets missing).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORG = "cyber-lazer-mermicorn";

const CORE_REPOS = [
  "mermicorn-grove",
  "command-board",
  "constellation-map",
  "tower-of-babel",
  "mermicorn-mega-boot",
  "mermicorn-graphic-ai",
  "mermicorn-commerce-ai",
  "cherry-ravewear-studio",
  "cherry-travel-deal-lab",
  "cherry-auto-matchmaker",
  "cherry-numismatic-auction-lab",
  "cherry-rift-lab",
  "cherry-chance-game-lab",
  "cherry-operator-apprenticeship",
  "cherry-portfolio",
  "mcp-hub",
  "ai-observability",
  "ai-agent-orchestrator",
  "supabase-showcase",
  "vercel-showcase",
] as const;

type RepoResult = {
  repo: string;
  valid: boolean;
  status: number;
  visibility: "public";
};

export async function GET() {
  const token = process.env.MERMICORN_PAT?.trim() || process.env.GITHUB_TOKEN?.trim();
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mermicorn-command-board",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const results: RepoResult[] = await Promise.all(
    CORE_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${ORG}/${repo}/main/mermicorn.repo.yaml`,
          { headers, cache: "no-store" }
        );
        return {
          repo,
          valid: res.ok,
          status: res.status,
          visibility: "public" as const,
        };
      } catch {
        return { repo, valid: false, status: 0, visibility: "public" as const };
      }
    })
  );

  const valid = results.filter((r) => r.valid).length;
  const missing = results.filter((r) => !r.valid).map((r) => r.repo);

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    auth: Boolean(token),
    valid,
    total: results.length,
    missing,
    results,
  });
}
