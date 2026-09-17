import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="page-shell">
      <div className="container auth-grid">
        <section className="hero">
          <div className="brand"><span className="brand-mark">✈</span> VoyageAgent</div>
          <div className="eyebrow" style={{ marginTop: 70 }}>Build your travel workspace</div>
          <h1>From inspiration to itinerary.</h1>
          <p>Create an account and make every destination easier to explore, compare, and organize.</p>
          <div className="hero-points">
            <div className="hero-point"><span>01</span><span>Save your favorite places and stays</span></div>
            <div className="hero-point"><span>02</span><span>Build and manage trips</span></div>
            <div className="hero-point"><span>03</span><span>Use AI to shape your plans</span></div>
          </div>
        </section>
        <section className="card auth-card">
          <div className="brand"><span className="brand-mark">✈</span> VoyageAgent</div>
          <h1 style={{ marginTop: 28 }}>Create your account</h1>
          <p className="sub">Start building your next journey in a few seconds.</p>
          <form action="/api/auth/register" method="post" className="form">
            <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required autoComplete="name" placeholder="Your name" /></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" /></div>
            <button className="button" type="submit">Create my account</button>
          </form>
          <p className="muted" style={{ marginTop: 24, textAlign: 'center' }}>Already have an account? <Link className="text-link" href="/login">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
