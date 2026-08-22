import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildBookingMessageSchedule } from '@/lib/ai-comms';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stytch, StytchAuthError } from '@/lib/clients/stytch';

const bookingScheduleRequest = z.object({
  bookingId: z.string().uuid(),
  guestEmail: z.string().email(),
  guestName: z.string().trim().min(1).max(200),
  checkInDate: z.string().date(),
  checkOutDate: z.string().date(),
}).superRefine(({ checkInDate, checkOutDate }, context) => {
  if (checkOutDate <= checkInDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'checkOutDate must be after checkInDate',
      path: ['checkOutDate'],
    });
  }
});

function bearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization');
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice('Bearer '.length).trim();
  return token || null;
}

export async function POST(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
  }

  try {
    await stytch.authenticateSession(token);
  } catch (error) {
    if (error instanceof StytchAuthError) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  let input: z.infer<typeof bookingScheduleRequest>;
  try {
    input = bookingScheduleRequest.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid booking schedule request', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const schedule = buildBookingMessageSchedule(
      input.bookingId,
      input.guestEmail,
      input.guestName,
      input.checkInDate,
      input.checkOutDate
    );

    const { error } = await getSupabaseAdmin().from('scheduled_messages').insert(schedule);
    if (error) throw new Error(error.message);

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error('booking schedule creation failed', error);
    return NextResponse.json({ error: 'Unable to create booking schedule' }, { status: 500 });
  }
}
