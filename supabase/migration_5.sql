-- ============================================================
-- MIGRATION 5 — Run in Supabase → SQL Editor → New query → Run
-- Adds "created by" tracking to Orders and Invoices, plus indexes
-- to keep the app fast as data grows. Safe on your existing
-- database: only adds columns/indexes, nothing is deleted.
-- ============================================================

alter table orders add column if not exists created_by text;
alter table invoices add column if not exists created_by text;

-- ------------------------------------------------------------
-- Indexes: every foreign key used in a lookup / filter gets one.
-- Postgres does not create these automatically, and without them
-- queries get slower as the number of orders/invoices grows.
-- ------------------------------------------------------------
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);
create index if not exists idx_invoice_items_order_item_id on invoice_items(order_item_id);
create index if not exists idx_invoices_order_id on invoices(order_id);
create index if not exists idx_invoices_dealer_id on invoices(dealer_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_orders_dealer_id on orders(dealer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_tasks_dealer_id on tasks(dealer_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_dealer_comments_dealer_id on dealer_comments(dealer_id);
create index if not exists idx_dealer_history_dealer_id on dealer_history(dealer_id);
create index if not exists idx_dealers_status on dealers(status);
create index if not exists idx_dealers_country on dealers(country);
