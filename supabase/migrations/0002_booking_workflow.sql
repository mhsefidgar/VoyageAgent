create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  destination text not null,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1 check (guests > 0),
  rooms integer not null default 1 check (rooms > 0),
  budget numeric,
  preferences jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','searching','offers_ready','awaiting_human_approval','approved','rejected','booking','confirmed','failed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hotel_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_requests(id) on delete cascade,
  provider text not null,
  provider_hotel_id text not null,
  provider_offer_id text not null,
  hotel_name text not null,
  city text,
  country text,
  room_name text,
  rate_name text,
  total_price numeric not null,
  currency text not null,
  taxes numeric,
  cancellation_policy jsonb not null default '{}'::jsonb,
  raw_offer jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_offer_id)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null references public.hotel_offers(id) on delete restrict,
  decision text not null default 'pending' check (decision in ('pending','approved','rejected')),
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_requests(id) on delete restrict,
  offer_id uuid not null references public.hotel_offers(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_booking_id text,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','confirmed','failed','cancelled')),
  confirmation_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.booking_requests(id) on delete cascade,
  agent text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;
alter table public.hotel_offers enable row level security;
alter table public.approvals enable row level security;
alter table public.bookings enable row level security;
alter table public.workflow_events enable row level security;

create policy "booking requests own rows" on public.booking_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hotel offers own requests" on public.hotel_offers for select using (exists (select 1 from public.booking_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy "approvals own rows" on public.approvals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bookings own rows" on public.bookings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workflow events own requests" on public.workflow_events for select using (exists (select 1 from public.booking_requests r where r.id = request_id and r.user_id = auth.uid()));
