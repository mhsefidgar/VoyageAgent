import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  // Temporary local/demo admin gate. Production authentication must use Supabase Auth
  // and the admin credentials must be stored as server-side secrets, not in source.
  if (email === 'adminname' && password === 'adminpassword') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
