-- ============================================================
-- MIGRATION 20 — Run in Supabase → SQL Editor → New query → Run
-- Adds Urban Population (%) to the legacy Countries reference.
-- Safe to run any number of times.
-- ============================================================

alter table countries add column if not exists urban_population_pct numeric;
