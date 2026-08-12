// Hourly cron job — runs on Vercel's edge runtime
// Full org access via MERMICORN_PAT (public + private repos)

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const ORG = 'cyber-lazer-mermicorn'

const REPOS = [
  'mermicorn-grove', 'mermicorn-token-saver', 'mermicorn-graphic-ai',
  'mermicorn-commerce-ai', 'cherry-ravewear-studio', 'cherry-travel-deal-lab',
  'cherry-auto-matchmaker', 'cherry-rift-lab', 'cherry-operator-apprenticeship',
  'supabase-showcase', 'vercel-showcase', 'mcp-hub',
  'ai-agent-orchestrator', 'ai-observability', 'command-board',
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // MERMICORN_PAT gives read access to all org repos, public + private
  const token = process.env.MERMICORN_PAT
  if (!token) {
    return NextResponse.json({ error: 'MERMICORN_PAT not configured' }, { status: 500 })
  }

  const results: Record<string, { valid: boolean; status: number }> = {}

  await Promise.all(
    REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${ORG}/${repo}/main/mermicorn.repo.yaml`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        results[repo] = { valid: res.ok, status: res.status }
      } catch {
        results[repo] = { valid: false, status: 0 }
      }
    })
  )

  const validCount  = Object.values(results).filter(r => r.valid).length
  const missingRepos = Object.entries(results).filter(([, r]) => !r.valid).map(([name]) => name)

  // TODO: upsert into Supabase constellation_repos once schema is live

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    valid: validCount,
    total: REPOS.length,
    missing: missingRepos,
    results,
  })
}
