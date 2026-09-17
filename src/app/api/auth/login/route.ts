import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  // Temporary local/demo authentication. Replace with Supabase Auth in production.
  const destination = email === 'adminname' && password === 'adminpassword' ? '/admin' : '/dashboard';
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set('voyageagent_session', 'demo-authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
