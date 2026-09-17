import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.redirect(new URL('/register?error=registration_failed', request.url));
  }

  const destination = data.session ? '/dashboard' : '/login?registered=1';
  return NextResponse.redirect(new URL(destination, request.url));
}
