import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: requests }, { count: savedCount }, { data: bookings }] = await Promise.all([
    supabase.from('booking_requests').select('id, destination, check_in, check_out, status, guests, rooms, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10),
    supabase.from('saved_hotels').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('bookings').select('id, status, provider_booking_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const active = (requests ?? []).filter((item) => !['confirmed', 'cancelled', 'rejected', 'failed'].includes(item.status)).length;
  const awaiting = (requests ?? []).filter((item) => item.status === 'awaiting_human_approval').length;
  const confirmed = (bookings ?? []).filter((item) => item.status === 'confirmed').length;

  return (
    <main className="page-shell">
      <div className="container">
        <nav className="dashboard-nav">
          <Link className="brand" href="/"><span className="brand-mark">✈</span> VoyageAgent</Link>
          <div className="actions"><Link className="pill" href="/">Home</Link><form action="/api/auth/logout" method="post"><button className="pill" type="submit">Sign out</button></form></div>
        </nav>

        <section className="dashboard-hero">
          <div><div className="eyebrow">Traveler workspace</div><h1>Your booking operations.</h1><p>Agents search and evaluate live hotel offers. You make the final booking decision.</p></div>
          <Link className="button" href="/dashboard/requests/new">＋ New hotel request</Link>
        </section>

        <section className="stats">
          <div className="card stat"><span className="muted">Active requests</span><div className="value">{active}</div></div>
          <div className="card stat"><span className="muted">Awaiting approval</span><div className="value">{awaiting}</div></div>
          <div className="card stat"><span className="muted">Confirmed bookings</span><div className="value">{confirmed}</div></div>
          <div className="card stat"><span className="muted">Saved hotels</span><div className="value">{savedCount ?? 0}</div></div>
        </section>

        <div className="section-title"><h2>Booking requests</h2><span>Persistent workflow state</span></div>
        <section className="offer-list">
          {(requests ?? []).map((request) => <Link className="card trip-card" href={`/dashboard/requests/${request.id}`} key={request.id}>
            <div><div className="eyebrow">{request.status.replaceAll('_', ' ')}</div><h3>{request.destination}</h3><p>{request.check_in} → {request.check_out} · {request.guests} guests · {request.rooms} room{request.rooms === 1 ? '' : 's'}</p></div>
            <span className="text-link">Open workflow →</span>
          </Link>)}
          {!requests?.length && <div className="card empty-state"><h3>No booking requests yet</h3><p>Start with a destination, dates, guests, and the preferences that matter to you.</p><Link className="button" href="/dashboard/requests/new">Create first request</Link></div>}
        </section>

        <section className="card planner-banner"><div><div className="eyebrow">Human-in-the-loop booking</div><h2>No reservation happens without you.</h2><p>VoyageAgent persists the agent workflow, shows the selected hotel and rate, and requires explicit approval immediately before the booking agent can act.</p></div><Link className="button" href="/dashboard/requests/new">Start a request</Link></section>
      </div>
    </main>
  );
}
