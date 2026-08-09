-- ============================================================
-- MIGRATION 18 — Run in Supabase → SQL Editor → New query → Run
--
-- New, standalone "Country Dashboard" module — separate from the
-- existing hand-maintained Countries reference. Two tables:
--
-- 1. country_master — static reference (ISO2, names, capital, currency,
--    languages, continent). Seeded once from Country_Master_Extended_Filled
--    (seed_country_master.sql), rarely changes.
--
-- 2. country_data_points — the time-series history store for every
--    dynamic field (population, GDP, cities, EU export values, ...).
--    Every refresh INSERTS a new row; existing rows are never
--    overwritten or deleted, per the "never overwrite history" rule.
--    The current dashboard view always reads the most recent
--    retrieval per (iso2, data_field, year).
--
-- Admin-only, same access pattern as the rest of the system — store
-- staff never see this. Run this before seed_country_master.sql.
-- Safe to run any number of times.
-- ============================================================

create table if not exists country_master (
  iso2 text primary key,
  country_en text not null,
  country_de text,
  continent_en text,
  continent_de text,
  languages_en text,
  languages_de text,
  language_codes text,
  capital text,
  currency text,
  official_languages text,
  created_at timestamptz default now()
);

create table if not exists country_data_points (
  id uuid primary key default uuid_generate_v4(),
  iso2 text not null references country_master(iso2) on delete cascade,
  data_field text not null, -- stable key, e.g. 'population', 'gdp_usd', 'city_1_name'
  year int, -- calendar year the value refers to; null for "current only" fields (cities)
  value numeric, -- numeric fields
  text_value text, -- text fields (city names)
  source text not null, -- 'World Bank' / 'GeoNames' / 'Eurostat Comext'
  retrieved_at timestamptz not null default now(),
  created_by text
);

-- The dashboard always wants "the latest retrieval per field+year" —
-- this index makes that lookup fast even as history accumulates.
create index if not exists idx_country_data_points_lookup
  on country_data_points(iso2, data_field, year, retrieved_at desc);

alter table country_master enable row level security;
alter table country_data_points enable row level security;

drop policy if exists "admin_full_access" on country_master;
create policy "admin_full_access" on country_master
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

drop policy if exists "admin_full_access" on country_data_points;
create policy "admin_full_access" on country_data_points
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

-- ============================================================
-- ROLLBACK (kept here for reference — run manually if this module
-- ever needs to be fully removed):
--
-- drop table if exists country_data_points;
-- drop table if exists country_master;
-- ============================================================
