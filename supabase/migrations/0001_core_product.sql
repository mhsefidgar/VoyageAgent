create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  destination text not null,
  start_date date,
  end_date date,
  budget numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_hotels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_hotel_id text not null,
  offer_id text,
  name text not null,
  city text,
  country text,
  price numeric,
  currency text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider, provider_hotel_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  prompt text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.saved_hotels enable row level security;
alter table public.plans enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "trips own rows" on public.trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved hotels own rows" on public.saved_hotels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plans own rows" on public.plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set full_name = excluded.full_name, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
