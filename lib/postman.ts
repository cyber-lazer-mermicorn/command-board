// Postman API client
// https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a

const POSTMAN_BASE = 'https://api.getpostman.com'

export async function getCollections() {
  const apiKey = process.env.POSTMAN_API_KEY
  if (!apiKey) throw new Error('POSTMAN_API_KEY is not set')

  const res = await fetch(`${POSTMAN_BASE}/collections`, {
    headers: { 'X-Api-Key': apiKey },
  })
  if (!res.ok) throw new Error(`Postman API error: ${res.status}`)
  return res.json()
}

export async function runMonitor(monitorId: string) {
  const apiKey = process.env.POSTMAN_API_KEY
  if (!apiKey) throw new Error('POSTMAN_API_KEY is not set')

  const res = await fetch(`${POSTMAN_BASE}/monitors/${monitorId}/run`, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
  })
  if (!res.ok) throw new Error(`Postman monitor run error: ${res.status}`)
  return res.json()
}
