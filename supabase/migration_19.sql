-- ============================================================
-- MIGRATION 19 — Run in Supabase → SQL Editor → New query → Run
--
-- HS code reference library — Product Group / Product / HS code, with a
-- checkbox controlling which codes are included when the Trade Overview
-- "Load from Eurostat" button runs. Admin-only, same access pattern as
-- the rest of Countries.
-- Safe to run any number of times.
-- ============================================================

create table if not exists hs_codes (
  id uuid primary key default uuid_generate_v4(),
  product_group text not null,
  product text not null,
  hs_code text not null unique,
  eurostat_api boolean not null default true,
  created_by text,
  created_at timestamptz default now()
);

alter table hs_codes enable row level security;

drop policy if exists "admin_full_access" on hs_codes;
create policy "admin_full_access" on hs_codes
  for all to authenticated using (not is_store_staff()) with check (not is_store_staff());

insert into hs_codes (product_group, product, hs_code) values
  ('Sport Optics', 'Binoculars', '85258900'),
  ('Sport Optics', 'Telescopic sights', '90065380'),
  ('Photo', 'Camera lenses', '90021100'),
  ('Photo', 'Cameras', '90051000'),
  ('Photo', 'Photographic accessories', '90131090')
on conflict (hs_code) do nothing;
