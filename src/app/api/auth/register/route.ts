import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Temporary local/demo registration. Replace with Supabase Auth in production.
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set('voyageagent_session', 'demo-authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
