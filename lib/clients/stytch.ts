/**
 * Stytch Client
 *
 * Server-side session and M2M token validation.
 * Never import in browser code.
 *
 * Env vars required:
 *   STYTCH_PROJECT_ID
 *   STYTCH_SECRET
 *   STYTCH_PROJECT_ENV   — "live" | "test"  (defaults to "live")
 */

import { env } from "@/lib/env";

const BASE_URL =
  env.STYTCH_PROJECT_ENV === "test"
    ? "https://test.stytch.com/v1"
    : "https://api.stytch.com/v1";

const AUTH_HEADER = `Basic ${Buffer.from(
  `${env.STYTCH_PROJECT_ID}:${env.STYTCH_SECRET}`
).toString("base64")}`;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StytchUser {
  user_id: string;
  emails: Array<{ email_id: string; email: string; verified: boolean }>;
  created_at: string;
}

export interface StytchSession {
  session_id: string;
  user_id: string;
  started_at: string;
  last_accessed_at: string;
  expires_at: string;
  attributes: Record<string, unknown>;
}

export interface StytchSessionValidation {
  session: StytchSession;
  user: StytchUser;
}

export class StytchAuthError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorType: string,
    message: string
  ) {
    super(message);
    this.name = "StytchAuthError";
  }
}

// ─── Internal fetch ──────────────────────────────────────────────────────────

async function stytchFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_HEADER,
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new StytchAuthError(
      res.status,
      body?.error_type ?? "unknown_error",
      body?.error_message ?? `Stytch error ${res.status}`
    );
  }

  return body as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const stytch = {
  /**
   * Authenticate a session token.
   * Throws StytchAuthError if invalid or expired.
   */
  async authenticateSession(
    sessionToken: string,
    sessionDurationMinutes = 60
  ): Promise<StytchSessionValidation> {
    return stytchFetch<StytchSessionValidation>("/sessions/authenticate", {
      method: "POST",
      body: JSON.stringify({
        session_token: sessionToken,
        session_duration_minutes: sessionDurationMinutes,
      }),
    });
  },

  /**
   * Authenticate a session JWT.
   * Throws StytchAuthError if signature invalid or expired.
   */
  async authenticateJwt(
    sessionJwt: string,
    sessionDurationMinutes = 60
  ): Promise<StytchSessionValidation> {
    return stytchFetch<StytchSessionValidation>("/sessions/authenticate", {
      method: "POST",
      body: JSON.stringify({
        session_jwt: sessionJwt,
        session_duration_minutes: sessionDurationMinutes,
      }),
    });
  },

  /**
   * Revoke a session by token.
   */
  async revokeSession(sessionToken: string): Promise<void> {
    await stytchFetch<void>("/sessions/revoke", {
      method: "POST",
      body: JSON.stringify({ session_token: sessionToken }),
    });
  },

  /**
   * Get user by Stytch user_id.
   */
  async getUser(userId: string): Promise<StytchUser> {
    const data = await stytchFetch<{ user: StytchUser }>(`/users/${userId}`);
    return data.user;
  },
} as const;
