import { neon } from '@neondatabase/serverless'

export function getNeonSql() {
  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) throw new Error('NEON_DATABASE_URL is not set')
  return neon(databaseUrl)
}

// Example: fast edge query for session state
export async function getSessionState(userId: string) {
  const sql = getNeonSql()
  const rows = await sql`
    SELECT * FROM session_state
    WHERE user_id = ${userId}
    LIMIT 1
  `
  return rows[0] ?? null
}
