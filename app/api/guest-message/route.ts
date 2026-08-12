/**
 * POST /api/guest-message
 * Receives an inbound guest message, runs quick triage,
 * then generates a full AI reply via Claude 3.5 Sonnet.
 *
 * Body: GuestMessage JSON
 * Returns: AIReply JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateGuestReply, quickTriageMessage } from '@/lib/ai-comms';
import { DEFAULT_PROPERTY } from '@/lib/vacation-rental-config';
import type { GuestMessage } from '@/lib/ai-comms';

export async function POST(req: NextRequest) {
  try {
    const message: GuestMessage = await req.json();

    // Fast local triage — flag emergencies before AI round-trip
    const triage = quickTriageMessage(message.body);
    if (triage.isEmergency) {
      return NextResponse.json(
        {
          messageId: message.id,
          escalate: true,
          escalationReason: `Emergency keywords detected: ${triage.keywords.join(', ')}`,
          autoSend: false,
          confidence: 0,
          draft: '',
          topic: 'emergency',
          sentiment: 'urgent',
          suggestedActions: [
            'Call guest immediately',
            `Contact emergency services if needed`,
            'Document incident in Supabase',
          ],
        },
        { status: 200 }
      );
    }

    // Full AI reply generation
    const reply = await generateGuestReply(message, DEFAULT_PROPERTY);
    return NextResponse.json(reply, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
