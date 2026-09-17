import Link from 'next/link';

export default function Home() {
  return (
    <main className="page-shell">
      <div className="container">
        <nav className="dashboard-nav"><div className="brand"><span className="brand-mark">✈</span> VoyageAgent</div><div className="actions"><Link className="pill" href="/login">Sign in</Link><Link className="button" href="/register">Get started</Link></div></nav>
        <section className="card" style={{ padding: '70px 7%', marginTop: 30, overflow: 'hidden', position: 'relative' }}>
          <div className="eyebrow">AI-powered travel workspace</div>
          <h1 style={{ fontSize: 'clamp(46px, 7vw, 82px)', lineHeight: .98, letterSpacing: '-.06em', maxWidth: 780, margin: '18px 0' }}>Plan less. <br />Experience more.</h1>
          <p className="muted" style={{ maxWidth: 620, fontSize: 19, lineHeight: 1.7 }}>VoyageAgent brings trips, hotels, saved places, and intelligent planning together so your journey feels organized before you even leave.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}><Link className="button" href="/register">Start planning →</Link><Link className="pill" href="/login">I already have an account</Link></div>
        </section>
        <section className="feature-grid" style={{ marginTop: 16 }}>
          <div className="card feature"><div className="icon">🗺️</div><h3>Trips in one view</h3><p>Keep destinations, dates, notes, and plans together instead of scattered across tabs.</p></div>
          <div className="card feature"><div className="icon">🏨</div><h3>Stays that fit</h3><p>Keep hotel options visible in your user workspace while you shape the rest of the journey.</p></div>
          <div className="card feature"><div className="icon">🤖</div><h3>AI-assisted planning</h3><p>Use your preferences and budget as inputs for a more useful starting itinerary.</p></div>
        </section>
      </div>
    </main>
  );
}
