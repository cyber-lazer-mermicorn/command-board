"use client";

import { useEffect, useState } from "react";

type Deployment = {
  uid?: string;
  name?: string;
  url?: string;
  state?: string;
  ready?: number;
  created?: number;
  target?: string | null;
};

export default function CIPanel() {
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/deployments?limit=8", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        if (!cancelled) setDeployments(json.deployments ?? []);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="panel-blue">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-blue-400 font-bold text-lg">🚀 CI / Deployments</h2>
        <span className="text-gray-500 text-xs">Vercel</span>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">Recent deployments</p>
          {loading && <p className="text-gray-500 text-xs">Loading…</p>}
          {error && (
            <p className="text-amber-500 text-xs">
              {error.includes("VERCEL") || error.includes("503") || error.includes("502")
                ? "Vercel token not configured or API unavailable — set VERCEL_TOKEN"
                : error}
            </p>
          )}
          {deployments && deployments.length === 0 && !error && (
            <p className="text-gray-500 text-xs">No deployments returned</p>
          )}
          {deployments && deployments.length > 0 && (
            <ul className="space-y-2">
              {deployments.slice(0, 8).map((d, i) => (
                <li key={d.uid || i} className="text-xs text-gray-300 flex justify-between gap-2">
                  <span className="truncate">
                    {d.name || d.url || d.uid || "deployment"}
                  </span>
                  <span className="text-gray-500 shrink-0">{d.state || d.target || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">GitHub Actions</p>
          <p className="text-gray-500 text-xs">
            Stream via MERMICORN_PAT on a dedicated route (next increment)
          </p>
        </div>
      </div>
    </div>
  );
}
