'use client'

import { useEffect, useState } from 'react'

const FALLBACK = [
  { label: 'Ravewear', emoji: '✨', color: 'text-pink-400' },
  { label: 'Commerce', emoji: '🛒', color: 'text-yellow-400' },
  { label: 'Travel', emoji: '✈️', color: 'text-blue-400' },
  { label: 'Auto', emoji: '🚗', color: 'text-orange-400' },
  { label: 'Gaming', emoji: '🎮', color: 'text-green-400' },
  { label: 'AI Infra', emoji: '🧠', color: 'text-purple-400' },
]

type Vertical = {
  label: string
  open: number | null
  inProgress: number | null
}

export default function LinearPanel() {
  const [verticals, setVerticals] = useState<Vertical[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/linear', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (json.verticals) setVerticals(json.verticals)
          if (!res.ok) setError(json.error || `HTTP ${res.status}`)
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rows =
    verticals?.map((v) => {
      const meta = FALLBACK.find((f) => f.label === v.label) ?? {
        emoji: '•',
        color: 'text-gray-400',
      }
      return { ...v, emoji: meta.emoji, color: meta.color }
    }) ?? FALLBACK.map((f) => ({ ...f, open: null, inProgress: null }))

  return (
    <div className="panel-purple">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-purple-400 font-bold text-lg">📋 Linear Status</h2>
        <span className="text-gray-500 text-xs">by vertical</span>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-gray-500 text-xs">Loading…</p>}
        {rows.map(({ label, emoji, color, open, inProgress }) => (
          <div
            key={label}
            className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2"
          >
            <span className={`text-sm font-medium ${color}`}>
              {emoji} {label}
            </span>
            <span className="text-gray-400 text-xs">
              {open === null
                ? '—'
                : `${open} open${inProgress ? ` · ${inProgress} active` : ''}`}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-gray-600 text-xs mt-4">
          {error.includes('LINEAR') || error.includes('503')
            ? 'Set LINEAR_API_KEY to activate live counts'
            : error}
        </p>
      )}
    </div>
  )
}
