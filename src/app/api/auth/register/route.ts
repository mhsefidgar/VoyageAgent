import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Registration is intentionally routed to the normal user dashboard in this
  // local/demo foundation. Supabase Auth should replace this handler for production.
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
