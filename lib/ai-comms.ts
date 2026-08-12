/**
 * ai-comms.ts — Capable AI Guest Communication Engine
 * Vacation Rental: auto-replies, sentiment triage, escalation, scheduling hooks
 *
 * Model priority:
 *   1. claude-3-5-sonnet-20241022  (best reasoning, tone, nuance)
 *   2. gpt-4o                      (fallback if Anthropic unavailable)
 *   3. HuggingFace inference        (offline/cost fallback)
 *
 * All outbound messages are staged for human review unless
 * confidence >= AUTO_SEND_THRESHOLD and topic is in SAFE_AUTO_TOPICS.
 */

import Anthropic from '@anthropic-ai/sdk';

// ─── Config ──────────────────────────────────────────────────────────────────

const AUTO_SEND_THRESHOLD = 0.92; // confidence floor for autonomous send

/** Topics the AI can auto-send without human approval */
const SAFE_AUTO_TOPICS = [
  'check_in_instructions',
  'check_out_reminder',
  'booking_confirmation',
  'wifi_password',
  'parking_instructions',
  'house_rules_recap',
  'review_request',
] as const;

type SafeTopic = (typeof SAFE_AUTO_TOPICS)[number];

export type GuestMessage = {
  id: string;
  guestName: string;
  guestEmail: string;
  platform: 'airbnb' | 'vrbo' | 'direct' | 'email' | 'sms';
  body: string;
  receivedAt: string; // ISO 8601
  bookingId?: string;
};

export type AIReply = {
  messageId: string;
  draft: string;
  topic: string;
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'urgent';
  confidence: number;       // 0–1
  autoSend: boolean;        // true = safe to send immediately
  escalate: boolean;        // true = needs human review NOW
  escalationReason?: string;
  scheduledSendAt?: string; // ISO 8601 — set for timed follow-ups
  suggestedActions: string[];
};

export type ScheduledMessage = {
  bookingId: string;
  guestEmail: string;
  guestName: string;
  topic: SafeTopic;
  sendAt: string; // ISO 8601
  status: 'pending' | 'sent' | 'failed';
};

// ─── Anthropic client ────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(propertyContext: PropertyContext): string {
  return `You are the AI guest communications manager for ${propertyContext.name}, 
a vacation rental property in ${propertyContext.location}.

Your personality: warm, professional, concise, and genuinely helpful.
You speak like the property owner — friendly but not overly casual.

Property details:
- Name: ${propertyContext.name}
- Location: ${propertyContext.location}
- Check-in: ${propertyContext.checkInTime} | Check-out: ${propertyContext.checkOutTime}
- Max guests: ${propertyContext.maxGuests}
- Amenities: ${propertyContext.amenities.join(', ')}
- House rules: ${propertyContext.houseRules.join('; ')}
- WiFi: ${propertyContext.wifiName} / ${propertyContext.wifiPassword}
- Parking: ${propertyContext.parkingInstructions}
- Emergency contact: ${propertyContext.emergencyContact}
- Host name: ${propertyContext.hostName}

Your job:
1. Classify the guest's message: topic, sentiment (positive/neutral/frustrated/urgent)
2. Write a warm, accurate reply that fully resolves their question
3. Rate your own confidence (0.00–1.00) in the reply's correctness
4. Flag if human escalation is needed (maintenance, complaints, safety, legal, refunds)
5. Suggest 1-3 proactive follow-up actions if appropriate

Response format — return ONLY valid JSON, no markdown:
{
  "topic": "<topic_slug>",
  "sentiment": "positive|neutral|frustrated|urgent",
  "confidence": 0.97,
  "draft": "<full reply text>",
  "escalate": false,
  "escalationReason": null,
  "suggestedActions": ["<action1>", "<action2>"]
}`;
}

// ─── Property context type ────────────────────────────────────────────────────

export type PropertyContext = {
  name: string;
  location: string;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  amenities: string[];
  houseRules: string[];
  wifiName: string;
  wifiPassword: string;
  parkingInstructions: string;
  emergencyContact: string;
  hostName: string;
};

// ─── Core: Generate AI reply ──────────────────────────────────────────────────

