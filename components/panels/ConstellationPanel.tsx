"use client";

import { useEffect, useState } from "react";

type ConstellationResponse = {
  checked_at: string;
  auth: boolean;
  valid: number;
  total: number;
  missing: string[];
  results: { repo: string; valid: boolean; status: number }[];
};

export default function ConstellationPanel() {
  const [data, setData] = useState<ConstellationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/constellation", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ConstellationResponse;
        if (!cancelled) setData(json);
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
    <div className="panel-green">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-green-400 font-bold text-lg">🌿 Constellation Health</h2>
        <span className="text-gray-500 text-xs">
          {loading
            ? "loading…"
            : data
              ? `${data.valid}/${data.total} manifests`
              : "offline"}
        </span>
      </div>

      {error && (
        <p className="text-red-400 text-xs mb-3">Failed to load: {error}</p>
      )}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.results.map((r) => (
            <a
              key={r.repo}
              href={`https://github.com/cyber-lazer-mermicorn/${r.repo}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors"
            >
              <span
                className={r.valid ? "status-green" : "status-gray"}
                title={r.valid ? "mermicorn.repo.yaml present" : `HTTP ${r.status}`}
              />
              <span className="text-xs text-gray-300 truncate">{r.repo}</span>
            </a>
          ))}
        </div>
      )}

      {!loading && !data && !error && (
        <p className="text-gray-500 text-xs">No data</p>
      )}

      <p className="text-gray-600 text-xs mt-4">
        Live check of <code className="text-green-600">mermicorn.repo.yaml</code> on{" "}
        <code className="text-green-600">main</code>
        {data?.auth ? " · authenticated" : " · public fetch"}
        {data?.checked_at ? ` · ${new Date(data.checked_at).toLocaleString()}` : ""}
      </p>
    </div>
  );
}
