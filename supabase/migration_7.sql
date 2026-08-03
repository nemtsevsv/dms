-- ============================================================
-- MIGRATION 7 — Run in Supabase → SQL Editor → New query → Run
-- Fixes a circular RLS bug: is_store_staff() / my_store_id() /
-- my_store_role() query store_users, but store_users' own RLS policy
-- calls these same functions — so any row in store_users could make
-- the check misfire for other logged-in users, including admins.
-- SECURITY DEFINER breaks the cycle. Safe to run any number of times.
-- ============================================================

create or replace function is_store_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from store_users su where su.email = auth.jwt() ->> 'email');
$$;

create or replace function my_store_id() returns uuid
language sql stable security definer set search_path = public as $$
  select store_id from store_users where email = auth.jwt() ->> 'email' limit 1;
$$;

create or replace function my_store_role() returns text
language sql stable security definer set search_path = public as $$
  select role from store_users where email = auth.jwt() ->> 'email' limit 1;
$$;
