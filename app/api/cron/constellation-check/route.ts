// Hourly cron job — runs on Vercel's cron scheduler
// Checks constellation health and writes results to Supabase

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron (not a public user)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const repos = [
    'mermicorn-grove', 'mermicorn-token-saver', 'mermicorn-graphic-ai',
    'mermicorn-commerce-ai', 'cherry-ravewear-studio', 'cherry-travel-deal-lab',
    'cherry-auto-matchmaker', 'cherry-rift-lab', 'cherry-operator-apprenticeship',
    'supabase-showcase', 'vercel-showcase', 'mcp-hub',
    'ai-agent-orchestrator', 'ai-observability', 'command-board',
  ]

  const token = process.env.GITHUB_TOKEN
  const results: Record<string, boolean> = {}

  await Promise.all(
    repos.map(async (repo) => {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/cyber-lazer-mermicorn/${repo}/main/mermicorn.repo.yaml`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        results[repo] = res.ok
      } catch {
        results[repo] = false
      }
    })
  )

  const validCount = Object.values(results).filter(Boolean).length
  const total = repos.length

  console.log(`Constellation check: ${validCount}/${total} repos have mermicorn.repo.yaml`)

  // TODO: upsert results into Supabase constellation_repos table
  // const supabase = getSupabaseAdmin()
  // await supabase.from('constellation_repos').upsert(...)

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    valid: validCount,
    total,
    results,
  })
}
