import Link from 'next/link';

export default function NewBookingRequestPage() {
  return (
    <main className="page-shell">
      <div className="container narrow-container">
        <nav className="dashboard-nav">
          <Link className="brand" href="/dashboard"><span className="brand-mark">✈</span> VoyageAgent</Link>
          <Link className="pill" href="/dashboard">Back to dashboard</Link>
        </nav>
        <section className="dashboard-hero">
          <div>
            <div className="eyebrow">Travel intake agent</div>
            <h1>Tell us what you need.</h1>
            <p>VoyageAgent will turn your constraints into a hotel search, evaluate the live offers, and ask for your approval before any booking action.</p>
          </div>
        </section>
        <form className="card form-card" action="/api/booking-requests" method="post">
          <div className="form-grid">
            <label>Destination<input name="destination" required placeholder="Montreal, Paris, Tokyo…" /></label>
            <label>Guests<input name="guests" type="number" min="1" defaultValue="2" required /></label>
            <label>Check-in<input name="check_in" type="date" required /></label>
            <label>Check-out<input name="check_out" type="date" required /></label>
            <label>Rooms<input name="rooms" type="number" min="1" defaultValue="1" required /></label>
            <label>Nightly budget<input name="budget" type="number" min="0" step="0.01" placeholder="Optional" /></label>
          </div>
          <label>Preferences<textarea name="preferences" rows={5} placeholder="Cancellation flexibility, room type, amenities, location, accessibility, or anything else that matters." /></label>
          <div className="form-actions">
            <Link className="pill" href="/dashboard">Cancel</Link>
            <button className="button" type="submit">Start hotel search →</button>
          </div>
        </form>
      </div>
    </main>
  );
}
