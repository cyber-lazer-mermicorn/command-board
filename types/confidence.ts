/**
 * confidence.ts — Branded unit-interval primitives.
 *
 * Confidence and DemandScore are both floats in [0, 1] but represent
 * semantically distinct concepts:
 *
 *   Confidence  — how certain the model is about its own output.
 *   DemandScore — the normalized demand signal for a given period.
 *
 * The brand distinction prevents phantom-pricer from accidentally passing a
 * DemandScore where a Confidence is expected and vice versa.
 *
 * Thresholds are exported as constants so every agent that acts on them
 * imports from a single source of truth rather than hardcoding magic numbers.
 */

import { Brand, DomainValidationError } from "./brand";

// ---------------------------------------------------------------------------
// Type Declarations
// ---------------------------------------------------------------------------

/**
 * A model confidence score: finite float in [0, 1].
 * 0 = no confidence. 1 = maximum confidence.
 */
export type Confidence = Brand<number, "Confidence">;

/**
 * A normalized demand signal: finite float in [0, 1].
 * 0 = minimum demand. 1 = peak demand.
 */
export type DemandScore = Brand<number, "DemandScore">;

// ---------------------------------------------------------------------------
// Thresholds (single source of truth)
// ---------------------------------------------------------------------------

/**
 * Below this threshold, phantom-pricer flags the recommendation
 * for human review regardless of the derived rate.
 */
export const CONFIDENCE_HUMAN_REVIEW_THRESHOLD = 0.6 as const;

/**
 * Above this threshold, a rate can be applied automatically.
 */
export const CONFIDENCE_AUTO_APPLY_THRESHOLD = 0.85 as const;

/**
 * Below this demand score, apply the minimum nightly rate floor.
 */
export const DEMAND_FLOOR_THRESHOLD = 0.25 as const;

/**
 * Above this demand score, apply the maximum nightly rate ceiling.
 */
export const DEMAND_CEILING_THRESHOLD = 0.80 as const;

// ---------------------------------------------------------------------------
// Internal Guard
// ---------------------------------------------------------------------------

function assertUnitInterval(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new DomainValidationError(
      field,
      "must be a finite number between 0 and 1 inclusive",
      value,
    );
  }
}

// ---------------------------------------------------------------------------
// Constructor Functions
// ---------------------------------------------------------------------------

/**
 * Creates a validated Confidence value.
 * Throws DomainValidationError if value is outside [0, 1].
 */
export function confidence(value: number): Confidence {
  assertUnitInterval(value, "Confidence");
  return value as Confidence;
}

/**
 * Creates a validated DemandScore value.
 * Throws DomainValidationError if value is outside [0, 1].
 */
export function demandScore(value: number): DemandScore {
  assertUnitInterval(value, "DemandScore");
  return value as DemandScore;
}

// ---------------------------------------------------------------------------
// Classification Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the disposition driven by a confidence value.
 * Mirrors the logic in phantom-pricer without importing agent code.
 */
export function confidenceDisposition(
  c: Confidence,
): "auto" | "human_review" | "blocked" {
  if (Number(c) >= CONFIDENCE_AUTO_APPLY_THRESHOLD) return "auto";
  if (Number(c) >= CONFIDENCE_HUMAN_REVIEW_THRESHOLD) return "human_review";
  return "blocked";
}

/**
 * Returns the pricing band driven by a demand score.
 */
export function demandBand(
  d: DemandScore,
): "floor" | "mid" | "ceiling" {
  if (Number(d) >= DEMAND_CEILING_THRESHOLD) return "ceiling";
  if (Number(d) <= DEMAND_FLOOR_THRESHOLD) return "floor";
  return "mid";
}
