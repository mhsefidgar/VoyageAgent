export default function RegisterPage() {
  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 48 }}>
      <h1>Create your account</h1>
      <form action="/api/auth/register" method="post" style={{ display: 'grid', gap: 16 }}>
        <label>
          Name
          <input name="name" required autoComplete="name" style={{ display: 'block', width: '100%', padding: 10 }} />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" style={{ display: 'block', width: '100%', padding: 10 }} />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} required autoComplete="new-password" style={{ display: 'block', width: '100%', padding: 10 }} />
        </label>
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
