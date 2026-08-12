import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-cyber-400 mb-2">
            🧭 Mermicorn Command Board
          </h1>
          <p className="text-gray-400 text-lg">
            Control plane for the constellation
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-left">
          {[
            { href: '/dashboard', label: '🌿 Constellation Health', color: 'border-green-800 hover:border-green-500' },
            { href: '/dashboard/linear', label: '📋 Linear Status', color: 'border-purple-800 hover:border-purple-500' },
            { href: '/dashboard/ci', label: '🚀 CI / Deployments', color: 'border-blue-800 hover:border-blue-500' },
            { href: '/dashboard/observability', label: '🧠 AI Observability', color: 'border-cyan-800 hover:border-cyan-500' },
            { href: '/dashboard/actions', label: '⚡ Quick Actions', color: 'border-yellow-800 hover:border-yellow-500' },
          ].map(({ href, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`panel border-2 ${color} transition-all duration-200 hover:bg-slate-800 block`}
            >
              <span className="text-gray-200 font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <p className="text-gray-600 text-sm">
          Part of{' '}
          <a
            href="https://github.com/cyber-lazer-mermicorn/mermicorn-grove"
            className="text-grove-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Mermicorn Grove
          </a>
        </p>
      </div>
    </main>
  )
}
