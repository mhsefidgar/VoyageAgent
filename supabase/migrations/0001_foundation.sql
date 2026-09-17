create extension if not exists pgcrypto;

create type public.org_role as enum ('owner','admin','member','viewer');
create type public.platform_role as enum ('none','support','analyst','admin','super_admin');
create type public.market as enum ('US','CA');
create type public.ai_operation as enum ('trip_plan','chat','summary');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  platform_role public.platform_role not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  market public.market not null default 'US',
  currency char(3) not null default 'USD' check (currency in ('USD','CAD')),
  monthly_ai_budget_usd numeric(12,4) not null default 5 check (monthly_ai_budget_usd >= 0),
  monthly_ai_requests integer not null default 50 check (monthly_ai_requests >= 0),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  market public.market not null,
  currency char(3) not null check (currency in ('USD','CAD')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_usage (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  operation public.ai_operation not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(14,8) not null default 0 check (estimated_cost_usd >= 0),
  latency_ms integer,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members(user_id);
create index trips_org_created_idx on public.trips(organization_id, created_at desc);
create index ai_usage_org_created_idx on public.ai_usage(organization_id, created_at desc);
create index ai_usage_created_idx on public.ai_usage(created_at desc);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role <> 'none'
  );
$$;

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.trips enable row level security;
alter table public.ai_usage enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid() or public.is_platform_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_platform_admin());

create policy organizations_member on public.organizations for select using (public.is_org_member(id) or public.is_platform_admin());
create policy organizations_admin_update on public.organizations for update using (public.has_org_role(id, array['owner','admin']::public.org_role[]) or public.is_platform_admin());

create policy memberships_member_read on public.organization_members for select using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_platform_admin());
create policy memberships_admin_write on public.organization_members for all using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin()) with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or public.is_platform_admin());

create policy trips_member on public.trips for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy trips_member_insert on public.trips for insert with check (public.is_org_member(organization_id) and created_by = auth.uid());
create policy trips_admin_delete on public.trips for delete using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) or created_by = auth.uid() or public.is_platform_admin());

create policy ai_usage_org_read on public.ai_usage for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy ai_usage_server_write on public.ai_usage for insert with check (public.is_org_member(organization_id) or public.is_platform_admin());

create or replace view public.admin_ai_cost_summary as
select
  date_trunc('month', created_at) as month,
  organization_id,
  provider,
  model,
  count(*) as requests,
  sum(input_tokens) as input_tokens,
  sum(output_tokens) as output_tokens,
  sum(estimated_cost_usd) as estimated_cost_usd,
  avg(latency_ms) as avg_latency_ms,
  count(*) filter (where not success) as failed_requests
from public.ai_usage
group by 1,2,3,4;
