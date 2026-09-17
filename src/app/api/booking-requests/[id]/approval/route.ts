import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { approveOffer, rejectOffer } from '@/lib/booking/workflow';

const schema = z.object({
  approval_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return NextResponse.redirect(new URL(`/dashboard/requests/${id}?error=invalid_approval`, request.url));

  try {
    if (parsed.data.decision === 'approved') {
      await approveOffer(id, parsed.data.approval_id, user.id, parsed.data.comment);
    } else {
      await rejectOffer(id, parsed.data.approval_id, user.id, parsed.data.comment);
    }
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/requests/${id}?error=approval_conflict`, request.url));
  }

  return NextResponse.redirect(new URL(`/dashboard/requests/${id}`, request.url));
}
