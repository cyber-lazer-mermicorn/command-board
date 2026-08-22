/**
 * GitHub Client
 *
 * Octokit wrapper scoped to the cyber-lazer-mermicorn org.
 * Uses MERMICORN_PAT for full org-level read/write access.
 * Server-side only — never expose PAT in browser bundles.
 *
 * Env vars required:
 *   MERMICORN_PAT   — fine-grained PAT with full org access
 */

import { Octokit } from "@octokit/rest";
import { env } from "@/lib/env";

const ORG = "cyber-lazer-mermicorn";

// ─── Singleton Octokit instance ───────────────────────────────────────────────

export const octokit = new Octokit({
  auth: env.MERMICORN_PAT,
  userAgent: "command-board/1.0.0",
  timeZone: "UTC",
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error,
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  pushedAt: string | null;
  topics: string[];
}

export interface WorkflowRunSummary {
  id: number;
  name: string | null;
  status: string | null;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const github = {
  /**
   * List all repos in the mermicorn org.
   */
  async listOrgRepos(perPage = 100): Promise<RepoSummary[]> {
    const { data } = await octokit.repos.listForOrg({
      org: ORG,
      type: "all",
      sort: "pushed",
      direction: "desc",
      per_page: perPage,
    });
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      description: r.description ?? null,
      defaultBranch: r.default_branch ?? 'main',
      pushedAt: r.pushed_at ?? null,
      topics: r.topics ?? [],
    }));
  },

  /**
   * Get recent workflow runs for a repo.
   */
  async listWorkflowRuns(
    repo: string,
    perPage = 10
  ): Promise<WorkflowRunSummary[]> {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner: ORG,
      repo,
      per_page: perPage,
    });
    return data.workflow_runs.map((r) => ({
      id: r.id,
      name: r.name ?? null,
      status: r.status ?? null,
      conclusion: r.conclusion ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      htmlUrl: r.html_url,
    }));
  },

  /**
   * Dispatch a repository_dispatch event.
   * Used by command-board to trigger cross-repo workflows.
   */
  async dispatchEvent(
    repo: string,
    eventType: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    await octokit.repos.createDispatchEvent({
      owner: ORG,
      repo,
      event_type: eventType,
      client_payload: payload ?? {},
    });
  },

  /**
   * Get the latest commit SHA on a branch.
   */
  async getLatestSha(repo: string, branch = "main"): Promise<string> {
    const { data } = await octokit.repos.getBranch({
      owner: ORG,
      repo,
      branch,
    });
    return data.commit.sha;
  },
} as const;
