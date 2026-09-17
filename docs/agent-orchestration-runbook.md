# VoyageAgent Agent Orchestration Runbook

This runbook defines the operational contract for the multi-agent hotel workflow. It is intentionally implementation-oriented: the system should be boring at the boundary and interesting inside the reasoning pipeline.

## Command/event split

Commands ask the system to perform work; events record facts that already happened.

Examples:

```text
StartBookingRequest
ValidateTravelConstraints
SearchHotels
EvaluateOffers
CreateApprovalGate
ApproveOffer
RejectOffer
BookApprovedOffer
ReconcileBooking
SendNotification
```

Corresponding events:

```text
BookingRequestCreated
TravelConstraintsValidated
HotelSearchStarted
HotelOffersPersisted
OffersEvaluated
ApprovalRequested
OfferApproved
OfferRejected
BookingStarted
BookingConfirmed
BookingFailed
BookingReconciliationRequired
NotificationSent
```

Handlers should be deterministic around persistence and side effects. An event may be delivered more than once; consumers must tolerate duplicates.

## Recommended worker shape

```text
queue message
   │
   ├─ validate schema/version
   ├─ acquire idempotency lease
   ├─ load current aggregate state
   ├─ assert allowed transition
   ├─ execute bounded work
   ├─ persist result + event atomically where possible
   └─ ack / retry / dead-letter
```

Do not build an open-ended `while (agent.decide())` loop for booking. Each agent run should have a maximum step budget and a clear terminal result.

## State transition policy

A transition should be expressed as:

```ts
type Transition = {
  from: BookingWorkflowStatus;
  command: string;
  to: BookingWorkflowStatus;
  requiresApproval?: boolean;
  maxAttempts?: number;
};
```

The persistence layer should reject illegal transitions. The UI is not the authority for workflow state.

## Idempotency

Use separate idempotency scopes:

- `workflow:{requestId}:{command}:{version}` for agent commands
- `supplier-booking:{requestId}:{offerId}:{approvalId}` for booking side effects
- `notification:{eventId}:{channel}` for notifications

Persist the key and resulting operation ID before acknowledging work. A repeated request must return the prior result rather than invoke the supplier again.

## Approval freshness

Approval is authorization of a specific commercial decision, not a blanket permission to book.

Invalidate approval when any material field changes:

- total price or currency
- room/rate
- cancellation terms
- dates
- guest count
- selected hotel/offer
- supplier

A booking worker must never infer that an older approval covers a new offer.

## LLM boundary

Use structured output schemas for every model-facing decision. The model may produce:

- normalized intent candidates
- ranking explanations
- missing-information questions
- user-facing summaries

The model may not directly:

- mutate booking state
- execute arbitrary HTTP
- execute SQL
- access secrets
- approve a booking
- set a final price
- mark a booking confirmed

A deterministic server function must translate model output into an allowed command.

## Evaluation strategy

Keep factual scoring deterministic. For example:

```text
score = budget_fit
      + date_fit
      + room_fit
      + cancellation_fit
      + preference_fit
```

The exact weights should be configuration, not hidden in prompts. Store score components so the recommendation can be explained and audited.

LLM-generated prose is presentation, not the source of truth.

## Security review checklist

Before enabling a new agent tool:

- [ ] Does it have the narrowest possible capability?
- [ ] Is its input schema strict and bounded?
- [ ] Can user/provider content inject instructions into it?
- [ ] Can it access PII it does not need?
- [ ] Can it create a financial or booking side effect?
- [ ] Is explicit authorization required for that side effect?
- [ ] Is the operation idempotent?
- [ ] Is there a timeout and retry budget?
- [ ] Are inputs/outputs safe to log?
- [ ] Is the result auditable through workflow events?

## Production readiness gates

### Before search

- authenticated user
- valid request ownership
- normalized dates/time zone
- bounded search parameters
- configured provider

### Before approval

- offers persisted with provider IDs
- offer expiry known
- price/currency represented accurately
- cancellation policy represented accurately where available
- shortlist derived from persisted facts

### Before booking

- authenticated actor context
- active approval bound to selected offer
- approval not expired/revoked
- offer still valid
- price/terms revalidated
- supplier credentials available
- idempotency lease acquired

### Before confirmation

- supplier returned a verifiable booking reference
- booking persisted successfully
- no unresolved supplier ambiguity

## Operational playbooks

### Provider outage

Trip the provider circuit after configured failure thresholds. Surface degraded search status, retry asynchronously, and avoid presenting stale offers as current availability.

### Ambiguous booking result

Do not retry blindly. Mark the booking as reconciliation-required, query the supplier's reconciliation/status capability, and only transition to confirmed after a verifiable supplier result.

### Queue poison message

After bounded retries, move the message to a dead-letter path with correlation ID, request ID, error class, and safe diagnostic metadata. Do not include secrets or raw PII.

### Model outage

Skip optional natural-language explanation and continue with deterministic validation/ranking where possible. If model output is required for a safety-critical decision, stop rather than invent a result.

## Testing strategy

Unit tests should cover the transition matrix and every invariant. Integration tests should exercise:

- duplicate command delivery
- stale approval
- expired offer
- changed price
- provider timeout
- supplier booking timeout
- reconciliation
- RLS ownership failures
- prompt-injection payloads in hotel descriptions/reviews
- malformed model output
- concurrent approval/booking attempts

A production deployment should have a staging supplier account or a provider sandbox for contract tests. Never test destructive booking behavior against production inventory without an explicit test-safe environment.
