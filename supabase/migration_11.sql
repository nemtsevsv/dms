-- ============================================================
-- MIGRATION 11 — Run in Supabase → SQL Editor → New query → Run
-- Adds:
-- 1. Admin-only manual overrides for the Sales Result summary
--    (Receipts / Core / Accessories) — used only when the real number
--    needs correcting; Sales Total / Target / Achievement stay fully
--    automatic, computed from these.
-- 2. "Close the day" — records when a report was submitted and by
--    whom, separately from who started it in the morning.
-- Safe to run any number of times.
-- ============================================================

alter table daily_reports add column if not exists manual_receipts int;
alter table daily_reports add column if not exists manual_sales_core numeric;
alter table daily_reports add column if not exists manual_sales_accessories numeric;
alter table daily_reports add column if not exists closed_at timestamptz;
alter table daily_reports add column if not exists closed_by text;
