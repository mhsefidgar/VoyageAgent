# VoyageAgent: Industry-Standard Multi-Agent Hotel Booking Architecture

## 1. Architecture in one sentence

VoyageAgent is a **modular monolith with durable workflow orchestration, event-driven agent workers, a relational domain model, and a human-in-the-loop authorization boundary**.

This is deliberately different from a free-form agent swarm. Agents are specialized workers; the orchestrator is the authority for workflow state and policy.

## 2. Why this architecture?

Hotel booking is a **long-running, stateful business transaction** with money, changing inventory, external systems, retries, and irreversible side effects. That combination favors deterministic workflow control over an autonomous conversation.

The architecture separates four concerns:

```text
LLM reasoning       → interpretation, ranking, explanations
Workflow authority  → state transitions, policy, retries, approval
Domain persistence  → requests, offers, approvals, bookings, audit
Provider side effect → search, revalidation, booking, reconciliation
```

The result is easier to test, observe, secure, and evolve than a single agent with unrestricted tools.

## 3. Architectural style

### Modular monolith

The application is one deployable Next.js system, but its responsibilities are separated into domain modules and explicit interfaces.

**Why:** it keeps local transactions and development simple while preserving boundaries that can later become services.

### Durable workflow/state machine

A booking request moves through explicit states instead of relying on conversational agent memory.

**Why:** workers can crash, messages can be duplicated, providers can timeout, and users can approve hours after a search. Durable state makes these conditions explicit.

### Event-driven coordination

Commands request work; events record facts.

**Why:** downstream consumers such as notifications do not need to be coupled to the booking worker, and operational history remains auditable.

### Human-in-the-loop control

Human approval is a first-class state transition, not a UI decoration.

**Why:** an LLM recommendation must never silently become a financial authorization.

### Ports-and-adapters provider boundary

Supplier APIs are hidden behind normalized interfaces.

**Why:** the workflow should not depend on one supplier's authentication, response format, or error model.

## 4. System topology

```text
                          Traveler
                             │
                             ▼
                    ┌─────────────────┐
                    │    Next.js UI   │
                    └────────┬────────┘
                             │ authenticated command
                             ▼
                    ┌─────────────────┐
                    │ API / Domain    │
                    │ application     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Orchestrator  │
                    │ state + policy  │
                    └───────┬─────────┘
                            │ commands/events
          ┌─────────────────┼───────────────────┐
          ▼                 ▼                   ▼
     Intake Agent      Search Agent        Evaluation Agent
          │                 │                   │
          └─────────────────┴───────────────────┘
                            │
                            ▼
                    Human Approval Gate
                            │
                            ▼
                      Booking Agent
                            │
                            ▼
                    Provider Adapter
                            │
                            ▼
                         Supplier
                            │
                            ▼
                    Notification Agent

                 ┌─────────────────────────┐
                 │ Supabase/Postgres       │
                 │ state + RLS + audit     │
                 └─────────────────────────┘
```

## 5. End-to-end execution

### Step A — Traveler request

The user authenticates and creates a booking request. Server-side validation bounds dates, guests, rooms, budget, and preferences.

### Step B — Intake

The Intake Agent converts natural language into structured travel constraints. It may ask for missing information but cannot invent requirements.

### Step C — Search

The Search Agent calls a configured provider. Supplier responses are normalized into `hotel_offers`, preserving provider identifiers, pricing, cancellation data, and expiry.

### Step D — Evaluation

The Evaluation Agent uses deterministic facts to calculate ranking features. An LLM can produce a concise explanation from those facts. The explanation is not authoritative data.

### Step E — Approval

The system creates an approval snapshot containing the selected offer and the commercial details the traveler is authorizing.

### Step F — Revalidation

Before booking, the current offer is loaded again. Price, currency, dates, guests, room/rate, cancellation terms, supplier, and expiry are checked. A material change requires new approval.

### Step G — Booking

The Booking Agent obtains an idempotency lease, calls the provider adapter, and persists the supplier result.

### Step H — Confirmation

