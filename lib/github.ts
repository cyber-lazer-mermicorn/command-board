import { Octokit } from '@octokit/rest'

const OWNER = 'cyber-lazer-mermicorn'

export function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not set')
  return new Octokit({ auth: token })
}

export async function getWorkflowRuns(repo: string, limit = 10) {
  const octokit = getOctokit()
  const { data } = await octokit.actions.listWorkflowRunsForRepo({
    owner: OWNER,
    repo,
    per_page: limit,
  })
  return data.workflow_runs
}

export async function getRepoDetails(repo: string) {
  const octokit = getOctokit()
  const { data } = await octokit.repos.get({ owner: OWNER, repo })
  return data
}

export async function triggerWorkflow(repo: string, workflow_id: string, ref = 'main') {
  const octokit = getOctokit()
  await octokit.actions.createWorkflowDispatch({
    owner: OWNER,
    repo,
    workflow_id,
    ref,
  })
}
