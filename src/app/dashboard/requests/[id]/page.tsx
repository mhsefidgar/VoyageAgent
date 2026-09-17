import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function BookingRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: request } = await supabase.from('booking_requests').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!request) notFound();

  const [{ data: offers }, { data: approvals }, { data: events }, { data: bookings }] = await Promise.all([
    supabase.from('hotel_offers').select('*').eq('request_id', id).order('total_price'),
    supabase.from('approvals').select('*').eq('request_id', id).order('created_at', { ascending: false }),
    supabase.from('workflow_events').select('*').eq('request_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('bookings').select('*').eq('request_id', id).order('created_at', { ascending: false }),
  ]);

  const approval = approvals?.[0];
  const selectedOffer = offers?.find((offer) => offer.id === approval?.offer_id) ?? offers?.[0];
  const steps = [
    ['Travel Intake Agent', ['draft', 'searching', 'offers_ready', 'awaiting_human_approval', 'approved', 'booking', 'confirmed'].includes(request.status)],
    ['Hotel Search Agent', ['offers_ready', 'awaiting_human_approval', 'approved', 'booking', 'confirmed'].includes(request.status)],
    ['Hotel Evaluation Agent', ['awaiting_human_approval', 'approved', 'booking', 'confirmed'].includes(request.status)],
    ['Human Approval Gate', ['approved', 'booking', 'confirmed', 'rejected'].includes(request.status)],
    ['Booking Agent', ['booking', 'confirmed'].includes(request.status)],
    ['Notification Agent', request.status === 'confirmed'],
  ] as const;

  return (
    <main className="page-shell">
      <div className="container">
        <nav className="dashboard-nav">
          <Link className="brand" href="/dashboard"><span className="brand-mark">✈</span> VoyageAgent</Link>
          <Link className="pill" href="/dashboard">Dashboard</Link>
        </nav>

        <section className="dashboard-hero">
          <div><div className="eyebrow">Booking request</div><h1>{request.destination}</h1><p>{request.check_in} → {request.check_out} · {request.guests} guests · {request.rooms} room{request.rooms === 1 ? '' : 's'}</p></div>
          <span className="status-badge">{request.status.replaceAll('_', ' ')}</span>
        </section>

        <section className="workflow-grid">
          <article className="card workflow-panel">
            <h2>Agent workflow</h2>
            <div className="workflow-list">
              {steps.map(([name, complete], index) => <div className={`workflow-step ${complete ? 'complete' : ''}`} key={name}><span>{complete ? '✓' : index + 1}</span><div><strong>{name}</strong><p>{complete ? 'Completed' : 'Waiting'}</p></div></div>)}
            </div>
          </article>
          <article className="card workflow-panel">
            <h2>Human approval</h2>
            {request.status === 'awaiting_human_approval' && selectedOffer ? (
              <div>
                <h3>{selectedOffer.hotel_name}</h3>
                <p>{selectedOffer.room_name || 'Room'} · {selectedOffer.rate_name || 'Selected rate'}</p>
                <div className="approval-price">{selectedOffer.total_price} {selectedOffer.currency}</div>
                <p>{selectedOffer.taxes ? `Taxes/fees: ${selectedOffer.taxes} ${selectedOffer.currency}` : 'Taxes/fees supplied by provider.'}</p>
                <pre className="policy">{JSON.stringify(selectedOffer.cancellation_policy, null, 2)}</pre>
                <form action={`/api/booking-requests/${id}/approval`} method="post" className="approval-actions">
                  <input type="hidden" name="approval_id" value={approval?.id ?? ''} />
                  <textarea name="comment" rows={3} placeholder="Optional approval note" />
                  <button className="button" name="decision" value="approved">Approve & continue</button>
                  <button className="pill danger-button" name="decision" value="rejected">Reject</button>
                </form>
              </div>
            ) : (
              <div className="empty-state"><h3>{approval?.decision === 'approved' ? 'Approved' : approval?.decision === 'rejected' ? 'Rejected' : 'Not waiting for approval'}</h3><p>The booking agent is hard-blocked until an explicit approval exists for the selected offer.</p></div>
            )}
          </article>
        </section>

        <div className="section-title"><h2>Live hotel offers</h2><span>{offers?.length ?? 0} persisted offers</span></div>
        <section className="offer-list">
          {(offers ?? []).map((offer) => <article className="card trip-card" key={offer.id}><div><h3>{offer.hotel_name}</h3><p>{offer.city || request.destination} · {offer.room_name || 'Room'} · {offer.rate_name || 'Rate'}</p><small>{offer.provider}</small></div><strong>{offer.total_price} {offer.currency}</strong></article>)}
          {!offers?.length && <div className="card empty-state"><h3>No live offers yet</h3><p>The search agent has not persisted any provider offers for this request.</p></div>}
        </section>

        {bookings?.[0] && <section className="card planner-banner"><div><div className="eyebrow">Booking</div><h2>{bookings[0].status === 'confirmed' ? 'Booking confirmed' : 'Booking in progress'}</h2><p>Provider reference: {bookings[0].provider_booking_id || 'Pending supplier confirmation'}</p></div></section>}

        <div className="section-title"><h2>Workflow audit</h2><span>Latest agent events</span></div>
        <section className="card event-list">{(events ?? []).map((event) => <div className="event-row" key={event.id}><strong>{event.agent}</strong><span>{event.event_type}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}{!events?.length && <p className="muted">No workflow events recorded yet.</p>}</section>
      </div>
    </main>
  );
}
