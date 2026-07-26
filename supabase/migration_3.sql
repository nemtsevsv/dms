-- ============================================================
-- MIGRATION 3 — Run in Supabase → SQL Editor → New query → Run
-- Adds: link between invoices and order items (for partial-invoice
-- tracking), list price / discount snapshot on order items.
-- Safe on your existing database: only adds columns, no data is deleted.
-- ============================================================

alter table invoice_items add column if not exists order_item_id uuid references order_items(id) on delete set null;
alter table order_items add column if not exists list_price numeric;
alter table order_items add column if not exists dealer_discount_percent numeric default 0;

-- invoices.status now also supports 'Cancelled' (already free-text, no change needed)
