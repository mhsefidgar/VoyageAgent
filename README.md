# VoyageAgent

**A production-oriented, multi-agent hotel-booking reference architecture with a human authorization boundary.**

VoyageAgent is designed as an educational system: specialized agents reason about travel, while deterministic workflow code enforces authorization, security, correctness, and supplier-side effects.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmhsefidgar%2FVoyageAgent)

## 1. What architecture is used?

VoyageAgent uses a **modular monolith + durable workflow orchestration + event-driven agent workers** architecture.

This is an industry-standard evolution path for an AI product: domain responsibilities are separated into explicit modules, commands, events, and provider adapters while remaining in one deployable application. Individual workers can later be extracted behind queues without redesigning the domain model.

It is **not a free-form agent swarm**. Agents do not own application state or authorize each other. A central orchestrator owns the state machine and controls which capability can run next.

### Why this architecture?

| Decision | Why |
|---|---|
| Modular monolith | Fast development, simple deployment, strong transactional boundaries. |
| Durable state machine | Booking is long-running; retries/restarts must not lose state. |
| Specialized agents | Small contexts and narrow responsibilities improve testability and safety. |
| Command/event split | Commands request work; events record facts. This supports auditability and replay. |
| Human approval gate | Booking is a consequential financial side effect; model output cannot equal authorization. |
| Provider adapters | Supplier-specific APIs stay behind a stable domain interface. |
| Supabase + RLS | Relational consistency plus authorization close to the data. |
| Server-side AI/tools | Secrets and privileged capabilities never enter the browser. |

**Core principle:** Agents reason. The orchestrator governs. Humans authorize. Providers execute.

## 2. End-to-end architecture

```text
┌──────────────────── Traveler UI ────────────────────┐
│ Login → Request → Shortlist → Review → Confirmation │
└────────────────────────┬────────────────────────────┘
                         ▼
                 Next.js application
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Domain/API layer       Workflow Orchestrator
              │                     │
              │          ┌──────────┼───────────┐
              │          ▼          ▼           ▼
              │       Intake      Search      Evaluate
              │          │          │           │
              │          └──────────┴───────────┘
              │                     │
              │              Human Approval
              │                     │
              │                  Booking
              │                     │
              │              Notification
              │                     │
              ▼                     ▼
        Supabase/Postgres       Provider Adapter
        Auth + RLS + audit       Amadeus / supplier
```

### Four important boundaries

- **Reasoning:** LLMs interpret intent and explain rankings. Their output is untrusted and schema-validated.
- **Authorization:** deterministic server code alone can approve a booking transition.
- **Side effects:** only the Booking Agent/provider adapter performs supplier booking operations.
- **Data:** user data is protected by authentication/RLS; credentials remain server-side.

## 3. End-to-end workflow

```text
Request → Intake → Live Search → Evaluation → Human Approval
                                      ↓
                              Revalidate price/terms
                                      ↓
                              Idempotent Booking
                                      ↓
                                  Supplier
                                      ↓
                               Confirmation
                                      ↓
                                Notification
```

### 1. Intake
Free-form intent becomes typed constraints: destination, dates, guests, rooms, budget, cancellation requirements, and preferences. Missing information is surfaced rather than invented.

### 2. Search
The Search Agent queries configured suppliers and normalizes responses into `HotelOffer`. Provider IDs, price, currency, room/rate, cancellation terms, and expiry remain traceable.

### 3. Evaluation
Deterministic scoring evaluates facts such as budget, dates, room fit, cancellation, and preferences. An LLM may explain trade-offs, but prose is never the source of truth.

### 4. Human approval
Approval is bound to the exact offer, price, currency, stay, guests, and terms. It is not blanket permission to book.

### 5. Revalidation
Immediately before booking, the system reloads the offer and approval. Material changes require renewed approval.

### 6. Booking
The Booking Agent acquires an idempotency lease and invokes the supplier adapter. A timeout or ambiguous result is never treated as success.

### 7. Confirmation
`confirmed` means the supplier returned a verifiable booking reference and the result was persisted. Notifications cannot manufacture confirmation.

## 4. Agent responsibilities

- **Travel Intake Agent:** intent → validated constraints.
- **Hotel Search Agent:** constraints → live normalized offers.
- **Hotel Evaluation Agent:** offers → explainable ranking.
- **Human Approval Gate:** selected offer → explicit authorization.
- **Booking Agent:** authorized offer → real supplier side effect.
- **Notification Agent:** workflow events → user notifications.

Each agent has a narrow capability allow-list. Avoid generic SQL, arbitrary HTTP, payment access, or broad service credentials.

