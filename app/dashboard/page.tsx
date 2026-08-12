import ConstellationPanel from '@/components/panels/ConstellationPanel'
import LinearPanel from '@/components/panels/LinearPanel'
import CIPanel from '@/components/panels/CIPanel'
import ObservabilityPanel from '@/components/panels/ObservabilityPanel'
import QuickActionsPanel from '@/components/panels/QuickActionsPanel'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-cyber-400">🧭 Command Board</h1>
        <p className="text-gray-500 text-sm mt-1">Mermicorn Constellation — Live Status</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ConstellationPanel />
        </div>
        <div>
          <LinearPanel />
        </div>
        <div>
          <CIPanel />
        </div>
        <div>
          <ObservabilityPanel />
        </div>
        <div>
          <QuickActionsPanel />
        </div>
      </div>
    </div>
  )
}
