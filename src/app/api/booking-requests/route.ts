import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  destination: z.string().trim().min(2).max(160),
  check_in: z.string().date(),
  check_out: z.string().date(),
  guests: z.coerce.number().int().min(1).max(20),
  rooms: z.coerce.number().int().min(1).max(10),
  budget: z.coerce.number().nonnegative().optional(),
  preferences: z.string().trim().max(2000).optional(),
}).refine((value) => value.check_out > value.check_in, {
  message: 'Check-out must be after check-in',
  path: ['check_out'],
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const form = Object.fromEntries(await request.formData());
  const parsed = requestSchema.safeParse(form);
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/dashboard/requests/new?error=invalid_request', request.url));
  }

  const { data, error } = await supabase.from('booking_requests').insert({
    user_id: user.id,
    destination: parsed.data.destination,
    check_in: parsed.data.check_in,
    check_out: parsed.data.check_out,
    guests: parsed.data.guests,
    rooms: parsed.data.rooms,
    budget: parsed.data.budget ?? null,
    preferences: { text: parsed.data.preferences ?? '' },
    status: 'draft',
  }).select('id').single();

  if (error || !data) {
    return NextResponse.redirect(new URL('/dashboard/requests/new?error=create_failed', request.url));
  }

  return NextResponse.redirect(new URL(`/dashboard/requests/${data.id}`, request.url));
}