## 5. Orchestration and state

The orchestrator uses an explicit state machine instead of an open-ended agent loop:

```text
draft → searching → offers_ready → awaiting_human_approval
                                      ↓
                                  approved
                                      ↓
                                   booking
                                      ↓
                                  confirmed
```

Failure branches include `needs_clarification`, `retrying`, `rejected`, `failed`, `cancelled`, and `reconciliation_required`.

Workers are assumed to receive work **at least once**, so handlers must be idempotent and safe under duplicate delivery. Every transition is durable and auditable.

See [`docs/multi-agent-hotel-booking-architecture.md`](docs/multi-agent-hotel-booking-architecture.md) and [`docs/agent-orchestration-runbook.md`](docs/agent-orchestration-runbook.md) for deeper contracts.

## 6. Security and AI guardrails

- Authenticate every server mutation and never trust a client-supplied user ID.
- Enforce Supabase RLS plus explicit ownership checks.
- Treat hotel descriptions, reviews, provider text, and traveler free text as **data, not instructions**.
- Validate all model output against strict schemas before creating commands.
- LLMs cannot approve, book, mark confirmed, execute arbitrary SQL/HTTP, or access secrets.
- Enforce budget, price/currency, cancellation, guest/stay, approval, and supplier invariants server-side.
- Use timeouts, bounded retries, exponential backoff, circuit breakers, idempotency keys, and reconciliation.
- Redact secrets and unnecessary PII from logs and model context.

## 7. Why not microservices or a pure agent swarm?

**Microservices** become useful when independent scaling, team ownership, or deployment isolation justify their operational cost. Splitting every agent into a service too early adds distributed-system complexity.

**Pure agent swarms** are useful for exploratory reasoning but are a poor authority model for financial side effects because responsibility and state ownership become ambiguous.

VoyageAgent therefore keeps the **domain centralized and responsibilities modular**. Search, Booking, or Notification workers can later be extracted behind queues while preserving the same contracts.

## 8. Data model

```text
profiles
  └── booking_requests
        ├── hotel_offers
        ├── approvals
        ├── bookings
        └── workflow_events

trips ─── saved_hotels
workflow_events ─── notifications
```

Relational storage is used for business state because bookings need consistency, constraints, ownership rules, and audit history.

## 9. Reliability patterns

- **Idempotency:** repeated commands do not repeat supplier side effects.
- **State checks:** stale workers cannot overwrite newer workflow state.
- **Saga-style progression:** long-running steps advance through durable states rather than one giant transaction.
- **Outbox/event pattern:** durable events hand work to downstream consumers.
- **Circuit breaker:** repeated supplier failures stop hammering an unhealthy provider.
- **Reconciliation:** unknown supplier state is investigated before confirmation.
- **Dead-letter handling:** poison jobs stop retrying forever and become operational work.

## 10. Observability

Carry `correlation_id`, `booking_request_id`, `agent_run_id`, provider request ID, and idempotency key through every operation.

Measure provider latency/errors, offer freshness, approval age, booking success/retry/reconciliation rates, duplicate suppression, token usage, and workflow cost. Never log access tokens, payment credentials, or unnecessary PII.

## 11. Production checklist

- [ ] Apply Supabase migrations and test RLS.
- [ ] Configure production supplier credentials as secrets.
- [ ] Configure the production provider endpoint.
- [ ] Configure AI provider/model server-side.
- [ ] Configure rate limits and usage budgets.
- [ ] Test state transitions, duplicate delivery, stale approval, expired offers, and price changes.
- [ ] Test supplier timeout/reconciliation and prompt-injection payloads.
- [ ] Verify logs contain no secrets/unnecessary PII.
- [ ] Verify real supplier booking, idempotency, and reconciliation before enabling production booking.

## 12. Deployment

Use the **Deploy with Vercel** button at the top to clone and deploy the repository. After deployment, configure environment variables in Vercel and apply the Supabase migrations.

A Vercel deployment alone does not create supplier credentials or make booking operational. The project intentionally does not fake booking confirmation when supplier booking capability is unavailable.

## 13. Further reading

- [`docs/multi-agent-hotel-booking-architecture.md`](docs/multi-agent-hotel-booking-architecture.md) — full system design, contracts, guardrails, and failure semantics.
- [`docs/agent-orchestration-runbook.md`](docs/agent-orchestration-runbook.md) — commands/events, idempotency, security review, operations, and testing.
- [`supabase/migrations/`](supabase/migrations/) — relational workflow state, RLS, and integrity constraints.
