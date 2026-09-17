import Link from 'next/link';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 48 }}>
      <h1>Sign in</h1>
      <p>Use your VoyageAgent account.</p>
      <form action="/api/auth/login" method="post" style={{ display: 'grid', gap: 16 }}>
        <label>
          Username or email
          <input
            name="email"
            type="text"
            required
            autoComplete="username"
            style={{ display: 'block', width: '100%', padding: 10 }}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={{ display: 'block', width: '100%', padding: 10 }}
          />
        </label>
        <button type="submit">Sign in</button>
      </form>
      <p><Link href="/register">Create an account</Link></p>
    </main>
  );
}
