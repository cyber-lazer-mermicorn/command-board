import type { Json } from '@/types/supabase';

/** Returns true only for values safely representable in a Supabase json/jsonb column. */
export function isJson(value: unknown): value is Json {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return Number.isFinite(value) || typeof value !== 'number';
  }
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJson);
  }
  return false;
}

/** Uses the supplied JSON fallback for omitted values and rejects unsupported payload values. */
export function jsonOrFallback(value: unknown, fallback: Json): Json {
  const candidate = value ?? fallback;
  if (!isJson(candidate)) {
    throw new TypeError('Expected a JSON-serializable value');
  }
  return candidate;
}
