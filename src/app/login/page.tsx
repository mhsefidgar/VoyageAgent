import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="page-shell">
      <div className="container auth-grid">
        <section className="hero">
          <div className="brand"><span className="brand-mark">✈</span> VoyageAgent</div>
          <div className="eyebrow" style={{ marginTop: 70 }}>Your next trip starts here</div>
          <h1>Travel planning, without the busywork.</h1>
          <p>Keep your itineraries, stays, saved places, and AI-assisted trip planning in one calm workspace.</p>
          <div className="hero-points">
            <div className="hero-point"><span>✓</span><span>Organize trips and stays in one place</span></div>
            <div className="hero-point"><span>✓</span><span>Discover destinations and hotels</span></div>
            <div className="hero-point"><span>✓</span><span>Plan with a cost-aware AI assistant</span></div>
          </div>
        </section>
        <section className="card auth-card">
          <div className="brand"><span className="brand-mark">✈</span> VoyageAgent</div>
          <h1 style={{ marginTop: 28 }}>Welcome back</h1>
          <p className="sub">Sign in to continue your travel workspace.</p>
          <form action="/api/auth/login" method="post" className="form">
            <div className="field"><label htmlFor="email">Username or email</label><input id="email" name="email" type="text" required autoComplete="username" placeholder="you@example.com" /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" placeholder="Enter your password" /></div>
            <button className="button" type="submit">Sign in to VoyageAgent</button>
          </form>
          <p className="muted" style={{ marginTop: 24, textAlign: 'center' }}>New to VoyageAgent? <Link className="text-link" href="/register">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
