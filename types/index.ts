// Mermicorn Command Board — shared TypeScript types

export type RepoStatus = 'active' | 'foundation' | 'planned' | 'archived'
export type RepoVisibility = 'public' | 'private'
export type RepoLane =
  | 'identity-governance'
  | 'ai-operating-core'
  | 'commerce'
  | 'gaming'
  | 'career'

export interface ConstellationRepo {
  id: string
  display_name: string
  lane: RepoLane
  visibility: RepoVisibility
  status: RepoStatus
  github_url: string
  is_valid: boolean | null
  last_checked: string | null
}

export interface GitHubEvent {
  id: string
  repo: string
  event_type: string
  payload: Record<string, unknown>
  received_at: string
}

export interface AICall {
  id: string
  provider: string
  model: string
  prompt_tokens: number
  response_tokens: number
  latency_ms: number | null
  success: boolean
  called_at: string
}

export interface IntegrationStatus {
  github: boolean
  linear: boolean
  supabase: boolean
  neon: boolean
  stytch: boolean
  huggingface: boolean
  context7: boolean
  postman: boolean
}
