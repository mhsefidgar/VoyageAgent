import Link from 'next/link';

const hotels = [
  { name: 'Hotel Bonaventure Montreal', location: 'Montréal, QC', detail: 'Central stay · Rooftop pool', price: '$189 / night' },
  { name: 'Fairmont Vancouver', location: 'Vancouver, BC', detail: 'Downtown · Mountain views', price: '$229 / night' },
  { name: 'The Drake Hotel', location: 'Toronto, ON', detail: 'Queen West · Boutique stay', price: '$205 / night' },
];

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <nav className="dashboard-nav">
          <Link className="brand" href="/"><span className="brand-mark">✈</span> VoyageAgent</Link>
          <div className="actions">
            <Link className="pill" href="/">Home</Link>
            <form action="/api/auth/logout" method="post">
              <button className="pill" type="submit">Sign out</button>
            </form>
          </div>
        </nav>

        <section className="dashboard-hero">
          <div><div className="eyebrow">Traveler workspace</div><h1>Welcome back</h1><p>Everything you need for your next journey, in one place.</p></div>
          <Link className="button" href="#trips">＋ Plan a new trip</Link>
        </section>

        <section className="stats">
          <div className="card stat"><span className="muted">Active trips</span><div className="value">2</div></div>
          <div className="card stat"><span className="muted">Saved places</span><div className="value">12</div></div>
          <div className="card stat"><span className="muted">Hotel options</span><div className="value">8</div></div>
          <div className="card stat"><span className="muted">AI plans</span><div className="value">4</div></div>
        </section>

        <div className="section-title" id="trips"><h2>Quick actions</h2><span>Start where you left off</span></div>
        <section className="feature-grid">
          <Link className="card feature" href="#trips"><div className="icon">🧳</div><h3>My Trips</h3><p>Create, edit, and organize itineraries with dates, destinations, and travel notes.</p><span className="text-link">Open trips →</span></Link>
          <Link className="card feature" href="#hotels"><div className="icon">🏨</div><h3>Hotels & stays</h3><p>Browse hotel options, compare stay details, and keep promising properties saved.</p><span className="text-link">Explore stays →</span></Link>
          <Link className="card feature" href="#planner"><div className="icon">✨</div><h3>AI Planner</h3><p>Turn your destination, budget, and preferences into a practical travel plan.</p><span className="text-link">Start planning →</span></Link>
        </section>

        <div className="section-title" id="hotels"><h2>Hotel suggestions</h2><span>Curated for your workspace</span></div>
        <section style={{ display: 'grid', gap: 12 }}>
          {hotels.map((hotel) => <article className="card trip-card" key={hotel.name}>
            <div><div className="eyebrow">Recommended stay</div><h3>{hotel.name}</h3><p>{hotel.location} · {hotel.detail}</p></div>
            <div><strong>{hotel.price}</strong><p>Flexible dates available</p></div>
            <button className="pill" type="button">View stay</button>
          </article>)}
        </section>

        <section className="card planner-banner" id="planner">
          <div><div className="eyebrow">AI travel planning</div><h2>Build your next trip in minutes.</h2><p>Tell VoyageAgent where you want to go and what matters to you. Your planning workspace can grow from there.</p></div>
          <Link className="button" href="#trips">Start planning</Link>
        </section>
      </div>
    </main>
  );
}
