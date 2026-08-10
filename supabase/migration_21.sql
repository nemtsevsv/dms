-- ============================================================
-- MIGRATION 21 — Run in Supabase → SQL Editor → New query → Run
-- Adds Regional_Official_Languages, a column present in the master
-- reference file that was missed in the original country_master seed.
-- Safe to run any number of times.
-- ============================================================

alter table country_master add column if not exists regional_official_languages text;
