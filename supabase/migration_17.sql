-- ============================================================
-- MIGRATION 17 — Run in Supabase → SQL Editor → New query → Run
--
-- Fixes a case where `countries` already existed in some partial form
-- (e.g. only migration_16 was run, or the table was created some other
-- way) — `create table if not exists` in migration_15 is a no-op once a
-- table exists, so it can never add columns that are still missing.
-- This migration adds every column individually instead, so it's safe
-- to run regardless of what state the table is already in.
-- Safe to run any number of times.
-- ============================================================

create table if not exists countries (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table countries add column if not exists capital text;
alter table countries add column if not exists biggest_cities text;
alter table countries add column if not exists area numeric;
alter table countries add column if not exists population numeric;
alter table countries add column if not exists population_growth_rate numeric;
alter table countries add column if not exists gdp numeric;
alter table countries add column if not exists gdp_growth_rate numeric;
alter table countries add column if not exists gdp_ppp numeric;
alter table countries add column if not exists gdp_ppp_growth_rate numeric;
alter table countries add column if not exists vat numeric;
alter table countries add column if not exists hnwi numeric;
alter table countries add column if not exists created_by text;
alter table countries add column if not exists updated_at timestamptz default now();

create table if not exists trade_data (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now()
);

alter table trade_data add column if not exists exporting_country text;
alter table trade_data add column if not exists importing_country text;
alter table trade_data add column if not exists product_group text;
alter table trade_data add column if not exists product text;
alter table trade_data add column if not exists hs_code text;
alter table trade_data add column if not exists flow text;
alter table trade_data add column if not exists year int;
alter table trade_data add column if not exists quantity numeric;
alter table trade_data add column if not exists value numeric;
alter table trade_data add column if not exists uploaded_by text;

create index if not exists idx_trade_data_exporting on trade_data(exporting_country);
create index if not exists idx_trade_data_importing on trade_data(importing_country);
create index if not exists idx_trade_data_year on trade_data(year);
create index if not exists idx_trade_data_hs_code on trade_data(hs_code);

alter table countries enable row level security;
alter table trade_data enable row level security;

drop policy if exists "admin_full_access" on countries;
create policy "admin_full_access" on countries
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

drop policy if exists "admin_full_access" on trade_data;
create policy "admin_full_access" on trade_data
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

notify pgrst, 'reload schema';
