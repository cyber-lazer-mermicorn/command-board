// Constellation Health Panel
// Reads repo validation status from mermicorn-grove via GitHub API

const REPOS = [
  'mermicorn-grove', 'mermicorn-token-saver', 'mermicorn-graphic-ai',
  'mermicorn-commerce-ai', 'cherry-ravewear-studio', 'cherry-travel-deal-lab',
  'cherry-auto-matchmaker', 'cherry-rift-lab', 'cherry-operator-apprenticeship',
  'supabase-showcase', 'vercel-showcase', 'mcp-hub',
  'ai-agent-orchestrator', 'ai-observability', 'command-board',
]

export default function ConstellationPanel() {
  return (
    <div className="panel-green">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-green-400 font-bold text-lg">🌿 Constellation Health</h2>
        <span className="text-gray-500 text-xs">mermicorn-grove validator</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {REPOS.map((repo) => (
          <a
            key={repo}
            href={`https://github.com/cyber-lazer-mermicorn/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors"
          >
            <span className="status-gray" title="Awaiting validation" />
            <span className="text-xs text-gray-300 truncate">{repo}</span>
          </a>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-4">
        Live validation via <code className="text-green-600">tools/validate_constellation.py</code> — connect GitHub token to activate
      </p>
    </div>
  )
}
