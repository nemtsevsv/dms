-- ============================================================
-- MIGRATION 10 — Run in Supabase → SQL Editor → New query → Run
-- One-off data cleanup: test/admin taps made while trying out the app
-- under sergey.nemtsev@capof.co and test@test.com get re-tagged as
-- 'historical-import', so they stop showing up as if a real store
-- employee logged that traffic or filled that day's report.
-- Safe to run more than once (it's just an UPDATE, idempotent).
-- ============================================================

update store_traffic_events
set created_by = 'historical-import'
where created_by in ('sergey.nemtsev@capof.co', 'test@test.com');

update daily_reports
set submitted_by = 'historical-import'
where submitted_by in ('sergey.nemtsev@capof.co', 'test@test.com');
