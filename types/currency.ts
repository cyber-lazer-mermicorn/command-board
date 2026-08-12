/**
 * currency.ts — Branded monetary primitives.
 *
 * All monetary values in the pricing pipeline are expressed as integer cents
 * (UsdCents, NightlyRateUsdCents). Floating-point dollars are NEVER stored
 * internally. Formatting to display strings is done at the presentation layer
 * exclusively via formatUsd().
 *
 * Why cents?
 *   - Eliminates IEEE 754 rounding: 0.1 + 0.2 === 0.30000000000000004 in JS.
 *   - Safe integer arithmetic up to Number.MAX_SAFE_INTEGER (≈$90 trillion).
 *   - Direct compatibility with Stripe, Supabase money columns, and VRBO APIs.
 */

import { Brand, DomainValidationError } from "./brand";

// ---------------------------------------------------------------------------
// Type Declarations
// ---------------------------------------------------------------------------

/** ISO 4217 currency codes supported by the pricing pipeline. */
export type CurrencyCode = "USD";

/**
 * A non-negative integer representing a US dollar amount in cents.
 * Used for totals, payouts, and fee calculations.
 * @example usdCents(1500) === $15.00
 */
export type UsdCents = Brand<number, "UsdCents">;

/**
 * A positive integer representing a per-night listing rate in US cents.
 * Distinct from UsdCents — cannot be used interchangeably at compile time.
 * @example nightlyRateUsdCents(25000) === $250.00/night
 */
export type NightlyRateUsdCents = Brand<number, "NightlyRateUsdCents">;

// ---------------------------------------------------------------------------
// Internal Guards
// ---------------------------------------------------------------------------

function assertSafeNonNegativeInteger(
  value: number,
  field: string,
): asserts value is number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DomainValidationError(
      field,
      "must be a non-negative safe integer expressed in cents",
      value,
    );
  }
}

// ---------------------------------------------------------------------------
// Constructor Functions
// ---------------------------------------------------------------------------

/**
 * Creates a validated UsdCents value.
 * Throws DomainValidationError if value is not a non-negative safe integer.
 */
export function usdCents(value: number): UsdCents {
  assertSafeNonNegativeInteger(value, "UsdCents");
  return value as UsdCents;
}

/**
 * Creates a validated NightlyRateUsdCents value.
 * Throws DomainValidationError if value is not a positive safe integer.
 * A nightly rate of zero is rejected — it indicates a data error, not a
 * valid free listing (use a separate flag for complimentary stays).
 */
export function nightlyRateUsdCents(value: number): NightlyRateUsdCents {
  assertSafeNonNegativeInteger(value, "NightlyRateUsdCents");
  if (value === 0) {
    throw new DomainValidationError(
      "NightlyRateUsdCents",
      "must be greater than zero — use a complimentary-stay flag for $0 rates",
      value,
    );
  }
  return value as NightlyRateUsdCents;
}

// ---------------------------------------------------------------------------
// Arithmetic Helpers
// ---------------------------------------------------------------------------

/**
 * Multiplies a nightly rate by a night count, returning a UsdCents total.
 * Validates that nights is a positive safe integer.
 */
export function totalForNights(
  rate: NightlyRateUsdCents,
  nights: number,
): UsdCents {
  if (!Number.isSafeInteger(nights) || nights <= 0) {
    throw new DomainValidationError(
      "nights",
      "must be a positive safe integer",
      nights,
    );
  }
  return usdCents(Number(rate) * nights);
}

/**
 * Adds a service fee (as basis points, 1bp = 0.01%) to a subtotal.
 * @param subtotal - The pre-fee amount in UsdCents.
 * @param basisPoints - Fee as integer basis points (e.g., 300 = 3%).
 */
export function applyFee(subtotal: UsdCents, basisPoints: number): UsdCents {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new DomainValidationError(
      "basisPoints",
      "must be a non-negative safe integer",
      basisPoints,
    );
  }
  return usdCents(Math.round(Number(subtotal) * (1 + basisPoints / 10_000)));
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

/**
 * Formats a branded cent value as a localized USD string.
 * This is the ONLY place in the codebase that converts cents to display dollars.
 * Never divide by 100 outside this function.
 */
export function formatUsd(
  cents: UsdCents | NightlyRateUsdCents,
  opts?: { showCents?: boolean },
): string {
  const fractionDigits = opts?.showCents === false ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(cents) / 100);
}

/**
 * Converts a raw dollar float from an external API into validated UsdCents.
 * Rounds to the nearest cent — use exclusively at ingestion boundaries.
 */
export function dollarsToCents(dollars: number): UsdCents {
  if (!Number.isFinite(dollars) || dollars < 0) {
    throw new DomainValidationError(
      "dollars",
      "must be a non-negative finite number",
      dollars,
    );
  }
  return usdCents(Math.round(dollars * 100));
}