Only a verifiable supplier booking reference can produce `confirmed`. Unknown supplier state enters reconciliation.

### Step I — Notification

Notification consumes durable workflow events independently. A notification failure cannot undo a confirmed supplier booking.

## 6. State machine

```text
DRAFT
  │
  ▼
INTAKE_VALIDATED ──► NEEDS_CLARIFICATION
  │
  ▼
SEARCHING ──► RETRYING / DEGRADED
  │
  ▼
OFFERS_READY
  │
  ▼
EVALUATING
  │
  ▼
AWAITING_HUMAN_APPROVAL
       │          │
    rejected   approved
       │          │
       ▼          ▼
   REJECTED   REVALIDATING
                   │
             ┌─────┴─────┐
             ▼           ▼
          BOOKING   REVALIDATION_FAILED
             │
       ┌─────┼──────────┐
       ▼     ▼          ▼
 CONFIRMED FAILED RECONCILIATION_REQUIRED
```

The database and server-side workflow code are authoritative. The browser is a client, not a state machine.

## 7. Agent contracts

| Agent | Reads | Produces | Forbidden |
|---|---|---|---|
| Intake | traveler request | constraints | booking/financial side effects |
| Search | constraints/provider config | normalized offers | arbitrary URLs/SQL |
| Evaluation | constraints/offers | scores/explanation | inventing supplier facts |
| Approval | request/offer snapshot | human decision | self-approval |
| Booking | approved request/offer | booking result | bypassing approval |
| Notification | workflow events | delivery result | changing booking state |

A useful engineering rule is: **the smaller the tool surface, the smaller the blast radius when a model or integration behaves incorrectly.**

## 8. Command/event model

A command is an instruction:

```text
SearchHotels
EvaluateOffers
CreateApprovalGate
ApproveOffer
BookApprovedOffer
ReconcileBooking
```

An event is a fact:

```text
HotelSearchStarted
HotelOffersPersisted
OffersEvaluated
ApprovalRequested
OfferApproved
BookingStarted
BookingConfirmed
BookingReconciliationRequired
```

A worker must not assume a command runs exactly once. Design for at-least-once delivery.

## 9. Reliability patterns

### Idempotency

Use different scopes for different side effects:

```text
workflow:{request}:{command}:{version}
supplier-booking:{request}:{offer}:{approval}
notification:{event}:{channel}
```

Repeated work returns the previous operation rather than repeating a supplier side effect.

### Leases

A short-lived booking lease prevents two workers from simultaneously booking the same approval.

### Bounded retries

Retry only errors known to be transient. Use exponential backoff and jitter. Never retry an unknown booking result blindly.

### Circuit breakers

If a supplier repeatedly fails, stop sending traffic temporarily and expose degraded status instead of generating fake availability.

### Reconciliation

If a supplier may have received the booking but the client timed out, query supplier status before any retry or confirmation.

### Dead letters

After a bounded retry budget, move poison work to a dead-letter path with safe diagnostics and correlation identifiers.

## 10. AI trust boundary

The model is a **reasoning component, not a security boundary**.

```text
untrusted text
     ↓
structured input
     ↓
LLM reasoning
     ↓
strict schema validation
     ↓
deterministic policy checks
     ↓
allowed command
```

The LLM cannot:

- approve a booking;
- set a final authoritative price;
- mark a booking confirmed;
- execute arbitrary SQL;
- call arbitrary URLs;
- access secrets;
- bypass authorization.

## 11. Prompt-injection defense

External supplier content can contain text that looks like instructions. The system treats it as data.

For example, a hotel description saying `ignore previous instructions` must remain a hotel description. It must never alter the tool policy.

Use structured fields, explicit delimiters, strict output schemas, and capability allow-lists. Never allow model-generated supplier URLs or SQL to become executable commands without deterministic validation.

## 12. Security model

### Identity

Authenticate every mutation. Resolve the user from the server session rather than a request body.

### Authorization

Use Supabase RLS plus server-side ownership checks. A user must not be able to reference another user's request, offer, approval, or booking by changing an ID.

