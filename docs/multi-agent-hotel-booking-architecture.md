# VoyageAgent: Multi-Agent Hotel Booking Product Architecture

VoyageAgent is a multi-agent hotel booking system. The UI must represent real workflow state, not sample inventory or hardcoded metrics.

## Agent responsibilities

1. **Travel Intake Agent** — converts the user's request into structured constraints: destination, dates, guests, budget, room requirements, amenities, cancellation requirements, and preferences.
2. **Hotel Search Agent** — queries configured hotel suppliers/APIs and normalizes live offers. It must return provider IDs, offer IDs, price, currency, taxes/fees when available, cancellation policy, room/rate details, and expiry information.
3. **Hotel Evaluation Agent** — compares normalized offers against the user's constraints. It may explain trade-offs but must not fabricate availability or pricing.
4. **Booking Agent** — creates a booking only after the approval gate is satisfied. It must persist an idempotency key and provider booking reference.
5. **Human Approval Agent / Gate** — creates a review task whenever the workflow requires human approval. Approval is explicit and auditable; rejection/cancellation stops the booking action.
6. **Notification Agent** — sends booking/review/status notifications through configured providers and records delivery state.

## Core workflow

`request -> intake -> live search -> evaluate -> shortlist -> human approval -> booking -> confirmation`

Every transition is persisted. Agent retries must be idempotent. No agent may claim a booking exists until the supplier confirms it.

## Human-in-the-loop states

Use explicit states such as:

- `draft`
- `searching`
- `offers_ready`
- `awaiting_human_approval`
- `approved`
- `rejected`
- `booking`
- `confirmed`
- `failed`
- `cancelled`

An approval record must contain the reviewer, decision, timestamp, selected offer, and optional comment. The booking worker must re-check approval state immediately before creating the supplier reservation.

## Data model

Minimum persistent entities:

- users/profiles
- trips
- booking_requests
- hotel_offers
- approvals
- bookings
- agent_runs / workflow_events
- notifications

All user-owned records require row-level authorization. Provider credentials and server secrets never reach the browser.

## Product rule

Remove presentation-only hotel cards, fake counts, fake prices, and fake availability. If no supplier is configured, the product should show a clear configuration/error state rather than inventing an offer.

## Provider boundary

Create provider adapters so Amadeus or another hotel supplier can be replaced without changing the workflow. Supplier responses are normalized into the internal `hotel_offers` model. Booking uses the supplier's booking API/reference, not a local fake booking.

## Approval UX

The traveler should see:

- selected hotel and room/rate
- total price and currency
- taxes/fees when available
- cancellation deadline/policy
- supplier/provider
- guest and stay details
- approval status
- approve / reject actions

After approval, the booking action should be visible as a separate workflow step with progress and final supplier confirmation.
