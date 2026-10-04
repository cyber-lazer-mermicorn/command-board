'use client'

import { useEffect, useState } from 'react'

type Deployment = {
  uid?: string
  name?: string
  url?: string
  state?: string
  target?: string | null
}

type ActionRun = {
  repo: string
  name: string
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
}

export default function CIPanel() {
  const [deployments, setDeployments] = useState<Deployment[] | null>(null)
  const [runs, setRuns] = useState<ActionRun[] | null>(null)
  const [depError, setDepError] = useState<string | null>(null)
  const [actError, setActError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [depRes, actRes] = await Promise.all([
          fetch('/api/deployments?limit=8', { cache: 'no-store' }),
          fetch('/api/github/actions', { cache: 'no-store' }),
        ])
        const depJson = await depRes.json().catch(() => ({}))
        const actJson = await actRes.json().catch(() => ({}))
        if (!cancelled) {
          if (depRes.ok) setDeployments(depJson.deployments ?? [])
          else setDepError(depJson.error || `HTTP ${depRes.status}`)
          if (actRes.ok) setRuns(actJson.runs ?? [])
          else setActError(actJson.error || `HTTP ${actRes.status}`)
        }
      } catch (e) {
        if (!cancelled) {
          setDepError(String(e))
          setActError(String(e))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="panel-blue">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-blue-400 font-bold text-lg">🚀 CI / Deployments</h2>
        <span className="text-gray-500 text-xs">Vercel · Actions</span>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">Recent deployments</p>
          {loading && <p className="text-gray-500 text-xs">Loading…</p>}
          {depError && (
            <p className="text-amber-500 text-xs">
              {depError.includes('VERCEL') || depError.includes('503')
                ? 'Set VERCEL_TOKEN to load deployments'
                : depError}
            </p>
          )}
          {deployments && deployments.length === 0 && !depError && (
            <p className="text-gray-500 text-xs">No deployments returned</p>
          )}
          {deployments && deployments.length > 0 && (
            <ul className="space-y-2">
              {deployments.slice(0, 6).map((d, i) => (
                <li
                  key={d.uid || i}
                  className="text-xs text-gray-300 flex justify-between gap-2"
                >
                  <span className="truncate">{d.name || d.url || 'deployment'}</span>
                  <span className="text-gray-500 shrink-0">{d.state || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">GitHub Actions</p>
          {actError && (
            <p className="text-amber-500 text-xs">
              {actError.includes('token') || actError.includes('503')
                ? 'Set MERMICORN_PAT for Actions feed'
                : actError}
            </p>
          )}
          {runs && runs.length === 0 && !actError && (
            <p className="text-gray-500 text-xs">No recent runs</p>
          )}
          {runs && runs.length > 0 && (
            <ul className="space-y-2">
              {runs.slice(0, 8).map((r, i) => (
                <li key={`${r.repo}-${r.created_at}-${i}`} className="text-xs text-gray-300">
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-300 flex justify-between gap-2"
                  >
                    <span className="truncate">
                      {r.repo} · {r.name}
                    </span>
                    <span className="text-gray-500 shrink-0">
                      {r.conclusion || r.status}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
