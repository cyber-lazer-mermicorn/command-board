/**
 * pricing.ts — PriceRecommendation domain contract.
 *
 * Produced exclusively by phantom-pricer (hidden agent).
 * Consumed exclusively by booking-agent.
 * The rationale array is INTERNAL ONLY — strip it before any external response.
 *
 * Rate invariant (enforced by phantom-pricer, documented here):
 *   minimumNightlyRate ≤ recommendedNightlyRate ≤ maximumNightlyRate
 *
 * All monetary values are NightlyRateUsdCents (integer cents).
 * All properties are readonly — recommendations are immutable value objects.
 */

import type { Confidence } from "./confidence";
import type { DateRange } from "./forecast";
import type {
  CurrencyCode,
  NightlyRateUsdCents,
  UsdCents,
} from "./currency";

// ---------------------------------------------------------------------------
// Supporting Types
// ---------------------------------------------------------------------------

/**
 * Disposition drives booking-agent behaviour after receiving a recommendation.
 *
 *   automatic          — confidence ≥ 0.85, apply immediately.
 *   requires_human_review — confidence ∈ [0.60, 0.85), surface to owner dashboard.
 *   manual_override    — owner has explicitly set a custom rate; do not overwrite.
 *   blocked            — confidence < 0.60, do not apply; require owner action.
 */
export type PricingDisposition =
  | "automatic"
  | "requires_human_review"
  | "manual_override"
  | "blocked";

/**
 * The pricing strategy that drove this recommendation.
 * Useful for audit logs and owner-facing explanations.
 */
export type PricingStrategy =
  | "demand_based"     // oracle demand signal is primary driver
  | "competitor_based" // competitor rate snapshot is primary driver
  | "seasonal"         // historical seasonality curve is primary driver
  | "floor_enforced"   // minimum rate floor applied due to low confidence
  | "ceiling_enforced"; // maximum rate ceiling applied due to peak demand

// ---------------------------------------------------------------------------
// Primary Interface
// ---------------------------------------------------------------------------

/**
 * A fully-specified pricing recommendation for a rental period.
 *
 * Rate invariant:
 *   minimumNightlyRate ≤ recommendedNightlyRate ≤ maximumNightlyRate
 *
 * estimatedTotal = recommendedNightlyRate × number of nights in stayPeriod.
 * It is pre-calculated by phantom-pricer and stored for display convenience;
 * booking-agent must recalculate independently before committing a reservation.
 *
 * rationale is an ordered list of human-readable strings explaining the
 * recommendation. NEVER include this field in any response to guests or
 * external systems. Log it internally only.
 */
export interface PriceRecommendation {
  readonly id: string;                          // UUID
  readonly stayPeriod: DateRange;
  readonly currency: CurrencyCode;
  readonly recommendedNightlyRate: NightlyRateUsdCents;
  readonly minimumNightlyRate: NightlyRateUsdCents;
  readonly maximumNightlyRate: NightlyRateUsdCents;
  readonly estimatedTotal: UsdCents;             // recommendedRate × nights
  readonly confidence: Confidence;
  readonly disposition: PricingDisposition;
  readonly strategy: PricingStrategy;
  readonly generatedAt: string;                  // ISO 8601 timestamp
  readonly modelVersion: string;                 // semver
  readonly sourceForecastId: string;             // FK → DemandForecast.id
  readonly rationale: readonly string[];          // INTERNAL ONLY — never expose
}

// ---------------------------------------------------------------------------
// Invariant Validator
// ---------------------------------------------------------------------------

/**
 * Validates the rate ordering invariant at runtime.
 * Call this in phantom-pricer immediately before returning a recommendation.
 * Throws DomainValidationError if the invariant is violated.
 */
import { DomainValidationError } from "./brand";

export function assertRateInvariant(rec: PriceRecommendation): void {
  const min = Number(rec.minimumNightlyRate);
  const rec_ = Number(rec.recommendedNightlyRate);
  const max = Number(rec.maximumNightlyRate);

  if (min > rec_) {
    throw new DomainValidationError(
      "minimumNightlyRate",
      `must be ≤ recommendedNightlyRate (${min} > ${rec_})`,
    );
  }
  if (rec_ > max) {
    throw new DomainValidationError(
      "recommendedNightlyRate",
      `must be ≤ maximumNightlyRate (${rec_} > ${max})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Type Guard
// ---------------------------------------------------------------------------

export function isPriceRecommendation(
  value: unknown,
): value is PriceRecommendation {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r["id"] === "string" &&
    typeof r["currency"] === "string" &&
    typeof r["recommendedNightlyRate"] === "number" &&
    typeof r["minimumNightlyRate"] === "number" &&
    typeof r["maximumNightlyRate"] === "number" &&
    typeof r["estimatedTotal"] === "number" &&
    typeof r["confidence"] === "number" &&
    typeof r["disposition"] === "string" &&
    typeof r["sourceForecastId"] === "string"
  );
}
