import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const supabase = await createClient();

  if (!name || !email || password.length < 8) {
    return NextResponse.redirect(new URL('/register?error=registration_failed', request.url));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    return NextResponse.redirect(new URL('/register?error=registration_failed', request.url));
  }

  const destination = data.session ? '/dashboard' : '/login?registered=1';
  return NextResponse.redirect(new URL(destination, request.url));
}
