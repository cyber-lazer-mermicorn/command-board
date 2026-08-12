/**
 * Sentry Client
 *
 * Server-side error capture helpers. Wraps @sentry/nextjs internals
 * so the rest of the codebase never imports Sentry directly — all
 * instrumentation flows through this module.
 *
 * Env vars required:
 *   SENTRY_DSN
 *   SENTRY_AUTH_TOKEN   — for source map uploads in CI (not runtime)
 *   NEXT_PUBLIC_SENTRY_DSN  — surfaced to the browser SDK
 */

import * as SentryLib from "@sentry/nextjs";
import { env } from "@/lib/env";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SentryExtras = Record<string, unknown>;

export interface SentryContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extras?: SentryExtras;
}

// ─── Capture helpers ─────────────────────────────────────────────────────────

/**
 * Capture an exception with optional context.
 * Always call this instead of Sentry.captureException directly.
 */
export function captureException(
  error: unknown,
  context?: SentryContext
): string {
  return SentryLib.withScope((scope) => {
    if (context?.user) scope.setUser(context.user);
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extras) {
      for (const [key, value] of Object.entries(context.extras)) {
        scope.setExtra(key, value);
      }
    }
    scope.setTag("app", "command-board");
    scope.setTag("runtime", "server");
    return SentryLib.captureException(error);
  });
}

/**
 * Capture a message at a given level.
 */
export function captureMessage(
  message: string,
  level: SentryLib.SeverityLevel = "info",
  context?: SentryContext
): string {
  return SentryLib.withScope((scope) => {
    if (context?.user) scope.setUser(context.user);
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    scope.setTag("app", "command-board");
    return SentryLib.captureMessage(message, level);
  });
}

/**
 * Add a breadcrumb — use before notable operations so the trail is
 * meaningful if an exception fires afterwards.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: SentryLib.SeverityLevel = "info"
): void {
  SentryLib.addBreadcrumb({ category, message, data, level });
}

/**
 * Wrap an async server function with automatic exception capture.
 * Rethrows after capturing so the caller's error handling still runs.
 */
export async function withSentryCapture<T>(
  fn: () => Promise<T>,
  context?: SentryContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureException(error, context);
    throw error;
  }
}

/**
 * Flush the Sentry event queue before a serverless function terminates.
 * Call at the end of long-running API routes or background jobs.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  await SentryLib.flush(timeoutMs);
}

/**
 * Minimal health check — verifies DSN is configured and SDK initialised.
 */
export function sentryHealthy(): boolean {
  return Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN);
}
