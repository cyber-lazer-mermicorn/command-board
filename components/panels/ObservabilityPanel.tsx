// AI Observability Panel
// Feeds from ai-observability repo + Hugging Face usage

export default function ObservabilityPanel() {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-cyan-400 font-bold text-lg">🧠 AI Observability</h2>
        <span className="text-gray-500 text-xs">HF + ai-observability</span>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Model Calls (24h)', value: '—', note: 'Hugging Face Inference API' },
          { label: 'Avg Latency', value: '—', note: 'p50 / p95' },
          { label: 'Token Usage', value: '—', note: 'Across all agents' },
          { label: 'Error Rate', value: '—', note: 'Last 100 calls' },
          { label: 'Context7 Lookups', value: '—', note: 'Doc fetches today' },
        ].map(({ label, value, note }) => (
          <div key={label} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm text-gray-300">{label}</p>
              <p className="text-xs text-gray-600">{note}</p>
            </div>
            <span className="text-cyan-400 font-mono text-sm">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-4">
        Set <code className="text-cyan-600">HUGGINGFACE_API_TOKEN</code> +{' '}
        <code className="text-cyan-600">CONTEXT7_API_KEY</code> to activate
      </p>
    </div>
  )
}
