/**
 * types/index.ts — Barrel export for all domain contracts.
 *
 * Import from here everywhere in the codebase:
 *   import type { DemandForecast, PriceRecommendation } from "@/types";
 *
 * Never import from individual type files directly in agent code —
 * this barrel is the stable public surface. Internal type file names
 * are an implementation detail and may be reorganized.
 *
 * Export groups:
 *   brand      — Brand<T>, DomainValidationError, trySafe, Result
 *   currency   — UsdCents, NightlyRateUsdCents, formatUsd, dollarsToCents…
 *   confidence — Confidence, DemandScore, thresholds, classification helpers
 *   forecast   — DemandForecast, DemandSignal, DateRange, isDemandForecast
 *   pricing    — PriceRecommendation, PricingDisposition, assertRateInvariant…
 *   guest      — GuestIntent, SentimentScore, GuestIntentKind, isGuestIntent
 */

export * from "./brand";
export * from "./confidence";
export * from "./currency";
export * from "./forecast";
export * from "./guest";
export * from "./pricing";
