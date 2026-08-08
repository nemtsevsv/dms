-- ============================================================
-- MIGRATION 16 — Run in Supabase → SQL Editor → New query → Run
-- Adds Capital and Biggest Cities to the countries reference.
-- Safe to run any number of times.
-- ============================================================

alter table countries add column if not exists capital text;
alter table countries add column if not exists biggest_cities text;
