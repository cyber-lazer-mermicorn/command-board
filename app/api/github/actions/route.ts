/**
 * GET /api/github/actions — recent workflow runs across org (soft env).
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ORG = 'cyber-lazer-mermicorn'
const REPOS = [
  'command-board',
  'mermicorn-grove',
  'tower-of-babel',
  'cherry-rental-engine',
  'constellation-map',
]

export async function GET(req: NextRequest) {
  const token =
    process.env.MERMICORN_PAT?.trim() || process.env.GITHUB_TOKEN?.trim()
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub token not configured', runs: [] },
      { status: 503 }
    )
  }

  const perRepo = Math.min(
    parseInt(req.nextUrl.searchParams.get('per_repo') ?? '3', 10) || 3,
    10
  )

  const runs: Array<{
    repo: string
    name: string
    status: string
    conclusion: string | null
    html_url: string
    created_at: string
  }> = []

  await Promise.all(
    REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${ORG}/${repo}/actions/runs?per_page=${perRepo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'User-Agent': 'mermicorn-command-board',
            },
            cache: 'no-store',
          }
        )
        if (!res.ok) return
        const data = (await res.json()) as {
          workflow_runs?: Array<{
            name: string
            status: string
            conclusion: string | null
            html_url: string
            created_at: string
          }>
        }
        for (const r of data.workflow_runs ?? []) {
          runs.push({
            repo,
            name: r.name,
            status: r.status,
            conclusion: r.conclusion,
            html_url: r.html_url,
            created_at: r.created_at,
          })
        }
      } catch {
        // skip repo
      }
    })
  )

  runs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return NextResponse.json({ runs: runs.slice(0, 20) })
}
