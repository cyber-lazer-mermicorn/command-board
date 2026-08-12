// CI / Deployments Panel
// Shows GitHub Actions status + Vercel deployment feed

export default function CIPanel() {
  return (
    <div className="panel-blue">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-blue-400 font-bold text-lg">🚀 CI / Deployments</h2>
        <span className="text-gray-500 text-xs">GitHub + Vercel</span>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">GitHub Actions</p>
          <p className="text-gray-500 text-xs">Connect <code className="text-blue-600">GITHUB_TOKEN</code> to stream workflow runs</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Vercel Deployments</p>
          <p className="text-gray-500 text-xs">Register webhook to stream deploy status</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Postman Collections</p>
          <p className="text-gray-500 text-xs">Set <code className="text-blue-600">POSTMAN_API_KEY</code> to run API test suite</p>
        </div>
      </div>
    </div>
  )
}
