/**
 * Vercel Client
 *
 * Typed wrapper around the Vercel REST API v9.
 * All calls are server-side only — never import in browser code.
 *
 * Env vars required:
 *   VERCEL_TOKEN       — personal or team access token
 *   VERCEL_TEAM_ID     — (optional) scope requests to a team
 */

import { env } from "@/lib/env";

const BASE_URL = "https://api.vercel.com";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state:
    | "BUILDING"
    | "ERROR"
    | "INITIALIZING"
    | "QUEUED"
    | "READY"
    | "CANCELED";
  createdAt: number;
  readyAt: number | null;
  meta: Record<string, string>;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
  latestDeployments: VercelDeployment[];
}

export class VercelApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

// ─── Internal fetch ──────────────────────────────────────────────────────────

async function vercelFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : "";
  const url = `${BASE_URL}${path}${teamQuery}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.VERCEL_TOKEN}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new VercelApiError(
      res.status,
      body?.error?.code ?? "unknown_error",
      body?.error?.message ?? `Vercel API error ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const vercel = {
  /**
   * List recent deployments across the team or account.
   */
  async listDeployments(limit = 20): Promise<VercelDeployment[]> {
    const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?limit=${limit}`
    );
    return data.deployments;
  },

  /**
   * Get a single deployment by id or url.
   */
  async getDeployment(idOrUrl: string): Promise<VercelDeployment> {
    return vercelFetch<VercelDeployment>(`/v13/deployments/${idOrUrl}`);
  },

  /**
   * List all projects for the team or account.
   */
  async listProjects(limit = 50): Promise<VercelProject[]> {
    const data = await vercelFetch<{ projects: VercelProject[] }>(
      `/v9/projects?limit=${limit}`
    );
    return data.projects;
  },

  /**
   * Get a single project by id or name.
   */
  async getProject(idOrName: string): Promise<VercelProject> {
    return vercelFetch<VercelProject>(`/v9/projects/${idOrName}`);
  },
} as const;
