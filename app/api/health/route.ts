import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'command-board',
    constellation: 'mermicorn-grove',
    timestamp: new Date().toISOString(),
    integrations: {
      github: !!process.env.GITHUB_TOKEN,
      linear: !!process.env.LINEAR_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      neon: !!process.env.NEON_DATABASE_URL,
      stytch: !!process.env.STYTCH_PROJECT_ID,
      huggingface: !!process.env.HUGGINGFACE_API_TOKEN,
      context7: !!process.env.CONTEXT7_API_KEY,
      postman: !!process.env.POSTMAN_API_KEY,
    },
  })
}
