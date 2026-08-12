/**
 * Integration Client Barrel
 *
 * Single import surface for all external service clients.
 *
 * ALL clients are server-side only unless explicitly noted.
 * Never import this barrel in browser components — use the individual
 * client files and check their headers for browser safety notes.
 *
 * @example
 *   import { vercel, supabaseAdmin, stytch, github } from "@/lib/clients";
 */

export { vercel, VercelApiError } from "./vercel";
export type { VercelDeployment, VercelProject } from "./vercel";

export { supabaseAdmin, supabaseClient, assertSupabaseSuccess } from "./supabase";

export { stytch, StytchAuthError } from "./stytch";
export type { StytchUser, StytchSession, StytchSessionValidation } from "./stytch";

export {
  captureException,
  captureMessage,
  addBreadcrumb,
  withSentryCapture,
  flushSentry,
  sentryHealthy,
} from "./sentry";
export type { SentryContext, SentryExtras } from "./sentry";

export { huggingface, HFApiError } from "./huggingface";
export type {
  HFGenerationInput,
  HFGenerationOutput,
  HFEmbeddingOutput,
  HFClassificationOutput,
} from "./huggingface";

export { github, octokit } from "./github";
export type { RepoSummary, WorkflowRunSummary } from "./github";
