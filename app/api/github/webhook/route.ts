import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// GitHub webhook receiver
// Register at: https://github.com/cyber-lazer-mermicorn/mermicorn-grove/settings/hooks
// Payload URL: https://your-domain.vercel.app/api/github/webhook
// Content type: application/json
// Secret: GITHUB_WEBHOOK_SECRET

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSig = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })

  const payload = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  if (!verifySignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = req.headers.get('x-github-event')
  const body = JSON.parse(payload)

  // TODO: write event to Supabase for dashboard feed
  console.log(`GitHub webhook: ${event}`, body.repository?.name)

  return NextResponse.json({ received: true, event })
}
