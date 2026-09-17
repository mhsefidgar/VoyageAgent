# Admin cost control

The admin panel is designed to make spend visible before it becomes a surprise.

## Admin sections

- **Overview:** current-month AI spend, request count, estimated cost per request, failures, latency, and spend trend.
- **AI Costs:** filter by organization, user, provider, model, operation, and date range.
- **Organizations:** monthly AI budget, request limit, current spend, current requests, and remaining allowance.
- **API Settings:** provider enable/disable switches, model selection, request timeouts, cache TTLs, and server-side secret status. Secret values are never displayed.
- **Providers:** provider health, last success/failure, latency, quota notes, and estimated cost.
- **Feature Flags:** expensive features can be disabled globally or per organization.
- **Audit Logs:** every budget/configuration/provider change is recorded.

## Cost-effective defaults

1. Prefer a low-cost model for classification, extraction, formatting, and routine chat.
2. Use a stronger model only for complex itinerary synthesis.
3. Cache destination, hotel, activity, and supplier search results.
4. Parallelize independent supplier requests rather than chaining model calls.
5. Do not ask an LLM to calculate currency conversions, distances, totals, or availability.
6. Enforce monthly request and dollar budgets server-side.
7. At 80% of a budget, switch eligible operations to economy mode; at 100%, block non-essential AI work until the next period or an admin override.
8. Record token usage, provider/model, latency, success, and estimated cost for every AI request.
9. Never expose provider API keys to the browser.
10. Keep raw provider responses out of long-term logs unless explicitly required and redacted.

## Provider configuration model

Provider configuration should contain non-secret metadata in Postgres. Secrets belong in Vercel/Supabase secret storage and are referenced by environment variable name. The UI exposes whether a secret is configured, never the secret itself.
