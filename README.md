# VoyageAgent

Cost-aware AI travel SaaS for the US and Canada.

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
