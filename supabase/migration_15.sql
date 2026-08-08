-- ============================================================
-- MIGRATION 15 — Run in Supabase → SQL Editor → New query → Run
--
-- New "Countries" module: a system-wide reference of country-level
-- economic data (manually maintained, no external data source), plus a
-- trade overview built from bulk-uploaded HS-code export/import data.
-- Admin-only, same access pattern as Dealers/Products.
-- No historical data — filled in by hand / by upload going forward.
-- Safe to run any number of times.
-- ============================================================

create table if not exists countries (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  area numeric, -- km²
  population numeric,
  population_growth_rate numeric, -- % per year
  gdp numeric, -- current USD
  gdp_growth_rate numeric, -- %
  gdp_ppp numeric, -- current international $ (PPP)
  gdp_ppp_growth_rate numeric, -- %
  vat numeric, -- standard VAT rate, %
  hnwi numeric, -- high-net-worth individuals, manual entry
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GDP per capita and GDP (PPP) per capita are always population/GDP
-- divided — no separate stored field, computed wherever displayed, so
-- they can never drift out of sync with the two source numbers.

create table if not exists trade_data (
  id uuid primary key default uuid_generate_v4(),
  exporting_country text not null,
  importing_country text not null,
  product_group text,
  product text,
  hs_code text,
  flow text not null, -- 'import' / 'export', as uploaded
  year int not null,
  quantity numeric,
  value numeric,
  uploaded_by text,
  created_at timestamptz default now()
);

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
