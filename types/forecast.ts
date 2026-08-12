/**
 * forecast.ts — DemandForecast domain contract.
 *
 * Produced exclusively by oracle (hidden agent).
 * Consumed exclusively by phantom-pricer (hidden agent).
 * Never surfaced to guest-facing UI or external API responses.
 *
 * All properties are readonly — a forecast is immutable after creation.
 * Callers that need a modified forecast must construct a new one.
 */

import type { Confidence, DemandScore } from "./confidence";

// ---------------------------------------------------------------------------
// Supporting Types
// ---------------------------------------------------------------------------

/**
 * An inclusive date range expressed as ISO 8601 date strings (YYYY-MM-DD).
 * Time-of-day is intentionally absent — all periods are calendar-day granular.
 */
export interface DateRange {
  readonly startsAt: string; // ISO 8601: YYYY-MM-DD
  readonly endsAt: string;   // ISO 8601: YYYY-MM-DD, inclusive
}

/**
 * The supported demand signal sources oracle can ingest.
 * Extend this union when adding a new data source — never use raw strings.
 */
export type DemandSignalKind =
  | "booking_history"    // Past reservation density in this period
  | "competitor_rates"   // Sanitized competitor pricing snapshot
  | "local_event"        // Known local events (concerts, conferences, etc.)
  | "weather"            // Seasonal / forecast weather quality
  | "seasonality";       // Baseline seasonal curve from historical data

/**
 * A single observable signal contributing to the demand forecast.
 * weight is a relative contribution factor (all weights sum to 1.0 per forecast).
 * value is the raw signal reading before weighting (always in [0, 1]).
 */
export interface DemandSignal {
  readonly kind: DemandSignalKind;
  readonly label: string;         // Human-readable description for debugging
  readonly observedAt: string;    // ISO 8601 timestamp
  readonly weight: number;        // Relative contribution: 0.0..1.0
  readonly value: number;         // Raw signal value: 0.0..1.0
}

// ---------------------------------------------------------------------------
// Primary Interface
// ---------------------------------------------------------------------------

/**
 * The complete demand forecast for a given rental period.
 *
 * - demandScore: composite [0,1] score across all ingested signals.
 * - confidence: model certainty in the composite score.
 * - signals: full audit trail of contributing observations.
 * - modelVersion: semver of the oracle model that generated this forecast.
 *
 * The combination of generatedAt + modelVersion is the forecast's identity
 * for deduplication and audit purposes.
 */
export interface DemandForecast {
  readonly id: string;              // UUID — stable identifier for this forecast
  readonly period: DateRange;
  readonly demandScore: DemandScore;
  readonly confidence: Confidence;
  readonly generatedAt: string;     // ISO 8601 timestamp
  readonly modelVersion: string;    // semver: "1.0.0"
  readonly signals: readonly DemandSignal[];
  readonly isStale: boolean;        // true when age > oracle refresh cadence (6h)
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Runtime type guard — validates that an unknown value is a DemandForecast.
 * Use at ingestion boundaries (e.g., reading from Supabase JSON column).
 */
export function isDemandForecast(value: unknown): value is DemandForecast {
  if (typeof value !== "object" || value === null) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f["id"] === "string" &&
    typeof f["generatedAt"] === "string" &&
    typeof f["modelVersion"] === "string" &&
    typeof f["isStale"] === "boolean" &&
    typeof f["demandScore"] === "number" &&
    typeof f["confidence"] === "number" &&
    Array.isArray(f["signals"])
  );
}
