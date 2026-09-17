const cards = [
  ['AI spend this month', '$0.00', 'Budget-aware tracking'],
  ['AI requests', '0', 'Monthly limits enforced server-side'],
  ['Provider errors', '0', 'Failures are recorded'],
  ['Average latency', '—', 'Measured per AI request'],
];

export default function AdminPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
      <h1>VoyageAgent Admin</h1>
      <p>Operations, API configuration, and cost control.</p>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        {cards.map(([title, value, detail]) => (
          <article key={title} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 18 }}>
            <div>{title}</div>
            <strong style={{ fontSize: 28 }}>{value}</strong>
            <div>{detail}</div>
          </article>
        ))}
      </section>
      <section style={{ marginTop: 28, border: '1px solid #ddd', borderRadius: 12, padding: 20 }}>
        <h2>Cost controls</h2>
        <ul>
          <li>Per-organization monthly USD budget</li>
          <li>Per-organization monthly AI request limit</li>
          <li>Economy mode at 80% of allowance</li>
          <li>Block non-essential AI at 100% of allowance</li>
          <li>Provider/model/request cost visibility</li>
        </ul>
      </section>
      <section style={{ marginTop: 20, border: '1px solid #ddd', borderRadius: 12, padding: 20 }}>
        <h2>API & provider settings</h2>
        <ul>
          <li>Enable/disable provider</li>
          <li>Choose model by operation</li>
          <li>Configure cache TTL and request timeout</li>
          <li>See secret configured/not configured status only</li>
          <li>Audit every configuration change</li>
        </ul>
      </section>
    </main>
  );
}