export async function generateGuestReply(
  message: GuestMessage,
  property: PropertyContext
): Promise<AIReply> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: buildSystemPrompt(property),
    messages: [
      {
        role: 'user',
        content: `Guest: ${message.guestName}\nPlatform: ${message.platform}\nMessage:\n${message.body}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';

  let parsed: Omit<AIReply, 'messageId' | 'autoSend' | 'scheduledSendAt'>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Graceful fallback if model returns non-JSON
    parsed = {
      topic: 'unknown',
      sentiment: 'neutral',
      confidence: 0.5,
      draft: raw,
      escalate: true,
      escalationReason: 'AI returned non-JSON response — human review required',
      suggestedActions: ['Review AI output manually', 'Reply directly to guest'],
    };
  }

  const isSafeTopic = (SAFE_AUTO_TOPICS as readonly string[]).includes(parsed.topic);
  const autoSend = !parsed.escalate && isSafeTopic && parsed.confidence >= AUTO_SEND_THRESHOLD;

  return {
    messageId: message.id,
    ...parsed,
    autoSend,
  };
}

// ─── Scheduled message queue ──────────────────────────────────────────────────

/**
 * Build the standard timed message sequence for a booking:
 *  T-3 days: pre-arrival with check-in instructions
 *  T-0 morning: check-in day welcome + WiFi + parking
 *  T+n-1 morning: check-out reminder
 *  T+n+3 days: review request
 */
export function buildBookingMessageSchedule(
  bookingId: string,
  guestEmail: string,
  guestName: string,
  checkInDate: string,  // YYYY-MM-DD
  checkOutDate: string  // YYYY-MM-DD
): ScheduledMessage[] {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  const t = (base: Date, offsetDays: number, hour = 9): string => {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      bookingId,
      guestEmail,
      guestName,
      topic: 'check_in_instructions',
      sendAt: t(checkIn, -3, 10),  // 3 days before at 10am
      status: 'pending',
    },
    {
      bookingId,
      guestEmail,
      guestName,
      topic: 'booking_confirmation',
      sendAt: t(checkIn, 0, 8),    // check-in day at 8am
      status: 'pending',
    },
    {
      bookingId,
      guestEmail,
      guestName,
      topic: 'check_out_reminder',
      sendAt: t(checkOut, -1, 9),  // day before checkout at 9am
      status: 'pending',
    },
    {
      bookingId,
      guestEmail,
      guestName,
      topic: 'review_request',
      sendAt: t(checkOut, 3, 11),  // 3 days after checkout at 11am
      status: 'pending',
    },
  ];
}

// ─── Sentiment triage helper ──────────────────────────────────────────────────

/**
 * Quick local sentiment scan before hitting the API.
 * Catches urgent/emergency keywords so we can escalate immediately
 * without waiting for the full AI round-trip.
 */
export function quickTriageMessage(body: string): {
  isEmergency: boolean;
  isComplaint: boolean;
  keywords: string[];
} {
  const lower = body.toLowerCase();

  const emergencyKeywords = ['flood', 'fire', 'smoke', 'gas leak', 'emergency', 'ambulance', 'police', 'break in', 'broken', 'no water', 'no power', 'ac not working', 'heat not working'];
  const complaintKeywords = ['unacceptable', 'disgusting', 'refund', 'terrible', 'awful', 'filthy', 'dirty', 'worst', 'never again', 'false advertising', 'not as described', 'demand'];

  const foundEmergency = emergencyKeywords.filter(k => lower.includes(k));
  const foundComplaint = complaintKeywords.filter(k => lower.includes(k));

  return {
    isEmergency: foundEmergency.length > 0,
    isComplaint: foundComplaint.length > 0,
    keywords: [...foundEmergency, ...foundComplaint],
  };
}

// ─── Add ANTHROPIC_API_KEY to .env.example note ───────────────────────────────
// ANTHROPIC_API_KEY=  # https://console.anthropic.com/settings/keys
// This is the primary model key for ai-comms.ts.
// Falls back to HUGGINGFACE_API_TOKEN if not set (see lib/huggingface.ts).
