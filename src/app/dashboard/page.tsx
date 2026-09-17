export default function DashboardPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 48 }}>
      <h1>User Dashboard</h1>
      <p>Your travel workspace is ready.</p>
      <section style={{ marginTop: 32, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20 }}><strong>My Trips</strong><p>Create and manage trips.</p></div>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20 }}><strong>Saved Places</strong><p>Keep destinations and places you like.</p></div>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20 }}><strong>AI Planner</strong><p>Plan a trip with VoyageAgent.</p></div>
      </section>
    </main>
  );
}
