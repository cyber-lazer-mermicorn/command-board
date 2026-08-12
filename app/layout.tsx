import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mermicorn Command Board',
  description: 'Control plane for the Cyber Lazer Mermicorn constellation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-mono">
        {children}
      </body>
    </html>
  )
}
