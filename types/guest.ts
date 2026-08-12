/**
 * guest.ts — GuestIntent domain contract.
 *
 * Produced exclusively by archivist (hidden agent).
 * Consumed exclusively by comms-agent.
 * archivist MUST return a valid GuestIntent before comms-agent sends any reply.
 *
 * All properties are readonly — intent objects are immutable after classification.
 */

import { Brand, DomainValidationError } from "./brand";

// ---------------------------------------------------------------------------
// Branded Sentiment
// ---------------------------------------------------------------------------

/**
 * Sentiment score: finite float in [-1, 1].
 * -1 = maximally negative. 0 = neutral. 1 = maximally positive.
 */
export type SentimentScore = Brand<number, "SentimentScore">;

export function sentimentScore(value: number): SentimentScore {
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    throw new DomainValidationError(
      "SentimentScore",
      "must be a finite number between -1 and 1 inclusive",
      value,
    );
  }
  return value as SentimentScore;
}

// ---------------------------------------------------------------------------
// Supporting Types
// ---------------------------------------------------------------------------

/**
 * The platform the raw guest message arrived from.
 * Extend when integrating a new channel — never use raw strings downstream.
 */
export type MessagePlatform =
  | "airbnb"
  | "vrbo"
  | "direct"
  | "sms"
  | "email";

/**
 * The primary intent archivist classifies from a guest message.
 * comms-agent routes replies based on this value.
 */
export type GuestIntentKind =
  | "inquiry"           // General availability or listing question
  | "booking_request"   // Explicit request to book
  | "complaint"         // Active dissatisfaction requiring resolution
  | "change_request"    // Modify an existing reservation
  | "check_in_info"     // Requesting arrival / access instructions
  | "review"            // Post-stay feedback
  | "other";            // Could not classify with sufficient confidence

/**
 * Urgency level — drives response time SLA in comms-agent.
 *
 *   critical → respond within 15 minutes (complaint during active stay)
 *   high     → respond within 1 hour
 *   medium   → respond within 4 hours
 *   low      → respond within 24 hours
 */
export type UrgencyLevel = "low" | "medium" | "high" | "critical";

// ---------------------------------------------------------------------------
// Primary Interface
// ---------------------------------------------------------------------------

/**
 * The normalized classification of a raw guest message.
 *
 * requiresHuman: true when archivist confidence < 0.7 OR intent is complaint/
 * change_request. comms-agent must not send an automated reply when this is true.
 *
 * summary: one-sentence internal description of the message — used as context
 * for comms-agent's LLM call. Never send this to the guest directly.
 */
export interface GuestIntent {
  readonly id: string;                       // UUID — stable identifier
  readonly rawMessageId: string;             // FK → inbound message record
  readonly platform: MessagePlatform;
  readonly primaryIntent: GuestIntentKind;
  readonly urgency: UrgencyLevel;
  readonly sentiment: SentimentScore;
  readonly extractedDates: {
    readonly startsAt: string | null;        // ISO 8601 date or null
    readonly endsAt: string | null;
  };
  readonly extractedGuestCount: number | null;
  readonly requiresHuman: boolean;
  readonly classificationConfidence: number; // raw float — archivist internal
  readonly summary: string;                  // INTERNAL ONLY — never send to guest
  readonly classifiedAt: string;             // ISO 8601 timestamp
  readonly modelVersion: string;             // semver of archivist model
}

// ---------------------------------------------------------------------------
// Type Guard
// ---------------------------------------------------------------------------

export function isGuestIntent(value: unknown): value is GuestIntent {
  if (typeof value !== "object" || value === null) return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g["id"] === "string" &&
    typeof g["rawMessageId"] === "string" &&
    typeof g["primaryIntent"] === "string" &&
    typeof g["urgency"] === "string" &&
    typeof g["requiresHuman"] === "boolean" &&
    typeof g["classifiedAt"] === "string"
  );
}
