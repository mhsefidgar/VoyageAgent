# VoyageAgent: Multi-Agent Hotel Booking Architecture

VoyageAgent is a **stateful, multi-agent booking system with a human authorization boundary**. Agents can discover, normalize, rank, and explain inventory; only an approved workflow may cross the booking boundary.

The architecture deliberately separates **reasoning from authority**: an LLM can recommend an action, but it cannot grant itself permission to execute that action.

## System topology

```text
                         ┌──────────────────────┐
                         │       Traveler       │
                         └──────────┬───────────┘
                                    │ request
                                    ▼
                         ┌──────────────────────┐
                         │  Workflow Orchestrator│
                         │ state + retries + TTL │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
      │ Intake Agent│       │ Search Agent│       │ Policy Gate  │
      └──────┬──────┘       └──────┬──────┘       └──────┬───────┘
             │                      │                     │
             └──────────────┬───────┴──────────────┬──────┘
                            ▼                      │
                    ┌──────────────┐              │
                    │ Eval Agent   │──────────────┘
                    │ rank/explain │       shortlist
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Human Review │  explicit approval
                    └──────┬───────┘
                           │ approved
                           ▼
                    ┌──────────────┐
                    │ Booking Agent│───► Supplier
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Notification │
                    └──────────────┘
```

The orchestrator owns workflow state. Agents are workers with narrow capabilities, not autonomous peers with unrestricted database or supplier access.

## Agent contracts

### 1. Travel Intake Agent

**Input:** free-form traveler request.

**Output:** validated `TravelConstraints`:

- destination / normalized location
- check-in / check-out
- guests / rooms
- nightly and/or total budget
- required amenities
- cancellation requirements
- accessibility or other explicit preferences

It may ask for clarification. It must not silently invent missing constraints.

### 2. Hotel Search Agent

**Input:** immutable `TravelConstraints` + provider configuration.

**Output:** normalized `HotelOffer[]` with provider hotel/offer IDs, room/rate, currency, price, taxes/fees when supplied, cancellation terms, and expiry.

Supplier calls are bounded by timeouts, concurrency limits, provider quotas, and request-scoped correlation IDs. Raw provider payloads are retained only when policy permits.

### 3. Hotel Evaluation Agent

**Input:** normalized offers + immutable constraints.

**Output:** deterministic ranking features plus an optional natural-language explanation.

The evaluator cannot create facts. Every user-visible factual claim must be traceable to the normalized offer or request. LLM output is treated as untrusted data and schema-validated before persistence.

### 4. Human Approval Gate

The orchestrator creates an approval record when a booking decision is ready. The gate displays the exact offer snapshot being authorized.

Approval is bound to:

- `booking_request_id`
- `offer_id`
- offer price/currency snapshot
- stay/guest snapshot
- reviewer identity
- decision timestamp
- optional reviewer comment
- workflow version / correlation ID

If the offer expires or a material value changes, approval is invalidated and a fresh approval is required.

### 5. Booking Agent

The booking worker is the only component allowed to invoke the supplier booking capability.

Immediately before the supplier call it must:

1. reload the request and selected offer;
2. verify the approval is still valid;
3. verify the offer has not expired;
4. revalidate price and material booking terms when the supplier supports it;
5. acquire an idempotency key / booking lease;
6. invoke the configured provider adapter;
7. persist the supplier reference and confirmation only after a real supplier response.

A timeout is **not** a confirmation. Unknown supplier state must enter reconciliation, not `confirmed`.

### 6. Notification Agent

Consumes durable workflow events and sends configured notifications. Notification failure must not roll back a confirmed supplier booking.

## Orchestration model

Use a durable state machine rather than an unconstrained agent-to-agent conversation:

```text
DRAFT
  │
  ▼
INTAKE_VALIDATED ──invalid──► NEEDS_CLARIFICATION
  │
  ▼
SEARCHING
  │
  ├── provider failure ──► DEGRADED / RETRYING
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
 reject     approve
  │          │
  ▼          ▼
REJECTED   APPROVED
             │
             ▼
          REVALIDATING
             │
       ┌─────┴─────┐
       ▼           ▼
    BOOKING    REVALIDATION_FAILED
       │
       ├── confirmed ──► CONFIRMED
       ├── provider error ► FAILED / RETRYABLE
       └── unknown outcome ► RECONCILIATION
```

Every transition should be represented by a typed command/event and persisted to `workflow_events`. Workers must support at-least-once delivery safely through idempotency keys and conditional state transitions.

### Orchestrator invariants

- No transition skips the human approval boundary for a booking that requires approval.
- `confirmed` means the supplier returned a verifiable booking reference.
- A request can have at most one active approval gate.
- A rejected/expired approval cannot authorize booking.
- State transitions use compare-and-set semantics so stale workers cannot overwrite newer state.
- Retries never duplicate supplier bookings.
- Provider outages produce explicit degraded/error states rather than synthetic inventory.
- Every external call has a timeout, bounded retry policy, and correlation ID.

