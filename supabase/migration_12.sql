-- ============================================================
-- MIGRATION 12 — Run in Supabase → SQL Editor → New query → Run
--
-- 1) Adds a timezone to each store. "Today" for a store must be computed
--    in ITS OWN local time — Almaty/Yerevan are hours ahead of the
--    server's UTC clock, so for a while after local midnight the app was
--    still showing yesterday's report.
-- 2) Adds indexes on the store_* tables. None existed — every query
--    filtering by store_id/date was doing a full table scan, which is a
--    likely reason the app has felt slower as more data has come in.
-- Safe to run any number of times.
-- ============================================================

alter table stores add column if not exists timezone text default 'Asia/Almaty';

create index if not exists idx_store_traffic_events_store_date on store_traffic_events(store_id, occurred_at);
create index if not exists idx_store_receipts_store_date on store_receipts(store_id, occurred_at);
create index if not exists idx_store_receipt_items_receipt on store_receipt_items(receipt_id);
create index if not exists idx_daily_reports_store_date on daily_reports(store_id, report_date);
create index if not exists idx_store_stock_movements_store_sku on store_stock_movements(store_id, sku);
create index if not exists idx_store_sales_plan_store on store_sales_plan(store_id, year, month);
create index if not exists idx_store_users_store on store_users(store_id);
create index if not exists idx_store_schedule_store on store_schedule(store_id);
create index if not exists idx_store_weekly_focus_store on store_weekly_focus(store_id, week_start_date);
create index if not exists idx_store_price_overrides_store on store_price_overrides(store_id);
create index if not exists idx_store_deliveries_store on store_deliveries(store_id);
create index if not exists idx_store_delivery_items_delivery on store_delivery_items(delivery_id);
