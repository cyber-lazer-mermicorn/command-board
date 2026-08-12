/**
 * POST /api/booking-schedule
 * Generates the standard 4-message timed communication schedule
 * for a new booking and stores it in Supabase.
 *
 * Body: { bookingId, guestEmail, guestName, checkInDate, checkOutDate }
 * Returns: { schedule: ScheduledMessage[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildBookingMessageSchedule } from '@/lib/ai-comms';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, guestEmail, guestName, checkInDate, checkOutDate } = await req.json();

    const schedule = buildBookingMessageSchedule(
      bookingId,
      guestEmail,
      guestName,
      checkInDate,
      checkOutDate
    );

    // Persist schedule to Supabase for the cron job to process
    const { error } = await supabase
      .from('scheduled_messages')
      .insert(schedule);

    if (error) throw new Error(error.message);

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
