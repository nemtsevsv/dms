-- ============================================================
-- MIGRATION 13 — Run in Supabase → SQL Editor → New query → Run
--
-- New "Marketing" module (MVP): activities calendar + list/card,
-- admin-only (Sales Manager / Retail Manager) — store staff never see it,
-- same access pattern already used for dealers/orders.
-- No historical data — this is filled in by hand going forward.
-- Safe to run any number of times.
-- ============================================================

create table if not exists marketing_activity_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

insert into marketing_activity_types (name) values
  ('Digital Campaign'), ('Event'), ('Dealer Partnership'), ('PR / Press'), ('Local Store Activation'), ('Other')
on conflict (name) do nothing;

create table if not exists marketing_activities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  activity_type text,
  start_date date not null,
  end_date date not null,
  country text,
  store_id uuid references stores(id) on delete set null,
  dealer_id uuid references dealers(id) on delete set null,
  budget_planned numeric,
  budget_actual numeric,
  currency text not null default 'EUR',
  status text not null default 'Planned', -- Planned / Active / Completed / Cancelled
  notes text,
  -- Results — all optional, filled in by hand as numbers come in (e.g.
  -- copied over from Meta/Google Ads or an event's guest list). Online
  -- and offline metrics coexist on the same row; a given activity only
  -- ever fills in the ones that apply to it.
  reach numeric,
  clicks numeric,
  leads numeric,
  planned_participants numeric,
  registered numeric,
  participated numeric,
  purchased numeric,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_marketing_activities_dates on marketing_activities(start_date, end_date);
create index if not exists idx_marketing_activities_store on marketing_activities(store_id);
create index if not exists idx_marketing_activities_dealer on marketing_activities(dealer_id);

alter table marketing_activity_types enable row level security;
alter table marketing_activities enable row level security;

-- Admin-only — identical pattern to dealers/orders. Store staff are
-- never granted a policy here, so they get zero rows, and the module is
-- also outside their allowed navigation area in middleware.ts.
drop policy if exists "admin_full_access" on marketing_activity_types;
create policy "admin_full_access" on marketing_activity_types
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

drop policy if exists "admin_full_access" on marketing_activities;
create policy "admin_full_access" on marketing_activities
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());
