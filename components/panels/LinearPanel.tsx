// Linear Status Panel
// Shows issue counts by vertical via Linear API

const VERTICALS = [
  { label: 'Ravewear', emoji: '✨', color: 'text-pink-400' },
  { label: 'Commerce', emoji: '🛒', color: 'text-yellow-400' },
  { label: 'Travel', emoji: '✈️', color: 'text-blue-400' },
  { label: 'Auto', emoji: '🚗', color: 'text-orange-400' },
  { label: 'Gaming', emoji: '🎮', color: 'text-green-400' },
  { label: 'AI Infra', emoji: '🧠', color: 'text-purple-400' },
]

export default function LinearPanel() {
  return (
    <div className="panel-purple">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-purple-400 font-bold text-lg">📋 Linear Status</h2>
        <span className="text-gray-500 text-xs">by vertical</span>
      </div>

      <div className="space-y-2">
        {VERTICALS.map(({ label, emoji, color }) => (
          <div key={label} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
            <span className={`text-sm font-medium ${color}`}>{emoji} {label}</span>
            <span className="text-gray-500 text-xs">— connect Linear API</span>
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-4">
        Set <code className="text-purple-600">LINEAR_API_KEY</code> in env to activate
      </p>
    </div>
  )
}
