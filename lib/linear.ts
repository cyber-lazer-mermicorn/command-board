import { LinearClient } from '@linear/sdk'

export function getLinearClient() {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) throw new Error('LINEAR_API_KEY is not set')
  return new LinearClient({ apiKey })
}

export async function getMyIssues(limit = 20) {
  const client = getLinearClient()
  const me = await client.viewer
  const issues = await me.assignedIssues({ first: limit })
  return issues.nodes
}

export async function createIssue(params: {
  title: string
  description?: string
  teamId: string
  priority?: number
}) {
  const client = getLinearClient()
  const issue = await client.createIssue(params)
  return issue
}
