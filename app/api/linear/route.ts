/**
 * GET /api/linear — issue summary by team/label when LINEAR_API_KEY set.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VERTICALS = [
  'Ravewear',
  'Commerce',
  'Travel',
  'Auto',
  'Gaming',
  'AI Infra',
] as const

export async function GET() {
  const key = process.env.LINEAR_API_KEY?.trim()
  if (!key) {
    return NextResponse.json(
      {
        error: 'LINEAR_API_KEY not configured',
        verticals: VERTICALS.map((label) => ({
          label,
          open: null as number | null,
          inProgress: null as number | null,
        })),
      },
      { status: 503 }
    )
  }

  try {
    const query = `
      query {
        issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 100) {
          nodes { id title state { name type } labels { nodes { name } } team { name } }
        }
      }
    `
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        Authorization: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Linear API ${res.status}`, verticals: [] },
        { status: 502 }
      )
    }

    const data = await res.json()
    const nodes: Array<{
      state?: { type?: string }
      labels?: { nodes?: Array<{ name: string }> }
      team?: { name?: string }
    }> = data?.data?.issues?.nodes ?? []

    const verticals = VERTICALS.map((label) => {
      const matched = nodes.filter((n) => {
        const hay = [
          n.team?.name ?? '',
          ...(n.labels?.nodes?.map((l) => l.name) ?? []),
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(label.toLowerCase().split(' ')[0]!)
      })
      const inProgress = matched.filter((n) => n.state?.type === 'started').length
      const open = matched.length
      return { label, open, inProgress }
    })

    return NextResponse.json({
      verticals,
      totalOpen: nodes.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: String(err), verticals: [] },
      { status: 502 }
    )
  }
}