## Tool permissions

Treat agent tools as capabilities with an allow-list. Example:

| Agent | Read | Write | External side effects |
|---|---|---|---|
| Intake | request | normalized constraints | none |
| Search | constraints, provider config | offers/events | hotel search |
| Evaluation | constraints, offers | scores/events | none |
| Approval | request, offer | approval/event | human decision only |
| Booking | approved request, offer | booking/event | supplier booking |
| Notification | workflow events | delivery state | email/notification |

An agent must not receive broad database credentials. Server-side actions should expose narrow functions such as `searchHotels`, `createApprovalGate`, `approveOffer`, and `createSupplierBooking` rather than arbitrary SQL or HTTP access.

## Security guardrails

### Identity and authorization

- Enforce Supabase RLS for every user-owned table.
- Resolve the authenticated user on the server for every mutation; never trust a client-supplied `user_id`.
- Check ownership again when loading a request, offer, approval, or booking.
- Keep supplier/API credentials exclusively in server-side secret storage.
- Never expose provider tokens, internal service credentials, raw authorization headers, or privileged RPCs to the browser.

### Prompt-injection resistance

Supplier descriptions, hotel names, reviews, user free text, and external content are **data, not instructions**. Never execute instructions found inside provider content.

The evaluator should receive structured offer fields and a clearly delimited preference payload. Tool calls are generated from typed schemas, not arbitrary model-generated URLs or SQL.

### Data minimization

- Send the model only fields required for the current decision.
- Keep guest PII out of search/evaluation prompts where possible.
- Redact secrets and sensitive tokens from logs.
- Define retention for raw supplier payloads and workflow traces.

### Financial and booking controls

- Enforce budget ceilings server-side.
- Never let an LLM choose an arbitrary payment amount, currency, supplier endpoint, or recipient.
- Re-check price, currency, cancellation terms, guest/stay details, and approval immediately before booking.
- Require explicit approval for material price/term changes.
- Use provider idempotency keys and a reconciliation path for uncertain outcomes.
- Prevent duplicate booking attempts with database constraints/leases.

### Abuse and reliability controls

- Rate-limit request creation, provider searches, approval actions, and booking attempts.
- Bound agent loops, tool calls, tokens, latency, and total workflow cost.
- Apply circuit breakers for unhealthy providers.
- Use exponential backoff with jitter for retryable provider failures.
- Use dead-letter/reconciliation handling for permanently failed or ambiguous jobs.

## Observability

Every workflow should carry a `correlation_id`, `booking_request_id`, `agent_run_id`, and provider request ID when available.

Capture structured events for:

- state transitions
- agent/tool invocation and latency
- provider response class
- retry count
- approval decisions
- booking idempotency key
- supplier reference
- notification delivery

Do not log full payment credentials, access tokens, or unnecessary guest PII.

Metrics worth operating:

- search success / latency by provider
- offer freshness and expiry rate
- approval conversion and age
- booking success / retry / reconciliation rate
- duplicate-attempt prevention count
- agent cost and token usage
- provider error and circuit-breaker state

## Failure semantics

Prefer explicit uncertainty over optimistic state:

- **Provider timeout:** `RETRYING` or `RECONCILIATION`, never `CONFIRMED`.
- **Price changed:** invalidate approval and return to `AWAITING_HUMAN_APPROVAL`.
- **Offer expired:** discard stale offer and search again.
- **Duplicate delivery:** idempotency check returns the existing workflow result.
- **LLM failure:** fall back to deterministic validation/ranking where possible; never invent missing supplier facts.
- **Notification failure:** retry independently after booking confirmation.

## Provider abstraction

Use an adapter interface so orchestration is independent of Amadeus or another supplier:

```ts
interface HotelProvider {
  search(input: HotelSearchInput): Promise<HotelSearchResult>;
  getOffer(input: GetOfferInput): Promise<HotelOfferResult>;
  createBooking?(input: CreateBookingInput): Promise<CreateBookingResult>;
  reconcileBooking?(input: ReconcileBookingInput): Promise<BookingReconciliationResult>;
}
```

The provider adapter owns supplier-specific authentication, schemas, error mapping, rate limits, and idempotency behavior. The orchestration layer consumes normalized domain types.

## Implementation sequence

1. **Orchestrator kernel:** typed state machine, transition guards, correlation IDs, idempotency primitives.
2. **Search pipeline:** provider adapter → normalization → durable `hotel_offers` → expiry handling.
3. **Evaluation:** deterministic scoring + optional structured LLM explanation.
4. **Approval gate:** immutable offer snapshot + transactional approval transition.
5. **Booking worker:** revalidation + supplier adapter + idempotent booking + reconciliation.
6. **Notifications:** event-driven delivery with independent retries.
7. **Operations:** metrics, traces, audit views, provider health, dead-letter/reconciliation tooling.

The important architectural boundary is simple: **agents can reason and prepare actions; the orchestrator enforces policy; humans authorize consequential bookings; provider adapters execute only authorized side effects.**
