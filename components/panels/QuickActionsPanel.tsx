// Quick Actions Panel
// One-click triggers: create Linear issue, run Postman, trigger GH workflow

const ACTIONS = [
  {
    label: 'Create Linear Issue',
    emoji: '📋',
    description: 'New issue in default project',
    endpoint: '/api/linear/create-issue',
    color: 'hover:border-purple-500',
  },
  {
    label: 'Run Postman Suite',
    emoji: '🧪',
    description: 'Execute API test collection',
    endpoint: '/api/postman/run',
    color: 'hover:border-orange-500',
  },
  {
    label: 'Validate Constellation',
    emoji: '🌿',
    description: 'Trigger grove validator',
    endpoint: '/api/github/trigger-validate',
    color: 'hover:border-green-500',
  },
  {
    label: 'Deploy to Vercel',
    emoji: '🚀',
    description: 'Force redeploy latest',
    endpoint: '/api/vercel/redeploy',
    color: 'hover:border-blue-500',
  },
]

export default function QuickActionsPanel() {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-yellow-400 font-bold text-lg">⚡ Quick Actions</h2>
        <span className="text-gray-500 text-xs">one-click triggers</span>
      </div>

      <div className="space-y-2">
        {ACTIONS.map(({ label, emoji, description, color }) => (
          <button
            key={label}
            className={`w-full text-left bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 transition-all duration-200 ${color} hover:bg-slate-700`}
          >
            <div className="flex items-center gap-2">
              <span>{emoji}</span>
              <div>
                <p className="text-sm text-gray-200 font-medium">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
