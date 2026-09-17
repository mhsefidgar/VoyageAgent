# VoyageAgent

Cost-aware AI travel SaaS for the US and Canada, built as a **multi-agent hotel booking system with human authorization at the booking boundary**.

## Architecture

VoyageAgent separates reasoning from authority:

```text
Traveler → Orchestrator → Intake → Search → Evaluate → Human Approval → Booking → Supplier
                              │          │              │
                              └──────── durable state ──┴── audit events
```

Agents are narrow workers. The orchestrator owns state transitions, retry/idempotency policy, and authorization boundaries. LLMs can reason over structured travel data, but cannot approve bookings, access secrets, execute arbitrary SQL/HTTP, or declare a booking confirmed.

See [`docs/multi-agent-hotel-booking-architecture.md`](docs/multi-agent-hotel-booking-architecture.md) for the system design and [`docs/agent-orchestration-runbook.md`](docs/agent-orchestration-runbook.md) for implementation and operational contracts.

## Agent responsibilities

- **Travel Intake Agent:** converts free-form intent into validated travel constraints.
- **Hotel Search Agent:** queries configured suppliers and normalizes live offers.
- **Hotel Evaluation Agent:** ranks offers using explicit constraints and produces traceable explanations.
- **Human Approval Gate:** binds a review decision to an immutable offer/stay/price snapshot.
- **Booking Agent:** revalidates approval and offer freshness, then performs the supplier side effect idempotently.
- **Notification Agent:** consumes workflow events and delivers status updates independently from booking state.

## Guardrails

- Supabase RLS and server-side ownership checks protect user-owned data.
- Provider credentials remain server-side; no supplier token reaches the browser.
- External content is treated as untrusted data to resist prompt injection.
- Tool access is capability-based and schema-constrained.
- Budget, price, cancellation, approval, and booking invariants are enforced server-side.
- Retries are bounded; supplier calls have timeouts and correlation IDs.
- Ambiguous supplier outcomes enter reconciliation rather than becoming `confirmed`.
- Duplicate commands and booking attempts are suppressed with idempotency keys/leases.
- Workflow transitions are durable and auditable.

## Cost-control principles

- One shared multi-tenant Postgres database with RLS; no database per customer.
- AI is used for planning and presentation, not deterministic calculations.
- Supplier searches run in parallel and are cached.
- Model/provider choice is configurable server-side; no API keys in the browser.
- Admin can see AI usage, estimated AI cost, provider/model, latency, errors, and monthly spend by organization.
- Hard usage budgets can stop or downgrade expensive AI operations before spend grows.
- Travel-provider API settings are stored as server-side configuration metadata; secrets are never rendered to normal users.
- Booking and offer prices are revalidated before confirmation.

## Planned stack

Next.js + TypeScript + Vercel AI SDK/Gateway + Supabase Auth/Postgres/RLS.