### Secrets

Supplier and AI credentials remain server-side. They are never sent to the browser or model context.

### Data minimization

Only send the minimum data required for an agent decision. Keep unnecessary guest PII out of prompts and logs.

### Abuse controls

Rate-limit request creation, search, approval, and booking operations. Bound model tokens, tool calls, workflow duration, and total cost.

## 13. Financial safety

The most important invariant is:

```text
LLM recommendation ≠ authorization
UI click ≠ authorization by itself
approval snapshot = authorization for specific terms
supplier confirmation = booking confirmation
```

If material commercial terms change, the old approval no longer applies.

## 14. Data architecture

The relational model represents the business aggregate:

```text
booking_request
      │
      ├── hotel_offer ──► provider reference
      │
      ├── approval ─────► exact authorized snapshot
      │
      ├── booking ──────► supplier reference
      │
      └── workflow_event ► audit/history
```

Relational constraints are valuable here because correctness depends on relationships, uniqueness, ownership, and state transitions.

## 15. Observability

Propagate:

`correlation_id` · `booking_request_id` · `agent_run_id` · provider request ID · idempotency key

Track latency, retries, provider errors, offer freshness, approval age, booking outcomes, reconciliation volume, model usage, and workflow cost.

Logs should contain safe structured metadata, not access tokens, payment credentials, or unnecessary PII.

## 16. Provider abstraction

```ts
interface HotelProvider {
  search(input: HotelSearchInput): Promise<HotelSearchResult>;
  getOffer(input: GetOfferInput): Promise<HotelOfferResult>;
  createBooking?(input: CreateBookingInput): Promise<CreateBookingResult>;
  reconcileBooking?(input: ReconcileBookingInput): Promise<BookingReconciliationResult>;
}
```

The adapter owns supplier authentication, schemas, error translation, rate limits, and supplier-specific idempotency. The orchestrator works with normalized domain objects.

## 17. Why not a microservice per agent?

A service boundary should exist for an operational reason: independent scaling, deployment isolation, ownership, or failure containment.

If every agent becomes a service on day one, the team inherits distributed tracing, network failures, deployment coordination, schema versioning, and distributed transactions before those costs are justified.

The current modular boundaries preserve an easy future migration:

```text
Today:
Next.js + modules + durable DB

Later, where justified:
Next.js → queue → Search Worker
                  → Evaluation Worker
                  → Booking Worker
                  → Notification Worker
```

The contracts stay stable while the deployment topology evolves.

## 18. Why not a pure autonomous swarm?

A swarm can be useful for open-ended research, but booking needs explicit authority.

If Agent A can ask Agent B to book and Agent B can ask Agent C to approve, it becomes difficult to answer basic production questions: who authorized the charge, which offer was approved, what happened after a retry, and which component owns the state?

VoyageAgent instead makes authority explicit and auditable.

## 19. Production engineering checklist

- [ ] Every state transition has a server-side guard.
- [ ] Every side effect has an idempotency strategy.
- [ ] Every supplier call has timeout and retry semantics.
- [ ] Ambiguous supplier results reconcile before confirmation.
- [ ] Approval is bound to an immutable commercial snapshot.
- [ ] RLS and ownership checks are tested.
- [ ] Model output is schema-validated.
- [ ] External text is treated as untrusted data.
- [ ] Secrets are absent from browser payloads, prompts, and logs.
- [ ] Provider sandbox/contract tests exist before production booking.
- [ ] Metrics, traces, alerts, and dead-letter handling exist before scale.

## 20. Implementation map

The repository maps the architecture to these areas:

```text
src/app/                         → UI + server routes
src/lib/booking/workflow.ts     → workflow invariants
src/app/api/hotels/search       → provider search boundary
supabase/migrations/             → state, RLS, integrity
.github/workflows/               → CI verification
docs/                            → architecture + operations
```

The design target is not “maximum agent autonomy.” It is **controlled autonomy**: enough intelligence to reduce manual travel work, with deterministic boundaries wherever correctness, security, money, or external side effects matter.
