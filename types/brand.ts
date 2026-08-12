/**
 * brand.ts — Core nominal typing infrastructure.
 *
 * Every domain primitive in this codebase is a Brand<T, Name>.
 * The compiler treats NightlyRateUsdCents and UsdCents as distinct types
 * even though both are numbers at runtime. No accidental substitution.
 *
 * DomainValidationError is the single exception class for boundary failures.
 * It is thrown by constructor functions — never silently swallowed.
 */

declare const __brand: unique symbol;

/**
 * Brands a primitive type T with a compile-time Name tag.
 * The tag is erased at runtime — zero cost, full safety.
 */
export type Brand<T, Name extends string> = T & {
  readonly [__brand]: Name;
};

/**
 * Thrown when a domain primitive constructor receives an invalid value.
 * Always includes the field name and a human-readable reason.
 */
export class DomainValidationError extends Error {
  public override readonly name = "DomainValidationError" as const;

  public constructor(
    public readonly field: string,
    public readonly reason: string,
    public readonly receivedValue?: unknown,
  ) {
    super(
      `Invalid ${field}: ${reason}${
        receivedValue !== undefined ? ` (received: ${String(receivedValue)})` : ""
      }`,
    );

    // Maintains proper prototype chain across transpilation targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Type guard — narrows unknown errors to DomainValidationError.
 */
export function isDomainValidationError(
  err: unknown,
): err is DomainValidationError {
  return err instanceof DomainValidationError;
}

/**
 * Wraps a brand constructor in a safe Result shape instead of throwing.
 * Use at API boundaries when you want to handle errors without try/catch.
 *
 * @example
 *   const result = trySafe(() => usdCents(rawInput));
 *   if (!result.ok) console.error(result.error.message);
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: DomainValidationError };

export function trySafe<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    if (isDomainValidationError(err)) return { ok: false, error: err };
    throw err; // Non-domain errors bubble — never silently eat them.
  }
}
