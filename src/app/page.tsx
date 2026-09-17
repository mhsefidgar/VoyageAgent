export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 48 }}>
      <h1>VoyageAgent</h1>
      <p>Cost-aware AI travel planning for the US and Canada.</p>
      <ul>
        <li>Multi-tenant Supabase architecture with RLS</li>
        <li>AI usage budgets and estimated-cost tracking</li>
        <li>Admin controls for models, providers, APIs, and spend</li>
      </ul>
    </main>
  );
}
