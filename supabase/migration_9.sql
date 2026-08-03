-- ============================================================
-- MIGRATION 9 — Run in Supabase → SQL Editor → New query → Run
-- Critical fix: store_users had no policy letting a store-staff login
-- read its OWN row via a normal query (only the SECURITY DEFINER
-- helper functions could see it). middleware.ts and getStoreAccess()
-- both use a normal query — so they always concluded "not store staff",
-- and a real store login fell through to the full admin app instead of
-- being sent to /store. This adds the missing, narrowly-scoped policy:
-- a store user can only ever see their own single row, nobody else's.
-- Safe to run any number of times.
-- ============================================================

drop policy if exists "staff_read_own_row" on store_users;
create policy "staff_read_own_row" on store_users
  for select to authenticated
  using (is_store_staff() and email = auth.jwt() ->> 'email');
